// Home tab: marketplace landing with real listing data.
// Supports Buy / Rent / Invest modes with live API results.
// Navigation to PublicListingDetail stays within CitizenHomeStack.
// Cross-tab navigation to PropertiesTab/MapTab uses getParent().

import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  ImageBackground,
  PermissionsAndroid,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {formatCurrency} from '../../utils/formatters';
import {getNotifications} from '../../api/notifications';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import {useFocusEffect} from '@react-navigation/native';
import {CitizenHomeStackParamList, FilterParams} from '../../navigation/CitizenHomeStack';
import {CitizenTabParamList} from '../../navigation/CitizenTabNavigator';
import MarketModeSwitcher from '../../components/MarketModeSwitcher';
import FilterChipsRow from '../../components/FilterChipsRow';
import {MarketMode} from '../../types/market';
import {useMarketStrings} from '../../hooks/useMarketStrings';
import {getProperties, MarketType, PropertyListItem} from '../../api/properties';
import {
  getOpportunities,
  InvestmentOpportunityListItem,
} from '../../api/investmentOpportunities';
import {
  getSavedItems,
  saveListing,
  saveOpportunity,
  unsaveListing,
  unsaveOpportunity,
} from '../../api/savedListings';
import {Colors} from '../../constants/colors';
import {useStrings} from '../../i18n';
import {useInvestMode} from '../../store/investModeState';
import PropertyImage from '../../components/PropertyImage';
import CitizenBrandBar from '../../components/CitizenBrandBar';
import {detectJordanCity, DetectedCity, CITY_CENTERS} from '../../utils/jordanCityDetector';
import {AppImages} from '../../assets/images';

// React Native provides navigator.geolocation as a deprecated polyfill.
// This tsconfig omits DOM lib so we declare the minimal shape we need here.
declare global {
  const navigator: {
    geolocation: {
      getCurrentPosition: (
        success: (pos: {coords: {latitude: number; longitude: number}}) => void,
        error: () => void,
        options: {enableHighAccuracy: boolean; timeout: number; maximumAge: number},
      ) => void;
    };
  };
}

type Props = NativeStackScreenProps<CitizenHomeStackParamList, 'HomeMain'>;

const {width: SCREEN_W} = Dimensions.get('window');
const CARD_PAD = 16;
const CARD_GAP = 10;



const marketModeToType = (mode: MarketMode): MarketType =>
  mode === 'buy' ? 'sale' : mode === 'rent' ? 'rent' : 'investment';

