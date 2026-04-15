import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {AdminStackParamList} from '../../navigation/AdminStack';
import {
  getModerationReports,
  ReportListItem,
  ReportStatus,
  ReportTargetType,
} from '../../api/moderation';
import {AC} from '../../constants/adminColors';
import {useStrings} from '../../i18n';

type Props = NativeStackScreenProps<AdminStackParamList, 'ModerationQueue'>;

const STATUS_COLOR: Record<ReportStatus, string> = {
  open: AC.warning,
  under_review: AC.accent,
  resolved: AC.success,
  dismissed: AC.textMuted,
};

const TARGET_COLOR: Record<ReportTargetType, string> = {
  listing: AC.accent,
  opportunity: AC.cyan,
};

const FILTER_STATUSES: Array<ReportStatus | 'all'> = [
  'all', 'open', 'under_review', 'resolved', 'dismissed',
];

const FILTER_TARGET_TYPES: Array<ReportTargetType | 'all'> = [
  'all', 'listing', 'opportunity',
];

const FilterChip = ({
  label,
  active,
  onPress,
  color,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  color?: string;
}) => (
  <Pressable
    onPress={onPress}
    style={({pressed}) => [
      styles.chip,
      active && {
        backgroundColor: (color ?? AC.accent) + '22',
        borderColor: (color ?? AC.accent) + '55',
      },
      pressed && styles.chipPressed,
    ]}
    accessibilityRole="button"
    accessibilityState={{selected: active}}>
    {active && (
      <View style={[styles.chipDot, {backgroundColor: color ?? AC.accent}]} />
    )}
    <Text style={[styles.chipText, active && {color: color ?? AC.accent}]}>{label}</Text>
  </Pressable>
);

