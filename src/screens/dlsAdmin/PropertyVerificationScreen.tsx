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
import Button from '../../components/Button';
import Card from '../../components/Card';
import ConfirmationModal from '../../components/ConfirmationModal';
import StatusBadge from '../../components/StatusBadge';
import {AdminStackParamList} from '../../navigation/AdminStack';
import {VerificationStatus} from '../../api/properties';
import {formatDateTime} from '../../utils/formatters';
import {Colors} from '../../constants/colors';

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
  'verified',
  'rejected',
  'frozen',
  'sold',
];

const PropertyVerificationScreen = ({navigation}: Props) => {
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
        error instanceof Error ? error.message : 'Unable to load sale listings.',
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    void fetchProperties();
  }, [fetchProperties]);

  const modalConfig = useMemo(() => {
    if (!pendingAction) {
      return null;
    }

    if (pendingAction.action === 'verify') {
      return {
        title: 'Verify listing?',
        message: 'This approves the listing and makes it public in for-sale surfaces.',
        confirmLabel: 'Verify',
        confirmVariant: 'primary' as const,
      };
    }

    if (pendingAction.action === 'freeze') {
      return {
        title: 'Freeze listing?',
        message: 'This removes the listing from active citizen visibility while preserving its record.',
        confirmLabel: 'Freeze',
        confirmVariant: 'danger' as const,
      };
    }

    return {
      title: 'Anchor blockchain proof?',
      message: 'This records the property verification on the configured blockchain adapter.',
      confirmLabel: 'Anchor',
      confirmVariant: 'neutral' as const,
    };
  }, [pendingAction]);

  const executeAction = useCallback(async () => {
    if (!pendingAction) {
      return;
    }

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
      Alert.alert('Success', `Listing ${pendingAction.action} action completed.`);
    } catch (error) {
      Alert.alert(
        'Action Failed',
        error instanceof Error ? error.message : 'Unable to complete selected action.',
      );
    } finally {
      setIsSubmittingAction(false);
    }
  }, [fetchProperties, pendingAction]);

  if (isLoading) {
    return (
      <View style={styles.centeredState}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading sale listings…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
              void fetchProperties();
            }}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Admin Sale Listing Review</Text>
            <Text style={styles.subtitle}>
              Verification, audit, and analyst-style monitoring are unified in this admin area.
            </Text>

            <View style={styles.sectionActions}>
              <Button
                label="Audit Logs"
                onPress={() => navigation.navigate('AuditLogs')}
                variant="secondary"
                size="sm"
                style={styles.sectionActionButton}
              />
              <Button
                label="Analytics"
                onPress={() => navigation.navigate('Analytics')}
                variant="secondary"
                size="sm"
                style={styles.sectionActionButton}
              />
            </View>

            <View style={styles.filterRow}>
              {STATUS_FILTERS.map(filter => {
                const isActive = filter === statusFilter;
                return (
                  <Pressable
                    key={filter}
                    onPress={() => setStatusFilter(filter)}
                    style={[styles.filterChip, isActive && styles.filterChipActive]}>
                    <Text
                      style={[
                        styles.filterChipText,
                        isActive && styles.filterChipTextActive,
                      ]}>
                      {filter === 'all' ? 'All' : filter.replace('_', ' ')}
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
          </View>
        }
        renderItem={({item}) => {
          const canAnchor =
            item.verificationStatus === 'verified' && !item.blockchainTransactionId;

          return (
            <Pressable
              onPress={() => navigation.navigate('AdminPropertyDetail', {id: item.id})}>
              <Card variant="default" padding="md" style={styles.card}>
                <View style={styles.cardTopRow}>
                  <View style={styles.cardCopy}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text style={styles.cardSubtitle}>{item.location}</Text>
                  </View>
                  <StatusBadge status={item.verificationStatus} />
                </View>
                <Text style={styles.cardMeta}>Seller {item.ownerName}</Text>
                <Text style={styles.cardMeta}>
                  Submitted {formatDateTime(item.submissionDate)}
                </Text>
                <Text style={styles.cardMeta}>
                  Property verification {item.propertyVerificationStatus} | Identity {item.identityVerificationStatus}
                </Text>
                <Text style={styles.cardMeta}>
                  Verification record {item.verificationRecordId ?? 'Pending'}
                </Text>
                <View style={styles.actionsRow}>
                  <Button
                    label="View"
                    onPress={() => navigation.navigate('AdminPropertyDetail', {id: item.id})}
                    variant="secondary"
                    size="sm"
                    style={styles.actionButton}
                  />
                  <Button
                    label="Verify"
                    onPress={() => setPendingAction({action: 'verify', property: item})}
                    variant="primary"
                    size="sm"
                    style={styles.actionButton}
                  />
                  <Button
                    label="Freeze"
                    onPress={() => setPendingAction({action: 'freeze', property: item})}
                    variant="danger"
                    size="sm"
                    style={styles.actionButton}
                  />
                  <Button
                    label="Anchor"
                    onPress={() => setPendingAction({action: 'anchor', property: item})}
                    variant="secondary"
                    size="sm"
                    style={styles.actionButton}
                    disabled={!canAnchor}
                  />
                </View>
              </Card>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No listings in this state</Text>
            <Text style={styles.emptyText}>
              Change the filter or wait for more citizen sale submissions.
            </Text>
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
    backgroundColor: Colors.backgroundPrimary,
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  centeredState: {
    alignItems: 'center',
    backgroundColor: Colors.backgroundPrimary,
    flex: 1,
    justifyContent: 'center',
  },
  loadingText: {
    color: Colors.textSecondary,
    marginTop: 12,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 24,
    fontWeight: '800',
  },
  subtitle: {
    color: Colors.textSecondary,
    marginTop: 4,
    marginBottom: 16,
  },
  sectionActions: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  sectionActionButton: {
    flex: 1,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    backgroundColor: Colors.backgroundMuted,
    borderColor: Colors.border,
    borderRadius: 100,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  filterChipActive: {
    backgroundColor: Colors.primaryDark,
    borderColor: Colors.primaryDark,
  },
  filterChipText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  filterChipTextActive: {
    color: Colors.textOnDark,
  },
  errorBanner: {
    backgroundColor: Colors.errorLight,
    borderRadius: 12,
    marginTop: 12,
    padding: 12,
  },
  errorBannerText: {
    color: Colors.error,
  },
  card: {
    marginBottom: 12,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardCopy: {
    flex: 1,
  },
  cardTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  cardSubtitle: {
    color: Colors.textSecondary,
    marginTop: 4,
  },
  cardMeta: {
    color: Colors.textSecondary,
    marginTop: 10,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
  },
  actionButton: {
    flexBasis: '48%',
    flexGrow: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 64,
  },
  emptyTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyText: {
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});

export default PropertyVerificationScreen;
