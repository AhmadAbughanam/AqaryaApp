import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import Button from '../../components/Button';
import Card from '../../components/Card';
import StatusBadge from '../../components/StatusBadge';
import {getMyProfile, CitizenProfile} from '../../api/profile';
import {CitizenStackParamList} from '../../navigation/CitizenStack';
import {Colors} from '../../constants/colors';

type Props = NativeStackScreenProps<CitizenStackParamList, 'Profile'>;

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);

const CitizenProfileScreen = ({navigation}: Props) => {
  const [profile, setProfile] = useState<CitizenProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    try {
      const response = await getMyProfile();
      setProfile(response);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Unable to load profile.',
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  if (isLoading) {
    return (
      <View style={styles.centeredState}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading profile…</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.centeredState}>
        <Text style={styles.errorTitle}>Profile unavailable</Text>
        <Text style={styles.errorMessage}>{errorMessage ?? 'Try again shortly.'}</Text>
      </View>
    );
  }

  const saleEligibleProperties = profile.ownedProperties.filter(
    property => property.marketType === 'sale',
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={() => {
            setIsRefreshing(true);
            void loadProfile();
          }}
          tintColor={Colors.primary}
          colors={[Colors.primary]}
        />
      }>
      <Text style={styles.title}>{profile.user.username}</Text>
      <Text style={styles.subtitle}>
        Owned properties, investment history, and current listing statuses.
      </Text>

      <View style={styles.statsRow}>
        <Card variant="dark" padding="md" style={styles.statCard}>
          <Text style={styles.darkStatValue}>{profile.aggregates.ownedPropertyCount}</Text>
          <Text style={styles.darkStatLabel}>Owned</Text>
        </Card>
        <Card variant="default" padding="md" style={styles.statCard}>
          <Text style={styles.lightStatValue}>{profile.aggregates.salePropertyCount}</Text>
          <Text style={styles.lightStatLabel}>Sale Homes</Text>
        </Card>
      </View>

      <View style={styles.statsRowSecondary}>
        <Card variant="default" padding="md" style={styles.statCard}>
          <Text style={styles.lightStatValue}>
            {profile.aggregates.investmentProjectCount}
          </Text>
          <Text style={styles.lightStatLabel}>Projects</Text>
        </Card>
        <Card variant="default" padding="md" style={styles.statCard}>
          <Text style={styles.lightStatValue}>{profile.aggregates.investmentCount}</Text>
          <Text style={styles.lightStatLabel}>Investments</Text>
        </Card>
      </View>

      <Card variant="default" padding="md" style={styles.summaryCard}>
        <Text style={styles.sectionTitle}>Aggregate Stats</Text>
        <Text style={styles.summaryLine}>
          Listed for sale: {profile.aggregates.listedForSaleCount}
        </Text>
        <Text style={styles.summaryLine}>Sold listings: {profile.aggregates.soldPropertyCount}</Text>
        <Text style={styles.summaryLine}>
          Total owned value: {formatCurrency(profile.aggregates.totalOwnedValue)}
        </Text>
        <Text style={styles.summaryLine}>
          Total invested: {formatCurrency(profile.aggregates.totalInvested)}
        </Text>
      </Card>

      <Card variant="default" padding="md" style={styles.summaryCard}>
        <Text style={styles.sectionTitle}>Sell Your Property</Text>
        <Text style={styles.summaryLine}>
          Choose one of your owned sale homes below to submit or resubmit it for sale verification.
        </Text>
        <Button
          label="Open Sell Listing Form"
          onPress={() => navigation.navigate('SellProperty')}
          variant="primary"
          size="sm"
          style={styles.primaryActionButton}
        />
        <Text style={styles.summaryHint}>
          Eligible sale properties: {saleEligibleProperties.filter(property => property.canListForSale).length}
        </Text>
      </Card>

      <Text style={styles.sectionHeading}>Owned Properties</Text>
      {profile.ownedProperties.map(property => (
        <Card key={property.id} variant="default" padding="md" style={styles.listCard}>
          <View style={styles.cardTopRow}>
            <View style={styles.cardTopCopy}>
              <Text style={styles.cardTitle}>{property.title}</Text>
              <Text style={styles.cardSubtitle}>{property.location}</Text>
            </View>
            <StatusBadge status={property.status} />
          </View>
          <Text style={styles.cardMeta}>
            {property.marketType === 'sale' ? 'Sale home' : 'Investment project'} | Value{' '}
            {formatCurrency(property.propertyValue)} | Asking {formatCurrency(property.price)}
          </Text>
          {property.marketType === 'investment' ? (
            <Text style={styles.cardMeta}>
              Shares {property.availableShares}/{property.totalShares} available
            </Text>
          ) : null}
          <Text style={styles.cardMeta}>
            Property verification {property.verificationStatus} | Identity {property.identityVerificationStatus}
          </Text>
          {property.marketType === 'sale' ? (
            <>
              <Button
                label={property.canListForSale ? 'List This Property' : 'Already In Sale Flow'}
                onPress={() =>
                  property.canListForSale
                    ? navigation.navigate('SellProperty', {
                        propertyId: property.id,
                        title: property.title,
                        location: property.location,
                        ownerName: profile.user.username,
                        ownershipType: 'Freehold',
                        ownershipProofType: 'title_deed',
                        ownershipProofNumber: '',
                        description: '',
                        propertyValue: property.propertyValue,
                        price: property.price,
                      })
                    : undefined
                }
                variant={property.canListForSale ? 'primary' : 'secondary'}
                size="sm"
                style={styles.listButton}
                disabled={!property.canListForSale}
              />
              {!property.canListForSale ? (
                <Text style={styles.actionHint}>
                  This property is already pending, verified, or frozen in the sale workflow.
                </Text>
              ) : null}
            </>
          ) : null}
        </Card>
      ))}

      <Text style={styles.sectionHeading}>Investments</Text>
      {profile.investments.map(investment => (
        <Card
          key={investment.simulationId}
          variant="muted"
          padding="md"
          style={styles.listCard}>
          <View style={styles.cardTopRow}>
            <View style={styles.cardTopCopy}>
              <Text style={styles.cardTitle}>{investment.propertyTitle}</Text>
              <Text style={styles.cardSubtitle}>{investment.propertyLocation}</Text>
            </View>
            <StatusBadge status={investment.propertyStatus} />
          </View>
          <Text style={styles.cardMeta}>Shares owned {investment.sharesOwned}</Text>
          <Text style={styles.cardMeta}>
            Simulated total {formatCurrency(investment.totalAmount)}
          </Text>
          <Text style={styles.cardMeta}>
            Annual return {formatCurrency(investment.expectedAnnualReturn)} | 5Y return{' '}
            {formatCurrency(investment.expectedFiveYearReturn)}
          </Text>
        </Card>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.backgroundPrimary,
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  centeredState: {
    alignItems: 'center',
    backgroundColor: Colors.backgroundPrimary,
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    color: Colors.textSecondary,
    marginTop: 12,
  },
  errorTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  errorMessage: {
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 24,
    fontWeight: '800',
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statsRowSecondary: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  statCard: {
    flex: 1,
  },
  darkStatValue: {
    color: Colors.textOnDark,
    fontSize: 24,
    fontWeight: '800',
  },
  darkStatLabel: {
    color: Colors.textOnDarkMuted,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  lightStatValue: {
    color: Colors.textPrimary,
    fontSize: 24,
    fontWeight: '800',
  },
  lightStatLabel: {
    color: Colors.textMuted,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  summaryCard: {
    marginTop: 12,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  summaryLine: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginBottom: 6,
  },
  summaryHint: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 10,
  },
  sectionHeading: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 10,
  },
  listCard: {
    marginBottom: 12,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardTopCopy: {
    flex: 1,
  },
  cardTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  cardSubtitle: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginTop: 4,
  },
  cardMeta: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginTop: 10,
  },
  listButton: {
    marginTop: 14,
  },
  primaryActionButton: {
    marginTop: 12,
  },
  actionHint: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 10,
  },
});

export default CitizenProfileScreen;
