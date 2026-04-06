// Admin analytics dashboard for high-level platform metrics.

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
import AnalyticsCard from '../../components/AnalyticsCard';
import Button from '../../components/Button';
import Card from '../../components/Card';
import {formatDateTime} from '../../utils/formatters';
import {Colors} from '../../constants/colors';
import {Strings} from '../../constants/strings';

// ─── Types ────────────────────────────────────────────────────────────────────

interface InsightItem {
  id: string;
  tone: 'success' | 'warning' | 'error';
  title: string;
  detail: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const toPercent = (numerator: number, denominator: number): number => {
  if (denominator <= 0) {return 0;}
  return Math.round((numerator / denominator) * 100);
};

const getHealthLabel = (score: number): string => {
  if (score >= 80) {return 'Strong';}
  if (score >= 60) {return 'Needs Attention';}
  return 'Critical';
};

const getHealthTone = (score: number): 'success' | 'warning' | 'error' => {
  if (score >= 80) {return 'success';}
  if (score >= 60) {return 'warning';}
  return 'error';
};

// ─── Sub-components ───────────────────────────────────────────────────────────

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
  const barColor =
    tone === 'success' ? Colors.success
    : tone === 'warning' ? Colors.warning
    : Colors.error;

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

// ─── Main component ───────────────────────────────────────────────────────────

const AnalyticsScreen = () => {
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
        error instanceof Error ? error.message : 'Unable to load analytics.',
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchAnalytics();
  }, [fetchAnalytics]);

  const summary = useMemo(() => {
    if (!analytics) {return null;}

    const verificationRate = toPercent(analytics.verifiedProperties, analytics.totalProperties);
    const freezeRate = toPercent(analytics.frozenProperties, analytics.totalProperties);
    const anchorRate = toPercent(analytics.totalAnchored, analytics.verifiedProperties);
    const simulationCoverage = toPercent(
      analytics.totalSimulations,
      Math.max(analytics.verifiedProperties, 1),
    );
    const activeProperties = Math.max(
      analytics.verifiedProperties - analytics.frozenProperties,
      0,
    );
    const operationalScore = Math.max(
      0,
      Math.min(
        100,
        Math.round(verificationRate * 0.5 + anchorRate * 0.35 + (100 - freezeRate) * 0.15),
      ),
    );

    const insights: InsightItem[] = [];
    if (verificationRate < 65) {
      insights.push({
        id: 'verification',
        tone: 'warning',
        title: 'Verification throughput is low',
        detail: 'Increase DLS verification capacity to move more properties into the trusted market.',
      });
    }
    if (freezeRate >= 20) {
      insights.push({
        id: 'freeze',
        tone: 'error',
        title: 'High frozen-property ratio',
        detail: 'Prioritize investigations and remediation to reduce frozen inventory.',
      });
    }
    if (anchorRate < 70) {
      insights.push({
        id: 'anchor',
        tone: 'warning',
        title: 'Blockchain anchoring backlog',
        detail: 'Anchor additional verified records to strengthen auditability.',
      });
    }
    if (insights.length === 0) {
      insights.push({
        id: 'stable',
        tone: 'success',
        title: 'Operational posture is healthy',
        detail: 'Verification, anchoring, and freeze levels are within expected pilot thresholds.',
      });
    }

    return {
      activeProperties,
      verificationRate,
      freezeRate,
      anchorRate,
      simulationCoverage,
      operationalScore,
      operationalHealthLabel: getHealthLabel(operationalScore),
      operationalHealthTone: getHealthTone(operationalScore),
      insights,
    };
  }, [analytics]);

  // ── Guards ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={styles.centeredState}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>{Strings.common.loading}</Text>
      </View>
    );
  }

  if (!analytics || !summary) {
    return (
      <View style={styles.centeredState}>
        <View style={styles.errorIconWrapper}>
          <Text style={styles.errorEmoji}>⚠</Text>
        </View>
        <Text style={styles.errorTitle}>Could not load analytics</Text>
        <Text style={styles.errorMessage}>
          {errorMessage ?? 'Unable to load analytics.'}
        </Text>
        <Button
          label={Strings.common.retry}
          onPress={() => void fetchAnalytics()}
          variant="primary"
          size="md"
        />
      </View>
    );
  }

  const lastUpdated = analytics.lastAnchoredAt
    ? formatDateTime(analytics.lastAnchoredAt)
    : 'No anchor recorded yet';

  const healthStatusStyle =
    summary.operationalHealthTone === 'success'
      ? styles.healthStatusSuccess
      : summary.operationalHealthTone === 'warning'
      ? styles.healthStatusWarning
      : styles.healthStatusError;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          tintColor={Colors.primary}
          colors={[Colors.primary]}
          onRefresh={() => {
            setIsRefreshing(true);
            void fetchAnalytics();
          }}
        />
      }>

      {/* ── Header ── */}
      <View style={styles.headerBlock}>
        <Text style={styles.heading}>
          {Strings.analytics.screenTitle}
        </Text>
        <Text style={styles.headerSubtext}>
          Real-time operational overview for verification, blockchain anchoring,
          and citizen simulation activity.
        </Text>
        <View style={styles.updatedAtRow}>
          <Text style={styles.updatedAtDot}>🔗</Text>
          <Text style={styles.updatedAt}>Last anchor: {lastUpdated}</Text>
        </View>
      </View>

      {/* ── Operational health — dark card ── */}
      <Card variant="dark" padding="md" style={styles.healthCard}>
        <Text style={styles.healthTitle}>Operational Health Score</Text>
        <View style={styles.healthRow}>
          <Text style={styles.healthValue}>{summary.operationalScore}</Text>
          <Text style={styles.healthValueSuffix}>/100</Text>
        </View>
        <View style={styles.healthFooter}>
          <View style={[styles.healthStatusPill, healthStatusStyle]}>
            <Text style={[styles.healthStatusText, healthStatusStyle]}>
              {summary.operationalHealthLabel}
            </Text>
          </View>
          {/* Mini score bar */}
          <View style={styles.healthBarTrack}>
            <View
              style={[
                styles.healthBarFill,
                {
                  width: `${summary.operationalScore}%`,
                  backgroundColor:
                    summary.operationalHealthTone === 'success'
                      ? Colors.chatOnlineIndicator
                      : summary.operationalHealthTone === 'warning'
                      ? Colors.warning
                      : Colors.error,
                },
              ]}
            />
          </View>
        </View>
      </Card>

      {/* ── Metric grid ── */}
      <View style={styles.row}>
        <AnalyticsCard
          label={Strings.analytics.totalProperties}
          value={analytics.totalProperties.toLocaleString()}
          trend={`${summary.verificationRate}% verified`}
          trendDirection={summary.verificationRate >= 70 ? 'up' : 'neutral'}
        />
        <View style={styles.spacer} />
        <AnalyticsCard
          label="Active Properties"
          value={summary.activeProperties.toLocaleString()}
          trend={`${summary.freezeRate}% frozen`}
          trendDirection={summary.freezeRate > 15 ? 'down' : 'up'}
        />
      </View>

      <View style={styles.row}>
        <AnalyticsCard
          label="Verified"
          value={analytics.verifiedProperties.toLocaleString()}
          trend={`${summary.verificationRate}% coverage`}
          trendDirection={summary.verificationRate >= 70 ? 'up' : 'neutral'}
        />
        <View style={styles.spacer} />
        <AnalyticsCard
          label={Strings.analytics.totalSimulations}
          value={analytics.totalSimulations.toLocaleString()}
          trend={`${summary.simulationCoverage}% per asset`}
          trendDirection={analytics.totalSimulations > 0 ? 'up' : 'neutral'}
        />
      </View>

      <View style={styles.row}>
        <AnalyticsCard
          label="Anchored Records"
          value={analytics.totalAnchored.toLocaleString()}
          trend={`${summary.anchorRate}% of verified`}
          trendDirection={summary.anchorRate >= 70 ? 'up' : 'neutral'}
        />
        <View style={styles.spacer} />
        <AnalyticsCard
          label="Frozen"
          value={analytics.frozenProperties.toLocaleString()}
          trend={`${summary.freezeRate}% of inventory`}
          trendDirection={summary.freezeRate > 15 ? 'down' : 'up'}
        />
      </View>

      {/* ── Performance breakdown ── */}
      <Card variant="default" padding="md" style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Performance Breakdown</Text>
        <MetricBar
          label="Verification Coverage"
          value={summary.verificationRate}
          tone={summary.verificationRate >= 70 ? 'success' : 'warning'}
        />
        <MetricBar
          label="Anchoring Coverage"
          value={summary.anchorRate}
          tone={summary.anchorRate >= 70 ? 'success' : 'warning'}
        />
        <MetricBar
          label="Frozen Inventory Ratio"
          value={summary.freezeRate}
          tone={
            summary.freezeRate <= 10 ? 'success'
            : summary.freezeRate <= 20 ? 'warning'
            : 'error'
          }
        />
      </Card>

      {/* ── Actionable insights ── */}
      <Card variant="default" padding="md" style={styles.sectionCard}>
        <Pressable
          onPress={() => setIsExpandedInsights(prev => !prev)}
          style={styles.insightsHeader}>
          <Text style={styles.sectionTitle}>Actionable Insights</Text>
          <View style={styles.expandPill}>
            <Text style={styles.expandPillText}>
              {isExpandedInsights ? 'Collapse' : 'Expand'}
            </Text>
          </View>
        </Pressable>

        {(isExpandedInsights
          ? summary.insights
          : summary.insights.slice(0, 2)
        ).map(insight => (
          <View key={insight.id} style={styles.insightRow}>
            <View
              style={[
                styles.insightDot,
                insight.tone === 'success' ? styles.insightSuccess
                : insight.tone === 'warning' ? styles.insightWarning
                : styles.insightError,
              ]}
            />
            <View style={styles.insightBody}>
              <Text style={styles.insightTitle}>{insight.title}</Text>
              <Text style={styles.insightDetail}>{insight.detail}</Text>
            </View>
          </View>
        ))}
      </Card>

      {/* ── Inline error ── */}
      {errorMessage ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>⚠  {errorMessage}</Text>
        </View>
      ) : null}

    </ScrollView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    backgroundColor: Colors.backgroundPrimary,
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },

  // ── Centered states ───────────────────────────────────────────────────────
  centeredState: {
    alignItems: 'center',
    backgroundColor: Colors.backgroundPrimary,
    flex: 1,
    justifyContent: 'center',
    padding: 32,
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginTop: 12,
  },
  errorIconWrapper: {
    alignItems: 'center',
    backgroundColor: Colors.errorLight,
    borderRadius: 28,
    height: 72,
    justifyContent: 'center',
    marginBottom: 18,
    width: 72,
  },
  errorEmoji: {fontSize: 30},
  errorTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  errorMessage: {
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
    textAlign: 'center',
  },

  // ── Header ────────────────────────────────────────────────────────────────
  headerBlock: {
    marginBottom: 16,
  },
  heading: {
    color: Colors.textPrimary,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 0.2,
    marginBottom: 6,
  },
  headerSubtext: {
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
  updatedAtRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  updatedAtDot: {fontSize: 12},
  updatedAt: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },

  // ── Health card ───────────────────────────────────────────────────────────
  healthCard: {
    marginBottom: 12,
  },
  healthTitle: {
    color: Colors.textOnDarkMuted,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.4,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  healthRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 4,
    marginBottom: 14,
  },
  healthValue: {
    color: Colors.textOnDark,
    fontSize: 52,
    fontWeight: '800',
    letterSpacing: -1,
    lineHeight: 56,
  },
  healthValueSuffix: {
    color: Colors.textOnDarkMuted,
    fontSize: 20,
    fontWeight: '400',
    lineHeight: 40,
    marginBottom: 4,
  },
  healthFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  healthStatusPill: {
    borderRadius: 100,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  healthStatusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  healthStatusSuccess: {
    backgroundColor: 'rgba(76,175,125,0.2)',
    color: '#79E39E',
  },
  healthStatusWarning: {
    backgroundColor: 'rgba(212,168,83,0.2)',
    color: '#FFD28C',
  },
  healthStatusError: {
    backgroundColor: 'rgba(192,84,74,0.25)',
    color: '#FFB4AC',
  },
  healthBarTrack: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 100,
    flex: 1,
    height: 6,
    overflow: 'hidden',
  },
  healthBarFill: {
    borderRadius: 100,
    height: '100%',
  },

  // ── Metric grid ───────────────────────────────────────────────────────────
  row: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  spacer: {
    width: 10,
  },

  // ── Section cards ─────────────────────────────────────────────────────────
  sectionCard: {
    marginBottom: 12,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.1,
    marginBottom: 14,
  },

  // Metric bars
  metricBlock: {
    marginBottom: 14,
  },
  metricLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  metricLabel: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  metricTrack: {
    backgroundColor: Colors.backgroundMuted,
    borderRadius: 100,
    height: 8,
    overflow: 'hidden',
  },
  metricFill: {
    borderRadius: 100,
    height: 8,
  },

  // Insights
  insightsHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  expandPill: {
    backgroundColor: Colors.backgroundMuted,
    borderRadius: 100,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  expandPillText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  insightRow: {
    flexDirection: 'row',
    marginTop: 12,
  },
  insightDot: {
    borderRadius: 100,
    height: 9,
    marginRight: 10,
    marginTop: 5,
    width: 9,
  },
  insightSuccess: {backgroundColor: Colors.success},
  insightWarning: {backgroundColor: Colors.warning},
  insightError: {backgroundColor: Colors.error},
  insightBody: {flex: 1},
  insightTitle: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 3,
  },
  insightDetail: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },

  // Inline error
  errorBanner: {
    backgroundColor: Colors.errorLight,
    borderRadius: 12,
    marginTop: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  errorBannerText: {
    color: Colors.error,
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default AnalyticsScreen;
