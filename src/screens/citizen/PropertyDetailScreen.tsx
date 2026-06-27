import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import Card from '../../components/Card';
import VerificationBadge from '../../components/VerificationBadge';
import Button from '../../components/Button';
import {buyProperty, getPropertyDetails, PropertyDetails} from '../../api/properties';
import {CitizenStackParamList} from '../../navigation/CitizenStack';
import {formatDateTime} from '../../utils/formatters';
import {Colors} from '../../constants/colors';
import {useStrings} from '../../i18n';
import PropertyImage from '../../components/PropertyImage';
import {AppImages} from '../../assets/images';
import { formatCurrency } from '../../utils/formatters';

type Props = NativeStackScreenProps<CitizenStackParamList, 'PropertyDetail'>;

const InfoRow = ({label, value}: {label: string; value: string}) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const PropertyDetailScreen = ({route, navigation}: Props) => {
  const strings = useStrings();
  const {id} = route.params;
  const [property, setProperty] = useState<PropertyDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isBuying, setIsBuying] = useState(false);

  const fetchPropertyDetails = useCallback(async () => {
    try {
      const response = await getPropertyDetails(id);
      setProperty(response);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Unable to load property details.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchPropertyDetails();
  }, [fetchPropertyDetails]);

  if (isLoading) {
    return (
      <View style={styles.centeredState}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>{strings.propertyDetail.loadingText}</Text>
      </View>
    );
  }

  if (!property) {
    return (
      <View style={styles.centeredState}>
        <Text style={styles.errorTitle}>{strings.propertyDetail.unavailableTitle}</Text>
        <Text style={styles.errorText}>{errorMessage ?? strings.propertyDetail.unavailableMessage}</Text>
      </View>
    );
  }

  const onBuyProperty = () => {
    Alert.alert(
      strings.propertyDetail.confirmBuyTitle,
      `Buy ${property.title} for ${formatCurrency(property.price)}?`,
      [
        {text: strings.propertyDetail.confirmBuyCancel, style: 'cancel'},
        {
          text: strings.propertyDetail.confirmBuyConfirm,
          onPress: () => {
            void (async () => {
              try {
                setIsBuying(true);
                await buyProperty(property.id);
                Alert.alert(strings.propertyDetail.purchaseComplete, strings.propertyDetail.purchaseCompleteMsg);
                navigation.navigate('MyProperties');
              } catch (error) {
                Alert.alert(
                  strings.propertyDetail.purchaseFailed,
                  error instanceof Error ? error.message : 'Unable to complete the purchase.',
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

  const isSale = property.marketType === 'sale';
  const isRent = property.marketType === 'rent';
  const isInvestment = property.marketType === 'investment';
  const detailFallbackSource = isInvestment
    ? AppImages.property.investment.detailHero
    : isRent
      ? AppImages.property.rent.detailHero
      : AppImages.property.sale.detailHero;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}>
      <PropertyImage
        imageUrls={property.imageUrls}
        marketType={property.marketType}
        style={styles.hero}
        fallbackSource={detailFallbackSource}>
        {isInvestment ? <View style={styles.heroScrim} /> : null}
        <View style={styles.heroContent}>
          <VerificationBadge status={property.verificationStatus} showIcon />
          <Text style={styles.heroTitle}>{property.title}</Text>
          <Text style={styles.heroSubtitle}>{property.location}</Text>
        </View>
      </PropertyImage>

      <View style={styles.statsRow}>
        <Card variant="dark" padding="md" style={styles.statCard}>
          <Text style={styles.darkStatValue}>{formatCurrency(property.price)}</Text>
          <Text style={styles.darkStatLabel}>
            {isSale ? strings.propertyDetail.askingPrice : strings.propertyDetail.projectPrice}
          </Text>
        </Card>
        <Card variant="default" padding="md" style={styles.statCard}>
          <Text style={styles.lightStatValue}>
            {isSale
              ? strings.propertyDetail.directSale
              : String(property.availableShares)}
          </Text>
          <Text style={styles.lightStatLabel}>
            {isSale ? strings.propertyDetail.listingTypeLabel : strings.propertyDetail.sharesAvailableLabel}
          </Text>
        </Card>
      </View>

      <Card variant="default" padding="md" style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>{strings.propertyDetail.propertySummary}</Text>
        <Text style={styles.paragraph}>{property.description}</Text>
        <InfoRow label={strings.propertyDetail.ownerLabel} value={property.ownerName} />
        <InfoRow label={strings.propertyDetail.marketTypeLabel} value={property.marketType} />
        <InfoRow label={strings.propertyDetail.ownershipTypeLabel} value={property.ownershipType} />
        <InfoRow label={strings.propertyDetail.propertyValueLabel} value={formatCurrency(property.propertyValue)} />
        <InfoRow
          label={property.marketType === 'sale' ? strings.propertyDetail.salePriceLabel : strings.propertyDetail.pricePerShareLabel}
          value={formatCurrency(property.pricePerShare)}
        />
      </Card>

      <Card variant="default" padding="md" style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>{strings.propertyDetail.verificationTitle}</Text>
        <InfoRow label={strings.propertyDetail.listingStatusLabel} value={property.verificationStatus} />
        <InfoRow
          label={strings.propertyDetail.propertyVerificationLabel}
          value={property.propertyVerificationStatus}
        />
        <InfoRow
          label={strings.propertyDetail.identityVerificationLabel}
          value={property.identityVerificationStatus}
        />
        <InfoRow
          label={strings.propertyDetail.verifiedAtLabel}
          value={formatDateTime(property.verificationTimestamp)}
        />
        <InfoRow label={strings.propertyDetail.blockchainStatusLabel} value={property.blockchainStatus} />
        <InfoRow label={strings.propertyDetail.proofNumberLabel} value={property.ownershipProofNumber} />
      </Card>

      <Card variant="dark" padding="md" style={styles.sectionCard}>
        <Text style={styles.blockchainTitle}>{strings.propertyDetail.blockchainTitle}</Text>
        <Text style={styles.blockchainValue}>{property.blockchainHash || strings.propertyDetail.pendingHash}</Text>
        <Text style={styles.blockchainValue}>
          {property.blockchainTransactionId || strings.propertyDetail.pendingTransaction}
        </Text>
      </Card>

      {property.auditTrail.length > 0 ? (
        <Card variant="default" padding="md" style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{strings.propertyDetail.auditTrailTitle}</Text>
          {property.auditTrail.map(item => (
            <View key={item.id} style={styles.auditRow}>
              <Text style={styles.auditAction}>{item.actionType}</Text>
              <Text style={styles.auditMeta}>
                {item.actorName} • {formatDateTime(item.timestamp)}
              </Text>
            </View>
          ))}
        </Card>
      ) : null}

      {property.marketType === 'investment' ? (
        <Button
          label={strings.propertyDetail.simulateInvestmentButton}
          onPress={() => navigation.navigate('InvestmentSimulation', {propertyId: property.id})}
          variant="primary"
          size="lg"
          fullWidth
          style={styles.ctaButton}
        />
      ) : (
        <Button
          label={strings.propertyDetail.buyButton}
          onPress={onBuyProperty}
          variant="primary"
          size="lg"
          fullWidth
          style={styles.ctaButton}
          loading={isBuying}
        />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: {
    backgroundColor: Colors.backgroundPrimary,
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 0,
  },
  centeredState: {
    alignItems: 'center',
    backgroundColor: Colors.backgroundPrimary,
    flex: 1,
    justifyContent: 'center',
  },
  loadingText: {
    color: Colors.textSecondary,
    marginTop: 12,
  },
  errorTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  errorText: {
    color: Colors.textSecondary,
    marginTop: 8,
  },
  hero: {
    height: 165,
  },
  heroScrim: {
    backgroundColor: 'rgba(0,0,0,0.32)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  heroContent: {
    bottom: 0,
    gap: 4,
    left: 0,
    padding: 16,
    paddingTop: 40,
    position: 'absolute',
    right: 0,
  },
  heroTitle: {
    color: Colors.textOnDark,
    fontSize: 22,
    fontWeight: '800',
    marginTop: 10,
    textShadowColor: 'rgba(0,0,0,0.55)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 2,
  },
  heroSubtitle: {
    color: Colors.textOnDarkMuted,
    marginTop: 6,
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
  darkStatValue: {
    color: Colors.textOnDark,
    fontSize: 18,
    fontWeight: '800',
  },
  darkStatLabel: {
    color: Colors.textOnDarkMuted,
    marginTop: 4,
  },
  lightStatValue: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  lightStatLabel: {
    color: Colors.textMuted,
    marginTop: 4,
  },
  sectionCard: {
    marginHorizontal: 16,
    marginTop: 14,
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
  infoLabel: {
    color: Colors.textSecondary,
    flex: 1,
  },
  infoValue: {
    color: Colors.textPrimary,
    flex: 1,
    textAlign: 'right',
  },
  blockchainTitle: {
    color: Colors.textOnDark,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  blockchainValue: {
    color: Colors.chatOnlineIndicator,
    marginBottom: 10,
  },
  auditRow: {
    borderTopColor: Colors.border,
    borderTopWidth: 1,
    paddingVertical: 10,
  },
  auditAction: {
    color: Colors.textPrimary,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  auditMeta: {
    color: Colors.textSecondary,
    marginTop: 4,
  },
  ctaButton: {
    marginHorizontal: 16,
    marginBottom: 8,
    marginTop: 16,
  },
});

export default PropertyDetailScreen;
