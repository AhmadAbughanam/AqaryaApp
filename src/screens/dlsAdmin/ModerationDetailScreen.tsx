import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import Button from '../../components/Button';
import {AdminStackParamList} from '../../navigation/AdminStack';
import {
  getModerationReportDetail,
  moderateReport,
  ReportDetail,
  ReportStatus,
  ModerateAction,
  FlagSeverity,
} from '../../api/moderation';
import {AC} from '../../constants/adminColors';
import {useStrings} from '../../i18n';

type Props = NativeStackScreenProps<AdminStackParamList, 'ModerationDetail'>;

const STATUS_COLOR: Record<ReportStatus, string> = {
  open: AC.warning,
  under_review: AC.accent,
  resolved: AC.success,
  dismissed: AC.textMuted,
};

const SEVERITY_COLOR: Record<FlagSeverity, string> = {
  low: AC.textMuted,
  medium: AC.warning,
  high: AC.danger,
};

const SEVERITY_BG: Record<FlagSeverity, string> = {
  low: AC.surfaceMid,
  medium: AC.warningDim,
  high: AC.dangerDim,
};

const InfoRow = ({label, value}: {label: string; value: string}) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

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

const ModerationDetailScreen = ({navigation, route}: Props) => {
  const strings = useStrings();
  const md = strings.admin.moderationDetail;
  const {id} = route.params;
  const [report, setReport] = useState<ReportDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActing, setIsActing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getModerationReportDetail(id);
      setReport(data);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : md.errorLoad);
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  }, [id, navigation, md.errorLoad]);

  useEffect(() => {
    void load();
  }, [load]);

  const onAction = (action: ModerateAction) => {
    const labels: Record<ModerateAction, {title: string; confirm: string}> = {
      mark_under_review: {
        title: md.confirmMarkUnderReviewTitle,
        confirm: md.confirmMarkUnderReviewMsg,
      },
      resolve: {title: md.confirmResolveTitle, confirm: md.confirmResolveMsg},
      dismiss: {
        title: md.confirmDismissTitle,
        confirm: md.confirmDismissMsg,
      },
    };
    const {title, confirm} = labels[action];

    Alert.alert(title, confirm, [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Confirm',
        style: action === 'dismiss' ? 'destructive' : 'default',
        onPress: () => {
          void (async () => {
            try {
              setIsActing(true);
              await moderateReport(id, {action});
              await load();
            } catch (err) {
              Alert.alert('Error', err instanceof Error ? err.message : md.errorAction);
            } finally {
              setIsActing(false);
            }
          })();
        },
      },
    ]);
  };

  const onViewTarget = () => {
    if (!report) return;
    if (report.targetType === 'listing') {
      navigation.navigate('AdminPropertyDetail', {id: report.targetId});
    } else {
      navigation.navigate('AdminInvestmentDetail', {id: report.targetId});
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={AC.accent} />
      </View>
    );
  }

  if (!report) return null;

  const isClosed = report.status === 'resolved' || report.status === 'dismissed';
  const statusColor = STATUS_COLOR[report.status];

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>

      {/* Status header */}
      <View style={[styles.statusHeader, {borderLeftColor: statusColor}]}>
        <View style={styles.statusHeaderRow}>
          <View style={[styles.statusPill, {backgroundColor: statusColor + '22', borderColor: statusColor + '60'}]}>
            <View style={[styles.statusDot, {backgroundColor: statusColor}]} />
            <Text style={[styles.statusPillText, {color: statusColor}]}>
              {strings.admin.reportStatuses[report.status]}
            </Text>
          </View>
          <View style={styles.targetTypeBadge}>
            <Text style={styles.targetTypeBadgeText}>
              {report.targetType === 'listing' ? md.badgeListing : md.badgeOpportunity}
            </Text>
          </View>
        </View>
        <Text style={styles.createdDate}>
          {md.labelSubmitted}{' '}
          {new Date(report.createdAt).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>

      {/* Reported entity */}
      {report.entitySummary ? (
        <SectionCard
          title={report.targetType === 'listing' ? md.sectionReportedListing : md.sectionReportedOpportunity}
          accentColor={AC.cyan}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.entityInfoBlock}>
              <InfoRow label={md.labelTitle} value={report.entitySummary.title} />
              <InfoRow label={md.labelLocation} value={report.entitySummary.location} />
              <InfoRow label={md.labelStatus} value={report.entitySummary.status.replace(/_/g, ' ')} />
            </View>
          </View>
          <Pressable
            onPress={onViewTarget}
            style={({pressed}) => [styles.viewBtn, pressed && {opacity: 0.6}]}
            accessibilityRole="button">
            <Text style={styles.viewBtnText}>
              {report.targetType === 'listing' ? md.viewListing : md.viewOpportunity}
            </Text>
          </Pressable>
        </SectionCard>
      ) : (
        <SectionCard title={md.sectionReportedEntity}>
          <Text style={styles.mutedNote}>{md.entityNotFound}</Text>
        </SectionCard>
      )}

      {/* Report details */}
      <SectionCard title={md.sectionReportDetails} accentColor={AC.warning}>
        <InfoRow label={md.labelReason} value={strings.admin.reportReasons[report.reason]} />
        <InfoRow label={md.labelReporter} value={report.reporter.username} />
        {report.notes ? (
          <View style={styles.notesBlock}>
            <Text style={styles.notesBlockLabel}>{md.reporterNotes}</Text>
            <Text style={styles.notesBlockText}>"{report.notes}"</Text>
          </View>
        ) : null}
      </SectionCard>

      {/* Quality flags */}
      <SectionCard
        title={md.sectionQualityFlags}
        accentColor={report.qualityFlags.length > 0 ? AC.danger : undefined}>
        {report.qualityFlags.length === 0 ? (
          <Text style={styles.mutedNote}>{md.noQualityFlags}</Text>
        ) : (
          <>
            <Text style={styles.flagsSubtitle}>
              {md.qualityFlagsSubtitle} {report.targetType}.
            </Text>
            {report.qualityFlags.map(flag => (
              <View
                key={flag.id}
                style={[styles.flagRow, {backgroundColor: SEVERITY_BG[flag.severity]}]}>
                <View style={styles.flagLeft}>
                  <View
                    style={[styles.flagSeverityDot, {backgroundColor: SEVERITY_COLOR[flag.severity]}]}
                  />
                  <View style={styles.flagInfo}>
                    <Text style={styles.flagRule}>
                      {strings.admin.flagRules[flag.rule as keyof typeof strings.admin.flagRules] ?? flag.rule.replace(/_/g, ' ')}
                    </Text>
                    <Text style={styles.flagDetails}>{flag.details}</Text>
                  </View>
                </View>
                <Text style={[styles.flagSeverityLabel, {color: SEVERITY_COLOR[flag.severity]}]}>
                  {strings.admin.severities[flag.severity].toUpperCase()}
                </Text>
              </View>
            ))}
          </>
        )}
      </SectionCard>

      {/* Review history */}
      {report.reviewedAt ? (
        <SectionCard title={md.sectionReviewHistory}>
          <InfoRow
            label={md.labelReviewedAt}
            value={new Date(report.reviewedAt).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          />
        </SectionCard>
      ) : null}

      {/* Actions */}
      {!isClosed ? (
        <View style={styles.actions}>
          {report.status === 'open' ? (
            <Button
              label={md.actionMarkUnderReview}
              onPress={() => onAction('mark_under_review')}
              variant="secondary"
              size="md"
              fullWidth
              loading={isActing}
            />
          ) : null}
          <Button
            label={md.actionResolve}
            onPress={() => onAction('resolve')}
            variant="primary"
            size="md"
            fullWidth
            loading={isActing}
          />
          <Button
            label={md.actionDismiss}
            onPress={() => onAction('dismiss')}
            variant="secondary"
            size="md"
            fullWidth
            loading={isActing}
          />
        </View>
      ) : (
        <View style={styles.closedBanner}>
          <Text style={styles.closedBannerText}>
            {md.closedBannerPrefix} {report.status}{md.closedBannerSuffix}
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: {
    backgroundColor: AC.bg,
    flex: 1,
  },
  content: {
    gap: 12,
    padding: 16,
    paddingBottom: 40,
  },
  centered: {
    alignItems: 'center',
    backgroundColor: AC.bg,
    flex: 1,
    justifyContent: 'center',
  },

  // Status header
  statusHeader: {
    borderLeftWidth: 3,
    gap: 4,
    paddingLeft: 12,
  },
  statusHeaderRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  statusPill: {
    alignItems: 'center',
    borderRadius: 100,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusDot: {
    borderRadius: 4,
    height: 7,
    width: 7,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  targetTypeBadge: {
    backgroundColor: AC.surfaceMid,
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  targetTypeBadgeText: {
    color: AC.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  createdDate: {
    color: AC.textMuted,
    fontSize: 12,
    marginTop: 2,
  },

  // Section card
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
    padding: 14,
  },
  sectionTitle: {
    color: AC.textPrimary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  entityInfoBlock: {
    flex: 1,
  },
  viewBtn: {
    alignSelf: 'flex-start',
    backgroundColor: AC.accentDim,
    borderColor: AC.borderAccent,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  viewBtnText: {
    color: AC.accent,
    fontSize: 13,
    fontWeight: '600',
  },

  // Info rows
  infoRow: {
    borderTopColor: AC.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 9,
  },
  infoLabel: {
    color: AC.textMuted,
    flex: 1,
    fontSize: 12,
  },
  infoValue: {
    color: AC.textPrimary,
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'right',
    textTransform: 'capitalize',
  },
  mutedNote: {
    color: AC.textMuted,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 4,
  },

  // Notes block
  notesBlock: {
    backgroundColor: AC.surfaceMid,
    borderRadius: 10,
    marginTop: 10,
    padding: 12,
  },
  notesBlockLabel: {
    color: AC.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  notesBlockText: {
    color: AC.textSecondary,
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 19,
  },

  // Flags
  flagsSubtitle: {
    color: AC.textSecondary,
    fontSize: 12,
    marginBottom: 10,
  },
  flagRow: {
    alignItems: 'center',
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    padding: 12,
  },
  flagLeft: {
    alignItems: 'flex-start',
    flex: 1,
    flexDirection: 'row',
    gap: 10,
  },
  flagSeverityDot: {
    borderRadius: 5,
    flexShrink: 0,
    height: 10,
    marginTop: 3,
    width: 10,
  },
  flagInfo: {
    flex: 1,
    gap: 2,
  },
  flagRule: {
    color: AC.textPrimary,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  flagDetails: {
    color: AC.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  flagSeverityLabel: {
    flexShrink: 0,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginLeft: 8,
  },

  // Actions
  actions: {
    gap: 10,
  },
  closedBanner: {
    backgroundColor: AC.surfaceMid,
    borderColor: AC.border,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
  closedBannerText: {
    color: AC.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    textTransform: 'capitalize',
  },
});

export default ModerationDetailScreen;
