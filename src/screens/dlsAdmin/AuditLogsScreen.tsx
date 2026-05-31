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
import Button from '../../components/Button';
import Input from '../../components/Input';

import {AC} from '../../constants/adminColors';
import {CalendarIcon, WarningCircleIcon} from '../../components/AdminIcon';
import {useStrings} from '../../i18n';
import {formatDateTime} from '../../utils/formatters';


const PAGE_SIZE = 20;

const ACTION_FILTERS: Array<'all' | AdminActionType> = [
  'all',
  'listing_verified',
  'listing_frozen',
  'anchor',
];

const ACTION_CONFIG: Record<string, {color: string; bg: string; label: string}> = {
  listing_verified: {color: AC.success, bg: AC.successDim, label: 'VERIFIED'},
  listing_frozen: {color: AC.danger, bg: AC.dangerDim, label: 'FROZEN'},
  anchor: {color: AC.cyan, bg: AC.cyanDim, label: 'ANCHOR'},
  default: {color: AC.textSecondary, bg: AC.surfaceMid, label: 'EVENT'},
};

const ActionBadge = ({actionType}: {actionType: string}) => {
  const config = ACTION_CONFIG[actionType.toLowerCase()] ?? ACTION_CONFIG.default;
  return (
    <View style={[styles.actionBadge, {backgroundColor: config.bg}]}>
      <Text style={[styles.actionBadgeText, {color: config.color}]}>
        {config.label}
      </Text>
    </View>
  );
};

