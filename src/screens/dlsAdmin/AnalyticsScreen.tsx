// Admin analytics — full operational dashboard for the Aqarya platform.
// Covers: properties, investments, providers, moderation, support, and CMS.

import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {AdminAnalytics, getAnalytics} from '../../api/admin';
import { formatNumber, formatDateTime } from '../../utils/formatters';
import {AC} from '../../constants/adminColors';
import {useStrings} from '../../i18n';
import {WarningCircleIcon} from '../../components/AdminIcon';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface InsightItem {
  id: string;
  tone: 'success' | 'warning' | 'error';
  title: string;
  detail: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

const toPercent = (numerator: number, denominator: number): number => {
  if (denominator <= 0) {return 0;}
  return Math.round((numerator / denominator) * 100);
};

const getHealthLabel = (score: number, an: {healthStrong: string; healthNeedsAttention: string; healthCritical: string}): string => {
  if (score >= 80) {return an.healthStrong;}
  if (score >= 60) {return an.healthNeedsAttention;}
  return an.healthCritical;
};

const getHealthTone = (score: number): 'success' | 'warning' | 'error' => {
  if (score >= 80) {return 'success';}
  if (score >= 60) {return 'warning';}
  return 'error';
};


const fmtJod = (amount: number): string => `JOD ${(amount / 1000).toFixed(1)}k`;

const TONE_COLOR: Record<'success' | 'warning' | 'error', string> = {
  success: AC.success,
  warning: AC.warning,
  error: AC.danger,
};

// ─── Sub-components ────────────────────────────────────────────────────────────

const SectionLabel = ({children}: {children: string}) => (
  <View style={styles.sectionLabelRow}>
    <View style={styles.sectionLabelLine} />
    <Text style={styles.sectionLabel}>{children}</Text>
    <View style={styles.sectionLabelLine} />
  </View>
);

const MetricBar = ({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'success' | 'warning' | 'error';
}) => {
  const clamped = Math.max(0, Math.min(100, value));
  const barColor = TONE_COLOR[tone];
  return (
    <View style={styles.metricBlock}>
      <View style={styles.metricLabelRow}>
        <Text style={styles.metricLabel}>{label}</Text>
        <Text style={[styles.metricValue, {color: barColor}]}>{clamped}%</Text>
      </View>
      <View style={styles.metricTrack}>
        <View style={[styles.metricFill, {width: `${clamped}%`, backgroundColor: barColor}]} />
      </View>
    </View>
  );
};

const StatGrid = ({
  items,
}: {
  items: {label: string; value: string | number; accent?: boolean}[];
}) => (
  <View style={styles.statGrid}>
    {items.map(item => (
      <View key={item.label} style={styles.statCell}>
        <Text style={[styles.statValue, item.accent && styles.statValueAccent]}>
          {typeof item.value === 'number' ? formatNumber(item.value) : item.value}
        </Text>
        <Text style={styles.statLabel}>{item.label}</Text>
      </View>
    ))}
  </View>
);

const MetricTile = ({
  label,
  value,
  sub,
  direction,
}: {
  label: string;
  value: string;
  sub: string;
  direction: 'up' | 'down' | 'neutral';
}) => {
  const subColor =
    direction === 'up' ? AC.success : direction === 'down' ? AC.danger : AC.textMuted;
  const arrow = direction === 'up' ? '↑' : direction === 'down' ? '↓' : '–';
  return (
    <View style={styles.metricTile}>
      <Text style={styles.metricTileLabel}>{label}</Text>
      <Text style={styles.metricTileValue}>{value}</Text>
      <View style={styles.metricTileSub}>
        <Text style={[styles.metricTileArrow, {color: subColor}]}>{arrow}</Text>
        <Text style={[styles.metricTileSubText, {color: subColor}]} numberOfLines={1}>
          {sub}
        </Text>
      </View>
    </View>
  );
};

const SectionCard = ({
  title,
  accentColor,
  children,
}: {
  title: string;
  accentColor?: string;
  children: React.ReactNode;
}) => (
  <View style={styles.sectionCard}>
    {accentColor && <View style={[styles.sectionAccentBar, {backgroundColor: accentColor}]} />}
    <View style={styles.sectionCardInner}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  </View>
);

// ─── Main component ────────────────────────────────────────────────────────────

const AnalyticsScreen = () => {
  const strings = useStrings();
  const an = strings.admin.analytics;
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isExpandedInsights, setIsExpandedInsights] = useState(false);

  const fetchAnalytics = useCallback(async () => {
    setErrorMessage(null);
    try {
      const response = await getAnalytics();
      setAnalytics(response);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : an.errorLoad,
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [an.errorLoad]);

  useEffect(() => {
    void fetchAnalytics();
  }, [fetchAnalytics]);

  const derived = useMemo(() => {
    if (!analytics) {return null;}
    const a = analytics;

    // ─ Property rates ──────────────────────────────────────────────────────────
    const verificationRate = toPercent(a.verifiedProperties, a.totalProperties);
    const freezeRate = toPercent(a.frozenProperties, a.totalProperties);
    const anchorRate = toPercent(a.totalAnchored, a.verifiedProperties);
    const propRejectionRate = toPercent(
      a.rejectedProperties,
      a.totalProperties - a.pendingVerificationProperties - a.needsChangesProperties,
    );

    // ─ Investment rates ────────────────────────────────────────────────────────
    const investTotal =
      a.investments.draft + a.investments.submitted + a.investments.underReview +
      a.investments.approved + a.investments.published + a.investments.rejected;
    const investPipelineTotal =
      a.investments.submitted + a.investments.underReview +
      a.investments.approved + a.investments.published;
    const investPublishRate = toPercent(a.investments.published, Math.max(investPipelineTotal, 1));
    const investReviewBacklog = a.investments.submitted + a.investments.underReview;

    // ─ Provider rates ──────────────────────────────────────────────────────────
    const providerVerifiedRate = toPercent(a.providers.verified, a.providers.total);
    const providerReviewBacklog = a.providers.underReview;

    // ─ Moderation rates ────────────────────────────────────────────────────────
    const reportTotal =
      a.moderation.reportsOpen + a.moderation.reportsUnderReview +
      a.moderation.reportsResolved + a.moderation.reportsDismissed;
    const moderationResolutionRate = toPercent(
      a.moderation.reportsResolved + a.moderation.reportsDismissed,
      reportTotal,
    );
    const moderationBacklog = a.moderation.reportsOpen + a.moderation.reportsUnderReview;

    // ─ Operational health score (multi-signal) ─────────────────────────────────
    const healthSignals = {
      propVerification: verificationRate,
      investPublish: Math.min(100, investPublishRate + (investReviewBacklog === 0 ? 20 : 0)),
      providerVerification: providerVerifiedRate,
      moderationResolution: moderationResolutionRate || (reportTotal === 0 ? 100 : 0),
      anchorCoverage: anchorRate,
      frozenControl: Math.max(0, 100 - freezeRate * 4),
    };

    const operationalScore = Math.max(0, Math.min(100, Math.round(
      healthSignals.propVerification * 0.20 +
      healthSignals.investPublish * 0.15 +
      healthSignals.providerVerification * 0.15 +
      healthSignals.moderationResolution * 0.20 +
      healthSignals.anchorCoverage * 0.15 +
      healthSignals.frozenControl * 0.15,
    )));

    // ─ Insights ────────────────────────────────────────────────────────────────
    const insights: InsightItem[] = [];

    if (a.pendingVerificationProperties >= 3) {
      insights.push({
        id: 'prop_pending',
        tone: 'warning',
        title: `${a.pendingVerificationProperties}${an.insightPropPendingSuffix}`,
        detail: an.insightPropPendingDetail,
      });
    }
    if (freezeRate >= 15) {
      insights.push({
        id: 'freeze',
        tone: 'error',
        title: an.insightFreezeTitle,
        detail: an.insightFreezeDetail,
      });
    }
    if (anchorRate < 70 && a.verifiedProperties > 0) {
      insights.push({
        id: 'anchor',
        tone: 'warning',
        title: an.insightAnchorTitle,
        detail: an.insightAnchorDetail,
      });
    }
    if (investReviewBacklog >= 2) {
      insights.push({
        id: 'invest_review',
        tone: 'warning',
        title: `${investReviewBacklog}${an.insightInvestReviewSuffix}`,
        detail: an.insightInvestReviewDetail,
      });
    }
    if (providerReviewBacklog >= 2) {
      insights.push({
        id: 'provider_review',
        tone: 'warning',
        title: `${providerReviewBacklog}${an.insightProviderReviewSuffix}`,
        detail: an.insightProviderReviewDetail,
      });
    }
    if (moderationBacklog >= 3) {
      insights.push({
        id: 'moderation',
        tone: 'error',
        title: `${moderationBacklog}${an.insightModerationSuffix}`,
        detail: an.insightModerationDetail,
      });
    }
    if (a.moderation.unresolvedQualityFlags >= 3) {
      insights.push({
        id: 'quality_flags',
        tone: 'warning',
        title: `${a.moderation.unresolvedQualityFlags}${an.insightQualityFlagsSuffix}`,
        detail: an.insightQualityFlagsDetail,
      });
    }

    if (insights.length === 0) {
      insights.push({
        id: 'stable',
        tone: 'success',
        title: an.insightStableTitle,
        detail: an.insightStableDetail,
      });
    }

    return {
      verificationRate,
      freezeRate,
      anchorRate,
      propRejectionRate,
      investTotal,
      investPublishRate,
      investReviewBacklog,
      providerVerifiedRate,
      providerReviewBacklog,
      reportTotal,
      moderationResolutionRate,
      moderationBacklog,
      operationalScore,
      operationalHealthLabel: getHealthLabel(operationalScore, an),
      operationalHealthTone: getHealthTone(operationalScore),
      insights,
    };
  }, [analytics, an]);

  // ── Guards ─────────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={AC.accent} />
      </View>
    );
  }

  if (!analytics || !derived) {
    return (
      <View style={styles.centered}>
        <View style={[styles.errorIconCircle, {borderColor: AC.danger + '40'}]}>
          <WarningCircleIcon size={28} color={AC.danger} />
        </View>
        <Text style={styles.errorTitle}>{an.errorTitle}</Text>
        <Text style={styles.errorMessage}>{errorMessage ?? an.errorLoad}</Text>
        <Pressable
          onPress={() => void fetchAnalytics()}
          style={({pressed}) => [styles.retryBtn, pressed && {opacity: 0.75}]}
          accessibilityRole="button">
          <Text style={styles.retryBtnText}>{an.retryButton}</Text>
        </Pressable>
      </View>
    );
  }

  const lastUpdated = analytics.lastAnchoredAt
    ? formatDateTime(analytics.lastAnchoredAt)
    : an.noAnchor;

  const healthColor = TONE_COLOR[derived.operationalHealthTone];

  const healthStats: {label: string; value: string}[] = [
    {label: an.statCitizens, value: formatNumber(analytics.totalCitizenUsers)},
    {label: an.statListings, value: formatNumber(analytics.totalProperties)},
    {label: an.statOpportunities, value: formatNumber(derived.investTotal)},
    {label: an.statProviders, value: formatNumber(analytics.providers.total)},
  ];

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          tintColor={AC.accent}
          colors={[AC.accent]}
          onRefresh={() => {
            setIsRefreshing(true);
            void fetchAnalytics();
          }}
        />
      }>

      {/* ── Header row ── */}
      <View style={styles.headerRow}>
        <View style={styles.liveIndicator}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>{an.live}</Text>
        </View>
        <Text style={styles.anchorText}>{an.lastAnchorPrefix} {lastUpdated}</Text>
      </View>

      {/* ── Operational Health Hero ── */}
      <View style={[styles.healthHero, {borderColor: healthColor + '40'}]}>
        <View style={[styles.healthHeroAccentBar, {backgroundColor: healthColor}]} />
        <View style={styles.healthHeroInner}>
          <Text style={styles.healthHeroLabel}>{an.healthScoreLabel}</Text>
          <View style={styles.healthHeroScoreRow}>
            <Text style={[styles.healthHeroScore, {color: healthColor}]}>
              {derived.operationalScore}
            </Text>
            <Text style={styles.healthHeroScoreSuffix}>/100</Text>
            <View
              style={[
                styles.healthStatusPill,
                {backgroundColor: healthColor + '22', borderColor: healthColor + '50'},
              ]}>
              <View style={[styles.healthStatusDot, {backgroundColor: healthColor}]} />
              <Text style={[styles.healthStatusText, {color: healthColor}]}>
                {derived.operationalHealthLabel}
              </Text>
            </View>
          </View>
          <View style={styles.healthBarTrack}>
            <View
              style={[
                styles.healthBarFill,
                {width: `${derived.operationalScore}%`, backgroundColor: healthColor},
              ]}
            />
          </View>
          <View style={styles.healthStatsRow}>
            {healthStats.map((stat, i) => (
              <React.Fragment key={stat.label}>
                {i > 0 && <View style={styles.healthStatDivider} />}
                <View style={styles.healthStatItem}>
                  <Text style={styles.healthStatValue}>{stat.value}</Text>
                  <Text style={styles.healthStatLabel}>{stat.label}</Text>
                </View>
              </React.Fragment>
            ))}
          </View>
        </View>
      </View>

      {/* ── Property Operations ── */}
      <SectionLabel>{an.sectionPropertyOps}</SectionLabel>

      <View style={styles.tileRow}>
        <MetricTile
          label={an.tileTotalListings}
          value={formatNumber(analytics.totalProperties)}
          sub={`${derived.verificationRate}% verified`}
          direction={derived.verificationRate >= 70 ? 'up' : 'neutral'}
        />
        <MetricTile
          label={an.tilePendingReview}
          value={formatNumber(analytics.pendingVerificationProperties + analytics.needsChangesProperties)}
          sub={
            analytics.pendingVerificationProperties > 0
              ? `${analytics.pendingVerificationProperties} pending`
              : an.subQueueClear
          }
          direction={analytics.pendingVerificationProperties > 0 ? 'down' : 'up'}
        />
      </View>

      <View style={styles.tileRow}>
        <MetricTile
          label={an.tileAnchoredRecords}
          value={formatNumber(analytics.totalAnchored)}
          sub={`${derived.anchorRate}% of verified`}
          direction={derived.anchorRate >= 70 ? 'up' : 'neutral'}
        />
        <MetricTile
          label={an.tileSimulations}
          value={formatNumber(analytics.totalSimulations)}
          sub={
            analytics.totalSimulationVolume > 0
              ? fmtJod(analytics.totalSimulationVolume)
              : an.subNoVolume
          }
          direction={analytics.totalSimulations > 0 ? 'up' : 'neutral'}
        />
      </View>

      <SectionCard title={an.cardPropertyPipeline} accentColor={AC.accent}>
        <StatGrid
          items={[
            {label: an.statPending, value: analytics.pendingVerificationProperties, accent: analytics.pendingVerificationProperties > 0},
            {label: an.statNeedsChanges, value: analytics.needsChangesProperties, accent: analytics.needsChangesProperties > 0},
            {label: an.statVerified, value: analytics.verifiedProperties},
            {label: an.statRejected, value: analytics.rejectedProperties},
            {label: an.statFrozen, value: analytics.frozenProperties, accent: analytics.frozenProperties > 0},
            {label: an.statSold, value: analytics.soldProperties},
          ]}
        />
        <MetricBar
          label={an.barVerificationCoverage}
          value={derived.verificationRate}
          tone={derived.verificationRate >= 70 ? 'success' : 'warning'}
        />
        <MetricBar
          label={an.barAnchoringCoverage}
          value={derived.anchorRate}
          tone={derived.anchorRate >= 70 ? 'success' : 'warning'}
        />
        <MetricBar
          label={an.barFrozenInventory}
          value={derived.freezeRate}
          tone={derived.freezeRate <= 10 ? 'success' : derived.freezeRate <= 20 ? 'warning' : 'error'}
        />
      </SectionCard>

      {/* ── Investment Operations ── */}
      <SectionLabel>{an.sectionInvestmentOps}</SectionLabel>

      <View style={styles.tileRow}>
        <MetricTile
          label={an.tilePublished}
          value={formatNumber(analytics.investments.published)}
          sub={`${derived.investPublishRate}% publish rate`}
          direction={derived.investPublishRate >= 50 ? 'up' : 'neutral'}
        />
        <MetricTile
          label={an.tileReviewBacklog}
          value={formatNumber(derived.investReviewBacklog)}
          sub={
            analytics.investments.submitted > 0
              ? `${analytics.investments.submitted} submitted`
              : derived.investReviewBacklog > 0
              ? `${analytics.investments.underReview} under review`
              : an.subQueueClear
          }
          direction={derived.investReviewBacklog > 0 ? 'down' : 'up'}
        />
      </View>

      <SectionCard title={an.cardOpportunityPipeline} accentColor={AC.cyan}>
        <StatGrid
          items={[
            {label: an.statDraft, value: analytics.investments.draft},
            {label: an.statSubmitted, value: analytics.investments.submitted, accent: analytics.investments.submitted > 0},
            {label: an.statUnderReview, value: analytics.investments.underReview, accent: analytics.investments.underReview > 0},
            {label: an.statApproved, value: analytics.investments.approved},
            {label: an.statPublished, value: analytics.investments.published},
            {label: an.statRejected, value: analytics.investments.rejected},
          ]}
        />
        <MetricBar
          label={an.barPublishRate}
          value={derived.investPublishRate}
          tone={derived.investPublishRate >= 50 ? 'success' : 'warning'}
        />
        {analytics.investments.totalSimulations > 0 && (
          <View style={styles.simRow}>
            <Text style={styles.simLabel}>{an.investSimulations}</Text>
            <Text style={styles.simValue}>
              {formatNumber(analytics.investments.totalSimulations)}
              {analytics.investments.totalSimulationVolume > 0
                ? `  ·  ${fmtJod(analytics.investments.totalSimulationVolume)}`
                : ''}
            </Text>
          </View>
        )}
      </SectionCard>

      {/* ── Provider Verification ── */}
      <SectionLabel>{an.sectionProviderVerif}</SectionLabel>

      <View style={styles.tileRow}>
        <MetricTile
          label={an.tileVerifiedProviders}
          value={formatNumber(analytics.providers.verified)}
          sub={`${derived.providerVerifiedRate}% of total`}
          direction={derived.providerVerifiedRate >= 50 ? 'up' : 'neutral'}
        />
        <MetricTile
          label={an.tilePendingReview}
          value={formatNumber(analytics.providers.underReview)}
          sub={analytics.providers.underReview > 0 ? an.subNeedsAttention : an.subQueueClear}
          direction={analytics.providers.underReview > 0 ? 'down' : 'up'}
        />
      </View>

      <SectionCard title={an.cardProviderStatus} accentColor={AC.success}>
        <StatGrid
          items={[
            {label: an.statUnverified, value: analytics.providers.unverified},
            {label: an.statUnderReview, value: analytics.providers.underReview, accent: analytics.providers.underReview > 0},
            {label: an.statVerified, value: analytics.providers.verified},
            {label: an.statRejected, value: analytics.providers.rejected},
            {label: an.statSuspended, value: analytics.providers.suspended, accent: analytics.providers.suspended > 0},
          ]}
        />
        <MetricBar
          label={an.barVerifiedRate}
          value={derived.providerVerifiedRate}
          tone={derived.providerVerifiedRate >= 50 ? 'success' : 'warning'}
        />
      </SectionCard>

      {/* ── Moderation & Safety ── */}
      <SectionLabel>{an.sectionModerationSafety}</SectionLabel>

      <View style={styles.tileRow}>
        <MetricTile
          label={an.tileOpenReports}
          value={formatNumber(analytics.moderation.reportsOpen + analytics.moderation.reportsUnderReview)}
          sub={derived.moderationBacklog > 0 ? an.subNeedsAction : an.subClear}
          direction={derived.moderationBacklog > 0 ? 'down' : 'up'}
        />
        <MetricTile
          label={an.tileQualityFlags}
          value={formatNumber(analytics.moderation.unresolvedQualityFlags)}
          sub={
            analytics.moderation.unresolvedQualityFlags > 0 ? an.subUnresolved : an.subAllResolved
          }
          direction={analytics.moderation.unresolvedQualityFlags > 0 ? 'down' : 'up'}
        />
      </View>

      {derived.reportTotal > 0 && (
        <SectionCard title={an.cardReportPipeline} accentColor={AC.danger}>
          <StatGrid
            items={[
              {label: an.statOpen, value: analytics.moderation.reportsOpen, accent: analytics.moderation.reportsOpen > 0},
              {label: an.statUnderReview, value: analytics.moderation.reportsUnderReview, accent: analytics.moderation.reportsUnderReview > 0},
              {label: an.statResolved, value: analytics.moderation.reportsResolved},
              {label: an.statDismissed, value: analytics.moderation.reportsDismissed},
            ]}
          />
          <MetricBar
            label={an.barResolutionRate}
            value={derived.moderationResolutionRate}
            tone={
              derived.moderationResolutionRate >= 70
                ? 'success'
                : derived.moderationResolutionRate >= 40
                ? 'warning'
                : 'error'
            }
          />
        </SectionCard>
      )}

      {/* ── Support & Communications ── */}
      <SectionLabel>{an.sectionSupportComms}</SectionLabel>

      <View style={styles.tileRow}>
        <MetricTile
          label={an.tileSupportThreads}
          value={formatNumber(analytics.support.totalThreads)}
          sub={`${formatNumber(analytics.support.totalMessages)} messages`}
          direction={analytics.support.totalThreads > 0 ? 'up' : 'neutral'}
        />
        <MetricTile
          label={an.tileRecentMessages}
          value={formatNumber(analytics.support.recentMessages)}
          sub={an.subLast7Days}
          direction={analytics.support.recentMessages > 0 ? 'up' : 'neutral'}
        />
      </View>

      <SectionCard title={an.cardContentAnnouncements} accentColor={AC.warning}>
        <StatGrid
          items={[
            {label: an.statActiveAnnouncements, value: analytics.cms.activeAnnouncements},
            {label: an.statArchived, value: analytics.cms.archivedAnnouncements},
            {label: an.statActiveHelpBlocks, value: analytics.cms.activeContentBlocks},
          ]}
        />
      </SectionCard>

      {/* ── Actionable Insights ── */}
      <View style={styles.sectionCard}>
        <View
          style={[
            styles.sectionAccentBar,
            {
              backgroundColor:
                derived.operationalHealthTone === 'success'
                  ? AC.success
                  : derived.operationalHealthTone === 'warning'
                  ? AC.warning
                  : AC.danger,
            },
          ]}
        />
        <View style={styles.sectionCardInner}>
          <Pressable
            onPress={() => setIsExpandedInsights(prev => !prev)}
            style={styles.insightsHeader}
            accessibilityRole="button">
            <Text style={styles.sectionTitle}>{an.sectionInsights}</Text>
            <View style={styles.expandPill}>
              <Text style={styles.expandPillText}>
                {isExpandedInsights ? an.collapse : an.expand}
              </Text>
            </View>
          </Pressable>
          {(isExpandedInsights ? derived.insights : derived.insights.slice(0, 3)).map(
            insight => (
              <View key={insight.id} style={styles.insightRow}>
                <View
                  style={[styles.insightDot, {backgroundColor: TONE_COLOR[insight.tone]}]}
                />
                <View style={styles.insightBody}>
                  <Text style={styles.insightTitle}>{insight.title}</Text>
                  <Text style={styles.insightDetail}>{insight.detail}</Text>
                </View>
              </View>
            ),
          )}
        </View>
      </View>

      {errorMessage ? (
        <View style={styles.errorBanner}>
          <View style={styles.errorBannerRow}>
            <WarningCircleIcon size={14} color={AC.danger} />
            <Text style={styles.errorBannerText}>{errorMessage}</Text>
          </View>
        </View>
      ) : null}

    </ScrollView>
  );
};

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    backgroundColor: AC.bg,
    flex: 1,
  },
  content: {
    gap: 10,
    padding: 16,
    paddingBottom: 40,
  },
  centered: {
    alignItems: 'center',
    backgroundColor: AC.bg,
    flex: 1,
    justifyContent: 'center',
    padding: 32,
  },

  // ── Header row ────────────────────────────────────────────────────────────
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  liveIndicator: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  liveDot: {
    backgroundColor: AC.success,
    borderRadius: 5,
    height: 8,
    width: 8,
  },
  liveText: {
    color: AC.success,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  anchorText: {
    color: AC.textMuted,
    fontSize: 11,
  },

  // ── Health hero ───────────────────────────────────────────────────────────
  healthHero: {
    backgroundColor: AC.surfaceHigh,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  healthHeroAccentBar: {
    width: 4,
  },
  healthHeroInner: {
    flex: 1,
    padding: 16,
  },
  healthHeroLabel: {
    color: AC.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  healthHeroScoreRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  healthHeroScore: {
    fontSize: 56,
    fontWeight: '800',
    letterSpacing: -2,
    lineHeight: 60,
  },
  healthHeroScoreSuffix: {
    color: AC.textMuted,
    fontSize: 20,
    fontWeight: '400',
    lineHeight: 44,
  },
  healthStatusPill: {
    alignItems: 'center',
    borderRadius: 100,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    marginBottom: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  healthStatusDot: {
    borderRadius: 4,
    height: 7,
    width: 7,
  },
  healthStatusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  healthBarTrack: {
    backgroundColor: AC.surfaceMid,
    borderRadius: 100,
    height: 6,
    marginBottom: 16,
    overflow: 'hidden',
  },
  healthBarFill: {
    borderRadius: 100,
    height: '100%',
  },
  healthStatsRow: {
    borderTopColor: AC.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    paddingTop: 14,
  },
  healthStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  healthStatValue: {
    color: AC.textPrimary,
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 2,
  },
  healthStatLabel: {
    color: AC.textMuted,
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  healthStatDivider: {
    backgroundColor: AC.border,
    width: 1,
  },

  // ── Section label dividers ────────────────────────────────────────────────
  sectionLabelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    marginVertical: 4,
  },
  sectionLabelLine: {
    backgroundColor: AC.border,
    flex: 1,
    height: 1,
  },
  sectionLabel: {
    color: AC.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  // ── Metric tiles ──────────────────────────────────────────────────────────
  tileRow: {
    flexDirection: 'row',
    gap: 10,
  },
  metricTile: {
    backgroundColor: AC.surface,
    borderColor: AC.border,
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    padding: 14,
  },
  metricTileLabel: {
    color: AC.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  metricTileValue: {
    color: AC.textPrimary,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  metricTileSub: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  metricTileArrow: {
    fontSize: 11,
    fontWeight: '700',
  },
  metricTileSubText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '500',
  },

  // ── Section cards ─────────────────────────────────────────────────────────
  sectionCard: {
    backgroundColor: AC.surface,
    borderColor: AC.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  sectionAccentBar: {
    width: 3,
  },
  sectionCardInner: {
    flex: 1,
    gap: 10,
    padding: 14,
  },
  sectionTitle: {
    color: AC.textPrimary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  // ── Stat grid ─────────────────────────────────────────────────────────────
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statCell: {
    alignItems: 'center',
    backgroundColor: AC.surfaceMid,
    borderRadius: 10,
    flex: 1,
    minWidth: '28%',
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  statValue: {
    color: AC.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 3,
  },
  statValueAccent: {
    color: AC.warning,
  },
  statLabel: {
    color: AC.textMuted,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
    textAlign: 'center',
    textTransform: 'uppercase',
  },

  // ── Metric bars ───────────────────────────────────────────────────────────
  metricBlock: {
    gap: 5,
  },
  metricLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricLabel: {
    color: AC.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  metricValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  metricTrack: {
    backgroundColor: AC.surfaceMid,
    borderRadius: 100,
    height: 6,
    overflow: 'hidden',
  },
  metricFill: {
    borderRadius: 100,
    height: '100%',
  },

  // ── Sim row ───────────────────────────────────────────────────────────────
  simRow: {
    alignItems: 'center',
    borderTopColor: AC.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  simLabel: {
    color: AC.textSecondary,
    fontSize: 12,
  },
  simValue: {
    color: AC.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },

  // ── Insights ──────────────────────────────────────────────────────────────
  insightsHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  expandPill: {
    backgroundColor: AC.surfaceMid,
    borderColor: AC.border,
    borderRadius: 100,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  expandPillText: {
    color: AC.accent,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  insightRow: {
    borderTopColor: AC.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingTop: 10,
  },
  insightDot: {
    borderRadius: 100,
    flexShrink: 0,
    height: 9,
    marginTop: 4,
    width: 9,
  },
  insightBody: {
    flex: 1,
    gap: 2,
  },
  insightTitle: {
    color: AC.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  insightDetail: {
    color: AC.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },

  // ── Error states ──────────────────────────────────────────────────────────
  errorIconCircle: {
    alignItems: 'center',
    borderRadius: 36,
    borderWidth: 1,
    height: 72,
    justifyContent: 'center',
    marginBottom: 18,
    width: 72,
  },
  errorTitle: {
    color: AC.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  errorMessage: {
    color: AC.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: AC.accent,
    borderRadius: 12,
    paddingHorizontal: 28,
    paddingVertical: 12,
  },
  retryBtnText: {
    color: AC.white,
    fontSize: 14,
    fontWeight: '700',
  },
  errorBanner: {
    backgroundColor: AC.dangerDim,
    borderColor: AC.borderDanger,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  errorBannerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  errorBannerText: {
    color: AC.danger,
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default AnalyticsScreen;