const ReportRow = ({
  item,
  onPress,
  statusLabel,
  reasonLabel,
  targetLabel,
  reporterPrefix,
}: {
  item: ReportListItem;
  onPress: () => void;
  statusLabel: string;
  reasonLabel: string;
  targetLabel: string;
  reporterPrefix: string;
}) => {
  const statusColor = STATUS_COLOR[item.status];
  const targetColor = TARGET_COLOR[item.targetType];

  return (
    <Pressable
      onPress={onPress}
      style={({pressed}) => [styles.rowCard, pressed && styles.rowCardPressed]}
      accessibilityRole="button">
      <View style={[styles.rowAccentBar, {backgroundColor: statusColor}]} />
      <View style={styles.rowContent}>
        <View style={styles.rowTop}>
          <View style={styles.rowBadges}>
            <View style={[styles.targetBadge, {backgroundColor: targetColor + '22'}]}>
              <Text style={[styles.targetBadgeText, {color: targetColor}]}>
                {targetLabel.toUpperCase()}
              </Text>
            </View>
            <View style={[styles.statusPill, {backgroundColor: statusColor + '22'}]}>
              <View style={[styles.statusDot, {backgroundColor: statusColor}]} />
              <Text style={[styles.statusPillText, {color: statusColor}]}>
                {statusLabel}
              </Text>
            </View>
          </View>
          <Text style={styles.rowDate}>
            {new Date(item.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
          </Text>
        </View>

        <Text style={styles.rowTitle} numberOfLines={1}>
          {item.entityTitle ?? item.targetId}
        </Text>

        {item.entityLocation ? (
          <Text style={styles.rowLocation} numberOfLines={1}>
            {item.entityLocation}
          </Text>
        ) : null}

        <View style={styles.rowMeta}>
          <View style={styles.reasonPill}>
            <Text style={styles.reasonText}>{reasonLabel}</Text>
          </View>
          <Text style={styles.rowReporter}>{reporterPrefix}{item.reporter.username}</Text>
        </View>

        {item.notes ? (
          <Text style={styles.rowNotes} numberOfLines={2}>
            "{item.notes}"
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
};

const ModerationQueueScreen = ({navigation}: Props) => {
  const strings = useStrings();
  const mq = strings.admin.moderationQueue;
  const [reports, setReports] = useState<ReportListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<ReportStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<ReportTargetType | 'all'>('all');

  const load = useCallback(
    async (refresh = false) => {
      try {
        const result = await getModerationReports({
          status: statusFilter === 'all' ? undefined : statusFilter,
          targetType: typeFilter === 'all' ? undefined : typeFilter,
          limit: 50,
        });
        setReports(result.items);
        setTotal(result.total);
      } catch {
        // keep current list visible on error
      } finally {
        setIsLoading(false);
        if (refresh) setIsRefreshing(false);
      }
    },
    [statusFilter, typeFilter],
  );

  useEffect(() => {
    setIsLoading(true);
    void load();
  }, [load]);

  return (
    <View style={styles.container}>
      {/* Filter bar */}
      <View style={styles.filterBar}>
        <Text style={styles.filterSectionLabel}>{mq.filterStatusLabel}</Text>
        <View style={styles.filterRow}>
          {FILTER_STATUSES.map(s => (
            <FilterChip
              key={s}
              label={s === 'all' ? mq.filterAll : strings.admin.reportStatuses[s]}
              active={statusFilter === s}
              onPress={() => setStatusFilter(s)}
              color={s !== 'all' ? STATUS_COLOR[s] : undefined}
            />
          ))}
        </View>

        <Text style={[styles.filterSectionLabel, styles.filterSectionLabelSpaced]}>{mq.filterTypeLabel}</Text>
        <View style={styles.filterRow}>
          {FILTER_TARGET_TYPES.map(t => (
            <FilterChip
              key={t}
              label={t === 'all' ? mq.filterAll : t === 'listing' ? mq.targetListing : mq.targetOpportunity}
              active={typeFilter === t}
              onPress={() => setTypeFilter(t)}
              color={t !== 'all' ? TARGET_COLOR[t] : undefined}
            />
          ))}
        </View>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="small" color={AC.accent} />
        </View>
      ) : (
        <FlatList
          data={reports}
          keyExtractor={item => item.id}
          renderItem={({item}) => (
            <ReportRow
              item={item}
              onPress={() => navigation.navigate('ModerationDetail', {id: item.id})}
              statusLabel={strings.admin.reportStatuses[item.status]}
              reasonLabel={strings.admin.reportReasons[item.reason]}
              targetLabel={item.targetType === 'listing' ? mq.targetListing : mq.targetOpportunity}
              reporterPrefix="by "
            />
          )}
          ListHeaderComponent={
            <Text style={styles.countText}>
              {total}{' '}
              {total !== 1 ? mq.reportCountPlural : mq.reportCount}
            </Text>
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>{mq.emptyTitle}</Text>
              <Text style={styles.emptyText}>{mq.emptyText}</Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => {
                setIsRefreshing(true);
                void load(true);
              }}
              tintColor={AC.accent}
              colors={[AC.accent]}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: AC.bg,
    flex: 1,
  },
  filterBar: {
    backgroundColor: AC.surface,
    borderBottomColor: AC.border,
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
  },
  filterSectionLabel: {
    color: AC.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.1,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  filterSectionLabelSpaced: {
    marginTop: 10,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    alignItems: 'center',
    backgroundColor: AC.surfaceMid,
    borderColor: AC.border,
    borderRadius: 100,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  chipPressed: {
    opacity: 0.75,
  },
  chipDot: {
    borderRadius: 3,
    height: 6,
    width: 6,
  },
  chipText: {
    color: AC.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  countText: {
    color: AC.textMuted,
    fontSize: 12,
    fontWeight: '500',
    paddingHorizontal: 16,
    paddingTop: 14,
    marginBottom: 6,
  },
  listContent: {
    paddingBottom: 32,
  },
  centered: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  rowCard: {
    backgroundColor: AC.surface,
    borderColor: AC.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: 10,
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  rowCardPressed: {
    backgroundColor: AC.surfaceMid,
  },
  rowAccentBar: {
    width: 3,
  },
  rowContent: {
    flex: 1,
    gap: 6,
    padding: 12,
  },
  rowTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rowBadges: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  targetBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  targetBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  statusPill: {
    alignItems: 'center',
    borderRadius: 100,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusDot: {
    borderRadius: 4,
    height: 6,
    width: 6,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  rowDate: {
    color: AC.textMuted,
    fontSize: 11,
  },
  rowTitle: {
    color: AC.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  rowLocation: {
    color: AC.textSecondary,
    fontSize: 12,
  },
  rowMeta: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  reasonPill: {
    backgroundColor: AC.surfaceMid,
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  reasonText: {
    color: AC.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  rowReporter: {
    color: AC.textMuted,
    fontSize: 11,
  },
  rowNotes: {
    color: AC.textSecondary,
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 17,
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  emptyTitle: {
    color: AC.textSecondary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptyText: {
    color: AC.textMuted,
    fontSize: 13,
    textAlign: 'center',
  },
});

export default ModerationQueueScreen;
