// Public listing detail screen — shown when browsing the marketplace from Home or Map.
// Presents property specs, amenities, seller info, and a context-appropriate CTA.
// Used by CitizenHomeStack and CitizenMapStack.

import React, {useCallback, useEffect, useLayoutEffect, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {useFocusEffect, useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import Card from '../../components/Card';
import Button from '../../components/Button';
import VerificationBadge from '../../components/VerificationBadge';
import {getPropertyDetails, buyPropertyWithWallet, PropertyDetails} from '../../api/properties';
import {checkListingSaved, saveListing, unsaveListing} from '../../api/savedListings';
import {reportListing, ReportReason, REPORT_REASON_LABELS} from '../../api/moderation';
import {CitizenTabParamList} from '../../navigation/CitizenTabNavigator';
import { formatDateTime, formatCurrency, formatFractionMin2 } from '../../utils/formatters';
import {Colors} from '../../constants/colors';
import {useStrings} from '../../i18n';
import PropertyImage from '../../components/PropertyImage';
import {useInvestMode} from '../../store/investModeState';
import {getWalletBalance, WalletBalance} from '../../api/wallet';
import {AppImages} from '../../assets/images';

type LocalRoute = RouteProp<
  {PublicListingDetail: {id: string; marketType?: 'sale' | 'rent' | 'investment'}},
  'PublicListingDetail'
>;

const InfoRow = ({label, value, isDark = false}: {label: string; value: string; isDark?: boolean}) => (
  <View style={[styles.infoRow, isDark && styles.darkInfoRow]}>
    <Text style={[styles.infoLabel, isDark && styles.darkTextSecondary]}>{label}</Text>
    <Text style={[styles.infoValue, isDark && styles.darkTextPrimary]}>{value}</Text>
  </View>
);

const SpecChip = ({icon, label, isDark = false}: {icon: string; label: string; isDark?: boolean}) => (
  <View style={[styles.specChip, isDark && styles.darkSpecChip]}>
    <Text style={styles.specIcon}>{icon}</Text>
    <Text style={[styles.specLabel, isDark && styles.darkTextPrimary]}>{label}</Text>
  </View>
);

const PublicListingDetailScreen = () => {
  const route = useRoute<LocalRoute>();
  const navigation = useNavigation();
  const {id} = route.params;
  const strings = useStrings();
  const {setIsInvest} = useInvestMode();

  const [property, setProperty] = useState<PropertyDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBuying, setIsBuying] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isSavingItem, setIsSavingItem] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const [walletBalance, setWalletBalance] = useState<WalletBalance | null>(null);

  const fetchDetails = useCallback(async () => {
    try {
      const [data, savedStatus, bal] = await Promise.all([
        getPropertyDetails(id),
        checkListingSaved(id).catch(() => false),
        getWalletBalance().catch(() => null),
      ]);
      setProperty(data);
      setIsSaved(savedStatus);
      setWalletBalance(bal);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : strings.publicListing.unavailableMessage);
    } finally {
      setIsLoading(false);
    }
  }, [id, strings]);

  const onToggleSave = async () => {
    setIsSavingItem(true);
    try {
      if (isSaved) {
        await unsaveListing(id);
        setIsSaved(false);
      } else {
        await saveListing(id);
        setIsSaved(true);
      }
    } catch {
      Alert.alert(strings.common.error, strings.publicListing.saveError);
    } finally {
      setIsSavingItem(false);
    }
  };

  useEffect(() => {
    void fetchDetails();
  }, [fetchDetails]);

  const shouldUseDarkTheme =
    route.params.marketType === 'investment' || property?.marketType === 'investment';

  useFocusEffect(
    useCallback(() => {
      const useDark = Boolean(shouldUseDarkTheme);
      const tabNav = navigation.getParent<BottomTabNavigationProp<CitizenTabParamList>>();
      let timer: ReturnType<typeof setTimeout> | undefined;

      setIsInvest(useDark);
      if (useDark) {
        tabNav?.setOptions({
          tabBarStyle: styles.tabBarDarkOverride,
          tabBarActiveTintColor: '#7CBFAA',
          tabBarInactiveTintColor: '#3A3A38',
        });
        timer = setTimeout(() => setIsInvest(true), 0);
      }

      return () => {
        if (timer) {
          clearTimeout(timer);
        }
        if (useDark) {
          tabNav?.setOptions({
            tabBarStyle: undefined,
            tabBarActiveTintColor: undefined,
            tabBarInactiveTintColor: undefined,
          });
        }
        setIsInvest(false);
      };
    }, [navigation, setIsInvest, shouldUseDarkTheme]),
  );

  useLayoutEffect(() => {
    const balanceText = walletBalance != null
      ? `JOD ${formatFractionMin2(walletBalance.availableBalance)}`
      : '—';
    navigation.setOptions({
      headerStyle: {
        backgroundColor: shouldUseDarkTheme ? '#0D0D0C' : Colors.backgroundSecondary,
      },
      headerTintColor: shouldUseDarkTheme ? '#7CBFAA' : Colors.primary,
      headerTitleStyle: {
        color: shouldUseDarkTheme ? '#F0F0EE' : Colors.textPrimary,
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.1,
      },
      contentStyle: {
        backgroundColor: shouldUseDarkTheme ? '#0D0D0C' : Colors.backgroundPrimary,
      },
      headerRight: () => (
        <View style={styles.headerBalance}>
          <Text style={[styles.headerBalanceIcon, shouldUseDarkTheme && styles.headerBalanceIconDark]}>◈</Text>
          <Text style={[styles.headerBalanceText, shouldUseDarkTheme && styles.headerBalanceTextDark]}>
            {balanceText}
          </Text>
        </View>
      ),
    });
  }, [navigation, shouldUseDarkTheme, walletBalance]);

  if (isLoading) {
    return (
      <View style={[styles.centered, shouldUseDarkTheme && styles.centeredDark]}>
        <ActivityIndicator size="large" color={shouldUseDarkTheme ? '#7CBFAA' : Colors.primary} />
        <Text style={[styles.loadingText, shouldUseDarkTheme && styles.loadingTextDark]}>
          {strings.publicListing.loadingText}
        </Text>
      </View>
    );
  }

  if (!property) {
    return (
      <View style={[styles.centered, shouldUseDarkTheme && styles.centeredDark]}>
        <Text style={[styles.errorTitle, shouldUseDarkTheme && styles.darkTextPrimary]}>
          {strings.publicListing.unavailableTitle}
        </Text>
        <Text style={[styles.errorText, shouldUseDarkTheme && styles.darkTextSecondary]}>
          {error ?? strings.publicListing.unavailableMessage}
        </Text>
      </View>
    );
  }

  const isInvestment = shouldUseDarkTheme;
  const displayMarketType = isInvestment ? 'investment' : property.marketType;
  const isSale = !isInvestment && property.marketType === 'sale';
  const isRent = !isInvestment && property.marketType === 'rent';

  const onBuy = () => {

    if (!walletBalance || walletBalance.availableBalance < property.price) {
      const needed = formatFractionMin2(property.price);
      const have   = walletBalance ? formatFractionMin2(walletBalance.availableBalance) : '0.00';
      Alert.alert(
        'Insufficient Balance',
        `You need JOD ${needed} in your Ejod Wallet to buy this property.\n\nYour balance: JOD ${have}\n\nPlease deposit funds first.`,
      );
      return;
    }

    Alert.alert(
      strings.publicListing.purchaseTitle,
      `Buy ${property.title} for JOD ${formatFractionMin2(property.price)}?\n\nThis will be deducted from your Ejod Wallet.`,
      [
        {text: strings.publicListing.purchaseCancel, style: 'cancel'},
        {
          text: strings.publicListing.purchaseConfirm,
          onPress: () => {
            void (async () => {
              try {
                setIsBuying(true);
                await buyPropertyWithWallet(property.id);
                Alert.alert(
                  strings.publicListing.purchaseComplete,
                  strings.publicListing.purchaseCompleteMsg,
                );
                navigation.goBack();
              } catch (err) {
                Alert.alert(
                  strings.publicListing.purchaseFailed,
                  err instanceof Error ? err.message : strings.publicListing.unavailableMessage,
                );
              } finally {
                setIsBuying(false);
              }
            })();
          },
        },
      ],
    );
  };

  const onReport = () => {
    const reasons: ReportReason[] = ['spam', 'fraud', 'misleading_info', 'inappropriate', 'duplicate', 'other'];
    Alert.alert(
      'Report Listing',
      'Why are you reporting this listing?',
      [
        ...reasons.map(reason => ({
          text: REPORT_REASON_LABELS[reason],
          onPress: () => {
            void (async () => {
              try {
                setIsReporting(true);
                await reportListing(id, {reason});
                Alert.alert('Report submitted', 'Thank you. Our team will review it shortly.');
              } catch (err) {
                Alert.alert(strings.common.error, err instanceof Error ? err.message : 'Could not submit report.');
              } finally {
                setIsReporting(false);
              }
            })();
          },
        })),
        {text: 'Cancel', style: 'cancel'},
      ],
    );
  };

  const onInquireRent = () => {
    Alert.alert(
      strings.publicListing.rentalEnquiryTitle,
      strings.publicListing.rentalEnquiryMsg,
    );
  };

  const onSimulateInvestment = () => {
    const tabNav = navigation.getParent<BottomTabNavigationProp<CitizenTabParamList>>();
    tabNav?.navigate('PropertiesTab', {
      screen: 'InvestmentSimulation',
      params: {propertyId: property.id},
    });
  };

  const priceLabel = isRent
    ? strings.publicListing.monthlyRent
    : isSale
      ? strings.publicListing.askingPrice
      : strings.publicListing.projectPrice;
  const ctaLabel = isSale
    ? strings.publicListing.buyButton
    : isRent
      ? strings.publicListing.enquireButton
      : strings.publicListing.simulateButton;
  const onCtaPress = isSale ? onBuy : isRent ? onInquireRent : onSimulateInvestment;

  const marketBadgeText = isSale
    ? strings.publicListing.forSale
    : isRent
      ? strings.publicListing.forRent
      : strings.publicListing.investment;

  const hasSpecs =
    property.bedrooms != null ||
    property.bathrooms != null ||
    property.areaSqm != null ||
    property.propertyType != null;

  return (
    <ScrollView
      style={[styles.screen, isInvestment && styles.screenDark]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>

      {/* ── Image Hero ────────────────────────────────────────────────────────── */}
      <PropertyImage
        imageUrls={property.imageUrls}
        marketType={displayMarketType}
        style={styles.imageHero}
        fallbackSource={
          displayMarketType === 'investment'
            ? AppImages.property.investment.detailHero
            : displayMarketType === 'rent'
              ? AppImages.property.rent.detailHero
              : AppImages.property.sale.detailHero
        }>
        {/* Top badge row */}
        <View style={styles.imageHeroBadgeRow}>
          <View style={styles.imageHeroMarketBadge}>
            <Text style={styles.imageHeroMarketText}>{marketBadgeText}</Text>
          </View>
          <Pressable
            onPress={() => void onToggleSave()}
            disabled={isSavingItem}
            style={({pressed}) => [styles.imageHeroSaveBtn, pressed && {opacity: 0.65}]}
            accessibilityRole="button"
            accessibilityLabel={isSaved ? 'Remove from saved' : 'Save listing'}>
            <Text style={styles.imageHeroSaveText}>{isSaved ? '♥' : '♡'}</Text>
          </Pressable>
        </View>
        {/* Bottom overlay */}
        <View
          style={[
            styles.imageHeroBottom,
            !isInvestment && styles.imageHeroBottomClear,
          ]}>
          <VerificationBadge status={property.verificationStatus} showIcon />
          <Text style={styles.imageHeroTitle}>{property.title}</Text>
          <Text style={styles.imageHeroLocation}>{property.location}</Text>
        </View>
      </PropertyImage>

      {/* ── Price strip ─────────────────────────────────────────────────────── */}
      <View style={styles.statsRow}>
        <Card variant="dark" padding="md" style={styles.statCard}>
          <Text style={styles.darkStatValue}>{formatCurrency(property.price)}</Text>
          <Text style={styles.darkStatLabel}>{priceLabel}</Text>
        </Card>
        <Card
          variant={isInvestment ? 'dark' : 'default'}
          padding="md"
          style={[styles.statCard, isInvestment && styles.darkSurfaceCard]}>
          <Text style={[styles.lightStatValue, isInvestment && styles.darkTextPrimary]}>
            {formatCurrency(property.propertyValue)}
          </Text>
          <Text style={[styles.lightStatLabel, isInvestment && styles.darkTextMuted]}>
            {strings.publicListing.valuation}
          </Text>
        </Card>
      </View>

      {/* ── Specs row ───────────────────────────────────────────────────────── */}
      {hasSpecs ? (
        <View style={styles.specsRow}>
          {property.propertyType ? (
            <SpecChip icon="🏠" label={property.propertyType} isDark={isInvestment} />
          ) : null}
          {property.bedrooms != null ? (
            <SpecChip icon="🛏" label={`${property.bedrooms} ${strings.publicListing.bed}`} isDark={isInvestment} />
          ) : null}
          {property.bathrooms != null ? (
            <SpecChip icon="🛁" label={`${property.bathrooms} ${strings.publicListing.bath}`} isDark={isInvestment} />
          ) : null}
          {property.areaSqm != null ? (
            <SpecChip icon="📐" label={`${property.areaSqm} m²`} isDark={isInvestment} />
          ) : null}
        </View>
      ) : null}

      {/* ── About ───────────────────────────────────────────────────────────── */}
      <Card
        variant={isInvestment ? 'dark' : 'default'}
        padding="md"
        style={[styles.sectionCard, isInvestment && styles.darkSurfaceCard]}>
        <Text style={[styles.sectionTitle, isInvestment && styles.darkTextPrimary]}>{strings.publicListing.aboutTitle}</Text>
        <Text style={[styles.paragraph, isInvestment && styles.darkTextSecondary]}>{property.description}</Text>
        <InfoRow label={strings.publicListing.ownerLabel} value={property.ownerName} isDark={isInvestment} />
        <InfoRow label={strings.publicListing.ownershipLabel} value={property.ownershipType} isDark={isInvestment} />
        {property.city ? <InfoRow label={strings.publicListing.cityLabel} value={property.city} isDark={isInvestment} /> : null}
      </Card>

      {/* ── Amenities ───────────────────────────────────────────────────────── */}
      {property.amenities && property.amenities.length > 0 ? (
        <Card
          variant={isInvestment ? 'dark' : 'default'}
          padding="md"
          style={[styles.sectionCard, isInvestment && styles.darkSurfaceCard]}>
          <Text style={[styles.sectionTitle, isInvestment && styles.darkTextPrimary]}>{strings.publicListing.amenitiesTitle}</Text>
          <View style={styles.amenitiesWrap}>
            {property.amenities.map(amenity => (
              <View key={amenity} style={[styles.amenityChip, isInvestment && styles.darkAmenityChip]}>
                <Text style={[styles.amenityText, isInvestment && styles.darkAccentText]}>{amenity}</Text>
              </View>
            ))}
          </View>
        </Card>
      ) : null}

      {/* ── Seller / Sponsor ────────────────────────────────────────────────── */}
      {property.seller ? (
        <Card
          variant={isInvestment ? 'dark' : 'default'}
          padding="md"
          style={[styles.sectionCard, isInvestment && styles.darkSurfaceCard]}>
          <Text style={[styles.sectionTitle, isInvestment && styles.darkTextPrimary]}>{isInvestment ? strings.publicListing.sponsorTitle : strings.publicListing.sellerTitle}</Text>
          <View style={styles.sellerRow}>
            <View style={styles.sellerAvatar}>
              <Text style={styles.sellerAvatarText}>
                {(property.seller.username[0] ?? '?').toUpperCase()}
              </Text>
            </View>
            <View style={styles.sellerInfo}>
              <Text style={[styles.sellerName, isInvestment && styles.darkTextPrimary]}>{property.seller.username}</Text>
              <Text style={[styles.sellerBadge, isInvestment && styles.darkAccentText]}>{strings.publicListing.verifiedMember}</Text>
            </View>
          </View>
        </Card>
      ) : null}

      {/* ── Share info (investment only) ─────────────────────────────────────── */}
      {isInvestment ? (
        <Card variant="dark" padding="md" style={[styles.sectionCard, styles.darkSurfaceCard]}>
          <Text style={[styles.sectionTitle, styles.darkTextPrimary]}>{strings.publicListing.shareInfoTitle}</Text>
          <InfoRow
            label={strings.publicListing.sharesAvailable}
            value={`${property.availableShares} / ${property.totalShares}`}
            isDark
          />
          <InfoRow label={strings.publicListing.pricePerShare} value={formatCurrency(property.pricePerShare)} isDark />
        </Card>
      ) : null}

      {/* ── Verification summary ─────────────────────────────────────────────── */}
      <Card
        variant={isInvestment ? 'dark' : 'default'}
        padding="md"
        style={[styles.sectionCard, isInvestment && styles.darkSurfaceCard]}>
        <Text style={[styles.sectionTitle, isInvestment && styles.darkTextPrimary]}>{strings.publicListing.verificationTitle}</Text>
        <InfoRow label={strings.publicListing.statusLabel} value={property.verificationStatus} isDark={isInvestment} />
        <InfoRow label={strings.publicListing.verifiedLabel} value={formatDateTime(property.verificationTimestamp)} isDark={isInvestment} />
        <InfoRow label={strings.publicListing.blockchainLabel} value={property.blockchainStatus} isDark={isInvestment} />
      </Card>

      {/* ── Ejod balance chip ───────────────────────────────────────────────── */}
      {walletBalance != null && (
        <View style={[styles.balanceChip, isInvestment && styles.balanceChipDark]}>
          <Text style={[styles.balanceChipIcon, isInvestment && styles.balanceChipIconDark]}>◈</Text>
          <Text style={[styles.balanceChipLabel, isInvestment && styles.balanceChipLabelDark]}>
            Ejod Balance:
          </Text>
          <Text style={[styles.balanceChipValue, isInvestment && styles.balanceChipValueDark]}>
            {`JOD ${formatFractionMin2(walletBalance.availableBalance)}`}
          </Text>
        </View>
      )}

      {/* ── CTA ─────────────────────────────────────────────────────────────── */}
      <Button
        label={ctaLabel}
        onPress={onCtaPress}
        variant="primary"
        size="lg"
        fullWidth
        style={styles.ctaButton}
        loading={isBuying}
      />

      {/* ── Report ──────────────────────────────────────────────────────────── */}
      <Pressable
        onPress={onReport}
        disabled={isReporting}
        style={({pressed}) => [styles.reportLink, pressed && {opacity: 0.5}]}
        accessibilityRole="button"
        accessibilityLabel="Report this listing">
        <Text style={[styles.reportLinkText, isInvestment && styles.darkTextMuted]}>
          {isReporting ? 'Submitting…' : 'Report this listing'}
        </Text>
      </Pressable>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: {
    backgroundColor: Colors.backgroundPrimary,
    flex: 1,
  },
  screenDark: {
    backgroundColor: '#0D0D0C',
  },
  tabBarDarkOverride: {
    backgroundColor: '#111110',
    borderTopColor: 'rgba(255,255,255,0.07)',
    borderTopWidth: 1,
    elevation: 0,
    height: 62,
    paddingBottom: 10,
    paddingTop: 8,
    shadowOpacity: 0,
  },
  content: {
    paddingBottom: 0,
  },
  centered: {
    alignItems: 'center',
    backgroundColor: Colors.backgroundPrimary,
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  centeredDark: {
    backgroundColor: '#0D0D0C',
  },
  loadingText: {
    color: Colors.textSecondary,
    marginTop: 12,
  },
  loadingTextDark: {
    color: '#ADADAA',
  },
  errorTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  errorText: {
    color: Colors.textSecondary,
    textAlign: 'center',
  },

  imageHero: {
    height: 165,
    position: 'relative',
    overflow: 'hidden',
    width: '100%',
  },
  imageHeroGrid: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 22,
    padding: 16,
    opacity: 0.07,
  },
  imageHeroGridDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#FFFFFF',
  },
  imageHeroBadgeRow: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  imageHeroMarketBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 100,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  imageHeroMarketText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  imageHeroSaveBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 100,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageHeroSaveText: {
    color: '#FFFFFF',
    fontSize: 18,
  },
  imageHeroBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingTop: 32,
    backgroundColor: 'rgba(0,0,0,0.35)',
    gap: 4,
  },
  imageHeroBottomClear: {
    backgroundColor: Colors.transparent,
  },
  imageHeroTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    marginTop: 4,
    textShadowColor: 'rgba(0,0,0,0.55)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 2,
  },
  imageHeroLocation: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    textShadowColor: 'rgba(0,0,0,0.55)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 2,
  },

  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    paddingHorizontal: 16,
  },
  statCard: {
    flex: 1,
  },
  darkSurfaceCard: {
    backgroundColor: '#1E1E1C',
    borderColor: 'rgba(200,221,212,0.10)',
    borderWidth: 1,
    shadowOpacity: 0,
  },
  darkStatValue: {
    color: Colors.textOnDark,
    fontSize: 18,
    fontWeight: '800',
  },
  darkStatLabel: {
    color: Colors.textOnDarkMuted,
    fontSize: 12,
    marginTop: 4,
  },
  lightStatValue: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  lightStatLabel: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 4,
  },

  specsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
    paddingHorizontal: 16,
  },
  specChip: {
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    borderColor: Colors.border,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  darkSpecChip: {
    backgroundColor: '#1E1E1C',
    borderColor: 'rgba(200,221,212,0.10)',
  },
  specIcon: {
    fontSize: 14,
  },
  specLabel: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },

  sectionCard: {
    marginTop: 14,
    marginHorizontal: 16,
  },
  darkTextPrimary: {
    color: '#F0F0EE',
  },
  darkTextSecondary: {
    color: '#ADADAA',
  },
  darkTextMuted: {
    color: '#666663',
  },
  darkAccentText: {
    color: '#7CBFAA',
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  paragraph: {
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  infoRow: {
    borderTopColor: Colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  darkInfoRow: {
    borderTopColor: 'rgba(200,221,212,0.10)',
  },
  infoLabel: {
    color: Colors.textSecondary,
    flex: 1,
  },
  infoValue: {
    color: Colors.textPrimary,
    flex: 1,
    textAlign: 'right',
  },

  amenitiesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  amenityChip: {
    backgroundColor: Colors.backgroundMuted,
    borderRadius: 100,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  darkAmenityChip: {
    backgroundColor: 'rgba(74,124,111,0.18)',
  },
  amenityText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },

  sellerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  sellerAvatar: {
    alignItems: 'center',
    backgroundColor: Colors.primaryDark,
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  sellerAvatarText: {
    color: Colors.textOnDark,
    fontSize: 18,
    fontWeight: '800',
  },
  sellerInfo: {
    flex: 1,
  },
  sellerName: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  sellerBadge: {
    color: Colors.primary,
    fontSize: 12,
    marginTop: 2,
  },

  balanceChip: {
    alignItems: 'center',
    backgroundColor: Colors.backgroundMuted,
    borderColor: Colors.border,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    marginHorizontal: 16,
    marginTop: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  balanceChipDark: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: 'rgba(255,255,255,0.10)',
  },
  balanceChipIcon: {color: Colors.textMuted, fontSize: 14},
  balanceChipIconDark: {color: '#7CBFAA'},
  balanceChipLabel: {color: Colors.textSecondary, fontSize: 12, fontWeight: '600'},
  balanceChipLabelDark: {color: '#ADADAA'},
  balanceChipValue: {color: Colors.textPrimary, flex: 1, fontSize: 13, fontWeight: '700', textAlign: 'right'},
  balanceChipValueDark: {color: '#E8E8E4'},

  ctaButton: {
    marginTop: 12,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  reportLink: {
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 8,
  },
  reportLinkText: {
    color: Colors.textMuted,
    fontSize: 13,
    textDecorationLine: 'underline',
  },

  // ── Header balance chip ───────────────────────────────────────────────────
  headerBalance: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    marginRight: 4,
  },
  headerBalanceIcon: {
    color: Colors.primary,
    fontSize: 12,
  },
  headerBalanceIconDark: {
    color: '#7CBFAA',
  },
  headerBalanceText: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  headerBalanceTextDark: {
    color: '#F0F0EE',
  },
});

export default PublicListingDetailScreen;
