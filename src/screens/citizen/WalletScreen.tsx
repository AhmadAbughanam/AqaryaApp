// Ejod Smart Wallet screen.
// Shows balance, locked/pending amounts, deposit & withdrawal flows,
// and an immutable transaction ledger — per the blockchain product spec.

import React, {useCallback, useEffect, useState} from 'react';
import {formatExactTwoDecimals} from '../../utils/formatters';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {CitizenProfileStackParamList} from '../../navigation/CitizenProfileStack';
import {
  getWalletBalance,
  getTransactionHistory,
  requestDeposit,
  requestWithdrawal,
  WalletBalance,
  WalletTransaction,
  TransactionType,
} from '../../api/wallet';
import {Colors} from '../../constants/colors';
import {useStrings} from '../../i18n';

type Props = NativeStackScreenProps<CitizenProfileStackParamList, 'Wallet'>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (v: number) =>
  formatExactTwoDecimals(v);

const TX_ICON: Record<TransactionType, string> = {
  deposit:      '↓',
  withdrawal:   '↑',
  purchase:     '⌂',
  rent_payment: '⌂',
  investment:   '◆',
  dividend:     '◈',
  refund:       '↩',
};

const TX_COLOR: Record<TransactionType, string> = {
  deposit:      '#3A7D44',
  dividend:     '#3A7D44',
  refund:       '#3A7D44',
  withdrawal:   '#C0544A',
  purchase:     '#C0544A',
  rent_payment: '#C0544A',
  investment:   '#C0544A',
};

const TX_SIGN: Record<TransactionType, string> = {
  deposit:      '+',
  dividend:     '+',
  refund:       '+',
  withdrawal:   '-',
  purchase:     '-',
  rent_payment: '-',
  investment:   '-',
};

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'});
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const BalanceTile = ({label, value, accent}: {label: string; value: string; accent?: boolean}) => (
  <View style={st.balTile}>
    <Text style={st.balTileLabel}>{label}</Text>
    <Text style={[st.balTileValue, accent && st.balTileValueAccent]}>{value}</Text>
  </View>
);

// ─── Modal form ───────────────────────────────────────────────────────────────

