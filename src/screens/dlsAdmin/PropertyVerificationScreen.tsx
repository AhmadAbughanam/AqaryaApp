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
  AdminProperty,
  anchorProperty,
  freezeProperty,
  getAdminProperties,
  verifyProperty,
} from '../../api/admin';
import ConfirmationModal from '../../components/ConfirmationModal';
import StatusBadge from '../../components/StatusBadge';
import {AdminStackParamList} from '../../navigation/AdminStack';
import {VerificationStatus} from '../../api/properties';
import {formatDateTime} from '../../utils/formatters';
import {AC} from '../../constants/adminColors';
import {useStrings} from '../../i18n';

type Props = NativeStackScreenProps<AdminStackParamList, 'PropertyVerification'>;
type AdminAction = 'verify' | 'freeze' | 'anchor';
type StatusFilter = VerificationStatus | 'all';

interface PendingActionState {
  action: AdminAction;
  property: AdminProperty;
}

const STATUS_FILTERS: StatusFilter[] = [
  'all',
  'pending_verification',
  'needs_changes',
  'verified',
  'rejected',
  'frozen',
  'sold',
];

const STATUS_ACCENT: Partial<Record<StatusFilter, string>> = {
  pending_verification: AC.warning,
  needs_changes: AC.cyan,
  verified: AC.success,
  rejected: AC.danger,
  frozen: AC.textMuted,
  sold: AC.accent,
};

const PropertyVerificationScreen = ({navigation}: Props) => {
  const strings = useStrings();
  const pv = strings.admin.propertyVerification;
  const [properties, setProperties] = useState<AdminProperty[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingActionState | null>(null);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  const fetchProperties = useCallback(async () => {
    try {
      const response = await getAdminProperties(statusFilter);
      setProperties(response);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : pv.errorLoad,
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [statusFilter, pv.errorLoad]);

  useEffect(() => {
    void fetchProperties();
  }, [fetchProperties]);

  const modalConfig = useMemo(() => {
    if (!pendingAction) return null;
    if (pendingAction.action === 'verify') {
      return {
        title: pv.confirmVerifyTitle,
        message: pv.confirmVerifyMsg,
        confirmLabel: pv.actionVerify,
        confirmVariant: 'primary' as const,
      };
    }
    if (pendingAction.action === 'freeze') {
      return {
        title: pv.confirmFreezeTitle,
        message: pv.confirmFreezeMsg,
        confirmLabel: pv.actionFreeze,
        confirmVariant: 'danger' as const,
      };
    }
    return {
      title: pv.confirmAnchorTitle,
      message: pv.confirmAnchorMsg,
      confirmLabel: pv.actionAnchor,
      confirmVariant: 'neutral' as const,
    };
  }, [pendingAction, pv]);

  const executeAction = useCallback(async () => {
    if (!pendingAction) return;
    setIsSubmittingAction(true);
    try {
      if (pendingAction.action === 'verify') {
        await verifyProperty(pendingAction.property.id);
      } else if (pendingAction.action === 'freeze') {
        await freezeProperty(pendingAction.property.id);
      } else {
        await anchorProperty(pendingAction.property.id);
      }
      setPendingAction(null);
      await fetchProperties();
      Alert.alert(pv.alertDone, `${pendingAction.action} action completed.`);
    } catch (error) {
      Alert.alert(
        pv.alertActionFailed,
        error instanceof Error ? error.message : pv.alertActionError,
      );
    } finally {
      setIsSubmittingAction(false);
    }
  }, [fetchProperties, pendingAction, pv]);

  if (isLoading) {
    return (
      <View style={styles.centeredState}>
        <ActivityIndicator size="large" color={AC.accent} />
        <Text style={styles.loadingText}>{pv.loadingText}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={properties}
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
              void fetchProperties();
            }}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>{pv.title}</Text>
            <Text style={styles.subtitle}>{pv.subtitle}</Text>

            {/* Filter chips */}
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
                      {filter === 'all' ? pv.filterAll : filter.replace(/_/g, ' ')}
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

            {properties.length > 0 ? (
              <Text style={styles.countText}>
                {properties.length}{' '}
                {properties.length !== 1 ? pv.listingCountPlural : pv.listingCount}
              </Text>
            ) : null}
          </View>
        }
        renderItem={({item}) => {
          const canAnchor =
            item.verificationStatus === 'verified' && !item.blockchainTransactionId;
          const accentColor = STATUS_ACCENT[item.verificationStatus as StatusFilter] ?? AC.textMuted;

          return (
            <Pressable
              onPress={() => navigation.navigate('AdminPropertyDetail', {id: item.id})}
              style={({pressed}) => [styles.card, pressed && styles.cardPressed]}>
              <View style={[styles.cardAccentBar, {backgroundColor: accentColor}]} />
              <View style={styles.cardInner}>
                <View style={styles.cardTopRow}>
                  <View style={styles.cardCopy}>
                    <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.cardSubtitle} numberOfLines={1}>{item.location}</Text>
                  </View>
                  <StatusBadge status={item.verificationStatus} />
                </View>

                <View style={styles.metaRow}>
                  <Text style={styles.metaChip}>{pv.labelSeller}: {item.ownerName}</Text>
                  <Text style={styles.metaSep}>·</Text>
                  <Text style={styles.metaChip}>{formatDateTime(item.submissionDate)}</Text>
                </View>

                <View style={styles.actionsRow}>
                  <Pressable
                    onPress={() => navigation.navigate('AdminPropertyDetail', {id: item.id})}
                    style={styles.actionBtn}>
                    <Text style={styles.actionBtnText}>{pv.actionView}</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setPendingAction({action: 'verify', property: item})}
                    style={[styles.actionBtn, styles.actionBtnAccent]}>
                    <Text style={[styles.actionBtnText, {color: AC.accent}]}>{pv.actionVerify}</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setPendingAction({action: 'freeze', property: item})}
                    style={[styles.actionBtn, styles.actionBtnDanger]}>
                    <Text style={[styles.actionBtnText, {color: AC.danger}]}>{pv.actionFreeze}</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setPendingAction({action: 'anchor', property: item})}
                    disabled={!canAnchor}
                    style={[styles.actionBtn, !canAnchor && styles.actionBtnDisabled]}>
                    <Text style={[styles.actionBtnText, !canAnchor && {color: AC.textMuted}]}>
                      {pv.actionAnchor}
                    </Text>
                  </Pressable>
                </View>
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>{pv.emptyTitle}</Text>
            <Text style={styles.emptyText}>{pv.emptyText}</Text>
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
          loading={isSubmittingAction}
          onConfirm={() => void executeAction()}
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
    fontWeight: '500',
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
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    marginTop: 10,
  },
  metaChip: {
    color: AC.textMuted,
    fontSize: 12,
  },
  metaSep: {
    color: AC.textMuted,
    fontSize: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  actionBtn: {
    backgroundColor: AC.surfaceMid,
    borderColor: AC.border,
    borderRadius: 8,
    borderWidth: 1,
    flexBasis: '22%',
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: 7,
  },
  actionBtnAccent: {
    backgroundColor: AC.accentDim,
    borderColor: AC.borderAccent,
  },
  actionBtnDanger: {
    backgroundColor: AC.dangerDim,
    borderColor: AC.borderDanger,
  },
  actionBtnDisabled: {
    opacity: 0.4,
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

export default PropertyVerificationScreen;
