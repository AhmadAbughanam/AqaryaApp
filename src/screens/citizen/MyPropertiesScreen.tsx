// Properties hub — "My Properties" and "Favorites" tabs.
// My Properties: owned listings from getMyProfile().
// Favorites: saved items from getSavedItems() with unsave capability.

import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import StatusBadge from '../../components/StatusBadge';
import Button from '../../components/Button';
import {getMyProfile, OwnedProfileProperty} from '../../api/profile';
import {
  getSavedItems,
  unsaveListing,
  unsaveOpportunity,
  SavedListing,
} from '../../api/savedListings';
import {CitizenStackParamList} from '../../navigation/CitizenStack';
import {Colors} from '../../constants/colors';
import {useStrings} from '../../i18n';
import PropertyImage from '../../components/PropertyImage';
import {CitizenBrandLogo} from '../../components/CitizenBrandBar';
import {VerificationStatus} from '../../api/properties';
import {AppImages} from '../../assets/images';

type Props = NativeStackScreenProps<CitizenStackParamList, 'MyProperties'>;
type Tab = 'mine' | 'favorites';
type StatusFilter = 'active' | 'pending' | 'draft' | 'rejected' | null;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);

const formatDate = (iso: string): string => {
  try {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '';
  }
};

const isNew = (iso: string): boolean => {
  try {
    return Date.now() - new Date(iso).getTime() < 7 * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
};

const getStatusCategory = (status: VerificationStatus): StatusFilter => {
  switch (status) {
    case 'verified':
    case 'sold':
      return 'active';
    case 'pending':
    case 'pending_verification':
      return 'pending';
    case 'needs_changes':
      return 'draft';
    case 'rejected':
    case 'frozen':
      return 'rejected';
    default:
      return 'pending';
  }
};

const getStatusLabel = (status: VerificationStatus): string => {
  switch (status) {
    case 'verified': return 'Active';
    case 'sold': return 'Sold';
    case 'pending':
    case 'pending_verification': return 'Pending';
    case 'needs_changes': return 'Draft';
    case 'rejected': return 'Rejected';
    case 'frozen': return 'Frozen';
    default: return status;
  }
};

const getStatusBadgeColors = (status: VerificationStatus): {bg: string; text: string} => {
  switch (status) {
    case 'verified': return {bg: '#F0FAF4', text: '#2E7D55'};
    case 'sold': return {bg: '#EEF2FF', text: '#4A6FA5'};
    case 'pending':
    case 'pending_verification': return {bg: '#FFF8EC', text: '#A06B1A'};
    case 'needs_changes': return {bg: '#F5F5F5', text: '#666660'};
    case 'rejected': return {bg: '#FFF0F0', text: '#C0392B'};
    case 'frozen': return {bg: '#F0F4FF', text: '#5A6EA6'};
    default: return {bg: '#F5F5F5', text: '#666660'};
  }
};

// ─── Back chevron ─────────────────────────────────────────────────────────────
// Two arms meet at the left tip (6, 10) on a 20×20 grid.
// Upper arm center (10, 6) rotated −45°, lower arm center (10, 14) rotated +45°.
// Both arms share the same left edge so the tips align perfectly.

const BackArrow = ({color = Colors.textPrimary, size = 20}: {color?: string; size?: number}) => {
  const k      = size / 20;
  const sw     = Math.max(2.5, 2.8 * k);   // thick stroke
  const armLen = 11.3 * k;
  const cx     = size / 2;
  const arm = (top: number): object => ({
    backgroundColor: color,
    borderRadius: sw / 2,
    height: sw,
    left: cx - armLen / 2,
    position: 'absolute' as const,
    top: top * k - sw / 2,
    width: armLen,
  });
  return (
    <View style={{height: size, width: size}}>
      <View style={[arm(6),  {transform: [{rotate: '-45deg'}]}]} />
      <View style={[arm(14), {transform: [{rotate:  '45deg'}]}]} />
    </View>
  );
};

// ─── Gear icon ────────────────────────────────────────────────────────────────
// 6 rectangular teeth + hollow ring, all scaled from a 20×20 reference grid.
// toothR = ringR + tw/2 so each tooth's inner edge touches the ring's outer edge.

const GearIcon = ({color = Colors.textPrimary, size = 20}: {color?: string; size?: number}) => {
  const k = size / 20;
  const cx = size / 2;
  const ringR = 6.5 * k;
  const ringD = ringR * 2;
  const bw = 2 * k;
  const tw = 3 * k;
  const th = 3.2 * k;
  const tR = ringR + tw / 2;
  const angles = [0, 60, 120, 180, 240, 300];
  return (
    <View style={{height: size, width: size}}>
      {angles.map(a => {
        const rad = (a * Math.PI) / 180;
        return (
          <View
            key={a}
            style={{
              backgroundColor: color,
              borderRadius: k,
              height: th,
              left: cx + tR * Math.cos(rad) - tw / 2,
              position: 'absolute',
              top: cx + tR * Math.sin(rad) - th / 2,
              transform: [{rotate: `${a}deg`}],
              width: tw,
            }}
          />
        );
      })}
      <View
        style={{
          borderColor: color,
          borderRadius: ringD / 2,
          borderWidth: bw,
          height: ringD,
          left: cx - ringR,
          position: 'absolute',
          top: cx - ringR,
          width: ringD,
        }}
      />
    </View>
  );
};

// ─── My Properties card ───────────────────────────────────────────────────────

const MyPropertyCard = ({
  item,
  onSell,
  onSimulate,
}: {
  item: OwnedProfileProperty;
  onSell: () => void;
  onSimulate: () => void;
}) => {
  const isSale = item.marketType === 'sale';
  const statusCat = getStatusCategory(item.status);
  const statusLabel = getStatusLabel(item.status);
  const badgeColors = getStatusBadgeColors(item.status);
  const showNewBadge = isNew(item.createdAt);
  const isPending = statusCat === 'pending';
  const isDraft = statusCat === 'draft';
  const dateLabel =
    statusCat === 'active'
      ? `Active on ${formatDate(item.createdAt)}`
      : `Submitted ${formatDate(item.createdAt)}`;

  return (
    <View style={s.card}>
      {/* ── Image ── */}
      <PropertyImage
        imageUrls={item.imageUrls}
        marketType={item.marketType}
        style={s.cardImage}
        fallbackSource={
          isSale
            ? AppImages.property.sale.fullWidth
            : AppImages.property.rent.fullWidth
        }>

        {/* Top-left: market / status badge */}
        <View style={s.imgBadgeTL}>
          <Text style={s.imgBadgeTLText}>
            {isPending ? 'Pending Review' : isDraft ? 'Under Revision' : isSale ? 'For Sale' : 'For Rent'}
          </Text>
        </View>

        {/* Top-right: Revise button or status badge from StatusBadge */}
        {isDraft ? (
          <Pressable
            onPress={onSell}
            style={s.reviseBtn}
            accessibilityRole="button"
            accessibilityLabel="Revise listing">
            <Text style={s.reviseBtnText}>Revise</Text>
          </Pressable>
        ) : (
          <View style={s.statusBadgeImg}>
            <StatusBadge status={item.status} />
          </View>
        )}

        {/* Bottom-left: NEW badge */}
        {showNewBadge && (
          <View style={s.newBadge}>
            <Text style={s.newBadgeText}>NEW</Text>
          </View>
        )}
      </PropertyImage>

      {/* ── Body ── */}
      <View style={s.cardBody}>
        {/* Title + status chip */}
        <View style={s.titleRow}>
          <Text style={s.cardTitle} numberOfLines={2}>{item.title}</Text>
          <View style={[s.statusChip, {backgroundColor: badgeColors.bg}]}>
            <Text style={[s.statusChipText, {color: badgeColors.text}]}>
              {statusLabel} ›
            </Text>
          </View>
        </View>

        {/* Location */}
        <View style={s.locationRow}>
          <View style={s.verifiedDot} />
          <Text style={s.locationText} numberOfLines={1}>
            {item.location}
          </Text>
        </View>

        {/* Price */}
        <Text style={s.priceText}>{formatCurrency(item.price)}</Text>

        {/* Date */}
        <Text style={s.dateText}>{dateLabel}</Text>

        {/* Actions (only for active/draft) */}
        {(statusCat === 'active' || isDraft) && (
          <View style={s.cardActions}>
            {isSale ? (
              <Button
                label={item.canListForSale ? 'List for Sale' : 'Already Listed'}
                onPress={onSell}
                variant={item.canListForSale ? 'primary' : 'secondary'}
                size="sm"
                disabled={!item.canListForSale}
                style={s.actionBtn}
              />
            ) : (
              <Button
                label="Simulate"
                onPress={onSimulate}
                variant="primary"
                size="sm"
                style={s.actionBtn}
              />
            )}
          </View>
        )}
      </View>
    </View>
  );
};

// ─── Favorites card ───────────────────────────────────────────────────────────

const FavoriteCard = ({
  item,
  onPress,
  onUnsave,
  isUnsaving,
}: {
  item: SavedListing;
  onPress: () => void;
  onUnsave: () => void;
  isUnsaving: boolean;
}) => {
  const listing = item.listing;
  const opp = item.opportunity;
  const title = listing?.title ?? opp?.title ?? '—';
  const location = listing?.location ?? opp?.location ?? '';
  const price = listing?.price ?? opp?.pricePerShare ?? 0;
  const isVerified = listing?.status === 'verified';
  const marketType = item.type === 'opportunity' ? 'investment' : listing?.marketType ?? 'sale';
  const marketLabel =
    item.type === 'opportunity' ? 'Invest' : listing?.marketType === 'rent' ? 'For Rent' : 'For Sale';
  const savedDate = `Saved ${formatDate(item.savedAt)}`;

  return (
    <Pressable
      onPress={onPress}
      style={({pressed}) => [s.card, pressed && s.cardPressed]}
      accessibilityRole="button"
      accessibilityLabel={title}>

      {/* ── Image ── */}
      <PropertyImage
        imageUrls={null}
        marketType={marketType as 'sale' | 'investment' | 'rent'}
        style={s.cardImage}
        fallbackSource={
          item.type === 'opportunity'
            ? AppImages.property.investment.fullWidth
            : listing?.marketType === 'rent'
            ? AppImages.property.rent.fullWidth
            : AppImages.property.sale.fullWidth
        }>

        {/* Market badge bottom-left */}
        <View style={s.imgBadgeTL}>
          <Text style={s.imgBadgeTLText}>{marketLabel}</Text>
        </View>

        {/* Heart button top-right */}
        <Pressable
          onPress={onUnsave}
          style={s.heartBtn}
          accessibilityRole="button"
          accessibilityLabel="Remove from favorites"
          hitSlop={10}>
          {isUnsaving ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <Text style={s.heartIcon}>♥</Text>
          )}
        </Pressable>
      </PropertyImage>

      {/* ── Body ── */}
      <View style={s.cardBody}>
        {/* Title + heart */}
        <View style={s.titleRow}>
          <Text style={s.cardTitle} numberOfLines={2}>{title}</Text>
          <Pressable
            onPress={onUnsave}
            style={s.heartBtnTitle}
            accessibilityRole="button"
            accessibilityLabel="Remove from favorites"
            hitSlop={8}>
            <Text style={s.heartIcon}>♥</Text>
          </Pressable>
        </View>

        {/* Location with verified indicator */}
        <View style={s.locationRow}>
          <View style={[s.verifiedDot, !isVerified && s.unverifiedDot]} />
          <Text style={s.locationText} numberOfLines={1}>{location}</Text>
          {isVerified && <Text style={s.verifiedCheck}> ✓</Text>}
        </View>

        {/* Price */}
        <Text style={s.priceText}>{formatCurrency(price)}</Text>

        {/* Date */}
        <Text style={s.dateText}>{savedDate}</Text>
      </View>
    </Pressable>
  );
};