const HomeScreen = ({navigation, route}: Props) => {
  const strings = useStrings();
  const {filterChips} = useMarketStrings();
  const [marketMode, setMarketMode] = useState<MarketMode>('buy');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [activeFilters, setActiveFilters] = useState<FilterParams | undefined>(undefined);
  const [listings, setListings] = useState<PropertyListItem[]>([]);
  const [opportunities, setOpportunities] = useState<InvestmentOpportunityListItem[]>([]);
  const [isLoadingListings, setIsLoadingListings] = useState(false);
  const [listingsError, setListingsError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [savedOpportunityIds, setSavedOpportunityIds] = useState<Set<string>>(new Set());
  const [detectedCity, setDetectedCity] = useState<DetectedCity>('Amman');
  const [cityCoords, setCityCoords] = useState<{lat: number; lng: number} | null>(null);

  const tabNav = navigation.getParent<BottomTabNavigationProp<CitizenTabParamList>>();

  const fetchListings = useCallback(
    async (mode: MarketMode, search: string, filters?: FilterParams) => {
      setIsLoadingListings(true);
      setListingsError(null);
      try {
        if (mode === 'invest') {
          const result = await getOpportunities({
            search: search.trim() || undefined,
            limit: 8,
          });
          setOpportunities(result.items);
          setListings([]);
        } else {
          const result = await getProperties({
            marketType: marketModeToType(mode),
            search: search.trim() || undefined,
            limit: 8,
            propertyType: filters?.propertyType,
            city: filters?.city,
            bedrooms: filters?.bedrooms,
            bathrooms: filters?.bathrooms,
            minAreaSqm: filters?.minAreaSqm,
            maxAreaSqm: filters?.maxAreaSqm,
            minPrice: filters?.minPrice,
            maxPrice: filters?.maxPrice,
            amenities: filters?.amenities,
            sort: filters?.sort,
            verifiedOnly: filters?.verifiedOnly,
          });
          setListings(result.items);
          setOpportunities([]);
        }
      } catch (err) {
        setListingsError(err instanceof Error ? err.message : strings.home.emptyDefault);
        setListings([]);
        setOpportunities([]);
      } finally {
        setIsLoadingListings(false);
      }
    },
    [strings],
  );

  // Re-fetch when mode changes
  useEffect(() => {
    void fetchListings(marketMode, searchText, activeFilters);
  }, [marketMode, fetchListings]); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-fetch when filter params are returned from SearchFilterScreen
  useEffect(() => {
    const incoming = route.params?.filters;
    if (incoming !== undefined) {
      setActiveFilters(incoming);
      void fetchListings(marketMode, searchText, incoming);
    }
  }, [route.params?.filters]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    getNotifications()
      .then(notifications => {
        setUnreadCount(notifications.filter(n => !n.isRead).length);
      })
      .catch(() => {
        // non-critical — leave badge at 0
      });
  }, []);

  useEffect(() => {
    getSavedItems()
      .then(items => {
        const ids = new Set(
          items
            .filter(i => i.type === 'listing' && i.listing)
            .map(i => i.listing!.id),
        );
        const opportunityIds = new Set(
          items
            .filter(i => i.type === 'opportunity' && i.opportunity)
            .map(i => i.opportunity!.id),
        );
        setSavedIds(ids);
        setSavedOpportunityIds(opportunityIds);
      })
      .catch(() => {/* non-critical */});
  }, []);

  // ── Detect user city from GPS — non-blocking, card hidden on failure ──────
  useEffect(() => {
    const detect = async () => {
      try {
        if (Platform.OS === 'android') {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            {
              title: 'Location Permission',
              message: 'Aqarya uses your location to show nearby properties.',
              buttonPositive: 'OK',
            },
          );
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            return;
          }
        }
        navigator.geolocation.getCurrentPosition(
          pos => {
            const city = detectJordanCity(pos.coords.latitude, pos.coords.longitude);
            if (city) {
              setDetectedCity(city);
              setCityCoords({lat: pos.coords.latitude, lng: pos.coords.longitude});
            }
          },
          () => {/* location unavailable — city card stays hidden */},
          {enableHighAccuracy: false, timeout: 8000, maximumAge: 60_000},
        );
      } catch {/* ignore — city card stays hidden */}
    };
    void detect();
  }, []);

  const toggleSave = (id: string) => {
    const isSaved = savedIds.has(id);
    setSavedIds(prev => {
      const next = new Set(prev);
      if (isSaved) {next.delete(id);} else {next.add(id);}
      return next;
    });
    const fn = isSaved ? unsaveListing : saveListing;
    fn(id).catch(() => {
      // revert on failure
      setSavedIds(prev => {
        const next = new Set(prev);
        if (isSaved) {next.add(id);} else {next.delete(id);}
        return next;
      });
    });
  };

  const toggleOpportunitySave = (id: string) => {
    const isSaved = savedOpportunityIds.has(id);
    setSavedOpportunityIds(prev => {
      const next = new Set(prev);
      if (isSaved) {next.delete(id);} else {next.add(id);}
      return next;
    });
    const fn = isSaved ? unsaveOpportunity : saveOpportunity;
    fn(id).catch(() => {
      setSavedOpportunityIds(prev => {
        const next = new Set(prev);
        if (isSaved) {next.add(id);} else {next.delete(id);}
        return next;
      });
    });
  };

  const onModeChange = (mode: MarketMode) => {
    setMarketMode(mode);
    setSelectedFilter('all');
  };

  const onSearchSubmit = () => {
    void fetchListings(marketMode, searchText);
  };

  const onListingPress = (item: PropertyListItem) => {
    navigation.navigate('PublicListingDetail', {
      id: item.id,
      marketType: item.marketType,
    });
  };

  const onOpportunityPress = (id: string) => {
    navigation.navigate('InvestmentOpportunityDetail', {id});
  };

  const onCityCardPress = useCallback(() => {
    const coords = cityCoords ?? CITY_CENTERS[detectedCity];
    tabNav?.navigate('MapTab', {
      screen: 'MapMain',
      params: {
        initialCity: detectedCity,
        initialLatitude: coords.lat,
        initialLongitude: coords.lng,
      },
    });
  }, [tabNav, detectedCity, cityCoords]);

  const isDark = marketMode === 'invest';
  const {setIsInvest} = useInvestMode();

  // Sync invest mode with the tab bar — reset to false when screen loses focus
  // so the nav bar doesn't stay dark when browsing other tabs.
  useFocusEffect(
    useCallback(() => {
      setIsInvest(marketMode === 'invest');
      return () => setIsInvest(false);
    }, [marketMode, setIsInvest]),
  );

  const activeCount = marketMode === 'invest' ? opportunities.length : listings.length;

  const hasActiveFilters = !!(
    activeFilters?.propertyType ||
    activeFilters?.city ||
    activeFilters?.bedrooms !== undefined ||
    activeFilters?.bathrooms !== undefined ||
    activeFilters?.minAreaSqm !== undefined ||
    activeFilters?.maxAreaSqm !== undefined ||
    activeFilters?.minPrice !== undefined ||
    activeFilters?.maxPrice !== undefined ||
    activeFilters?.amenities?.length ||
    activeFilters?.sort ||
    activeFilters?.verifiedOnly
  );

  const renderListingCard = ({item}: {item: PropertyListItem}) => {
    const isVerified = item.verificationStatus === 'verified';
    const marketLabel = item.marketType === 'sale' ? 'Sale' : 'Rent';
    const isSaved = savedIds.has(item.id);
    return (
      <Pressable
        onPress={() => onListingPress(item)}
        style={({pressed}) => [styles.listingCard, pressed && styles.cardPressed]}
        accessibilityRole="button"
        accessibilityLabel={item.title}>
        <View style={styles.cardRow}>
          <PropertyImage
            imageUrls={item.imageUrls}
            marketType={item.marketType}
            style={styles.cardThumb}
            fallbackSource={
              item.marketType === 'rent'
                ? AppImages.property.rent.mapThumb
                : AppImages.property.sale.mapThumb
            }>
            <View style={[styles.thumbBadge, item.marketType === 'rent' && styles.thumbBadgeRent]}>
              <Text style={styles.thumbBadgeText}>{marketLabel}</Text>
            </View>
          </PropertyImage>

          <View style={styles.cardInfo}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
              <Pressable
                onPress={() => toggleSave(item.id)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={isSaved ? 'Remove from favorites' : 'Save to favorites'}>
                <Text style={[styles.cardHeart, isSaved && styles.cardHeartSaved]}>
                  {isSaved ? '♥' : '♡'}
                </Text>
              </Pressable>
            </View>
            {isVerified ? (
              <View style={styles.verifiedRow}>
                <View style={styles.verifiedDot} />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            ) : null}
            <View style={styles.locationRow}>
              <Text style={styles.locationPin}>📍</Text>
              <Text style={styles.locationText} numberOfLines={1}>
                {[item.city, item.location].filter(Boolean).join(' · ')}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.cardDivider} />

        <View style={styles.cardPriceRow}>
          <Text style={styles.cardPrice}>{formatCurrency(item.price)}</Text>
          <View style={styles.cardSpecs}>
            {item.areaSqm != null ? (
              <View style={styles.cardSpecChip}>
                <Text style={styles.cardSpecText}>{item.areaSqm} m²</Text>
              </View>
            ) : null}
            {item.bedrooms != null ? (
              <View style={styles.cardSpecChip}>
                <Text style={styles.cardSpecText}>{item.bedrooms} bd</Text>
              </View>
            ) : null}
            {item.bathrooms != null ? (
              <View style={styles.cardSpecChip}>
                <Text style={styles.cardSpecText}>{item.bathrooms} ba</Text>
              </View>
            ) : null}
          </View>
        </View>
      </Pressable>
    );
  };

  const renderOpportunityCard = ({item}: {item: InvestmentOpportunityListItem}) => {
    const isSaved = savedOpportunityIds.has(item.id);
    const fundingPct = Math.round(Math.min(item.fundingProgress, 1) * 100);
    const roiLabel = `${(item.targetIrr * 100).toFixed(0)}%`;
    const scoreLabel = item.trustScore != null
      ? `Aqarya ${(item.trustScore / 10).toFixed(1)}`
      : null;
    const badgeColor =
      item.trustBadge === 'aqarya_approved' ? '#7CBFAA'
        : item.trustBadge === 'premium_verified' ? '#D4A853'
        : '#7CBFAA';

    return (
      <Pressable
        onPress={() => onOpportunityPress(item.id)}
        style={({pressed}) => [styles.investCard, pressed && styles.cardPressed]}
        accessibilityRole="button"
        accessibilityLabel={item.title}>

        {/* ── Hero image ──────────────────────────────────────────────────── */}
        <PropertyImage
          imageUrls={null}
          marketType="investment"
          style={styles.investCardImage}
          fallbackSource={AppImages.property.investment.opportunityHero}>
          <View style={styles.investImgBadge}>
            <Text style={styles.investImgBadgeText}>Investment</Text>
          </View>
          <Pressable
            onPress={() => toggleOpportunitySave(item.id)}
            hitSlop={10}
            style={styles.investHeartBtn}
            accessibilityRole="button"
            accessibilityLabel={isSaved ? 'Remove from favorites' : 'Save to favorites'}>
            <Text style={[styles.investHeartIcon, isSaved && styles.cardHeartSaved]}>
              {isSaved ? '♥' : '♡'}
            </Text>
          </Pressable>
        </PropertyImage>

        {/* ── Card body ───────────────────────────────────────────────────── */}
        <View style={styles.investCardBody}>

          {/* Title */}
          <Text style={styles.investCardTitle} numberOfLines={2}>{item.title}</Text>

          {/* Sponsor + verified */}
          {item.trustBadge != null && (
            <View style={styles.investSponsorRow}>
              <View style={[styles.investVerifiedDot, {backgroundColor: badgeColor}]} />
              <Text style={[styles.investSponsorText, {color: badgeColor}]}>{item.sponsorName}</Text>
            </View>
          )}

          {/* Location */}
          <View style={styles.locationRow}>
            <Text style={styles.locationPin}>📍</Text>
            <Text style={styles.investLocationText} numberOfLines={1}>{item.location}</Text>
          </View>

          {/* Divider */}
          <View style={styles.investDivider} />

          {/* Price + Target ROI */}
          <View style={styles.investPriceRow}>
            <Text style={styles.investPrice}>{formatCurrency(item.minimumInvestmentAmount)}</Text>
            <View style={styles.investRoiBadge}>
              <Text style={styles.investRoiText}>Target ROI {roiLabel}</Text>
            </View>
          </View>

          {/* Funding bar */}
          <View style={styles.investFundingTrack}>
            <View style={[styles.investFundingFill, {width: `${fundingPct}%` as `${number}%`}]} />
          </View>

          {/* Funding stats */}
          <View style={styles.investStatsRow}>
            <Text style={styles.investStatFunded}>{fundingPct}% funded</Text>
            <Text style={styles.investStatSub}>{formatCurrency(item.fundedAmount)}</Text>
            <Text style={styles.investStatSub}>{formatCurrency(item.fundingGoal)}</Text>
          </View>

          {/* Aqarya score + CTA */}
          <View style={styles.investBottomRow}>
            {scoreLabel != null ? (
              <View style={styles.aqaryaScoreBadge}>
                <Text style={styles.aqaryaScoreText}>{scoreLabel} ◆</Text>
              </View>
            ) : <View />}
            <Pressable
              onPress={() => onOpportunityPress(item.id)}
              style={({pressed}) => [styles.investCtaBtn, pressed && styles.investCtaBtnPressed]}
              accessibilityRole="button">
              <Text style={styles.investCtaText}>View Financial Details</Text>
            </Pressable>
          </View>
        </View>
      </Pressable>
    );
  };

  const ListHeader = (
    <View>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <View style={[styles.header, isDark && styles.headerDark]}>

        {/* ── Brand row ── */}
        <CitizenBrandBar
          isDark={isDark}
          right={
            <Pressable
              onPress={() => navigation.navigate('Notifications')}
              style={({pressed}) => [styles.notifBtn, isDark && styles.notificationBtnDark, pressed && styles.cardPressed]}
              accessibilityRole="button"
              accessibilityLabel="Open notifications">
              <BellIcon color={isDark ? '#FFFFFF' : Colors.textPrimary} size={20} />
              {unreadCount > 0 && (
                <View style={styles.notifBadge}>
                  <Text style={styles.notifBadgeText}>{unreadCount > 9 ? '9+' : String(unreadCount)}</Text>
                </View>
              )}
            </Pressable>
          }
        />

        {/* ── Tabs (Buy / Rent / Invest) + filter button on same row ── */}
        <View style={styles.tabsFilterRow}>
          <View style={styles.tabsWrap}>
            <MarketModeSwitcher value={marketMode} onChange={onModeChange} />
          </View>
          <Pressable
            onPress={() =>
              navigation.navigate('SearchFilter', {initialFilters: activeFilters})
            }
            style={({pressed}) => [
              styles.filterIconBtn,
              isDark && styles.filterBtnDark,
              hasActiveFilters && styles.filterIconBtnActive,
              pressed && {opacity: 0.75},
            ]}
            accessibilityRole="button"
            accessibilityLabel="Open filters">
            <Text style={[styles.filterIconBtnText, isDark && styles.darkText]}>⊟</Text>
            {hasActiveFilters ? <View style={styles.filterActiveDot} /> : null}
          </Pressable>
        </View>

        {/* ── Search bar ── */}
        <View style={[styles.searchBar, isDark && styles.searchBarDark]}>
          <TextInput
            style={[styles.searchInput, isDark && styles.darkText]}
            placeholder={strings.home.searchPlaceholder}
            placeholderTextColor={isDark ? '#555550' : Colors.textMuted}
            value={searchText}
            onChangeText={setSearchText}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            onSubmitEditing={onSearchSubmit}
            accessibilityLabel={strings.a11y.searchIcon}
          />
        </View>
      </View>

      {/* ── City image card — always visible, defaults to Amman ─────────── */}
      <Pressable
        onPress={onCityCardPress}
        style={({pressed}) => [styles.cityCard, pressed && {opacity: 0.88}]}
        accessibilityRole="button"
        accessibilityLabel={`${strings.home.cityCard.title} — ${detectedCity}`}>
        <ImageBackground
          source={AppImages.cities[detectedCity]}
          style={styles.cityCardBg}
          resizeMode="cover">
          <View style={styles.cityCardOverlay}>
            <Text style={styles.cityCardTitle}>{strings.home.cityCard.title}</Text>
            <View style={styles.cityCardBottom}>
              <Text style={styles.cityCardName}>{detectedCity}</Text>
              <View style={styles.cityCardBtn}>
                <Text style={styles.cityCardBtnText}>{strings.home.cityCard.explore}</Text>
              </View>
            </View>
          </View>
        </ImageBackground>
      </Pressable>

      {/* ── Filter chips ──────────────────────────────────────────────────── */}
      <View style={styles.filterSection}>
        <FilterChipsRow
          chips={filterChips}
          selectedKey={selectedFilter}
          onSelect={setSelectedFilter}
        />
      </View>
    </View>
  );

  const ListFooter = isLoadingListings ? (
    <View style={styles.listingsLoading}>
      <ActivityIndicator color={Colors.primary} />
    </View>
  ) : listingsError ? (
    <View style={styles.listingsError}>
      <Text style={styles.listingsErrorText}>{listingsError}</Text>
    </View>
  ) : activeCount === 0 ? (
    <View style={styles.listingsEmpty}>
      <Text style={styles.listingsEmptyTitle}>{strings.home.noListings}</Text>
      <Text style={styles.listingsEmptyText}>
        {marketMode === 'rent'
          ? strings.home.emptyRent
          : marketMode === 'invest'
            ? strings.home.emptyInvest
            : strings.home.emptyDefault}
      </Text>
    </View>
  ) : null;

  if (marketMode === 'invest') {
    return (
      <FlatList
        style={[styles.screen, styles.screenDark]}
        data={opportunities}
        keyExtractor={item => item.id}
        renderItem={renderOpportunityCard}
        ListHeaderComponent={ListHeader}
        ListFooterComponent={ListFooter}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      />
    );
  }

  return (
    <FlatList
      style={styles.screen}
      data={listings}
      keyExtractor={item => item.id}
      renderItem={renderListingCard}
      ListHeaderComponent={ListHeader}
      ListFooterComponent={ListFooter}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    />
  );
};

