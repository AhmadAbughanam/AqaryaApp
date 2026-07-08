import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {
  AdminInvestmentOpportunity,
  InvestmentOpportunityStatus,
  getAdminInvestmentOpportunities,
  reviewInvestmentOpportunity,
} from '../../api/admin';
import ConfirmationModal from '../../components/ConfirmationModal';
import StatusBadge from '../../components/StatusBadge';
import {AdminStackParamList} from '../../navigation/AdminStack';
import {formatDateTime} from '../../utils/formatters';
import {AC} from '../../constants/adminColors';
import {useStrings} from '../../i18n';
import { formatCurrency } from '../../utils/formatters';

type Props = NativeStackScreenProps<AdminStackParamList, 'InvestmentReview'>;
type QuickAction = 'approve' | 'publish';
type StatusFilter = InvestmentOpportunityStatus | 'all';

interface PendingQuickAction {
  action: QuickAction;
  opportunity: AdminInvestmentOpportunity;
}

const STATUS_FILTERS: StatusFilter[] = [
  'all',
  'submitted',
  'under_review',
  'approved',
  'published',
  'rejected',
];

const STATUS_ACCENT: Partial<Record<StatusFilter, string>> = {
  submitted: AC.warning,
  under_review: AC.cyan,
  approved: AC.success,
  published: AC.accent,
  rejected: AC.danger,
};


