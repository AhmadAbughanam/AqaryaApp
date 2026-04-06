import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {
  getPilotProperties,
  PilotProperty,
  SimulationResult,
  simulateInvestment,
} from '../../api/investments';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Modal from '../../components/Modal';
import {CitizenStackParamList} from '../../navigation/CitizenStack';
import {Colors} from '../../constants/colors';

type Props = NativeStackScreenProps<CitizenStackParamList, 'InvestmentSimulation'>;
type ExitScenario = 'conservative' | 'base' | 'optimistic';

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);

const InvestmentSimulationScreen = ({navigation, route}: Props) => {
  const preferredPropertyId = route.params?.propertyId;

  const [properties, setProperties] = useState<PilotProperty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<PilotProperty | null>(null);
  const [sharesInput, setSharesInput] = useState('');
  const [holdingPeriodInput, setHoldingPeriodInput] = useState('5');
  const [exitScenario, setExitScenario] = useState<ExitScenario>('base');
  const [reinvestDistributions, setReinvestDistributions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastResult, setLastResult] = useState<SimulationResult | null>(null);

  const fetchPilotProperties = useCallback(async () => {
    try {
      const response = await getPilotProperties();
      setProperties(response);
      setErrorMessage(null);

      if (preferredPropertyId) {
        const preferred = response.find(property => property.id === preferredPropertyId);
        if (preferred) {
          setSelectedProperty(preferred);
          setHoldingPeriodInput(String(preferred.targetHoldYears));
        }
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Unable to load investment projects.',
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [preferredPropertyId]);

  useEffect(() => {
    void fetchPilotProperties();
  }, [fetchPilotProperties]);

  const shares = Number(sharesInput || 0);
  const holdingPeriodYears = Number(holdingPeriodInput || 0);

  const computed = useMemo(() => {
    if (
      !selectedProperty ||
      !Number.isFinite(shares) ||
      shares <= 0 ||
      !Number.isFinite(holdingPeriodYears) ||
      holdingPeriodYears <= 0
    ) {
      return {
        subtotal: 0,
        platformFee: 0,
        governmentFee: 0,
        totalAmount: 0,
        annualGrossIncome: 0,
        annualManagementFee: 0,
        annualNetCashFlow: 0,
        projectedExitValue: 0,
        projectedNetExitProceeds: 0,
        projectedProfit: 0,
        equityMultiple: 0,
        ownershipPercentage: 0,
      };
    }

    const subtotal = shares * selectedProperty.pricePerShare;
    const platformFee = subtotal * 0.015;
    const governmentFee = subtotal * 0.0075;
    const totalAmount = subtotal + platformFee + governmentFee;
    const scenarioYieldFactor =
      exitScenario === 'optimistic' ? 1.08 : exitScenario === 'conservative' ? 0.88 : 1;
    const annualGrossIncome =
      subtotal *
      selectedProperty.targetCashYield *
      selectedProperty.occupancyRate *
      scenarioYieldFactor;
    const annualManagementFee = subtotal * 0.0125;
    const annualNetCashFlow = annualGrossIncome - annualManagementFee;
    const appreciationFactor =
      exitScenario === 'optimistic' ? 1.15 : exitScenario === 'conservative' ? 0.8 : 1;
    const projectedExitValue =
      subtotal * Math.pow(1 + 0.06 * appreciationFactor, holdingPeriodYears);
    const projectedNetExitProceeds = projectedExitValue * 0.99;
    const projectedDistributions =
      annualNetCashFlow * holdingPeriodYears * (reinvestDistributions ? 1.12 : 1);
    const projectedProfit =
      projectedNetExitProceeds + projectedDistributions - totalAmount;

    return {
      subtotal,
      platformFee,
      governmentFee,
      totalAmount,
      annualGrossIncome,
      annualManagementFee,
      annualNetCashFlow,
      projectedExitValue,
      projectedNetExitProceeds,
      projectedProfit,
      equityMultiple:
        totalAmount > 0
          ? (projectedNetExitProceeds + projectedDistributions) / totalAmount
          : 0,
      ownershipPercentage: (shares / selectedProperty.totalShares) * 100,
    };
  }, [
    exitScenario,
    holdingPeriodYears,
    reinvestDistributions,
    selectedProperty,
    shares,
  ]);

  const onSubmitSimulation = async () => {
    if (!selectedProperty || !Number.isInteger(shares) || shares <= 0) {
      setErrorMessage('Enter a valid number of shares before running the simulation.');
      return;
    }

    if (!Number.isInteger(holdingPeriodYears) || holdingPeriodYears <= 0) {
      setErrorMessage('Enter a valid holding period in years.');
      return;
    }

    if (shares < selectedProperty.minimumShares) {
      setErrorMessage(
        `This project requires at least ${selectedProperty.minimumShares} shares.`,
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await simulateInvestment({
        propertyId: selectedProperty.id,
        shares,
        holdingPeriodYears,
        exitScenario,
        reinvestDistributions,
      });
      setLastResult(result);
      setErrorMessage(null);
      setShowSuccessModal(true);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Unable to complete simulation.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centeredState}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading opportunities…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {!selectedProperty ? (
        <FlatList
          data={properties}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
              onRefresh={() => {
                setIsRefreshing(true);
                void fetchPilotProperties();
              }}
            />
          }
          ListHeaderComponent={
            <View style={styles.header}>
              <Text style={styles.screenTitle}>Investment Projects</Text>
              <Text style={styles.screenSubtitle}>
                Review sponsor quality, target yield, funding progress, and your underwriting assumptions before you invest.
              </Text>
              {errorMessage ? (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorBannerText}>{errorMessage}</Text>
                </View>
              ) : null}
            </View>
          }
          renderItem={({item}) => (
            <Card variant="default" padding="md" style={styles.selectionCard}>
              <Text style={styles.selectionTitle}>{item.title}</Text>
              <Text style={styles.selectionSubtitle}>{item.location}</Text>
              <Text style={styles.selectionDescription} numberOfLines={2}>
                {item.description}
              </Text>

              <View style={styles.projectMetaRow}>
                <Text style={styles.projectMetaPill}>{item.assetClass}</Text>
                <Text style={styles.projectMetaPill}>{item.riskBand}</Text>
                <Text style={styles.projectMetaPill}>{item.stage}</Text>
              </View>

              <View style={styles.selectionStats}>
                <Text style={styles.selectionStat}>Sponsor {item.sponsorName}</Text>
                <Text style={styles.selectionStat}>
                  {formatCurrency(item.pricePerShare)} / share
                </Text>
                <Text style={styles.selectionStat}>
                  Minimum ticket {formatCurrency(item.minimumInvestmentAmount)}
                </Text>
                <Text style={styles.selectionStat}>
                  Target IRR {(item.targetIrr * 100).toFixed(1)}% | Cash yield{' '}
                  {(item.targetCashYield * 100).toFixed(1)}%
                </Text>
                <Text style={styles.selectionStat}>
                  Funding {(item.fundingProgress * 100).toFixed(0)}% | Available{' '}
                  {item.availableShares} shares
                </Text>
              </View>

              <Button
                label="Underwrite"
                onPress={() => {
                  setSelectedProperty(item);
                  setSharesInput('');
                  setHoldingPeriodInput(String(item.targetHoldYears));
                  setExitScenario('base');
                  setReinvestDistributions(false);
                }}
                variant="primary"
                size="sm"
              />
            </Card>
          )}
        />
      ) : (
        <ScrollView
          style={styles.formScreen}
          contentContainerStyle={styles.formContent}
          showsVerticalScrollIndicator={false}>
          <Card variant="default" padding="md" style={styles.selectionCard}>
            <Text style={styles.selectionTitle}>{selectedProperty.title}</Text>
            <Text style={styles.selectionSubtitle}>{selectedProperty.location}</Text>
            <Text style={styles.selectionDescription}>{selectedProperty.description}</Text>

            <View style={styles.projectMetaRow}>
              <Text style={styles.projectMetaPill}>{selectedProperty.assetClass}</Text>
              <Text style={styles.projectMetaPill}>{selectedProperty.riskBand}</Text>
              <Text style={styles.projectMetaPill}>
                {selectedProperty.distributionFrequency}
              </Text>
            </View>

            <Text style={styles.selectionStat}>Sponsor {selectedProperty.sponsorName}</Text>
            <Text style={styles.selectionStat}>
              Target IRR {(selectedProperty.targetIrr * 100).toFixed(1)}% | Occupancy{' '}
              {(selectedProperty.occupancyRate * 100).toFixed(0)}%
            </Text>
            <Text style={styles.selectionStat}>
              Funding {(selectedProperty.fundingProgress * 100).toFixed(0)}% | Min shares{' '}
              {selectedProperty.minimumShares}
            </Text>

            <Button
              label="Change Project"
              onPress={() => setSelectedProperty(null)}
              variant="secondary"
              size="sm"
              style={styles.changeButton}
            />
          </Card>

          <Card variant="default" padding="md" style={styles.formCard}>
            <Input
              label="Shares to invest"
              value={sharesInput}
              keyboardType="numeric"
              onChangeText={value => setSharesInput(value.replace(/[^0-9]/g, ''))}
              helperText={`Minimum ${selectedProperty.minimumShares} shares • Maximum available ${selectedProperty.availableShares}`}
            />
            <Input
              label="Planned hold period"
              value={holdingPeriodInput}
              keyboardType="numeric"
              onChangeText={value =>
                setHoldingPeriodInput(value.replace(/[^0-9]/g, ''))
              }
              helperText={`Project target hold: ${selectedProperty.targetHoldYears} years`}
            />
          </Card>

          <Card variant="default" padding="md" style={styles.formCard}>
            <Text style={styles.sectionHeading}>Exit Scenario</Text>
            <View style={styles.optionRow}>
              {(['conservative', 'base', 'optimistic'] as const).map(option => (
                <Button
                  key={option}
                  label={option.charAt(0).toUpperCase() + option.slice(1)}
                  onPress={() => setExitScenario(option)}
                  variant={exitScenario === option ? 'primary' : 'secondary'}
                  size="sm"
                  style={styles.optionButton}
                />
              ))}
            </View>
            <Text style={styles.helperLine}>
              Conservative reduces rent and exit growth assumptions. Optimistic assumes stronger lease-up and pricing.
            </Text>
          </Card>

          <Card variant="default" padding="md" style={styles.formCard}>
            <Text style={styles.sectionHeading}>Distribution Plan</Text>
            <View style={styles.optionRow}>
              <Button
                label="Cash Payout"
                onPress={() => setReinvestDistributions(false)}
                variant={!reinvestDistributions ? 'primary' : 'secondary'}
                size="sm"
                style={styles.optionButton}
              />
              <Button
                label="Reinvest"
                onPress={() => setReinvestDistributions(true)}
                variant={reinvestDistributions ? 'primary' : 'secondary'}
                size="sm"
                style={styles.optionButton}
              />
            </View>
            <Text style={styles.helperLine}>
              Reinvestment compounds distributions instead of paying them out as cash.
            </Text>
          </Card>

          <Card variant="dark" padding="md" style={styles.previewCard}>
            <Text style={styles.previewTitle}>Investment Underwriting</Text>
            <Text style={styles.previewLine}>
              Equity commitment {formatCurrency(computed.subtotal)}
            </Text>
            <Text style={styles.previewLine}>
              Origination fee {formatCurrency(computed.platformFee)}
            </Text>
            <Text style={styles.previewLine}>
              Legal and registry {formatCurrency(computed.governmentFee)}
            </Text>
            <Text style={styles.previewLine}>
              Day-one cash outlay {formatCurrency(computed.totalAmount)}
            </Text>
            <Text style={styles.previewLine}>
              Gross annual income {formatCurrency(computed.annualGrossIncome)}
            </Text>
            <Text style={styles.previewLine}>
              Asset management drag {formatCurrency(computed.annualManagementFee)}
            </Text>
            <Text style={styles.previewLine}>
              Net annual cash flow {formatCurrency(computed.annualNetCashFlow)}
            </Text>
            <Text style={styles.previewLine}>
              Projected exit value {formatCurrency(computed.projectedExitValue)}
            </Text>
            <Text style={styles.previewLine}>
              Net exit proceeds {formatCurrency(computed.projectedNetExitProceeds)}
            </Text>
            <Text style={styles.previewLine}>
              Projected profit {formatCurrency(computed.projectedProfit)}
            </Text>
            <Text style={styles.previewLine}>
              Equity multiple {computed.equityMultiple.toFixed(2)}x
            </Text>
            <Text style={styles.previewLine}>
              Ownership {computed.ownershipPercentage.toFixed(2)}%
            </Text>
          </Card>

          {errorMessage ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{errorMessage}</Text>
            </View>
          ) : null}

          <Button
            label="Commit Simulation"
            onPress={() => void onSubmitSimulation()}
            variant="primary"
            size="lg"
            fullWidth
            loading={isSubmitting}
            disabled={!selectedProperty}
          />
        </ScrollView>
      )}

      <Modal
        visible={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Investment Recorded"
        subtitle={
          lastResult
            ? `${formatCurrency(lastResult.projectedProfit)} projected profit at ${lastResult.equityMultiple.toFixed(2)}x equity multiple.`
            : 'The simulated investment has been saved to your history.'
        }
        primaryAction={{
          label: 'View History',
          onPress: () => {
            setShowSuccessModal(false);
            navigation.navigate('Portfolio');
          },
        }}
        secondaryAction={{
          label: 'Underwrite Again',
          onPress: () => {
            setShowSuccessModal(false);
            setSelectedProperty(null);
          },
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.backgroundPrimary,
    flex: 1,
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
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 16,
  },
  screenTitle: {
    color: Colors.textPrimary,
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  screenSubtitle: {
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  selectionCard: {
    marginBottom: 14,
  },
  selectionTitle: {
    color: Colors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
  },
  selectionSubtitle: {
    color: Colors.textSecondary,
    marginTop: 4,
  },
  selectionDescription: {
    color: Colors.textSecondary,
    lineHeight: 20,
    marginTop: 10,
    marginBottom: 12,
  },
  selectionStats: {
    gap: 4,
    marginBottom: 12,
  },
  selectionStat: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  projectMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  projectMetaPill: {
    backgroundColor: Colors.backgroundMuted,
    borderRadius: 999,
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  formScreen: {
    flex: 1,
  },
  formContent: {
    padding: 16,
    paddingBottom: 32,
  },
  formCard: {
    marginBottom: 14,
  },
  previewCard: {
    marginBottom: 14,
  },
  previewTitle: {
    color: Colors.textOnDark,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  previewLine: {
    color: Colors.textOnDark,
    marginBottom: 8,
  },
  sectionHeading: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
  },
  optionRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  optionButton: {
    flex: 1,
    minWidth: 0,
  },
  helperLine: {
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  changeButton: {
    alignSelf: 'flex-start',
    marginTop: 12,
  },
  errorBanner: {
    backgroundColor: Colors.errorLight,
    borderRadius: 12,
    marginBottom: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  errorBannerText: {
    color: Colors.error,
    fontSize: 13,
    fontWeight: '500',
  },
});

export default InvestmentSimulationScreen;
