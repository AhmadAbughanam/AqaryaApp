// Audit logs screen with filters, pagination, and expandable metadata.

import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {AdminActionType, AuditLogItem, getAuditLogs} from '../../api/admin';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Input from '../../components/Input';
import {formatDateTime} from '../../utils/formatters';
import {Colors} from '../../constants/colors';
import {Strings} from '../../constants/strings';

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;
const ACTION_FILTERS: Array<'all' | AdminActionType> = [
  'all',
  'listing_verified',
  'listing_frozen',
  'anchor',
];

// Action type visual config
const ACTION_CONFIG: Record<
  string,
  {color: string; bg: string; icon: string}
> = {
  listing_verified:  {color: Colors.success, bg: Colors.successLight, icon: '✓'},
  listing_frozen:  {color: Colors.error,   bg: Colors.errorLight,   icon: '⏸'},
  anchor:  {color: Colors.info,    bg: Colors.infoLight,    icon: '🔗'},
  default: {color: Colors.textSecondary, bg: Colors.backgroundMuted, icon: '•'},
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const ActionTypeBadge = ({actionType}: {actionType: string}) => {
  const config = ACTION_CONFIG[actionType.toLowerCase()] ?? ACTION_CONFIG.default;
  return (
    <View style={[styles.actionBadge, {backgroundColor: config.bg}]}>
      <Text style={[styles.actionBadgeIcon, {color: config.color}]}>
        {config.icon}
      </Text>
      <Text style={[styles.actionBadgeText, {color: config.color}]}>
        {actionType.toUpperCase()}
      </Text>
    </View>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

const AuditLogsScreen = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [expandedLogIds, setExpandedLogIds] = useState<Record<string, boolean>>({});

  const [actionTypeFilter, setActionTypeFilter] = useState<'all' | AdminActionType>('all');
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');

  const requestFilters = useMemo(
    () => ({
      actionType: actionTypeFilter === 'all' ? undefined : actionTypeFilter,
      dateFrom: dateFromFilter.trim() || undefined,
      dateTo: dateToFilter.trim() || undefined,
    }),
    [actionTypeFilter, dateFromFilter, dateToFilter],
  );

  const fetchPage = useCallback(
    async (targetPage: number, mode: 'replace' | 'append') => {
      const response = await getAuditLogs({
        page: targetPage,
        limit: PAGE_SIZE,
        ...requestFilters,
      });
      setLogs(previous =>
        mode === 'replace' ? response.items : [...previous, ...response.items],
      );
      setPage(response.page);
      setHasNextPage(response.page * response.limit < response.total);
    },
    [requestFilters],
  );

  const loadInitial = useCallback(async () => {
    setErrorMessage(null);
    setIsInitialLoading(true);
    try {
      await fetchPage(1, 'replace');
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Unable to load audit logs.',
      );
    } finally {
      setIsInitialLoading(false);
    }
  }, [fetchPage]);

  useEffect(() => {
    void loadInitial();
  }, [loadInitial]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setErrorMessage(null);
    try {
      await fetchPage(1, 'replace');
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Unable to refresh.',
      );
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchPage]);

  const onLoadMore = useCallback(async () => {
    if (!hasNextPage || isLoadingMore || isInitialLoading) {return;}
    setIsLoadingMore(true);
    try {
      await fetchPage(page + 1, 'append');
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Unable to load more.',
      );
    } finally {
      setIsLoadingMore(false);
    }
  }, [fetchPage, hasNextPage, isInitialLoading, isLoadingMore, page]);

  // ── Render log item ────────────────────────────────────────────────────────
  const renderLog = ({item}: {item: AuditLogItem}) => {
    const isExpanded = Boolean(expandedLogIds[item.id]);
    const toggleExpanded = () =>
      setExpandedLogIds(prev => ({...prev, [item.id]: !prev[item.id]}));

    return (
      <Card variant="default" padding="none" style={styles.logCard}>
        {/* Header row */}
        <View style={styles.logHeader}>
          <ActionTypeBadge actionType={item.actionType} />
          <Text style={styles.logTimestamp}>
            {formatDateTime(item.timestamp)}
          </Text>
        </View>

        {/* Meta rows */}
        <View style={styles.logMeta}>
          <View style={styles.logMetaRow}>
            <Text style={styles.logMetaLabel}>Actor</Text>
            <Text style={styles.logMetaValue}>{item.actorName}</Text>
          </View>
          <View style={styles.logMetaRow}>
            <Text style={styles.logMetaLabel}>Role</Text>
            <Text style={styles.logMetaValue}>{item.actorRole}</Text>
          </View>
          <View style={[styles.logMetaRow, styles.logMetaRowLast]}>
            <Text style={styles.logMetaLabel}>Property ID</Text>
            <Text
              style={[styles.logMetaValue, styles.logMetaValueMono]}
              numberOfLines={1}>
              {item.propertyId}
            </Text>
          </View>
        </View>

        {/* Expand metadata toggle */}
        <Pressable
          onPress={toggleExpanded}
          style={styles.expandToggle}
          hitSlop={8}>
          <Text style={styles.expandToggleText}>
            {isExpanded ? '▲  Hide metadata' : '▼  View metadata'}
          </Text>
        </Pressable>

        {/* Metadata block */}
        {isExpanded && (
          <View style={styles.metadataBlock}>
            <Text style={styles.metadataText}>
              {JSON.stringify(item.metadata, null, 2)}
            </Text>
          </View>
        )}
      </Card>
    );
  };

  return (
    <View style={styles.container}>

      {/* ── Filter panel ── */}
      <View style={styles.filterPanel}>
        {/* Action type chips */}
        <Text style={styles.filterSectionLabel}>Action Type</Text>
        <View style={styles.filterChipsRow}>
          {ACTION_FILTERS.map(filter => {
            const isActive = filter === actionTypeFilter;
            return (
              <Pressable
                key={filter}
                onPress={() => setActionTypeFilter(filter)}
                style={[
                  styles.filterChip,
                  isActive && styles.filterChipActive,
                ]}>
                <Text
                  style={[
                    styles.filterChipText,
                    isActive && styles.filterChipTextActive,
                  ]}>
                  {filter === 'all' ? 'All' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Date range inputs */}
        <View style={styles.dateRow}>
          <Input
            placeholder="From (YYYY-MM-DD)"
            value={dateFromFilter}
            onChangeText={setDateFromFilter}
            containerStyle={styles.dateInput}
            leftIcon={<Text style={styles.inputIcon}>📅</Text>}
          />
          <Input
            placeholder="To (YYYY-MM-DD)"
            value={dateToFilter}
            onChangeText={setDateToFilter}
            containerStyle={styles.dateInput}
            leftIcon={<Text style={styles.inputIcon}>📅</Text>}
          />
        </View>

        {/* Apply button */}
        <Button
          label="Apply Filters"
          onPress={() => void loadInitial()}
          variant="primary"
          size="sm"
          fullWidth
        />
      </View>

      {/* ── List ── */}
      {isInitialLoading ? (
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>{Strings.common.loading}</Text>
        </View>
      ) : (
        <FlatList
          data={logs}
          keyExtractor={item => item.id}
          onEndReached={onLoadMore}
          onEndReachedThreshold={0.4}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          }
          contentContainerStyle={styles.listContent}
          renderItem={renderLog}
          ListHeaderComponent={
            errorMessage ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>⚠  {errorMessage}</Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>📋</Text>
              <Text style={styles.emptyTitle}>
                {Strings.auditLogs.emptyTitle}
              </Text>
              <Text style={styles.emptyMessage}>
                {Strings.auditLogs.emptyMessage}
              </Text>
            </View>
          }
          ListFooterComponent={
            isLoadingMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator color={Colors.primary} size="small" />
                <Text style={styles.loadingMoreText}>Loading more…</Text>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.backgroundPrimary,
    flex: 1,
  },

  // ── Filter panel ──────────────────────────────────────────────────────────
  filterPanel: {
    backgroundColor: Colors.backgroundSecondary,
    borderBottomColor: Colors.border,
    borderBottomWidth: 1,
    gap: 10,
    padding: 14,
  },
  filterSectionLabel: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  filterChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    backgroundColor: Colors.backgroundMuted,
    borderColor: Colors.border,
    borderRadius: 100,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  filterChipActive: {
    backgroundColor: Colors.primaryDark,
    borderColor: Colors.primaryDark,
  },
  filterChipText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: Colors.textOnDark,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dateInput: {
    flex: 1,
  },
  inputIcon: {
    fontSize: 14,
  },

  // ── List ──────────────────────────────────────────────────────────────────
  listContent: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 32,
  },

  // ── Log card ──────────────────────────────────────────────────────────────
  logCard: {
    marginBottom: 12,
    overflow: 'hidden',
  },
  logHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    paddingBottom: 10,
  },
  logTimestamp: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '400',
  },

  // Action badge
  actionBadge: {
    alignItems: 'center',
    borderRadius: 100,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  actionBadgeIcon: {
    fontSize: 11,
    fontWeight: '700',
  },
  actionBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // Meta rows
  logMeta: {
    borderTopColor: Colors.border,
    borderTopWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
  },
  logMetaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  logMetaRowLast: {
    // no border needed, just spacing
  },
  logMetaLabel: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
    width: 80,
  },
  logMetaValue: {
    color: Colors.textPrimary,
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
  },
  logMetaValueMono: {
    fontFamily: 'monospace',
    fontSize: 12,
  },

  // Expand toggle
  expandToggle: {
    borderTopColor: Colors.border,
    borderTopWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  expandToggleText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },

  // Metadata block
  metadataBlock: {
    backgroundColor: Colors.cardDark,
    margin: 12,
    marginTop: 0,
    borderRadius: 12,
    padding: 12,
  },
  metadataText: {
    color: Colors.chatOnlineIndicator,
    fontFamily: 'monospace',
    fontSize: 11,
    letterSpacing: 0.3,
    lineHeight: 18,
  },

  // ── Centered states ───────────────────────────────────────────────────────
  centeredState: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 32,
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginTop: 12,
  },

  // Error banner
  errorBanner: {
    backgroundColor: Colors.errorLight,
    borderRadius: 12,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  errorBannerText: {
    color: Colors.error,
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 60,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
    opacity: 0.4,
  },
  emptyTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyMessage: {
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },

  // Footer loader
  footerLoader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingMoreText: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
});

export default AuditLogsScreen;
