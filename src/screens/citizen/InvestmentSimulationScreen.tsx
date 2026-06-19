import { formatCurrency } from '../../utils/formatters';
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import {
  getPilotProperties,
  PilotProperty,
  SimulationResult,
  simulateInvestment,
} from '../../api/investments';
import {
  getOpportunities,
  InvestmentOpportunityListItem,
} from '../../api/investmentOpportunities';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Modal from '../../components/Modal';
import {CitizenStackParamList} from '../../navigation/CitizenStack';
import {CitizenTabParamList} from '../../navigation/CitizenTabNavigator';
import {Colors} from '../../constants/colors';
import {useStrings} from '../../i18n';

type Props = NativeStackScreenProps<CitizenStackParamList, 'InvestmentSimulation'>;
type ExitScenario = 'conservative' | 'base' | 'optimistic';



const InvestmentSimulationScreen = ({navigation, route}: Props) => {
  const strings = useStrings();
  const preferredPropertyId = route.params?.propertyId;
  const tabNav = navigation.getParent<BottomTabNavigationProp<CitizenTabParamList>>();

  const [properties, setProperties] = useState<PilotProperty[]>([]);
  const [featuredOpportunities, setFeaturedOpportunities] = useState<
    InvestmentOpportunityListItem[]
  >([]);
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
      const [response, oppsResponse] = await Promise.all([
        getPilotProperties(),
        getOpportunities({limit: 3}),
      ]);
      setProperties(response);
      setFeaturedOpportunities(oppsResponse.items);
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
        <Text style={styles.loadingText}>{strings.investmentSimulation.loadingText}</Text>
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
              {featuredOpportunities.length > 0 ? (
                <View style={styles.featuredSection}>
                  <Text style={styles.featuredLabel}>{strings.investmentSimulation.featuredLabel}</Text>
                  {featuredOpportunities.map(opp => (
                    <Pressable
                      key={opp.id}
                      onPress={() =>
                        tabNav?.navigate('HomeTab', {
                          screen: 'InvestmentOpportunityDetail',
                          params: {id: opp.id},
                        })
                      }
                      style={({pressed}) => [
                        styles.featuredCard,
                        pressed && styles.featuredCardPressed,
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={opp.title}>
                      <View style={styles.featuredCardRow}>
                        <View style={styles.featuredCardBody}>
                          <Text style={styles.featuredCardTitle} numberOfLines={1}>
                            {opp.title}
                          </Text>
                          <Text style={styles.featuredCardMeta}>
                            {opp.assetClass} · {(opp.targetIrr * 100).toFixed(1)}% IRR ·{' '}
                            {(opp.fundingProgress * 100).toFixed(0)}% funded
                          </Text>
                        </View>
                        <Text style={styles.featuredCardArrow}>›</Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              ) : null}
              <Text style={styles.screenTitle}>Investment Projects</Text>
              <Text style={styles.screenSubtitle}>
                {strings.investmentSimulation.screenSubtitle}
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
                <Text style={styles.selectionStat}>{strings.investmentSimulation.sponsorLabel} {item.sponsorName}</Text>
                <Text style={styles.selectionStat}>
                  {formatCurrency(item.pricePerShare)} {strings.investmentSimulation.perShare}
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

              <Pressable
                onPress={() => {
                  setSelectedProperty(item);
                  setSharesInput('');
                  setHoldingPeriodInput(String(item.targetHoldYears));
                  setExitScenario('base');
                  setReinvestDistributions(false);
                }}
                style={({pressed}) => [styles.selectBtn, pressed && {opacity: 0.80}]}
                accessibilityRole="button">
                <Text style={styles.selectBtnText}>{strings.investmentSimulation.underwriteButton}</Text>
              </Pressable>
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

            <Text style={styles.selectionStat}>{strings.investmentSimulation.sponsorLabel} {selectedProperty.sponsorName}</Text>
            <Text style={styles.selectionStat}>
              Target IRR {(selectedProperty.targetIrr * 100).toFixed(1)}% | Occupancy{' '}
              {(selectedProperty.occupancyRate * 100).toFixed(0)}%
            </Text>
            <Text style={styles.selectionStat}>
              Funding {(selectedProperty.fundingProgress * 100).toFixed(0)}% | Min shares{' '}
              {selectedProperty.minimumShares}
            </Text>

            <Pressable
              onPress={() => setSelectedProperty(null)}
              style={({pressed}) => [styles.changeBtn, pressed && {opacity: 0.80}]}
              accessibilityRole="button">
              <Text style={styles.changeBtnText}>{strings.investmentSimulation.changeProjectButton}</Text>
            </Pressable>
          </Card>

          <Card variant="default" padding="md" style={styles.formCard}>
            <Input
              label={strings.investmentSimulation.sharesToInvestLabel}
              value={sharesInput}
              keyboardType="numeric"
              onChangeText={value => setSharesInput(value.replace(/[^0-9]/g, ''))}
              helperText={`${strings.investmentSimulation.minimumSharesLabel} ${selectedProperty.minimumShares} • Maximum available ${selectedProperty.availableShares}`}
            />
            <Input
              label={strings.investmentSimulation.holdingPeriodLabel}
              value={holdingPeriodInput}
              keyboardType="numeric"
              onChangeText={value =>
                setHoldingPeriodInput(value.replace(/[^0-9]/g, ''))
              }
              helperText={`Project target hold: ${selectedProperty.targetHoldYears} years`}
            />
          </Card>

          <Card variant="default" padding="md" style={styles.formCard}>
            <Text style={styles.sectionHeading}>{strings.investmentSimulation.exitScenarioLabel}</Text>
            <View style={styles.optionRow}>
              {(['conservative', 'base', 'optimistic'] as const).map(option => {
                const scenarioLabel =
                  option === 'conservative'
                    ? strings.investmentSimulation.conservative
                    : option === 'base'
                    ? strings.investmentSimulation.base
                    : strings.investmentSimulation.optimistic;
                return (
                  <Button
                    key={option}
                    label={scenarioLabel}
                    onPress={() => setExitScenario(option)}
                    variant={exitScenario === option ? 'primary' : 'secondary'}
                    size="sm"
                    style={styles.optionButton}
                  />
                );
              })}
            </View>
            <Text style={styles.helperLine}>
              {strings.investmentSimulation.exitScenarioHelper}
            </Text>
          </Card>

          <Card variant="default" padding="md" style={styles.formCard}>
            <Text style={styles.sectionHeading}>{strings.investmentSimulation.distributionPlanLabel}</Text>
            <View style={styles.optionRow}>
              <Button
                label={strings.investmentSimulation.cashPayout}
                onPress={() => setReinvestDistributions(false)}
                variant={!reinvestDistributions ? 'primary' : 'secondary'}
                size="sm"
                style={styles.optionButton}
              />
              <Button
                label={strings.investmentSimulation.reinvestLabel}
                onPress={() => setReinvestDistributions(true)}
                variant={reinvestDistributions ? 'primary' : 'secondary'}
                size="sm"
                style={styles.optionButton}
              />
            </View>
            <Text style={styles.helperLine}>
              {strings.investmentSimulation.distributionHelper}
            </Text>
          </Card>

          <View style={styles.previewCard}>
            <Text style={styles.previewTitle}>Projected Return</Text>

            <View style={styles.previewMetric}>
              <Text style={styles.previewMetricValue}>{formatCurrency(computed.projectedExitValue)}</Text>
              <Text style={styles.previewMetricLabel}>Projected Value</Text>
            </View>
            <View style={styles.previewMetric}>
              <Text style={[styles.previewMetricValue, styles.previewMetricAccent]}>
                +{formatCurrency(Math.max(0, computed.projectedProfit))}
              </Text>
              <Text style={styles.previewMetricLabel}>Net Profit</Text>
            </View>
            {selectedProperty ? (
              <View style={styles.previewMetric}>
                <Text style={[styles.previewMetricValue, styles.previewMetricAccent]}>
                  +{(selectedProperty.targetIrr * 100).toFixed(1)}%
                </Text>
                <Text style={styles.previewMetricLabel}>Target ROI</Text>
              </View>
            ) : null}
            <View style={styles.previewMetric}>
              <Text style={[styles.previewMetricValue, styles.previewMetricAccent]}>
                +{formatCurrency(computed.annualNetCashFlow)}
              </Text>
              <Text style={styles.previewMetricLabel}>Annual Yield</Text>
            </View>

            <View style={styles.previewDivider} />

            <View style={styles.previewRoiRow}>
              <Text style={styles.previewRoiLabel}>Expected ROI</Text>
              {selectedProperty ? (
                <Text style={styles.previewRoiValue}>+{(selectedProperty.targetIrr * 100).toFixed(1)}%</Text>
              ) : null}
            </View>
            <Text style={styles.previewRoiSub}>
              Invest {formatCurrency(computed.totalAmount)}  →  Earn {formatCurrency(computed.projectedExitValue)}
            </Text>
            <Text style={styles.previewDisclaimer}>
              This is a projection based on the selected scenario and holding period. Actual returns may vary.
            </Text>
          </View>

          {errorMessage ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{errorMessage}</Text>
            </View>
          ) : null}

          <Pressable
            onPress={() => void onSubmitSimulation()}
            disabled={isSubmitting || !selectedProperty}
            style={({pressed}) => [styles.submitBtn, (isSubmitting || !selectedProperty) && styles.submitBtnDisabled, pressed && styles.submitBtnPressed]}
            accessibilityRole="button">
            {isSubmitting
              ? <ActivityIndicator color="#000000" size="small" />
              : <Text style={styles.submitBtnText}>Start Investment</Text>}
          </Pressable>
        </ScrollView>
      )}

      <Modal
        visible={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title={strings.investmentSimulation.investmentRecordedTitle}
        subtitle={
          lastResult
            ? `${formatCurrency(lastResult.projectedProfit)} projected profit at ${lastResult.equityMultiple.toFixed(2)}x equity multiple.`
            : 'The simulated investment has been saved to your history.'
        }
        primaryAction={{
          label: strings.investmentSimulation.viewHistoryButton,
          onPress: () => {
            setShowSuccessModal(false);
            navigation.navigate('Portfolio');
          },
        }}
        secondaryAction={{
          label: strings.investmentSimulation.underwriteAgainButton,
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
    backgroundColor: '#0D0D0C',
    flex: 1,
  },
  centeredState: {
    alignItems: 'center',
    backgroundColor: '#0D0D0C',
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
    color: '#E8E8E4',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 0.1,
    marginBottom: 4,
  },
  screenSubtitle: {
    color: '#6B6B68',
    fontSize: 14,
    lineHeight: 20,
  },
  selectionCard: {
    backgroundColor: '#1A1A18',
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 14,
    padding: 16,
  },
  selectionTitle: {
    color: '#E8E8E4',
    fontSize: 17,
    fontWeight: '700',
  },
  selectionSubtitle: {
    color: '#6B6B68',
    marginTop: 4,
  },
  selectionDescription: {
    color: '#6B6B68',
    lineHeight: 20,
    marginTop: 10,
    marginBottom: 12,
  },
  selectionStats: {
    gap: 4,
    marginBottom: 12,
  },
  selectionStat: {
    color: '#ADADAA',
    fontSize: 12,
  },
  projectMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  projectMetaPill: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 999,
    color: '#ADADAA',
    fontSize: 11,
    fontWeight: '600',
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  formScreen: {
    backgroundColor: '#0D0D0C',
    flex: 1,
  },
  formContent: {
    padding: 16,
    paddingBottom: 32,
  },
  formCard: {
    backgroundColor: '#1A1A18',
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 14,
    padding: 16,
  },
  previewCard: {
    backgroundColor: '#1A1A18',
    borderColor: 'rgba(212,168,83,0.20)',
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 14,
    padding: 20,
  },
  previewTitle: {
    color: '#E8E8E4',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.1,
    marginBottom: 16,
  },
  previewLine: {
    color: '#ADADAA',
    fontSize: 13,
    marginBottom: 6,
  },
  previewMetric: {
    alignItems: 'baseline',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  previewMetricValue: {
    color: '#E8E8E4',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.1,
  },
  previewMetricLabel: {
    color: '#6B6B68',
    fontSize: 13,
    fontWeight: '500',
  },
  previewMetricAccent: {
    color: '#D4A853',
  },
  previewDivider: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    height: 1,
    marginBottom: 14,
    marginTop: 4,
  },
  previewRoiRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  previewRoiLabel: {
    color: '#E8E8E4',
    fontSize: 14,
    fontWeight: '700',
  },
  previewRoiValue: {
    color: '#D4A853',
    fontSize: 16,
    fontWeight: '800',
  },
  previewRoiSub: {
    color: '#6B6B68',
    fontSize: 12,
    marginBottom: 8,
  },
  previewDisclaimer: {
    color: '#666663',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
  },
  sectionHeading: {
    color: '#E8E8E4',
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
    color: '#6B6B68',
    fontSize: 12,
    lineHeight: 18,
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
  featuredSection: {
    marginBottom: 20,
  },
  featuredLabel: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
  },
  featuredCard: {
    backgroundColor: '#1A1A18',
    borderColor: 'rgba(212,168,83,0.20)',
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
    padding: 14,
  },
  featuredCardPressed: {
    opacity: 0.80,
  },
  featuredCardRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  featuredCardBody: {
    flex: 1,
  },
  featuredCardTitle: {
    color: '#E8E8E4',
    fontSize: 14,
    fontWeight: '700',
  },
  featuredCardMeta: {
    color: '#6B6B68',
    fontSize: 12,
    marginTop: 3,
  },
  featuredCardArrow: {
    color: '#D4A853',
    fontSize: 20,
    fontWeight: '700',
  },
  submitBtn: {
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 100,
    marginBottom: 14,
    paddingVertical: 16,
  },
  submitBtnDisabled: {
    opacity: 0.35,
  },
  submitBtnPressed: {
    opacity: 0.80,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  selectBtn: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#1A1A1A',
    borderRadius: 100,
    marginTop: 12,
    paddingHorizontal: 18,
    paddingVertical: 9,
  },
  selectBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  changeBtn: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 100,
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  changeBtnText: {
    color: '#ADADAA',
    fontSize: 13,
    fontWeight: '600',
  },
});

export default InvestmentSimulationScreen;
