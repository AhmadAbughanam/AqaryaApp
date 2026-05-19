// Investment Opportunity Detail — dark premium mode.
// Full lifecycle: hero header, trust badge, sponsor card, funding progress,
// projected return summary, investment structure, realistic calculator, sticky CTA.
// Distinct from buy/rent detail screens — intentional dark design language.

import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useNavigation, useRoute, RouteProp, useFocusEffect} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {CitizenHomeStackParamList} from '../../navigation/CitizenHomeStack';
import {Colors} from '../../constants/colors';
import {useInvestMode} from '../../store/investModeState';
import {
  getOpportunityDetail,
  investOpportunityWithWallet,
  InvestmentOpportunityDetail,
  TrustBadgeTier,
  ExitScenario,
} from '../../api/investmentOpportunities';
import {checkOpportunitySaved, saveOpportunity, unsaveOpportunity} from '../../api/savedListings';
import {getWalletBalance, WalletBalance} from '../../api/wallet';
import {reportOpportunity, ReportReason, REPORT_REASON_LABELS} from '../../api/moderation';
import {useStrings} from '../../i18n';
import PropertyImage from '../../components/PropertyImage';
import CitizenBrandBar from '../../components/CitizenBrandBar';
import {AppImages} from '../../assets/images';
import {formatNumberTwoDecimals, formatCurrency} from '../../utils/formatters';

type Route = RouteProp<CitizenHomeStackParamList, 'InvestmentOpportunityDetail'>;
type Nav = NativeStackNavigationProp<CitizenHomeStackParamList, 'InvestmentOpportunityDetail'>;

// ─── Layout ────────────────────────────────────────────────────────────────────

const {height: SH} = Dimensions.get('window');
const HERO_H = Math.round(SH * 0.27);

// ─── Design tokens ─────────────────────────────────────────────────────────────
// Dark premium palette — intentionally distinct from the light sale/rent screens.

const T = {
  BG:        '#0D0D0C',
  SURFACE:   '#161615',
  CARD:      '#1E1E1C',
  BORDER:    'rgba(200,221,212,0.10)',
  TEXT:      '#F0F0EE',
  TEXT_SUB:  '#ADADAA',
  TEXT_MUTE: '#666663',
  ACCENT:    '#4A7C6F',
  ACCENT_L:  '#7CBFAA',
  ACCENT_BG: 'rgba(74,124,111,0.18)',
  GOLD:      '#D4A853',
  ERR:       '#C0544A',
};

// ─── Trust badge config ────────────────────────────────────────────────────────