// ─── Bell icon ────────────────────────────────────────────────────────────────

const BellIcon = ({color, size}: {color: string; size: number}) => {
  const bw  = Math.round(size * 0.60);   // bell body width
  const bh  = Math.round(size * 0.50);   // bell body height
  const bar = Math.round(size * 0.10);   // base bar height
  return (
    <View style={{width: size, height: size}}>
      {/* hook */}
      <View style={{
        width: Math.round(size * 0.14),
        height: Math.round(size * 0.14),
        borderRadius: Math.round(size * 0.07),
        backgroundColor: color,
        position: 'absolute',
        top: Math.round(size * 0.04),
        alignSelf: 'center',
        left: (size - Math.round(size * 0.14)) / 2,
      }} />
      {/* arch body */}
      <View style={{
        width: bw,
        height: bh,
        backgroundColor: color,
        borderTopLeftRadius: bw / 2,
        borderTopRightRadius: bw / 2,
        borderBottomLeftRadius: 2,
        borderBottomRightRadius: 2,
        position: 'absolute',
        top: Math.round(size * 0.14),
        left: (size - bw) / 2,
      }} />
      {/* base bar */}
      <View style={{
        width: Math.round(size * 0.74),
        height: bar,
        backgroundColor: color,
        borderRadius: 2,
        position: 'absolute',
        top: Math.round(size * 0.14) + bh - 1,
        left: (size - Math.round(size * 0.74)) / 2,
      }} />
      {/* clapper */}
      <View style={{
        width: Math.round(size * 0.18),
        height: Math.round(size * 0.18),
        borderRadius: Math.round(size * 0.09),
        backgroundColor: color,
        position: 'absolute',
        bottom: Math.round(size * 0.02),
        left: (size - Math.round(size * 0.18)) / 2,
      }} />
    </View>
  );
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    backgroundColor: Colors.backgroundPrimary,
    flex: 1,
  },
  screenDark: {
    backgroundColor: '#0D0D0B',
  },
  content: {
    paddingBottom: 0,
  },

  // ── Invest dark-mode overrides ────────────────────────────────────────────
  headerDark: {
    backgroundColor: '#161614',
    borderBottomColor: '#2A2A28',
  },
  modeSectionDark: {
    backgroundColor: '#0D0D0B',
  },
  notificationBtnDark: {
    backgroundColor: '#2A2A28',
  },
  searchBarDark: {
    backgroundColor: '#1A1A18',
    borderColor: '#2A2A28',
  },
  filterBtnDark: {
    backgroundColor: '#1A1A18',
    borderColor: '#2A2A28',
  },
  darkText: {
    color: '#FFFFFF',
  },
  darkSubText: {
    color: '#787870',
  },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    backgroundColor: Colors.backgroundSecondary,
    borderBottomColor: Colors.border,
    borderBottomWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    gap: 14,
  },

  notifBtn: {
    alignItems: 'center',
    backgroundColor: Colors.backgroundMuted,
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  notifIcon: {
    fontSize: 18,
  },
  notifBadge: {
    alignItems: 'center',
    backgroundColor: Colors.error,
    borderColor: Colors.backgroundSecondary,
    borderRadius: 10,
    borderWidth: 1.5,
    height: 18,
    justifyContent: 'center',
    minWidth: 18,
    paddingHorizontal: 2,
    position: 'absolute',
    right: -3,
    top: -3,
  },
  notifBadgeText: {
    color: Colors.textOnDark,
    fontSize: 10,
    fontWeight: '800',
  },

  // tabs + filter row
  tabsFilterRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  tabsWrap: {
    flex: 1,
  },
  searchBar: {
    alignItems: 'center',
    backgroundColor: Colors.inputBackground,
    borderColor: Colors.border,
    borderRadius: 14,
    borderWidth: 1.5,
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 10,
  },
  filterIconBtn: {
    alignItems: 'center',
    backgroundColor: Colors.backgroundMuted,
    borderColor: Colors.border,
    borderRadius: 12,
    borderWidth: 1.5,
    height: 46,
    justifyContent: 'center',
    position: 'relative',
    width: 46,
  },
  filterIconBtnActive: {
    backgroundColor: Colors.primaryDark,
    borderColor: Colors.primaryDark,
  },
  filterIconBtnText: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  filterActiveDot: {
    backgroundColor: Colors.error,
    borderRadius: 4,
    height: 8,
    position: 'absolute',
    right: 8,
    top: 8,
    width: 8,
  },
  searchIcon: {
    fontSize: 16,
  },
  searchInput: {
    color: Colors.textPrimary,
    flex: 1,
    fontSize: 15,
    fontWeight: '400',
    letterSpacing: 0.1,
    padding: 0,
  },

  // ── Count row ─────────────────────────────────────────────────────────────
  countRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 4,
  },
  countText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  seeAllLink: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },

  // ── Filter chips ──────────────────────────────────────────────────────────
  filterSection: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 6,
  },

  // ── Listing cards — same structure as Map bottom sheet cards ─────────────
  listingCard: {
    backgroundColor: Colors.backgroundSecondary,
    borderColor: Colors.border,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: CARD_GAP,
    marginHorizontal: CARD_PAD,
    paddingBottom: 14,
    paddingHorizontal: 14,
    paddingTop: 14,
    width: SCREEN_W - CARD_PAD * 2,
  },
  cardDark: {
    backgroundColor: '#1A1A18',
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cardRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 14,
  },
  cardThumb: {
    borderRadius: 12,
    flexShrink: 0,
    height: 84,
    overflow: 'hidden',
    position: 'relative',
    width: 84,
  },
  thumbBadge: {
    backgroundColor: 'rgba(0,0,0,0.42)',
    borderRadius: 100,
    bottom: 8,
    left: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
    position: 'absolute',
  },
  thumbBadgeInvest: {
    backgroundColor: 'rgba(74,122,155,0.75)',
  },
  thumbBadgeRent: {
    backgroundColor: 'rgba(201,151,62,0.8)',
  },
  thumbBadgeText: {
    color: Colors.white,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  cardInfo: {
    flex: 1,
    gap: 5,
    justifyContent: 'center',
  },
  cardTitleRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'space-between',
  },
  cardTitle: {
    color: Colors.textPrimary,
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.1,
    lineHeight: 20,
  },
  cardTitleDark: {
    color: '#E8E8E4',
  },
  cardHeart: {
    color: Colors.textMuted,
    fontSize: 18,
    paddingTop: 1,
  },
  cardHeartSaved: {
    color: '#FF4D6A',
  },
  verifiedRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  verifiedDot: {
    backgroundColor: Colors.success,
    borderRadius: 3,
    height: 6,
    width: 6,
  },
  verifiedDotPremium: {
    backgroundColor: Colors.warning,
  },
  verifiedText: {
    color: Colors.success,
    fontSize: 11,
    fontWeight: '600',
  },
  locationRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 3,
  },
  locationPin: {
    fontSize: 11,
  },
  locationText: {
    color: Colors.textSecondary,
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },
  locationTextDark: {
    color: '#6B6B68',
  },
  opportunityAgencyText: {
    color: '#4CAF50',
    fontSize: 11,
    fontWeight: '600',
  },
  opportunityAgencyTextPremium: {
    color: Colors.warning,
    fontSize: 11,
    fontWeight: '600',
  },
  cardDivider: {
    backgroundColor: Colors.border,
    height: 1,
    marginBottom: 12,
  },
  cardDividerDark: {
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  cardPriceRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardPrice: {
    color: Colors.textPrimary,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  cardPriceDark: {
    color: '#E8E8E4',
  },
  cardSpecs: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  cardSpecChip: {
    backgroundColor: Colors.backgroundMuted,
    borderRadius: 100,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  cardSpecChipDark: {
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  cardSpecText: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  cardSpecTextDark: {
    color: '#6B6B68',
  },
  fundingBarRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  fundingBarTrack: {
    backgroundColor: 'rgba(74,122,155,0.18)',
    borderRadius: 100,
    flex: 1,
    height: 5,
    overflow: 'hidden',
  },
  fundingBarFill: {
    backgroundColor: '#4A7A9B',
    borderRadius: 100,
    height: '100%',
  },
  fundingBarLabel: {
    color: '#4A7A9B',
    fontSize: 10,
    fontWeight: '700',
    minWidth: 48,
    textAlign: 'right',
  },

  // ── Investment card (full-width stacked design) ───────────────────────────
  investCard: {
    backgroundColor: '#1A1A18',
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    borderWidth: 1,
    marginHorizontal: CARD_PAD,
    overflow: 'hidden',
    width: SCREEN_W - CARD_PAD * 2,
  },
  investCardImage: {
    height: 180,
    width: '100%',
  },
  investImgBadge: {
    backgroundColor: 'rgba(74,122,155,0.80)',
    borderRadius: 100,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    position: 'absolute',
    top: 12,
  },
  investImgBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  investHeartBtn: {
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 100,
    padding: 7,
    position: 'absolute',
    right: 12,
    top: 12,
  },
  investHeartIcon: {
    color: 'rgba(255,255,255,0.70)',
    fontSize: 16,
    lineHeight: 18,
  },
  investCardBody: {
    gap: 8,
    padding: 14,
  },
  investCardTitle: {
    color: '#E8E8E4',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.1,
    lineHeight: 22,
  },
  investSponsorRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  investVerifiedDot: {
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  investSponsorText: {
    fontSize: 12,
    fontWeight: '700',
  },
  investLocationText: {
    color: '#6B6B68',
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },
  investDivider: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    height: 1,
    marginVertical: 2,
  },
  investPriceRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  investPrice: {
    color: '#E8E8E4',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  investRoiBadge: {
    backgroundColor: 'rgba(212,168,83,0.15)',
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  investRoiText: {
    color: '#D4A853',
    fontSize: 11,
    fontWeight: '700',
  },
  investFundingTrack: {
    backgroundColor: 'rgba(212,168,83,0.18)',
    borderRadius: 100,
    height: 7,
    overflow: 'hidden',
  },
  investFundingFill: {
    backgroundColor: '#D4A853',
    borderRadius: 100,
    height: '100%',
  },
  investStatsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -2,
  },
  investStatFunded: {
    color: '#D4A853',
    fontSize: 11,
    fontWeight: '700',
  },
  investStatSub: {
    color: '#6B6B68',
    fontSize: 11,
    fontWeight: '600',
  },
  investBottomRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  aqaryaScoreBadge: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  aqaryaScoreText: {
    color: '#D4A853',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  investCtaBtn: {
    backgroundColor: '#1A1A1A',
    borderRadius: 100,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  investCtaBtnPressed: {
    opacity: 0.80,
  },
  investCtaText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.2,
  },

  // ── States ────────────────────────────────────────────────────────────────
  listingsLoading: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  listingsError: {
    alignItems: 'center',
    marginHorizontal: 20,
    padding: 16,
  },
  listingsErrorText: {
    color: Colors.error,
    fontSize: 13,
    textAlign: 'center',
  },
  listingsEmpty: {
    alignItems: 'center',
    marginHorizontal: 20,
    paddingTop: 24,
  },
  listingsEmptyTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  listingsEmptyText: {
    color: Colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  cardPressed: {
    opacity: 0.85,
  },

  // ── City image card ───────────────────────────────────────────────────────
  cityCard: {
    aspectRatio: 1.5,
    marginTop: 16,
    overflow: 'hidden',
    width: '100%',
  },
  cityCardBg: {
    flex: 1,
  },
  cityCardOverlay: {
    backgroundColor: 'rgba(0,0,0,0.38)',
    bottom: 0,
    justifyContent: 'space-between',
    left: 0,
    paddingHorizontal: 18,
    paddingVertical: 16,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  cityCardTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.1,
    opacity: 0.85,
  },
  cityCardBottom: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cityCardName: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  cityCardBtn: {
    backgroundColor: 'rgba(255,255,255,0.20)',
    borderColor: 'rgba(255,255,255,0.50)',
    borderRadius: 100,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  cityCardBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});

export default HomeScreen;
