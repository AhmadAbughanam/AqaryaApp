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
import {
  AccountType,
  AdminUser,
  ProviderVerificationStatus,
  getAdminUsers,
} from '../../api/admin';
import StatusBadge from '../../components/StatusBadge';
import {AdminStackParamList} from '../../navigation/AdminStack';
import {formatDateTime} from '../../utils/formatters';
import {AC} from '../../constants/adminColors';
import {useStrings} from '../../i18n';

type Props = NativeStackScreenProps<AdminStackParamList, 'UserManagement'>;

type AccountTypeFilter = AccountType | 'all';
type ProviderStatusFilter = ProviderVerificationStatus | 'all';

const ACCOUNT_TYPE_FILTERS: AccountTypeFilter[] = [
  'all', 'individual', 'owner', 'agency', 'developer', 'partner',
];

const PROVIDER_STATUS_FILTERS: ProviderStatusFilter[] = [
  'all', 'unverified', 'under_review', 'verified', 'rejected', 'suspended',
];

const PROVIDER_STATUS_COLOR: Partial<Record<ProviderStatusFilter, string>> = {
  under_review: AC.warning,
  verified: AC.success,
  rejected: AC.danger,
  suspended: AC.danger,
  unverified: AC.textMuted,
};

const UserManagementScreen = ({navigation}: Props) => {
  const strings = useStrings();
  const um = strings.admin.userManagement;
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [accountTypeFilter, setAccountTypeFilter] = useState<AccountTypeFilter>('all');
  const [providerStatusFilter, setProviderStatusFilter] = useState<ProviderStatusFilter>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      const accountType = accountTypeFilter !== 'all' ? accountTypeFilter : undefined;
      const providerStatus = providerStatusFilter !== 'all' ? providerStatusFilter : undefined;
      const response = await getAdminUsers(accountType, providerStatus);
      setUsers(response);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : um.errorLoad);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [accountTypeFilter, providerStatusFilter, um]);

  useEffect(() => {
    setIsLoading(true);
    void fetchUsers();
  }, [fetchUsers]);

  if (isLoading) {
    return (
      <View style={styles.centeredState}>
        <ActivityIndicator size="large" color={AC.accent} />
        <Text style={styles.loadingText}>{um.loadingText}</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      data={users}
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
            void fetchUsers();
          }}
        />
      }
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.title}>{um.title}</Text>
          <Text style={styles.subtitle}>{um.subtitle}</Text>

          <Text style={styles.filterLabel}>{um.filterTypeLabel}</Text>
          <View style={styles.filterRow}>
            {ACCOUNT_TYPE_FILTERS.map(filter => {
              const isActive = filter === accountTypeFilter;
              return (
                <Pressable
                  key={filter}
                  onPress={() => setAccountTypeFilter(filter)}
                  style={[
                    styles.filterChip,
                    isActive && styles.filterChipActive,
                  ]}>
                  <Text
                    style={[
                      styles.filterChipText,
                      isActive && styles.filterChipTextActive,
                    ]}>
                    {filter === 'all' ? um.filterAll : strings.admin.accountTypes[filter]}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.filterLabel}>{um.filterStatusLabel}</Text>
          <View style={styles.filterRow}>
            {PROVIDER_STATUS_FILTERS.map(filter => {
              const isActive = filter === providerStatusFilter;
              const accentColor = PROVIDER_STATUS_COLOR[filter] ?? AC.accent;
              return (
                <Pressable
                  key={filter}
                  onPress={() => setProviderStatusFilter(filter)}
                  style={[
                    styles.filterChip,
                    isActive && {
                      backgroundColor: accentColor + '20',
                      borderColor: accentColor + '55',
                    },
                  ]}>
                  {isActive && (
                    <View style={[styles.filterDot, {backgroundColor: accentColor}]} />
                  )}
                  <Text
                    style={[
                      styles.filterChipText,
                      isActive && {color: accentColor},
                    ]}>
                    {filter === 'all' ? um.filterAll : strings.admin.providerStatuses[filter]}
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

          {users.length > 0 ? (
            <Text style={styles.countText}>
              {users.length}{' '}
              {users.length !== 1 ? um.userCountPlural : um.userCount}
            </Text>
          ) : null}
        </View>
      }
      renderItem={({item}) => {
        const provStatus = item.providerProfile?.providerVerificationStatus;
        const statusColor = provStatus
          ? (PROVIDER_STATUS_COLOR[provStatus] ?? AC.textMuted)
          : AC.textMuted;

        return (
          <Pressable
            onPress={() => navigation.navigate('AdminUserDetail', {id: item.id})}
            style={({pressed}) => [styles.card, pressed && styles.cardPressed]}>
            <View style={[styles.cardAccentBar, {backgroundColor: statusColor}]} />
            <View style={styles.cardInner}>
              <View style={styles.cardTopRow}>
                <View style={styles.cardCopy}>
                  <Text style={styles.cardUsername}>{item.username}</Text>
                  <Text style={styles.cardRole}>
                    {item.role}
                    {item.providerProfile ? ` · ${item.providerProfile.accountType}` : ''}
                  </Text>
                </View>
                {item.providerProfile ? (
                  <StatusBadge status={item.providerProfile.providerVerificationStatus} />
                ) : (
                  <View style={styles.noProfileBadge}>
                    <Text style={styles.noProfileText}>{um.noProfile}</Text>
                  </View>
                )}
              </View>

              {item.providerProfile?.businessName ? (
                <Text style={styles.businessName}>{item.providerProfile.businessName}</Text>
              ) : null}

              <View style={styles.statsRow}>
                <View style={styles.statChip}>
                  <Text style={styles.statChipNum}>{item.counts.properties}</Text>
                  <Text style={styles.statChipLabel}>{um.statProps}</Text>
                </View>
                <View style={styles.statChip}>
                  <Text style={styles.statChipNum}>{item.counts.simulations}</Text>
                  <Text style={styles.statChipLabel}>{um.statInvest}</Text>
                </View>
                <View style={styles.statChip}>
                  <Text style={styles.statChipNum}>{item.counts.threads}</Text>
                  <Text style={styles.statChipLabel}>{um.statThreads}</Text>
                </View>
                <Text style={styles.joinedText}>
                  {um.joinedPrefix}{formatDateTime(item.createdAt)}
                </Text>
              </View>
            </View>
          </Pressable>
        );
      }}
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>{um.emptyTitle}</Text>
          <Text style={styles.emptyText}>{um.emptyText}</Text>
        </View>
      }
    />
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
    marginBottom: 14,
  },
  filterLabel: {
    color: AC.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.1,
    marginBottom: 8,
    marginTop: 8,
    textTransform: 'uppercase',
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  filterChip: {
    alignItems: 'center',
    backgroundColor: AC.surface,
    borderColor: AC.border,
    borderRadius: 100,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  filterChipActive: {
    backgroundColor: AC.accentDim,
    borderColor: AC.borderAccent,
  },
  filterDot: {
    borderRadius: 3,
    height: 6,
    width: 6,
  },
  filterChipText: {
    color: AC.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  filterChipTextActive: {
    color: AC.accent,
  },
  countText: {
    color: AC.textMuted,
    fontSize: 12,
    marginTop: 8,
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
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  cardCopy: {
    flex: 1,
  },
  cardUsername: {
    color: AC.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  cardRole: {
    color: AC.textSecondary,
    fontSize: 12,
    marginTop: 3,
    textTransform: 'capitalize',
  },
  noProfileBadge: {
    backgroundColor: AC.surfaceMid,
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  noProfileText: {
    color: AC.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  businessName: {
    color: AC.textSecondary,
    fontSize: 13,
    marginTop: 8,
  },
  statsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  statChip: {
    alignItems: 'center',
    backgroundColor: AC.surfaceMid,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statChipNum: {
    color: AC.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  statChipLabel: {
    color: AC.textMuted,
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  joinedText: {
    color: AC.textMuted,
    flex: 1,
    fontSize: 11,
    textAlign: 'right',
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

export default UserManagementScreen;