const TRUST_CONFIG: Record<TrustBadgeTier, {label: string; bg: string; text: string; icon: string}> = {
  verified:        {label: 'Verified',        bg: 'rgba(255,255,255,0.15)',   text: '#FFFFFF',  icon: '✓'},
  premium_verified:{label: 'Premium',         bg: 'rgba(212,168,83,0.22)',    text: T.GOLD,     icon: '★'},
  aqarya_approved: {label: 'Aqarya Approved', bg: T.ACCENT_BG,               text: T.ACCENT_L, icon: '◆'},
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

const fmt$ = (v: number) =>
  formatCurrency(v);

const fmtPct = (v: number) => `${(v * 100).toFixed(1)}%`;

// ─── Component ─────────────────────────────────────────────────────────────────

const InvestmentOpportunityDetailScreen = () => {
  const route = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const {id} = route.params;
  const strings = useStrings();

  // ── Data ─────────────────────────────────────────────────────────────────────
  const [opportunity, setOpportunity] = useState<InvestmentOpportunityDetail | null>(null);
  const [isLoading, setIsLoading]     = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [isSaved, setIsSaved]         = useState(false);
  const [isSavingItem, setIsSavingItem] = useState(false);
  const [walletBalance, setWalletBalance] = useState<WalletBalance | null>(null);

  // ── Calculator ───────────────────────────────────────────────────────────────
  const [sharesInput, setSharesInput]   = useState('');
  const [holdingYears, setHoldingYears] = useState(5);
  const [exitScenario, setExitScenario] = useState<ExitScenario>('base');
  const [reinvest, setReinvest]         = useState(false);

  // ── Simulation ───────────────────────────────────────────────────────────────
  const [isInvesting, setIsInvesting]   = useState(false);
  const [isReporting, setIsReporting]   = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [simulationResult, setSimulationResult] = useState<{
    totalAmount: number;
    projectedProfit: number;
    equityMultiple: number;
    annualNetCashFlow: number;
    projectedExitValue: number;
  } | null>(null);

  // ── Dark nav bar while on this screen ────────────────────────────────────────
  // useFocusEffect fires AFTER the previous screen's blur cleanup, so this
  // correctly overwrites HomeScreen's setIsInvest(false) cleanup.
  const {setIsInvest} = useInvestMode();
  useFocusEffect(
    useCallback(() => {
      setIsInvest(true);
      return () => setIsInvest(false);
    }, [setIsInvest]),
  );

  // ── Animations ───────────────────────────────────────────────────────────────
  const trustAnim    = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  // ── Load ─────────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [data, savedStatus, bal] = await Promise.all([
        getOpportunityDetail(id),
        checkOpportunitySaved(id).catch(() => false),
        getWalletBalance().catch(() => null),
      ]);
      setOpportunity(data);
      setIsSaved(savedStatus);
      setWalletBalance(bal);
      setSharesInput(String(data.minimumShares));
      setHoldingYears(data.targetHoldYears);
      Animated.parallel([
        Animated.timing(trustAnim,    {toValue: data.trustScore ?? 0,  duration: 1000, useNativeDriver: false}),
        Animated.timing(progressAnim, {toValue: data.fundingProgress,  duration: 1000, useNativeDriver: false}),
      ]).start();
    } catch (err) {
      setError(err instanceof Error ? err.message : strings.opportunityDetail.notFound);
    } finally {
      setIsLoading(false);
    }
  }, [id, trustAnim, progressAnim, strings]);

  useEffect(() => { void load(); }, [load]);

  // ── Derived ──────────────────────────────────────────────────────────────────
  const parsedShares = parseInt(sharesInput, 10);
  const sharesValid  =
    opportunity != null &&
    Number.isFinite(parsedShares) &&
    parsedShares >= opportunity.minimumShares &&
    parsedShares <= opportunity.availableShares;
  const estimatedCost = opportunity && sharesValid ? parsedShares * opportunity.pricePerShare : null;

  const progressWidth = progressAnim.interpolate({inputRange: [0, 1],   outputRange: ['0%', '100%']});

  // ── Actions ──────────────────────────────────────────────────────────────────
  const onToggleSave = () => {
    setIsSavingItem(true);
    void (isSaved ? unsaveOpportunity(id) : saveOpportunity(id))
      .then(() => setIsSaved(v => !v))
      .catch(() => {})
      .finally(() => setIsSavingItem(false));
  };

  const onInvest = () => {
    if (!opportunity || !sharesValid) return;

    // Client-side balance check: shares × price × (1 + 1.5% + 0.75%) ≈ 1.0225
    const estimatedTotal = parsedShares * opportunity.pricePerShare * 1.0225;

    if (!walletBalance || walletBalance.availableBalance < estimatedTotal) {
      const needed = formatNumberTwoDecimals(estimatedTotal);
      const have   = walletBalance
        ? formatNumberTwoDecimals(walletBalance.availableBalance)
        : '0.00';
      Alert.alert(
        strings.opportunityDetail.insufficientBalanceTitle,
        `${strings.opportunityDetail.insufficientBalanceMsg}\n\nRequired: JOD ${needed}\nYour balance: JOD ${have}`,
      );
      return;
    }

    const totalFmt = formatNumberTwoDecimals(estimatedTotal);
    Alert.alert(
      strings.opportunityDetail.simulateButton,
      `Invest ${parsedShares} shares in ${opportunity.title} for ~JOD ${totalFmt}?\n\nThis will be deducted from your Ejod Wallet.`,
      [
        {text: strings.common.cancel, style: 'cancel'},
        {
          text: 'Confirm',
          onPress: () => {
            void (async () => {
              setIsInvesting(true);
              try {
                const result = await investOpportunityWithWallet(id, {
                  shares: parsedShares,
                  holdingPeriodYears: holdingYears,
                  exitScenario,
                  reinvestDistributions: reinvest,
                });
                setSimulationResult({
                  totalAmount:        result.totalAmount,
                  projectedProfit:    result.projectedProfit,
                  equityMultiple:     result.equityMultiple,
                  annualNetCashFlow:  result.annualNetCashFlow,
                  projectedExitValue: result.projectedExitValue,
                });
                // Refresh wallet balance
                getWalletBalance().then(setWalletBalance).catch(() => {});
                setShowResultModal(true);
              } catch (err) {
                Alert.alert(
                  strings.opportunityDetail.simulationFailedTitle,
                  err instanceof Error ? err.message : strings.opportunityDetail.notFound,
                );
              } finally {
                setIsInvesting(false);
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
      'Report Opportunity',
      'Why are you reporting this investment opportunity?',
      [
        ...reasons.map(reason => ({
          text: REPORT_REASON_LABELS[reason],
          onPress: () => {
            void (async () => {
              setIsReporting(true);
              try {
                await reportOpportunity(id, {reason});
                Alert.alert('Report submitted', 'Thank you. Our team will review it shortly.');
              } catch (e) {
                Alert.alert('Error', e instanceof Error ? e.message : 'Could not submit report.');
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

  // ── Loading / error ───────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={s.centered}>
        <ActivityIndicator size="large" color={T.ACCENT_L} />
        <Text style={s.centeredSub}>{strings.opportunityDetail.loadingText}</Text>
      </View>
    );
  }

  if (error || !opportunity) {
    return (
      <View style={s.centered}>
        <Text style={s.centeredErr}>{error ?? strings.opportunityDetail.notFound}</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.centeredBtn}>
          <Text style={s.centeredBtnText}>{strings.opportunityDetail.goBack}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const badge = opportunity.trustBadge ? TRUST_CONFIG[opportunity.trustBadge] : null;

  const score = opportunity.trustScore ?? 0;
  const trustColor = score >= 85 ? T.ACCENT_L : score >= 65 ? T.GOLD : T.ERR;

  return (
    <View style={s.screen}>

      {/* ── Brand header bar ─────────────────────────────────────────────── */}
      <View style={s.headerBar}>
        <CitizenBrandBar
          isDark
          left={
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={s.headerNavBtn}
              accessibilityLabel="Go back"
              accessibilityRole="button">
              <Text style={s.headerNavBtnText}>←</Text>
            </TouchableOpacity>
          }
          right={
            <View style={s.headerBalance}>
              <Text style={s.headerBalanceIcon}>◈</Text>
              <Text style={s.headerBalanceText}>
                {walletBalance != null
                  ? `JOD ${formatNumberTwoDecimals(walletBalance.availableBalance)}`
                  : '—'}
              </Text>
            </View>
          }
        />
      </View>

      {/* ── Hero — outside ScrollView so it always fills screen width ─────── */}
      <PropertyImage
        imageUrls={opportunity.imageUrls}
        marketType="investment"
        style={s.hero}
        fallbackSource={AppImages.property.investment.opportunityHero}>
        {/* Save button overlaid on hero top-right */}
        <TouchableOpacity
          onPress={onToggleSave}
          disabled={isSavingItem}
          style={s.heroSaveBtn}
          accessibilityLabel={isSaved ? 'Remove from watchlist' : 'Save to watchlist'}
          accessibilityRole="button">
          <Text style={[s.heroSaveBtnText, {color: isSaved ? T.GOLD : '#FFFFFF'}]}>
            {isSaved ? '♥' : '♡'}
          </Text>
        </TouchableOpacity>
      </PropertyImage>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* ── Opportunity Head ─────────────────────────────────────────────────── */}
        <View style={s.opHead}>

          {/* Title + sponsor brand */}
          <View style={s.opTitleRow}>
            <Text style={s.opTitle} numberOfLines={2}>{opportunity.title}</Text>
            <Text style={s.opSponsorBrand} numberOfLines={1}>{opportunity.sponsorName.toUpperCase()}</Text>
          </View>

          {/* Verified sponsor row */}
          <View style={s.opSponsorRow}>
            {badge ? <View style={[s.opVerifiedDot, {backgroundColor: badge.text}]} /> : null}
            <Text style={[s.opSponsorName, badge ? {color: badge.text} : {}]}>{opportunity.sponsorName}</Text>
          </View>

          {/* Location */}
          <View style={s.opLocRow}>
            <Text style={s.opLocPin}>📍</Text>
            <Text style={s.opLocText} numberOfLines={1}>{opportunity.location}</Text>
          </View>

          {/* Stats bar */}
          <View style={s.opStatsBar}>
            {opportunity.trustScore != null ? (
              <>
                <View style={s.opStatItem}>
                  <Text style={s.opStatLabel}>AQ Score</Text>
                  <Text style={[s.opStatVal, {color: trustColor}]}>{opportunity.trustScore}</Text>
                </View>
                <View style={s.opStatSep} />
              </>
            ) : null}
            <View style={s.opStatItem}>
              <Text style={s.opStatLabel}>USD / unit</Text>
              <Text style={s.opStatVal}>{fmt$(opportunity.pricePerShare)}</Text>
            </View>
            <View style={s.opStatSep} />
            <View style={s.opStatItem}>
              <Text style={s.opStatLabel}>Target IRR</Text>
              <Text style={[s.opStatVal, {color: T.GOLD}]}>{fmtPct(opportunity.targetIrr)}</Text>
            </View>
          </View>

          {/* Gold funding bar */}
          <View style={s.opFundTrack}>
            <Animated.View style={[s.opFundFill, {width: progressWidth}]} />
          </View>

          {/* Funded % + raised amount */}
          <View style={s.opFundRow}>
            <Text style={s.opFundedPct}>{fmtPct(opportunity.fundingProgress)} funded</Text>
            <Text style={s.opFundedAmt}>{fmt$(opportunity.fundedAmount)}</Text>
          </View>

          {/* Funding level stars */}
          <View style={s.opFundLevelRow}>
            <Text style={s.opFundLevelText}>Funding progress</Text>
            <View style={s.opStarsRow}>
              {[1, 2, 3].map(i => (
                <Text key={i} style={[s.opStar, opportunity.fundingProgress >= i / 3 && s.opStarActive]}>★</Text>
              ))}
            </View>
          </View>

          <View style={s.opDivider} />

          {/* Aqarya score badge + Invest Now */}
          <View style={s.opBottomRow}>
            {opportunity.trustScore != null ? (
              <View style={s.opAqaryaBadge}>
                <Text style={s.opAqaryaText}>Aqarya {(opportunity.trustScore / 10).toFixed(1)} ◆</Text>
              </View>
            ) : <View />}
            <TouchableOpacity
              style={[s.opInvestBtn, (!sharesValid || isInvesting) && s.ctaButtonDisabled]}
              onPress={() => void onInvest()}
              disabled={!sharesValid || isInvesting}
              accessibilityRole="button"
              accessibilityLabel="Invest Now">
              {isInvesting
                ? <ActivityIndicator color="#000000" size="small" />
                : <Text style={s.opInvestBtnText}>Invest Now</Text>}
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Opportunity Overview ─────────────────────────────────────────────── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Opportunity Overview</Text>
          <OverviewRow label="Type"         value={opportunity.assetClass} />
          <OverviewRow label="Status"       value={opportunity.stage} />
          <OverviewRow label="Developer"    value={opportunity.sponsorName} verified={badge != null} badgeColor={badge?.text} />
          <OverviewRow label="Funding Goal" value={fmt$(opportunity.fundingGoal)} />
        </View>

        {/* ── Returns Grid ──────────────────────────────────────────────────── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>{strings.opportunityDetail.projectedReturnsTitle}</Text>
          <View style={s.returnGrid}>
            <ReturnTile label={strings.opportunityDetail.targetIrrLabel}    value={fmtPct(opportunity.targetIrr)}           accent />
            <ReturnTile label={strings.opportunityDetail.cashYieldLabel}    value={fmtPct(opportunity.targetCashYield)} />
            <ReturnTile label={strings.opportunityDetail.holdPeriodLabel}   value={`${opportunity.targetHoldYears} ${strings.opportunityDetail.yearsUnit}`} />
            <ReturnTile label={strings.opportunityDetail.appreciationLabel} value={fmtPct(opportunity.appreciationRate)} />
            <ReturnTile label={strings.opportunityDetail.occupancyLabel}    value={fmtPct(opportunity.occupancyRate)} />
            <ReturnTile label={strings.opportunityDetail.distributionLabel} value={opportunity.distributionModel} />
          </View>
        </View>

        {/* ── Investment Structure ──────────────────────────────────────────── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>{strings.opportunityDetail.investmentStructureTitle}</Text>
          <DetailRow label={strings.opportunityDetail.ownershipLabel}          value={opportunity.ownershipStructure} />
          <DetailRow label={strings.opportunityDetail.distributionModelLabel}  value={opportunity.distributionModel} />
          <DetailRow label={strings.opportunityDetail.exitStrategyLabel}       value={opportunity.exitModel} />
          <DetailRow label={strings.opportunityDetail.minimumInvestmentLabel}  value={fmt$(opportunity.minimumInvestmentAmount)} />
          <DetailRow label={strings.opportunityDetail.mgmtFeeLabel}            value={fmtPct(opportunity.managementFeeRate)} />
        </View>

        {/* ── Description ───────────────────────────────────────────────────── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>{strings.opportunityDetail.aboutTitle}</Text>
          <Text style={s.descText}>{opportunity.description}</Text>
        </View>

        {/* ── Verification Record ───────────────────────────────────────────── */}
        {opportunity.verificationRecordId ? (
          <View style={s.section}>
            <Text style={s.sectionTitle}>{strings.opportunityDetail.verificationRecordTitle}</Text>
            <View style={s.disclosureCard}>
              <Text style={s.discLabel}>{strings.opportunityDetail.recordIdLabel}</Text>
              <Text style={s.discValue}>{opportunity.verificationRecordId}</Text>
              {opportunity.blockchainHash ? (
                <>
                  <Text style={[s.discLabel, {marginTop: 10}]}>{strings.opportunityDetail.blockchainHashLabel}</Text>
                  <Text style={s.discHash} numberOfLines={1}>{opportunity.blockchainHash}</Text>
                </>
              ) : null}
              <Text style={[s.discLabel, {marginTop: 10}]}>{strings.opportunityDetail.chainStatusLabel}</Text>
              <Text style={s.discValue}>{opportunity.blockchainStatus}</Text>
            </View>
          </View>
        ) : null}

        {/* ── Calculator ────────────────────────────────────────────────────── */}
        <View style={s.calcSection}>
          <Text style={s.calcTitle}>{strings.opportunityDetail.calculatorTitle}</Text>
          <Text style={s.calcSubtitle}>{strings.opportunityDetail.simulatePositionLabel} {opportunity.title}</Text>

          {/* Units stepper */}
          <Text style={s.inputLabel}>{strings.opportunityDetail.numberOfUnitsLabel}</Text>
          <View style={s.stepper}>
            <TouchableOpacity
              style={s.stepperBtn}
              onPress={() => {
                const n = (parsedShares || opportunity.minimumShares) - 1;
                if (n >= opportunity.minimumShares) setSharesInput(String(n));
              }}
              accessibilityLabel="Decrease units">
              <Text style={s.stepperBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={s.stepperVal}>{sharesInput}</Text>
            <TouchableOpacity
              style={s.stepperBtn}
              onPress={() => {
                const n = (parsedShares || opportunity.minimumShares) + 1;
                if (n <= opportunity.availableShares) setSharesInput(String(n));
              }}
              accessibilityLabel="Increase units">
              <Text style={s.stepperBtnText}>+</Text>
            </TouchableOpacity>
          </View>
          <Text style={s.inputHint}>
            Min {opportunity.minimumShares} · Max {opportunity.availableShares} · {fmt$(opportunity.pricePerShare)} / unit
          </Text>

          {/* Holding period chips */}
          <Text style={[s.inputLabel, {marginTop: 20}]}>{strings.opportunityDetail.holdingPeriodLabel}</Text>
          <View style={s.chipRow}>
            {([3, 5, 7, 10] as const).map(y => (
              <TouchableOpacity
                key={y}
                style={[s.chip, holdingYears === y && s.chipActive]}
                onPress={() => setHoldingYears(y)}
                accessibilityLabel={`${y} years`}
                accessibilityRole="button">
                <Text style={[s.chipText, holdingYears === y && s.chipTextActive]}>{y}Y</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Exit scenario chips */}
          <Text style={[s.inputLabel, {marginTop: 20}]}>{strings.opportunityDetail.exitScenarioLabel}</Text>
          <View style={s.chipRow}>
            {(['conservative', 'base', 'optimistic'] as ExitScenario[]).map(sc => (
              <TouchableOpacity
                key={sc}
                style={[s.chip, exitScenario === sc && s.chipActive]}
                onPress={() => setExitScenario(sc)}
                accessibilityLabel={sc}
                accessibilityRole="button">
                <Text style={[s.chipText, exitScenario === sc && s.chipTextActive]}>
                  {sc.charAt(0).toUpperCase() + sc.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Reinvest distributions toggle */}
          <TouchableOpacity
            style={s.reinvestRow}
            onPress={() => setReinvest(v => !v)}
            accessibilityRole="checkbox"
            accessibilityState={{checked: reinvest}}>
            <View style={[s.toggle, reinvest && s.toggleOn]}>
              <View style={[s.toggleThumb, reinvest && s.toggleThumbOn]} />
            </View>
            <Text style={s.reinvestLabel}>{strings.opportunityDetail.reinvestLabel}</Text>
          </TouchableOpacity>

          {/* Cost preview */}
          {estimatedCost != null ? (
            <View style={s.costPreview}>
              <Text style={s.costLabel}>{strings.opportunityDetail.estimatedEntryCostLabel}</Text>
              <Text style={s.costValue}>{fmt$(estimatedCost)}</Text>
              <Text style={s.costNote}>{strings.opportunityDetail.platformFeeNote}</Text>
            </View>
          ) : null}
        </View>

        {/* ── Report link ───────────────────────────────────────────────────── */}
        <TouchableOpacity
          onPress={onReport}
          disabled={isReporting}
          style={s.reportLink}
          accessibilityRole="button"
          accessibilityLabel="Report this opportunity">
          <Text style={s.reportLinkText}>{isReporting ? 'Submitting…' : 'Report this opportunity'}</Text>
        </TouchableOpacity>

        {/* spacer so last content clears the sticky CTA bar */}
        <View style={{height: 90}} />
      </ScrollView>

      {/* ── Sticky CTA ────────────────────────────────────────────────────────── */}
      <View style={s.ctaBar}>
        <View style={{flex: 1}}>
          <Text style={s.ctaLabel}>{strings.opportunityDetail.minInvestmentLabel}</Text>
          <Text style={s.ctaAmount}>{fmt$(opportunity.minimumInvestmentAmount)}</Text>
          {walletBalance != null && (() => {
            const estimatedTotal = sharesValid ? parsedShares * opportunity.pricePerShare * 1.0225 : 0;
            const sufficient = walletBalance.availableBalance >= (estimatedTotal || opportunity.minimumInvestmentAmount);
            return (
              <View style={s.ctaBalRow}>
                <Text style={[s.ctaBalIcon, !sufficient && {color: T.ERR}]}>◈</Text>
                <Text style={[s.ctaBalText, !sufficient && {color: T.ERR}]}>
                  {`JOD ${formatNumberTwoDecimals(walletBalance.availableBalance)}`}
                </Text>
              </View>
            );
          })()}
        </View>
        <TouchableOpacity
          style={[s.ctaButton, (!sharesValid || isInvesting) && s.ctaButtonDisabled]}
          onPress={onInvest}
          disabled={!sharesValid || isInvesting}
          accessibilityRole="button"
          accessibilityLabel="Invest now">
          {isInvesting
            ? <ActivityIndicator color="#000000" size="small" />
            : <Text style={s.ctaButtonText}>{strings.opportunityDetail.simulateButton}</Text>}
        </TouchableOpacity>
      </View>

      {/* ── Simulation result modal ───────────────────────────────────────────── */}
      <Modal
        visible={showResultModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowResultModal(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalSheet}>
            <View style={s.modalHandle} />
            <Text style={s.modalTitle}>{strings.opportunityDetail.simulationCompleteTitle}</Text>
            <Text style={s.modalSub}>{opportunity.title}</Text>

            {simulationResult ? (
              <View style={s.modalResults}>
                <SimRow label={strings.opportunityDetail.totalEntryCostLabel}    value={fmt$(simulationResult.totalAmount)} />
                <SimRow label={strings.opportunityDetail.annualCashFlowLabel}    value={fmt$(simulationResult.annualNetCashFlow)} />
                <SimRow label={strings.opportunityDetail.projectedExitValueLabel}value={fmt$(simulationResult.projectedExitValue)} />
                <SimRow label={strings.opportunityDetail.projectedProfitLabel}   value={fmt$(simulationResult.projectedProfit)}   highlight />
                <SimRow label={strings.opportunityDetail.equityMultipleLabel}    value={`${simulationResult.equityMultiple.toFixed(2)}×`} highlight />
              </View>
            ) : null}

            <Text style={s.modalDisclosure}>{strings.opportunityDetail.modalDisclosure}</Text>

            <TouchableOpacity
              style={s.modalClose}
              onPress={() => setShowResultModal(false)}
              accessibilityRole="button">
              <Text style={s.modalCloseText}>{strings.opportunityDetail.closeButton}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const OverviewRow = ({label, value, verified, badgeColor}: {
  label: string;
  value: string;
  verified?: boolean;
  badgeColor?: string;
}) => (
  <View style={s.overviewRow}>
    <Text style={s.overviewLabel}>{label}</Text>
    <View style={s.overviewValueRow}>
      {verified ? <View style={[s.overviewVerifiedDot, {backgroundColor: badgeColor ?? T.ACCENT_L}]} /> : null}
      <Text style={s.overviewValue} numberOfLines={1}>{value}</Text>
    </View>
    <Text style={s.overviewChevron}>›</Text>
  </View>
);

const ReturnTile = ({label, value, accent = false}: {label: string; value: string; accent?: boolean}) => (
  <View style={[s.returnTile, accent && s.returnTileAccent]}>
    <Text style={[s.returnTileValue, accent && s.returnTileValueAccent]}>{value}</Text>
    <Text style={s.returnTileLabel}>{label}</Text>
  </View>
);

const DetailRow = ({label, value}: {label: string; value: string}) => (
  <View style={s.detailRow}>
    <Text style={s.detailLabel}>{label}</Text>
    <Text style={s.detailValue}>{value}</Text>
  </View>
);

const SimRow = ({label, value, highlight = false}: {label: string; value: string; highlight?: boolean}) => (
  <View style={s.simRow}>
    <Text style={s.simLabel}>{label}</Text>
    <Text style={[s.simValue, highlight && s.simValueHL]}>{value}</Text>
  </View>
);

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({

  // ── Screen ─────────────────────────────────────────────────────────────────
  screen:        {backgroundColor: T.BG, flex: 1},
  scroll:        {flex: 1},
  scrollContent: {},

  centered:       {alignItems: 'center', backgroundColor: T.BG, flex: 1, justifyContent: 'center', padding: 24},
  centeredSub:    {color: T.TEXT_SUB, fontSize: 14, marginTop: 12},
  centeredErr:    {color: T.ERR, fontSize: 14, textAlign: 'center', marginBottom: 16},
  centeredBtn:    {backgroundColor: T.ACCENT_BG, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10},
  centeredBtnText:{color: T.TEXT, fontWeight: '600', fontSize: 14},

  // ── Brand header bar ─────────────────────────────────────────────────────
  headerBar: {
    backgroundColor: '#000000',
    paddingHorizontal: 16,
    paddingVertical: 10,
    width: '100%',
  },
  headerNavBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  headerNavBtnText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
  headerBalance: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  headerBalanceIcon: {
    color: T.ACCENT_L,
    fontSize: 12,
  },
  headerBalanceText: {
    color: T.TEXT,
    fontSize: 12,
    fontWeight: '700',
  },

  // ── Hero ───────────────────────────────────────────────────────────────────
  hero: {alignSelf: 'stretch', height: HERO_H, width: '100%'},
  heroSaveBtn: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 100,
    height: 36,
    justifyContent: 'center',
    position: 'absolute',
    right: 16,
    top: 16,
    width: 36,
  },
  heroSaveBtnText: {fontSize: 18},

  trustBadge:      {alignItems: 'center', borderRadius: 100, flexDirection: 'row', gap: 5, paddingHorizontal: 12, paddingVertical: 6},
  trustBadgeIcon:  {fontSize: 11, fontWeight: '800'},
  trustBadgeLabel: {fontSize: 11, fontWeight: '700', letterSpacing: 0.3},

  heroContent: {
    bottom: 20,
    left: 16,
    position: 'absolute',
    right: 16,
  },
  heroAssetClass: {
    color: T.ACCENT_L,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  heroTitle:    {color: '#FFFFFF', fontSize: 22, fontWeight: '800', letterSpacing: 0.1, lineHeight: 28, marginBottom: 5},
  heroLocation: {color: 'rgba(255,255,255,0.72)', fontSize: 13, marginBottom: 14},
  heroMetaRow:  {flexDirection: 'row', gap: 7},
  metricPill: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.48)',
    borderColor: 'rgba(255,255,255,0.14)',
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    paddingHorizontal: 4,
    paddingVertical: 9,
  },
  metricPillValue: {color: '#FFFFFF', fontSize: 13, fontWeight: '800'},
  metricPillLabel: {
    color: 'rgba(255,255,255,0.58)',
    fontSize: 9,
    fontWeight: '500',
    letterSpacing: 0.3,
    marginTop: 2,
    textTransform: 'uppercase',
  },

  // ── Section ────────────────────────────────────────────────────────────────
  section:    {borderBottomColor: T.BORDER, borderBottomWidth: 1, paddingHorizontal: 20, paddingVertical: 20},
  rowBetween: {alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12},
  sectionTitle:{color: T.TEXT, fontSize: 15, fontWeight: '700'},

  // ── Bars ───────────────────────────────────────────────────────────────────
  scoreNum:  {fontSize: 14, fontWeight: '700'},
  barTrack:  {backgroundColor: 'rgba(200,221,212,0.10)', borderRadius: 100, height: 8, marginBottom: 8, overflow: 'hidden'},
  barFill:   {borderRadius: 100, height: '100%'},
  barCaption:{color: T.TEXT_MUTE, fontSize: 12, lineHeight: 17},

  // ── Sponsor ────────────────────────────────────────────────────────────────
  sponsorCard:       {alignItems: 'center', backgroundColor: T.CARD, borderRadius: 16, flexDirection: 'row', gap: 14, padding: 14},
  sponsorAvatar:     {alignItems: 'center', backgroundColor: T.ACCENT, borderRadius: 24, height: 48, justifyContent: 'center', width: 48},
  sponsorAvatarText: {color: '#FFFFFF', fontSize: 20, fontWeight: '800'},
  sponsorName:       {color: T.TEXT, fontSize: 15, fontWeight: '700'},
  sponsorMeta:       {color: T.TEXT_SUB, fontSize: 12, marginTop: 3},
  riskBadge:         {borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5},
  riskBadgeText:     {fontSize: 12, fontWeight: '700'},

  // ── Stat boxes ─────────────────────────────────────────────────────────────
  statRow:      {flexDirection: 'row', gap: 8, marginTop: 14},
  statBox:      {alignItems: 'center', backgroundColor: T.CARD, borderRadius: 12, flex: 1, paddingVertical: 12},
  statBoxValue: {color: T.TEXT, fontSize: 13, fontWeight: '700'},
  statBoxLabel: {color: T.TEXT_MUTE, fontSize: 10, marginTop: 3, textTransform: 'uppercase'},

  // ── Return grid ────────────────────────────────────────────────────────────
  returnGrid:           {flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12},
  returnTile:           {backgroundColor: T.CARD, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 12, width: '31%'},
  returnTileAccent:     {backgroundColor: T.ACCENT_BG, borderColor: T.ACCENT, borderWidth: 1},
  returnTileValue:      {color: T.TEXT, fontSize: 14, fontWeight: '800'},
  returnTileValueAccent:{color: T.ACCENT_L},
  returnTileLabel:      {color: T.TEXT_MUTE, fontSize: 10, fontWeight: '500', marginTop: 3, textTransform: 'uppercase'},

  // ── Detail rows ────────────────────────────────────────────────────────────
  detailRow:  {borderBottomColor: T.BORDER, borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10},
  detailLabel:{color: T.TEXT_SUB, fontSize: 13},
  detailValue:{color: T.TEXT, flex: 1, fontSize: 13, fontWeight: '600', textAlign: 'right'},

  // ── Description ────────────────────────────────────────────────────────────
  descText: {color: T.TEXT_SUB, fontSize: 14, lineHeight: 22},

  // ── Disclosure ─────────────────────────────────────────────────────────────
  disclosureCard: {backgroundColor: T.CARD, borderRadius: 12, padding: 14},
  discLabel:      {color: T.TEXT_MUTE, fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4, textTransform: 'uppercase'},
  discValue:      {color: T.TEXT, fontSize: 13},
  discHash:       {color: T.ACCENT_L, fontSize: 11, fontFamily: 'monospace'},

  // ── Calculator ─────────────────────────────────────────────────────────────
  calcSection:  {paddingHorizontal: 20, paddingVertical: 24},
  calcTitle:    {color: T.TEXT, fontSize: 18, fontWeight: '800', letterSpacing: 0.1, marginBottom: 4},
  calcSubtitle: {color: T.TEXT_MUTE, fontSize: 13, marginBottom: 22},
  inputLabel:   {color: T.TEXT_SUB, fontSize: 11, fontWeight: '600', letterSpacing: 0.6, marginBottom: 10, textTransform: 'uppercase'},

  stepper:       {alignItems: 'center', backgroundColor: T.CARD, borderRadius: 14, flexDirection: 'row', justifyContent: 'space-between', padding: 4},
  stepperBtn:    {alignItems: 'center', backgroundColor: T.ACCENT_BG, borderRadius: 10, height: 44, justifyContent: 'center', width: 44},
  stepperBtnText:{color: T.ACCENT_L, fontSize: 22, fontWeight: '700'},
  stepperVal:    {color: T.TEXT, flex: 1, fontSize: 22, fontWeight: '800', textAlign: 'center'},
  inputHint:     {color: T.TEXT_MUTE, fontSize: 11, marginTop: 7, textAlign: 'center'},

  chipRow:       {flexDirection: 'row', gap: 8},
  chip:          {alignItems: 'center', backgroundColor: T.CARD, borderColor: T.BORDER, borderRadius: 100, borderWidth: 1, flex: 1, paddingVertical: 10},
  chipActive:    {backgroundColor: T.ACCENT, borderColor: T.ACCENT},
  chipText:      {color: T.TEXT_SUB, fontSize: 13, fontWeight: '600'},
  chipTextActive:{color: '#FFFFFF'},

  reinvestRow:    {alignItems: 'center', flexDirection: 'row', gap: 12, marginTop: 20},
  toggle:         {backgroundColor: T.CARD, borderColor: T.BORDER, borderRadius: 100, borderWidth: 1.5, flexDirection: 'row', height: 28, padding: 3, width: 50},
  toggleOn:       {backgroundColor: T.ACCENT, borderColor: T.ACCENT},
  toggleThumb:    {backgroundColor: T.TEXT_MUTE, borderRadius: 100, height: 18, width: 18},
  toggleThumbOn:  {backgroundColor: '#FFFFFF', marginLeft: 'auto'},
  reinvestLabel:  {color: T.TEXT_SUB, flex: 1, fontSize: 13},

  costPreview: {alignItems: 'center', backgroundColor: T.ACCENT_BG, borderColor: T.ACCENT, borderRadius: 16, borderWidth: 1, marginTop: 20, padding: 18},
  costLabel:   {color: T.TEXT_MUTE, fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4, textTransform: 'uppercase'},
  costValue:   {color: T.TEXT, fontSize: 28, fontWeight: '800', letterSpacing: 0.2},
  costNote:    {color: T.TEXT_MUTE, fontSize: 11, marginTop: 4},

  reportLink:     {alignItems: 'center', marginHorizontal: 20, paddingVertical: 14},
  reportLinkText: {color: T.TEXT_MUTE, fontSize: 13, textDecorationLine: 'underline'},

  // ── Hero icon nav buttons ─────────────────────────────────────────────────
  heroIconBtn:     {alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 100, height: 38, justifyContent: 'center', width: 38},
  heroIconBtnText: {color: '#FFFFFF', fontSize: 20, fontWeight: '700', lineHeight: 24},

  // ── Opportunity head ───────────────────────────────────────────────────────
  opHead:        {borderBottomColor: T.BORDER, borderBottomWidth: 1, gap: 10, padding: 20},
  opTitleRow:    {alignItems: 'flex-start', flexDirection: 'row', gap: 10, justifyContent: 'space-between'},
  opTitle:       {color: T.TEXT, flex: 1, fontSize: 20, fontWeight: '800', letterSpacing: 0.1, lineHeight: 26},
  opSponsorBrand:{color: T.TEXT_MUTE, fontSize: 11, fontWeight: '700', letterSpacing: 0.6, marginTop: 4, textTransform: 'uppercase'},
  opSponsorRow:  {alignItems: 'center', flexDirection: 'row', gap: 6},
  opVerifiedDot: {borderRadius: 6, height: 12, width: 12},
  opSponsorName: {color: T.TEXT_SUB, fontSize: 14, fontWeight: '700'},
  opLocRow:      {alignItems: 'center', flexDirection: 'row', gap: 4},
  opLocPin:      {fontSize: 12},
  opLocText:     {color: T.TEXT_MUTE, flex: 1, fontSize: 13},
  opStatsBar:    {alignItems: 'center', backgroundColor: T.CARD, borderRadius: 12, flexDirection: 'row', padding: 14},
  opStatItem:    {alignItems: 'center', flex: 1},
  opStatLabel:   {color: T.TEXT_MUTE, fontSize: 10, fontWeight: '600', letterSpacing: 0.4, marginBottom: 3, textTransform: 'uppercase'},
  opStatVal:     {color: T.TEXT, fontSize: 14, fontWeight: '800'},
  opStatSep:     {backgroundColor: T.BORDER, marginVertical: 4, width: 1},
  opFundTrack:   {backgroundColor: 'rgba(212,168,83,0.18)', borderRadius: 100, height: 8, overflow: 'hidden'},
  opFundFill:    {backgroundColor: T.GOLD, borderRadius: 100, height: '100%'},
  opFundRow:     {alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between'},
  opFundedPct:   {color: T.GOLD, fontSize: 13, fontWeight: '700'},
  opFundedAmt:   {color: T.TEXT_SUB, fontSize: 13, fontWeight: '600'},
  opFundLevelRow:{alignItems: 'center', flexDirection: 'row', gap: 8},
  opFundLevelText:{color: T.TEXT_MUTE, fontSize: 12},
  opStarsRow:    {flexDirection: 'row', gap: 3},
  opStar:        {color: T.TEXT_MUTE, fontSize: 14},
  opStarActive:  {color: T.GOLD},
  opDivider:     {backgroundColor: T.BORDER, height: 1},
  opBottomRow:   {alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between'},
  opAqaryaBadge: {backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 100, paddingHorizontal: 12, paddingVertical: 7},
  opAqaryaText:  {color: T.GOLD, fontSize: 13, fontWeight: '700', letterSpacing: 0.3},
  opInvestBtn:   {alignItems: 'center', backgroundColor: '#1A1A1A', borderRadius: 100, flex: 1, justifyContent: 'center', marginLeft: 12, paddingVertical: 14},
  opInvestBtnText:{color: '#FFFFFF', fontSize: 15, fontWeight: '800', letterSpacing: 0.2},

  // ── Overview rows ──────────────────────────────────────────────────────────
  overviewRow:        {alignItems: 'center', borderBottomColor: T.BORDER, borderBottomWidth: 1, flexDirection: 'row', paddingVertical: 13},
  overviewLabel:      {color: T.TEXT_SUB, fontSize: 13, width: 110},
  overviewValueRow:   {alignItems: 'center', flex: 1, flexDirection: 'row', gap: 6},
  overviewVerifiedDot:{borderRadius: 5, height: 10, width: 10},
  overviewValue:      {color: T.TEXT, flex: 1, fontSize: 13, fontWeight: '600'},
  overviewChevron:    {color: T.TEXT_MUTE, fontSize: 18, marginLeft: 8},

  // ── CTA bar ────────────────────────────────────────────────────────────────
  ctaBar: {
    alignItems: 'center',
    backgroundColor: T.SURFACE,
    borderTopColor: T.BORDER,
    borderTopWidth: 1,
    bottom: 0,
    flexDirection: 'row',
    gap: 14,
    left: 0,
    paddingBottom: 14,
    paddingHorizontal: 20,
    paddingTop: 14,
    position: 'absolute',
    right: 0,
  },
  ctaLabel:          {color: T.TEXT_MUTE, fontSize: 11, fontWeight: '500', textTransform: 'uppercase'},
  ctaAmount:         {color: T.TEXT, fontSize: 16, fontWeight: '800', marginTop: 2},
  ctaBalRow:         {alignItems: 'center', flexDirection: 'row', gap: 4, marginTop: 4},
  ctaBalIcon:        {color: T.ACCENT_L, fontSize: 11},
  ctaBalText:        {color: T.ACCENT_L, fontSize: 11, fontWeight: '600'},
  ctaButton:         {alignItems: 'center', backgroundColor: '#1A1A1A', borderRadius: 100, flex: 1, justifyContent: 'center', paddingVertical: 16},
  ctaButtonDisabled: {opacity: 0.35},
  ctaButtonText:     {color: '#FFFFFF', fontSize: 15, fontWeight: '700', letterSpacing: 0.2},

  // ── Modal ──────────────────────────────────────────────────────────────────
  modalOverlay: {backgroundColor: 'rgba(0,0,0,0.75)', flex: 1, justifyContent: 'flex-end'},
  modalSheet: {
    backgroundColor: Colors.backgroundSecondary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 36,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  modalHandle:     {alignSelf: 'center', backgroundColor: Colors.border, borderRadius: 100, height: 4, marginBottom: 20, width: 40},
  modalTitle:      {color: Colors.textPrimary, fontSize: 20, fontWeight: '800', marginBottom: 4},
  modalSub:        {color: Colors.textSecondary, fontSize: 13, marginBottom: 20},
  modalResults:    {backgroundColor: Colors.backgroundMuted, borderRadius: 16, marginBottom: 16, padding: 16},
  simRow:          {borderBottomColor: Colors.border, borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8},
  simLabel:        {color: Colors.textSecondary, fontSize: 13},
  simValue:        {color: Colors.textPrimary, fontSize: 13, fontWeight: '700'},
  simValueHL:      {color: Colors.primary, fontSize: 14},
  modalDisclosure: {color: Colors.textMuted, fontSize: 11, lineHeight: 16, marginBottom: 20, textAlign: 'center'},
  modalClose:         {alignItems: 'center', backgroundColor: Colors.primary, borderRadius: 100, paddingVertical: 16},
  modalCloseText:     {color: Colors.textOnDark, fontSize: 15, fontWeight: '700'},
});

export default InvestmentOpportunityDetailScreen;