const ActionModal = ({
  visible,
  mode,
  onClose,
  onSubmit,
  isSubmitting,
  strings,
}: {
  visible: boolean;
  mode: 'deposit' | 'withdraw';
  onClose: () => void;
  onSubmit: (amount: number, alias: string) => void;
  isSubmitting: boolean;
  strings: ReturnType<typeof useStrings>['wallet'];
}) => {
  const [amount, setAmount] = useState('');
  const [alias, setAlias] = useState('');
  const isDeposit = mode === 'deposit';

  const reset = () => { setAmount(''); setAlias(''); };

  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = () => {
    const n = parseFloat(amount);
    if (!Number.isFinite(n) || n <= 0) {
      Alert.alert(strings.invalidAmountTitle, strings.invalidAmountMsg);
      return;
    }
    if (!alias.trim()) {
      Alert.alert(
        strings.requiredTitle,
        isDeposit ? strings.depositRequiredMsg : strings.withdrawRequiredMsg,
      );
      return;
    }
    onSubmit(n, alias.trim());
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={st.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={st.modalSheet}>
          <View style={st.modalHandle} />

          <Text style={st.modalTitle}>
            {isDeposit ? strings.modalDepositTitle : strings.modalWithdrawTitle}
          </Text>
          <Text style={st.modalSub}>
            {isDeposit ? strings.modalDepositSub : strings.modalWithdrawSub}
          </Text>

          <Text style={st.inputLabel}>{strings.amountLabel}</Text>
          <TextInput
            style={st.input}
            value={amount}
            onChangeText={t => setAmount(t.replace(/[^0-9.]/g, ''))}
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor={Colors.textMuted}
          />

          <Text style={st.inputLabel}>
            {isDeposit ? strings.depositAliasLabel : strings.withdrawAliasLabel}
          </Text>
          <TextInput
            style={st.input}
            value={alias}
            onChangeText={setAlias}
            placeholder={isDeposit ? strings.depositPlaceholder : strings.withdrawPlaceholder}
            placeholderTextColor={Colors.textMuted}
            autoCapitalize="none"
          />

          <View style={st.modalActions}>
            <Pressable
              onPress={handleClose}
              style={({pressed}) => [st.modalCancelBtn, pressed && {opacity: 0.7}]}
              accessibilityRole="button">
              <Text style={st.modalCancelText}>{strings.cancelBtn}</Text>
            </Pressable>
            <Pressable
              onPress={handleSubmit}
              disabled={isSubmitting}
              style={({pressed}) => [st.modalSubmitBtn, isSubmitting && {opacity: 0.5}, pressed && {opacity: 0.8}]}
              accessibilityRole="button">
              {isSubmitting
                ? <ActivityIndicator color={Colors.white} size="small" />
                : <Text style={st.modalSubmitText}>{isDeposit ? strings.depositBtn : strings.withdrawBtn}</Text>}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ─── Screen ───────────────────────────────────────────────────────────────────

const WalletScreen = ({}: Props) => {
  const {wallet: w} = useStrings();
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [txItems, setTxItems] = useState<WalletTransaction[]>([]);
  const [txTotal, setTxTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<'deposit' | 'withdraw' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      const [bal, txRes] = await Promise.all([
        getWalletBalance(),
        getTransactionHistory(1, 20),
      ]);
      setBalance(bal);
      setTxItems(txRes.items);
      setTxTotal(txRes.total);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load wallet.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const onAction = async (amount: number, alias: string) => {
    if (!modalMode) return;
    setIsSubmitting(true);
    try {
      const ref = modalMode === 'deposit'
        ? await requestDeposit({amount, cliqAlias: alias})
        : await requestWithdrawal({amount, cliqAlias: alias});
      setModalMode(null);
      Alert.alert(
        modalMode === 'deposit' ? w.depositInitTitle : w.withdrawInitTitle,
        `Reference: ${ref.reference}\n\n${
          modalMode === 'deposit' ? w.depositInitMsg : w.withdrawInitMsg
        }`,
      );
      void load();
    } catch (e) {
      Alert.alert(w.errorTitle, e instanceof Error ? e.message : w.requestFailed);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <View style={st.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={st.screen}>
      <FlatList
        data={txItems}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => { setIsRefreshing(true); void load(); }}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
        ListHeaderComponent={
          <View>
            {/* ── Balance card ── */}
            <View style={st.balCard}>
              <Text style={st.balLabel}>{w.balLabel}</Text>
              <Text style={st.balAmount}>
                <Text style={st.balCurrency}>JOD </Text>
                {fmt(balance?.ejodBalance ?? 0)}
              </Text>
              <Text style={st.balSubtitle}>{w.balSubtitle}</Text>

              <View style={st.balTilesRow}>
                <BalanceTile
                  label={w.available}
                  value={`JOD ${fmt(balance?.availableBalance ?? 0)}`}
                  accent
                />
                <View style={st.balTileSep} />
                <BalanceTile
                  label={w.locked}
                  value={`JOD ${fmt(balance?.lockedAmount ?? 0)}`}
                />
                <View style={st.balTileSep} />
                <BalanceTile
                  label={w.pending}
                  value={`JOD ${fmt(balance?.pendingDeposits ?? 0)}`}
                />
              </View>

              {/* ── Action buttons ── */}
              <View style={st.actionRow}>
                <Pressable
                  onPress={() => setModalMode('deposit')}
                  style={({pressed}) => [st.actionBtn, pressed && {opacity: 0.8}]}
                  accessibilityRole="button"
                  accessibilityLabel={w.depositBtn}>
                  <Text style={st.actionBtnIcon}>↓</Text>
                  <Text style={st.actionBtnText}>{w.depositBtn}</Text>
                </Pressable>
                <Pressable
                  onPress={() => setModalMode('withdraw')}
                  style={({pressed}) => [st.actionBtn, st.actionBtnSecondary, pressed && {opacity: 0.8}]}
                  accessibilityRole="button"
                  accessibilityLabel={w.withdrawBtn}>
                  <Text style={[st.actionBtnIcon, st.actionBtnIconSecondary]}>↑</Text>
                  <Text style={[st.actionBtnText, st.actionBtnTextSecondary]}>{w.withdrawBtn}</Text>
                </Pressable>
              </View>
            </View>

            {/* ── Transaction history header ── */}
            <View style={st.txHeader}>
              <Text style={st.txHeaderTitle}>{w.txHistoryTitle}</Text>
              {txTotal > 0 && (
                <Text style={st.txHeaderCount}>{txTotal} {w.txRecords}</Text>
              )}
            </View>

            {error ? (
              <View style={st.errorBanner}>
                <Text style={st.errorText}>{error}</Text>
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <View style={st.emptyState}>
            <Text style={st.emptyIcon}>◈</Text>
            <Text style={st.emptyText}>{w.emptyText}</Text>
            <Text style={st.emptySub}>{w.emptySub}</Text>
          </View>
        }
        renderItem={({item}) => (
          <View style={st.txRow}>
            <View style={[st.txIconWrap, {backgroundColor: `${TX_COLOR[item.type]}18`}]}>
              <Text style={[st.txIcon, {color: TX_COLOR[item.type]}]}>
                {TX_ICON[item.type]}
              </Text>
            </View>
            <View style={st.txBody}>
              <Text style={st.txDesc} numberOfLines={1}>{item.description}</Text>
              {item.propertyTitle ? (
                <Text style={st.txProperty} numberOfLines={1}>{item.propertyTitle}</Text>
              ) : null}
              <Text style={st.txDate}>{formatDate(item.createdAt)}</Text>
            </View>
            <View style={st.txRight}>
              <Text style={[st.txAmount, {color: TX_COLOR[item.type]}]}>
                {TX_SIGN[item.type]}JOD {fmt(item.amount)}
              </Text>
              <View style={[
                st.txStatusBadge,
                item.status === 'completed' && st.txStatusCompleted,
                item.status === 'failed' && st.txStatusFailed,
              ]}>
                <Text style={[
                  st.txStatusText,
                  item.status === 'completed' && st.txStatusTextCompleted,
                  item.status === 'failed' && st.txStatusTextFailed,
                ]}>
                  {item.status}
                </Text>
              </View>
            </View>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={st.txSep} />}
        contentContainerStyle={st.listContent}
      />

      <ActionModal
        visible={modalMode !== null}
        mode={modalMode ?? 'deposit'}
        onClose={() => setModalMode(null)}
        onSubmit={onAction}
        isSubmitting={isSubmitting}
        strings={w}
      />
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const st = StyleSheet.create({
  screen:  {backgroundColor: Colors.backgroundPrimary, flex: 1},
  centered:{alignItems: 'center', flex: 1, justifyContent: 'center'},
  listContent: {paddingBottom: 32},

  // ── Balance card ────────────────────────────────────────────────────────────
  balCard: {
    backgroundColor: Colors.primary,
    margin: 16,
    borderRadius: 20,
    padding: 24,
  },
  balLabel: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  balAmount: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: 0.2,
    marginBottom: 4,
  },
  balCurrency: {
    fontSize: 20,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.70)',
  },
  balSubtitle: {
    color: 'rgba(255,255,255,0.50)',
    fontSize: 11,
    marginBottom: 20,
  },
  balTilesRow: {
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 14,
    flexDirection: 'row',
    marginBottom: 20,
    padding: 14,
  },
  balTile: {
    alignItems: 'center',
    flex: 1,
  },
  balTileLabel: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.4,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  balTileValue: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '700',
  },
  balTileValueAccent: {
    color: '#FFFFFF',
  },
  balTileSep: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    width: 1,
  },

  // ── Action buttons ──────────────────────────────────────────────────────────
  actionRow: {flexDirection: 'row', gap: 10},
  actionBtn: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 100,
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    paddingVertical: 12,
  },
  actionBtnSecondary: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  actionBtnIcon: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  actionBtnIconSecondary: {
    color: '#FFFFFF',
  },
  actionBtnText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  actionBtnTextSecondary: {
    color: '#FFFFFF',
  },

  // ── Tx header ───────────────────────────────────────────────────────────────
  txHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  txHeaderTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  txHeaderCount: {
    color: Colors.textMuted,
    fontSize: 12,
  },

  // ── Error ───────────────────────────────────────────────────────────────────
  errorBanner: {
    backgroundColor: Colors.errorLight,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
  },
  errorText: {color: Colors.error, fontSize: 13},

  // ── Empty state ─────────────────────────────────────────────────────────────
  emptyState: {alignItems: 'center', paddingVertical: 40},
  emptyIcon:  {color: Colors.textMuted, fontSize: 32, marginBottom: 10},
  emptyText:  {color: Colors.textPrimary, fontSize: 15, fontWeight: '600', marginBottom: 4},
  emptySub:   {color: Colors.textMuted, fontSize: 13},

  // ── Transaction rows ────────────────────────────────────────────────────────
  txRow: {
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  txIconWrap: {
    alignItems: 'center',
    borderRadius: 100,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  txIcon: {fontSize: 18, fontWeight: '700'},
  txBody: {flex: 1},
  txDesc: {color: Colors.textPrimary, fontSize: 14, fontWeight: '600', marginBottom: 2},
  txProperty: {color: Colors.textMuted, fontSize: 12, marginBottom: 2},
  txDate: {color: Colors.textMuted, fontSize: 11},
  txRight: {alignItems: 'flex-end', gap: 4},
  txAmount: {fontSize: 14, fontWeight: '700'},
  txStatusBadge: {
    backgroundColor: Colors.backgroundMuted,
    borderRadius: 100,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  txStatusCompleted: {backgroundColor: Colors.successLight},
  txStatusFailed:    {backgroundColor: Colors.errorLight},
  txStatusText: {color: Colors.textMuted, fontSize: 10, fontWeight: '600', textTransform: 'capitalize'},
  txStatusTextCompleted: {color: Colors.success},
  txStatusTextFailed:    {color: Colors.error},
  txSep: {backgroundColor: Colors.border, height: 1, marginLeft: 70},

  // ── Modal ───────────────────────────────────────────────────────────────────
  modalOverlay: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.backgroundSecondary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 36,
  },
  modalHandle: {
    alignSelf: 'center',
    backgroundColor: Colors.border,
    borderRadius: 100,
    height: 4,
    marginBottom: 20,
    width: 40,
  },
  modalTitle: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 6,
  },
  modalSub: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 20,
  },
  inputLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: Colors.backgroundMuted,
    borderColor: Colors.border,
    borderRadius: 12,
    borderWidth: 1,
    color: Colors.textPrimary,
    fontSize: 15,
    marginBottom: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  modalActions: {flexDirection: 'row', gap: 10, marginTop: 4},
  modalCancelBtn: {
    alignItems: 'center',
    backgroundColor: Colors.backgroundMuted,
    borderRadius: 100,
    flex: 1,
    paddingVertical: 14,
  },
  modalCancelText: {color: Colors.textPrimary, fontSize: 15, fontWeight: '600'},
  modalSubmitBtn: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 100,
    flex: 2,
    paddingVertical: 14,
  },
  modalSubmitText: {color: Colors.white, fontSize: 15, fontWeight: '700'},
});

export default WalletScreen;
