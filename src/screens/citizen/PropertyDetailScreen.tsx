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

type Props = NativeStackScreenProps<CitizenStackParamList, 'PropertyDetail'>;

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);

const InfoRow = ({label, value}: {label: string; value: string}) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const PropertyDetailScreen = ({route, navigation}: Props) => {
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
        <Text style={styles.loadingText}>Loading property…</Text>
      </View>
    );
  }

  if (!property) {
    return (
      <View style={styles.centeredState}>
        <Text style={styles.errorTitle}>Property unavailable</Text>
        <Text style={styles.errorText}>{errorMessage ?? 'Try again shortly.'}</Text>
      </View>
    );
  }

  const onBuyProperty = () => {
    Alert.alert(
      'Buy Property',
      `Buy ${property.title} for ${formatCurrency(property.price)}?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Buy',
          onPress: () => {
            void (async () => {
              try {
                setIsBuying(true);
                await buyProperty(property.id);
                Alert.alert('Purchase complete', 'The property has been transferred to your account.');
                navigation.navigate('Profile');
              } catch (error) {
                Alert.alert(
                  'Purchase failed',
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

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        <VerificationBadge status={property.verificationStatus} showIcon />
        <Text style={styles.heroTitle}>{property.title}</Text>
        <Text style={styles.heroSubtitle}>{property.location}</Text>
      </View>

      <View style={styles.statsRow}>
        <Card variant="dark" padding="md" style={styles.statCard}>
          <Text style={styles.darkStatValue}>{formatCurrency(property.price)}</Text>
          <Text style={styles.darkStatLabel}>
            {property.marketType === 'sale' ? 'Asking Price' : 'Project Price'}
          </Text>
        </Card>
        <Card variant="default" padding="md" style={styles.statCard}>
          <Text style={styles.lightStatValue}>
            {property.marketType === 'sale'
              ? 'Direct Sale'
              : String(property.availableShares)}
          </Text>
          <Text style={styles.lightStatLabel}>
            {property.marketType === 'sale' ? 'Listing Type' : 'Shares Available'}
          </Text>
        </Card>
      </View>

      <Card variant="default" padding="md" style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Property Summary</Text>
        <Text style={styles.paragraph}>{property.description}</Text>
        <InfoRow label="Owner" value={property.ownerName} />
        <InfoRow label="Market type" value={property.marketType} />
        <InfoRow label="Ownership type" value={property.ownershipType} />
        <InfoRow label="Property value" value={formatCurrency(property.propertyValue)} />
        <InfoRow
          label={property.marketType === 'sale' ? 'Sale price' : 'Price per share'}
          value={formatCurrency(property.pricePerShare)}
        />
      </Card>

      <Card variant="default" padding="md" style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Verification</Text>
        <InfoRow label="Listing status" value={property.verificationStatus} />
        <InfoRow
          label="Property verification"
          value={property.propertyVerificationStatus}
        />
        <InfoRow
          label="Identity verification"
          value={property.identityVerificationStatus}
        />
        <InfoRow
          label="Verified at"
          value={formatDateTime(property.verificationTimestamp)}
        />
        <InfoRow label="Blockchain status" value={property.blockchainStatus} />
        <InfoRow label="Proof number" value={property.ownershipProofNumber} />
      </Card>

      <Card variant="dark" padding="md" style={styles.sectionCard}>
        <Text style={styles.blockchainTitle}>Blockchain Record</Text>
        <Text style={styles.blockchainValue}>{property.blockchainHash || 'Pending hash'}</Text>
        <Text style={styles.blockchainValue}>
          {property.blockchainTransactionId || 'Transaction will be added after anchor'}
        </Text>
      </Card>

      {property.auditTrail.length > 0 ? (
        <Card variant="default" padding="md" style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Recent Audit Trail</Text>
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
          label="Simulate Investment"
          onPress={() => navigation.navigate('InvestmentSimulation', {propertyId: property.id})}
          variant="primary"
          size="lg"
          fullWidth
          style={styles.ctaButton}
        />
      ) : (
        <Button
          label="Buy Property"
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
    padding: 16,
    paddingBottom: 32,
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
    backgroundColor: Colors.backgroundMuted,
    borderRadius: 24,
    padding: 18,
  },
  heroTitle: {
    color: Colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    marginTop: 10,
  },
  heroSubtitle: {
    color: Colors.textSecondary,
    marginTop: 6,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
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
    marginTop: 16,
  },
});

export default PropertyDetailScreen;