// ─── Main screen ──────────────────────────────────────────────────────────────

const MyPropertiesScreen = ({navigation}: Props) => {
  const strings = useStrings();
  const [activeTab, setActiveTab] = useState<Tab>('mine');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(null);

  // Search state
  const [searchActive, setSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<TextInput>(null);

  // My Properties state
  const [myProperties, setMyProperties] = useState<OwnedProfileProperty[]>([]);
  const [isLoadingMine, setIsLoadingMine] = useState(true);
  const [isRefreshingMine, setIsRefreshingMine] = useState(false);
  const [mineError, setMineError] = useState<string | null>(null);

  // Favorites state
  const [favorites, setFavorites] = useState<SavedListing[]>([]);
  const [isLoadingFavs, setIsLoadingFavs] = useState(false);
  const [isRefreshingFavs, setIsRefreshingFavs] = useState(false);
  const [favsError, setFavsError] = useState<string | null>(null);
  const [unsavingId, setUnsavingId] = useState<string | null>(null);

  const loadMyProperties = useCallback(async () => {
    try {
      const profile = await getMyProfile();
      setMyProperties(profile.ownedProperties);
      setMineError(null);
    } catch (err) {
      setMineError(err instanceof Error ? err.message : strings.myProperties.errorText);
    } finally {
      setIsLoadingMine(false);
      setIsRefreshingMine(false);
    }
  }, [strings]);

  const loadFavorites = useCallback(async () => {
    setIsLoadingFavs(true);
    try {
      const items = await getSavedItems();
      setFavorites(items);
      setFavsError(null);
    } catch (err) {
      setFavsError(err instanceof Error ? err.message : strings.myProperties.errorText);
    } finally {
      setIsLoadingFavs(false);
      setIsRefreshingFavs(false);
    }
  }, [strings]);

  useEffect(() => {
    void loadMyProperties();
  }, [loadMyProperties]);

  useEffect(() => {
    if (activeTab === 'favorites') {
      void loadFavorites();
    }
  }, [activeTab, loadFavorites]);

  const onUnsave = (item: SavedListing) => {
    Alert.alert(strings.myProperties.removeFromFavTitle, strings.myProperties.removeFromFavMessage, [
      {text: strings.common.cancel, style: 'cancel'},
      {
        text: strings.myProperties.removeFromFavConfirm,
        style: 'destructive',
        onPress: () => {
          void (async () => {
            setUnsavingId(item.id);
            try {
              if (item.type === 'listing' && item.listing) {
                await unsaveListing(item.listing.id);
              } else if (item.type === 'opportunity' && item.opportunity) {
                await unsaveOpportunity(item.opportunity.id);
              }
              setFavorites(prev => prev.filter(f => f.id !== item.id));
            } catch {
              Alert.alert(strings.profile.errorLabel, strings.myProperties.removeFromFavError);
            } finally {
              setUnsavingId(null);
            }
          })();
        },
      },
    ]);
  };

  const onFavoritePress = (item: SavedListing) => {
    if (item.type === 'listing' && item.listing) {
      navigation.navigate('PropertyDetail', {id: item.listing.id});
    }
  };

  const openSearch = () => {
    setSearchActive(true);
    setTimeout(() => searchInputRef.current?.focus(), 50);
  };

  const closeSearch = () => {
    setSearchActive(false);
    setSearchQuery('');
  };

  // ── Derived data ─────────────────────────────────────────────────────────

  const q = searchQuery.toLowerCase().trim();

  // Status counts for filter chips
  const statusCounts = {
    active:   myProperties.filter(p => getStatusCategory(p.status) === 'active').length,
    pending:  myProperties.filter(p => getStatusCategory(p.status) === 'pending').length,
    draft:    myProperties.filter(p => getStatusCategory(p.status) === 'draft').length,
    rejected: myProperties.filter(p => getStatusCategory(p.status) === 'rejected').length,
  };

  const displayedMine = myProperties.filter(p => {
    if (statusFilter && getStatusCategory(p.status) !== statusFilter) return false;
    if (q) return p.title.toLowerCase().includes(q) || p.location.toLowerCase().includes(q);
    return true;
  });

  const displayedFavs = q
    ? favorites.filter(f => {
        const title = f.listing?.title ?? f.opportunity?.title ?? '';
        const loc = f.listing?.location ?? f.opportunity?.location ?? '';
        return title.toLowerCase().includes(q) || loc.toLowerCase().includes(q);
      })
    : favorites;

  // ── Status filter chips ────────────────────────────────────────────────────

  const filterChips: {key: StatusFilter; label: string; count: number}[] = [
    {key: null,       label: 'All',      count: myProperties.length},
    {key: 'active',   label: 'Active',   count: statusCounts.active},
    {key: 'pending',  label: 'Pending',  count: statusCounts.pending},
    {key: 'draft',    label: 'Draft',    count: statusCounts.draft},
    {key: 'rejected', label: 'Rejected', count: statusCounts.rejected},
  ];

  // ── Render Mine tab ────────────────────────────────────────────────────────

  const renderMineTab = () => {
    if (isLoadingMine) {
      return <ActivityIndicator color={Colors.primary} style={s.centeredLoader} />;
    }
    return (
      <FlatList
        data={displayedMine}
        keyExtractor={item => item.id}
        contentContainerStyle={s.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshingMine}
            onRefresh={() => {
              setIsRefreshingMine(true);
              void loadMyProperties();
            }}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
        ListHeaderComponent={
          mineError ? (
            <View style={s.errorBanner}>
              <Text style={s.errorBannerText}>{mineError}</Text>
            </View>
          ) : null
        }
        renderItem={({item}) => (
          <MyPropertyCard
            item={item}
            onSell={() => {
              if (item.canListForSale || item.status === 'needs_changes') {
                navigation.navigate('SellProperty', {
                  propertyId: item.id,
                  title: item.title,
                  location: item.location,
                  propertyValue: item.propertyValue,
                  price: item.price,
                });
              }
            }}
            onSimulate={() => navigation.navigate('InvestmentSimulation', {propertyId: item.id})}
          />
        )}
        ListEmptyComponent={
          <View style={s.emptyState}>
            <Text style={s.emptyTitle}>
              {q || statusFilter ? strings.myProperties.noSearchResults : strings.myProperties.emptyTitle}
            </Text>
            <Text style={s.emptySubtitle}>
              {!(q || statusFilter) ? strings.myProperties.emptySubtitle : ''}
            </Text>
            {!q && !statusFilter && (
              <Button
                label={strings.myProperties.addListingButton}
                onPress={() => navigation.navigate('SellProperty')}
                variant="primary"
                size="sm"
                style={s.emptyBtn}
              />
            )}
          </View>
        }
      />
    );
  };

  // ── Render Favorites tab ───────────────────────────────────────────────────

  const renderFavoritesTab = () => {
    if (isLoadingFavs) {
      return <ActivityIndicator color={Colors.primary} style={s.centeredLoader} />;
    }
    return (
      <FlatList
        data={displayedFavs}
        keyExtractor={item => item.id}
        contentContainerStyle={s.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshingFavs}
            onRefresh={() => {
              setIsRefreshingFavs(true);
              void loadFavorites();
            }}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
        ListHeaderComponent={
          favsError ? (
            <View style={s.errorBanner}>
              <Text style={s.errorBannerText}>{favsError}</Text>
            </View>
          ) : null
        }
        renderItem={({item}) => (
          <FavoriteCard
            item={item}
            onPress={() => onFavoritePress(item)}
            onUnsave={() => onUnsave(item)}
            isUnsaving={unsavingId === item.id}
          />
        )}
        ListEmptyComponent={
          <View style={s.emptyState}>
            <Text style={s.emptyTitle}>
              {q ? strings.myProperties.noSearchResults : strings.myProperties.favoritesEmptyTitle}
            </Text>
            <Text style={s.emptySubtitle}>
              {q ? '' : strings.myProperties.favoritesEmptySubtitle}
            </Text>
          </View>
        }
      />
    );
  };

  // ── JSX ───────────────────────────────────────────────────────────────────

  return (
    <View style={s.screen}>

      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <View style={s.topBar}>
        <Pressable
          onPress={searchActive ? closeSearch : () => navigation.goBack()}
          style={({pressed}) => [s.iconBtn, pressed && {opacity: 0.6}]}
          accessibilityRole="button"
          accessibilityLabel={searchActive ? 'Cancel search' : 'Go back'}>
          {searchActive
            ? <Text style={s.iconBtnText}>✕</Text>
            : <BackArrow color={Colors.textPrimary} size={20} />}
        </Pressable>

        {searchActive ? (
          <TextInput
            ref={searchInputRef}
            style={s.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={
              activeTab === 'mine'
                ? strings.myProperties.searchPropertiesPlaceholder
                : strings.myProperties.searchFavoritesPlaceholder
            }
            placeholderTextColor={Colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            selectionColor={Colors.primary}
          />
        ) : (
          <CitizenBrandLogo />
        )}

        <Pressable
          onPress={searchActive ? () => setSearchQuery('') : openSearch}
          style={({pressed}) => [s.iconBtn, pressed && {opacity: 0.6}]}
          accessibilityRole="button"
          accessibilityLabel={searchActive ? 'Clear search' : 'Settings'}>
          {searchActive
            ? <Text style={s.iconBtnText}>✕</Text>
            : <GearIcon color={Colors.textPrimary} size={20} />}
        </Pressable>
      </View>

      {/* ── Tab + action row ─────────────────────────────────────────────── */}
      <View style={s.tabActionRow}>
        <View style={s.tabGroup}>
          <Pressable
            onPress={() => setActiveTab('mine')}
            style={[s.tabPill, activeTab === 'mine' && s.tabPillActive]}
            accessibilityRole="tab"
            accessibilityState={{selected: activeTab === 'mine'}}>
            <Text style={[s.tabText, activeTab === 'mine' && s.tabTextActive]}>
              {strings.myProperties.screenTitle}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab('favorites')}
            style={[s.tabPill, activeTab === 'favorites' && s.tabPillActive]}
            accessibilityRole="tab"
            accessibilityState={{selected: activeTab === 'favorites'}}>
            <Text style={[s.tabText, activeTab === 'favorites' && s.tabTextActive]}>
              {strings.myProperties.favoritesTab}
            </Text>
          </Pressable>
        </View>

        <Pressable
          onPress={() => navigation.navigate('SellProperty')}
          style={({pressed}) => [s.addBtn, pressed && {opacity: 0.75}]}
          accessibilityRole="button"
          accessibilityLabel="Add new listing">
          <Text style={s.addBtnText}>+</Text>
        </Pressable>
      </View>

      {/* ── Status filter chips (mine tab only) ──────────────────────────── */}
      {activeTab === 'mine' && !isLoadingMine && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={s.filterBar}
          contentContainerStyle={s.filterBarContent}>
          {filterChips.map(chip => (
            <Pressable
              key={String(chip.key)}
              onPress={() => setStatusFilter(chip.key)}
              style={[
                s.filterChip,
                statusFilter === chip.key && s.filterChipActive,
                chip.key === 'rejected' && chip.count > 0 && statusFilter !== 'rejected' && s.filterChipAlert,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`${chip.label}: ${chip.count}`}>
              <Text
                style={[
                  s.filterChipText,
                  statusFilter === chip.key && s.filterChipTextActive,
                  chip.key === 'rejected' && chip.count > 0 && statusFilter !== 'rejected' && s.filterChipTextAlert,
                ]}>
                {chip.count > 0 ? `${chip.count} ` : ''}{chip.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {/* ── Tab content ──────────────────────────────────────────────────── */}
      <View style={s.tabContent}>
        {activeTab === 'mine' ? renderMineTab() : renderFavoritesTab()}
      </View>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  screen: {
    backgroundColor: Colors.backgroundPrimary,
    flex: 1,
  },

  // ── Top bar ───────────────────────────────────────────────────────────────
  topBar: {
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    borderBottomColor: Colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  iconBtn: {
    alignItems: 'center',
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  iconBtnText: {
    color: Colors.textPrimary,
    fontSize: 20,
  },
  searchInput: {
    backgroundColor: Colors.backgroundMuted,
    borderRadius: 10,
    color: Colors.textPrimary,
    flex: 1,
    fontSize: 15,
    height: 38,
    marginHorizontal: 8,
    paddingHorizontal: 12,
    paddingVertical: 0,
  },

  // ── Tab + action row ──────────────────────────────────────────────────────
  tabActionRow: {
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 14,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  tabGroup: {
    backgroundColor: Colors.backgroundMuted,
    borderColor: Colors.border,
    borderRadius: 100,
    borderWidth: 1,
    flexDirection: 'row',
    padding: 3,
  },
  tabPill: {
    borderRadius: 100,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  tabPillActive: {
    backgroundColor: '#1A1A1A',
  },
  tabText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
    color: Colors.white,
  },
  addBtn: {
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 22,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  addBtnText: {
    color: Colors.white,
    fontSize: 22,
    fontWeight: '300',
    lineHeight: 28,
  },

  // ── Status filter bar ─────────────────────────────────────────────────────
  filterBar: {
    backgroundColor: Colors.backgroundSecondary,
    borderBottomColor: Colors.border,
    borderBottomWidth: 1,
    flexGrow: 0,
    flexShrink: 0,
  },
  filterBarContent: {
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  filterChip: {
    backgroundColor: Colors.backgroundMuted,
    borderColor: Colors.border,
    borderRadius: 100,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  filterChipActive: {
    backgroundColor: '#1A1A1A',
    borderColor: '#1A1A1A',
  },
  filterChipAlert: {
    backgroundColor: '#FFF0F0',
    borderColor: '#FFCDD2',
  },
  filterChipText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: Colors.white,
  },
  filterChipTextAlert: {
    color: '#C0392B',
  },

  // ── Tab content ───────────────────────────────────────────────────────────
  tabContent: {
    flex: 1,
  },
  centeredLoader: {
    marginTop: 60,
  },
  listContent: {
    padding: 16,
    paddingBottom: 16,
  },

  // ── Card ──────────────────────────────────────────────────────────────────
  card: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 20,
    elevation: 2,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: Colors.shadowColor,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  cardPressed: {
    opacity: 0.92,
  },
  cardImage: {
    height: 145,
    overflow: 'hidden',
    position: 'relative',
  },

  // Image overlays
  imgBadgeTL: {
    backgroundColor: 'rgba(20,20,18,0.72)',
    borderRadius: 100,
    left: 12,
    paddingHorizontal: 12,
    paddingVertical: 5,
    position: 'absolute',
    top: 12,
  },
  imgBadgeTLText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  reviseBtn: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 100,
    paddingHorizontal: 14,
    paddingVertical: 5,
    position: 'absolute',
    right: 12,
    top: 12,
  },
  reviseBtnText: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  statusBadgeImg: {
    position: 'absolute',
    right: 12,
    top: 12,
  },
  newBadge: {
    backgroundColor: '#1A1A1A',
    borderRadius: 100,
    bottom: 12,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    position: 'absolute',
  },
  newBadgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  heartBtn: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
    height: 36,
    justifyContent: 'center',
    position: 'absolute',
    right: 12,
    top: 12,
    width: 36,
  },
  heartIcon: {
    color: '#FF4D6A',
    fontSize: 18,
  },

  // Card body
  cardBody: {
    gap: 5,
    paddingBottom: 16,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  titleRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  cardTitle: {
    color: Colors.textPrimary,
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.1,
    lineHeight: 23,
  },
  statusChip: {
    borderRadius: 100,
    marginTop: 3,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  heartBtnTitle: {
    paddingTop: 3,
  },
  locationRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  verifiedDot: {
    backgroundColor: '#4CAF50',
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  unverifiedDot: {
    backgroundColor: Colors.textMuted,
  },
  locationText: {
    color: Colors.textSecondary,
    flex: 1,
    fontSize: 13,
  },
  verifiedCheck: {
    color: '#4CAF50',
    fontSize: 13,
    fontWeight: '700',
  },
  priceText: {
    color: Colors.textPrimary,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.1,
    marginTop: 2,
  },
  dateText: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 1,
  },
  cardActions: {
    marginTop: 6,
  },
  actionBtn: {
    alignSelf: 'flex-start',
  },

  // ── Error / empty ─────────────────────────────────────────────────────────
  errorBanner: {
    backgroundColor: Colors.errorLight,
    borderRadius: 12,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  errorBannerText: {
    color: Colors.error,
    fontSize: 13,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtitle: {
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
  emptyBtn: {
    alignSelf: 'center',
  },
});

export default MyPropertiesScreen;