const AuditLogsScreen = () => {
  const strings = useStrings();
  const al = strings.admin.auditLogs;
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
      setErrorMessage(error instanceof Error ? error.message : al.errorLoad);
    } finally {
      setIsInitialLoading(false);
    }
  }, [al, fetchPage]);

  useEffect(() => {
    void loadInitial();
  }, [loadInitial]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setErrorMessage(null);
    try {
      await fetchPage(1, 'replace');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : al.errorLoad);
    } finally {
      setIsRefreshing(false);
    }
  }, [al, fetchPage]);

  const onLoadMore = useCallback(async () => {
    if (!hasNextPage || isLoadingMore || isInitialLoading) return;
    setIsLoadingMore(true);
    try {
      await fetchPage(page + 1, 'append');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : al.errorLoad);
    } finally {
      setIsLoadingMore(false);
    }
  }, [al, fetchPage, hasNextPage, isInitialLoading, isLoadingMore, page]);

  const renderLog = ({item}: {item: AuditLogItem}) => {
    const isExpanded = Boolean(expandedLogIds[item.id]);
    const toggleExpanded = () =>
      setExpandedLogIds(prev => ({...prev, [item.id]: !prev[item.id]}));

    return (
      <View style={styles.logCard}>
        {/* Header */}
        <View style={styles.logHeader}>
          <ActionBadge actionType={item.actionType} />
          <Text style={styles.logTimestamp}>{formatDateTime(item.timestamp)}</Text>
        </View>

        {/* Meta */}
        <View style={styles.logMeta}>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>{al.labelActor}</Text>
            <Text style={styles.metaValue}>{item.actorName}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>{al.labelRole}</Text>
            <Text style={styles.metaValue}>{item.actorRole}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>{al.labelProperty}</Text>
            <Text style={[styles.metaValue, styles.metaValueMono]} numberOfLines={1}>
              {item.propertyId}
            </Text>
          </View>
        </View>

        {/* Expand toggle */}
        <Pressable onPress={toggleExpanded} style={styles.expandToggle} hitSlop={8}>
          <Text style={styles.expandToggleText}>
            {isExpanded ? al.collapseMetadata : al.expandMetadata}
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
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Filter panel */}
      <View style={styles.filterPanel}>
        <Text style={styles.filterLabel}>{al.filterActionType}</Text>
        <View style={styles.filterChipsRow}>
          {ACTION_FILTERS.map(filter => {
            const isActive = filter === actionTypeFilter;
            const config = filter !== 'all' ? (ACTION_CONFIG[filter] ?? ACTION_CONFIG.default) : null;
            return (
              <Pressable
                key={filter}
                onPress={() => setActionTypeFilter(filter)}
                style={[
                  styles.filterChip,
                  isActive && config && {
                    backgroundColor: config.bg,
                    borderColor: config.color + '50',
                  },
                  isActive && !config && styles.filterChipActiveDefault,
                ]}>
                <Text
                  style={[
                    styles.filterChipText,
                    isActive && config && {color: config.color},
                    isActive && !config && {color: AC.accent},
                  ]}>
                  {filter === 'all'
                    ? al.filterAll
                    : filter.charAt(0).toUpperCase() + filter.slice(1).replace(/_/g, ' ')}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.dateRow}>
          <Input
            placeholder="From (YYYY-MM-DD)"
            value={dateFromFilter}
            onChangeText={setDateFromFilter}
            containerStyle={styles.dateInput}
            leftIcon={<CalendarIcon size={16} color={AC.textSecondary} />}
          />
          <Input
            placeholder="To (YYYY-MM-DD)"
            value={dateToFilter}
            onChangeText={setDateToFilter}
            containerStyle={styles.dateInput}
            leftIcon={<CalendarIcon size={16} color={AC.textSecondary} />}
          />
        </View>

        <Button
          label={al.applyFilters}
          onPress={() => void loadInitial()}
          variant="primary"
          size="sm"
          fullWidth
        />
      </View>

      {/* List */}
      {isInitialLoading ? (
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color={AC.accent} />
          <Text style={styles.loadingText}>{al.loadingText}</Text>
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
              tintColor={AC.accent}
              colors={[AC.accent]}
            />
          }
          contentContainerStyle={styles.listContent}
          renderItem={renderLog}
          ListHeaderComponent={
            errorMessage ? (
              <View style={styles.errorBanner}>
                <View style={styles.errorBannerRow}>
                  <WarningCircleIcon size={14} color={AC.danger} />
                  <Text style={styles.errorBannerText}>{errorMessage}</Text>
                </View>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>{al.noLogsTitle}</Text>
              <Text style={styles.emptyMessage}>{al.noLogsText}</Text>
            </View>
          }
          ListFooterComponent={
            isLoadingMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator color={AC.accent} size="small" />
                <Text style={styles.loadingMoreText}>{al.loadingMore}</Text>
              </View>
            ) : null
          }
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

  // Filter panel
  filterPanel: {
    backgroundColor: AC.surface,
    borderBottomColor: AC.border,
    borderBottomWidth: 1,
    gap: 10,
    padding: 14,
  },
  filterLabel: {
    color: AC.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  filterChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    backgroundColor: AC.surfaceMid,
    borderColor: AC.border,
    borderRadius: 100,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  filterChipActiveDefault: {
    backgroundColor: AC.accentDim,
    borderColor: AC.borderAccent,
  },
  filterChipText: {
    color: AC.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  dateRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dateInput: {
    flex: 1,
  },
  // List
  listContent: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 32,
  },

  // Log card
  logCard: {
    backgroundColor: AC.surface,
    borderColor: AC.border,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
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
    color: AC.textMuted,
    fontSize: 11,
  },
  actionBadge: {
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  actionBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.7,
  },

  // Meta rows
  logMeta: {
    borderTopColor: AC.border,
    borderTopWidth: 1,
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  metaLabel: {
    color: AC.textMuted,
    fontSize: 12,
    fontWeight: '500',
    width: 72,
  },
  metaValue: {
    color: AC.textPrimary,
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
  },
  metaValueMono: {
    fontFamily: 'monospace',
    fontSize: 12,
  },

  // Expand toggle
  expandToggle: {
    borderTopColor: AC.border,
    borderTopWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  expandToggleText: {
    color: AC.accent,
    fontSize: 12,
    fontWeight: '600',
  },

  // Metadata block
  metadataBlock: {
    backgroundColor: AC.codeBg,
    borderTopColor: AC.border,
    borderTopWidth: 1,
    padding: 12,
  },
  metadataText: {
    color: AC.codeText,
    fontFamily: 'monospace',
    fontSize: 11,
    letterSpacing: 0.2,
    lineHeight: 18,
  },

  // States
  centeredState: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 32,
  },
  loadingText: {
    color: AC.textSecondary,
    fontSize: 14,
    marginTop: 12,
  },
  errorBanner: {
    backgroundColor: AC.dangerDim,
    borderColor: AC.borderDanger,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
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
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 60,
  },
  emptyTitle: {
    color: AC.textSecondary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyMessage: {
    color: AC.textMuted,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
  footerLoader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingMoreText: {
    color: AC.textSecondary,
    fontSize: 13,
  },
});

export default AuditLogsScreen;