const InvestmentReviewScreen = ({navigation}: Props) => {
  const strings = useStrings();
  const ir = strings.admin.investmentReview;
  const [opportunities, setOpportunities] = useState<AdminInvestmentOpportunity[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingQuickAction | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchOpportunities = useCallback(async () => {
    try {
      const response = await getAdminInvestmentOpportunities(statusFilter);
      setOpportunities(response);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : ir.errorLoad,
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [ir, statusFilter]);

  useEffect(() => {
    void fetchOpportunities();
  }, [fetchOpportunities]);

  const modalConfig = useMemo(() => {
    if (!pendingAction) return null;
    if (pendingAction.action === 'approve') {
      return {
        title: ir.confirmApproveTitle,
        message: ir.confirmApproveMsg,
        confirmLabel: ir.actionApprove,
        confirmVariant: 'primary' as const,
      };
    }
    return {
      title: ir.confirmPublishTitle,
      message: ir.confirmPublishMsg,
      confirmLabel: ir.actionPublish,
      confirmVariant: 'primary' as const,
    };
  }, [ir, pendingAction]);

  const executeQuickAction = useCallback(async () => {
    if (!pendingAction) return;
    setIsSubmitting(true);
    try {
      await reviewInvestmentOpportunity(pendingAction.opportunity.id, pendingAction.action);
      setPendingAction(null);
      await fetchOpportunities();
      Alert.alert(ir.alertDone, ir.alertActionCompleted);
    } catch (error) {
      Alert.alert(
        ir.alertActionFailed,
        error instanceof Error ? error.message : ir.alertActionError,
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [fetchOpportunities, ir, pendingAction]);

  if (isLoading) {
    return (
      <View style={styles.centeredState}>
        <ActivityIndicator size="large" color={AC.accent} />
        <Text style={styles.loadingText}>{ir.loadingText}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={opportunities}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            tintColor={AC.accent}
            colors={[AC.accent]}
            onRefresh={() => {
              setIsRefreshing(true);
              void fetchOpportunities();
            }}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>{ir.title}</Text>
            <Text style={styles.subtitle}>{ir.subtitle}</Text>

            <View style={styles.filterRow}>
              {STATUS_FILTERS.map(filter => {
                const isActive = filter === statusFilter;
                const accentColor = STATUS_ACCENT[filter] ?? AC.accent;
                return (
                  <Pressable
                    key={filter}
                    onPress={() => setStatusFilter(filter)}
                    style={[
                      styles.filterChip,
                      isActive && {
                        backgroundColor: accentColor + '20',
                        borderColor: accentColor + '60',
                      },
                    ]}>
                    {isActive && (
                      <View style={[styles.filterChipDot, {backgroundColor: accentColor}]} />
                    )}
                    <Text
                      style={[
                        styles.filterChipText,
                        isActive && {color: accentColor},
                      ]}>
                      {filter === 'all' ? ir.filterAll : filter.replace(/_/g, ' ')}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {errorMessage ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{errorMessage}</Text>
              </View>
            ) : null}

            {opportunities.length > 0 ? (
              <Text style={styles.countText}>
                {opportunities.length}{' '}
                {opportunities.length !== 1 ? ir.opportunityCountPlural : ir.opportunityCount}
              </Text>
            ) : null}
          </View>
        }
        renderItem={({item}) => {
          const canApprove = item.status === 'submitted' || item.status === 'under_review';
          const canPublish = item.status === 'approved';
          const accentColor = STATUS_ACCENT[item.status as StatusFilter] ?? AC.textMuted;

          return (
            <Pressable
              onPress={() => navigation.navigate('AdminInvestmentDetail', {id: item.id})}
              style={({pressed}) => [styles.card, pressed && styles.cardPressed]}>
              <View style={[styles.cardAccentBar, {backgroundColor: accentColor}]} />
              <View style={styles.cardInner}>
                <View style={styles.cardTopRow}>
                  <View style={styles.cardCopy}>
                    <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.cardSubtitle} numberOfLines={1}>{item.location}</Text>
                  </View>
                  <StatusBadge status={item.status} />
                </View>

                <View style={styles.financialsRow}>
                  <View style={styles.financialChip}>
                    <Text style={styles.financialChipLabel}>{ir.labelIRR}</Text>
                    <Text style={[styles.financialChipValue, {color: AC.success}]}>
                      {item.targetIrr}%
                    </Text>
                  </View>
                  <View style={styles.financialChip}>
                    <Text style={styles.financialChipLabel}>{ir.labelPerShare}</Text>
                    <Text style={styles.financialChipValue}>
                      {formatCurrency(item.pricePerShare)}
                    </Text>
                  </View>
                  <View style={styles.financialChip}>
                    <Text style={styles.financialChipLabel}>{ir.labelRisk}</Text>
                    <Text style={[styles.financialChipValue, {color: AC.warning}]}>
                      {item.riskBand}
                    </Text>
                  </View>
                </View>

                <View style={styles.metaRow}>
                  <Text style={styles.metaChip}>{item.sponsorName}</Text>
                  <Text style={styles.metaSep}>·</Text>
                  <Text style={styles.metaChip}>{item.assetClass}</Text>
                  <Text style={styles.metaSep}>·</Text>
                  <Text style={styles.metaChip}>{formatDateTime(item.createdAt)}</Text>
                </View>

                <View style={styles.actionsRow}>
                  <Pressable
                    onPress={() => navigation.navigate('AdminInvestmentDetail', {id: item.id})}
                    style={styles.actionBtn}>
                    <Text style={styles.actionBtnText}>{ir.actionView}</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setPendingAction({action: 'approve', opportunity: item})}
                    disabled={!canApprove}
                    style={[
                      styles.actionBtn,
                      styles.actionBtnAccent,
                      !canApprove && styles.actionBtnDisabled,
                    ]}>
                    <Text style={[styles.actionBtnText, {color: AC.accent}]}>{ir.actionApprove}</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setPendingAction({action: 'publish', opportunity: item})}
                    disabled={!canPublish}
                    style={[
                      styles.actionBtn,
                      styles.actionBtnSuccess,
                      !canPublish && styles.actionBtnDisabled,
                    ]}>
                    <Text style={[styles.actionBtnText, {color: AC.success}]}>{ir.actionPublish}</Text>
                  </Pressable>
                </View>
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>{ir.emptyTitle}</Text>
            <Text style={styles.emptyText}>{ir.emptyText}</Text>
          </View>
        }
      />

      {modalConfig && pendingAction ? (
        <ConfirmationModal
          visible
          title={modalConfig.title}
          message={modalConfig.message}
          confirmLabel={modalConfig.confirmLabel}
          confirmVariant={modalConfig.confirmVariant}
          loading={isSubmitting}
          onConfirm={() => void executeQuickAction()}
          onCancel={() => setPendingAction(null)}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: AC.bg,
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  centeredState: {
    alignItems: 'center',
    backgroundColor: AC.bg,
    flex: 1,
    justifyContent: 'center',
  },
  loadingText: {
    color: AC.textSecondary,
    marginTop: 12,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    color: AC.textPrimary,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  subtitle: {
    color: AC.textSecondary,
    fontSize: 13,
    marginTop: 4,
    marginBottom: 16,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  filterChip: {
    alignItems: 'center',
    backgroundColor: AC.surface,
    borderColor: AC.border,
    borderRadius: 100,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  filterChipDot: {
    borderRadius: 4,
    height: 6,
    width: 6,
  },
  filterChipText: {
    color: AC.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  countText: {
    color: AC.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  errorBanner: {
    backgroundColor: AC.dangerDim,
    borderColor: AC.borderDanger,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 10,
    padding: 12,
  },
  errorBannerText: {
    color: AC.danger,
    fontSize: 13,
  },
  card: {
    backgroundColor: AC.surface,
    borderColor: AC.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: 10,
    overflow: 'hidden',
  },
  cardPressed: {
    backgroundColor: AC.surfaceMid,
  },
  cardAccentBar: {
    width: 3,
  },
  cardInner: {
    flex: 1,
    padding: 14,
  },
  cardTopRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  cardCopy: {
    flex: 1,
  },
  cardTitle: {
    color: AC.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  cardSubtitle: {
    color: AC.textSecondary,
    fontSize: 12,
    marginTop: 3,
  },
  financialsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  financialChip: {
    alignItems: 'center',
    backgroundColor: AC.surfaceMid,
    borderRadius: 8,
    flex: 1,
    paddingVertical: 8,
  },
  financialChipLabel: {
    color: AC.textMuted,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  financialChipValue: {
    color: AC.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 10,
  },
  metaChip: {
    color: AC.textMuted,
    fontSize: 11,
  },
  metaSep: {
    color: AC.textMuted,
    fontSize: 11,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  actionBtn: {
    alignItems: 'center',
    backgroundColor: AC.surfaceMid,
    borderColor: AC.border,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 7,
  },
  actionBtnAccent: {
    backgroundColor: AC.accentDim,
    borderColor: AC.borderAccent,
  },
  actionBtnSuccess: {
    backgroundColor: AC.successDim,
    borderColor: AC.borderSuccess,
  },
  actionBtnDisabled: {
    opacity: 0.35,
  },
  actionBtnText: {
    color: AC.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 64,
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

export default InvestmentReviewScreen;
