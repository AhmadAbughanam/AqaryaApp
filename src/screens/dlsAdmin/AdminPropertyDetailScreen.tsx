import { formatCurrency } from '../../utils/formatters';
import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import StatusBadge from '../../components/StatusBadge';
import Button from '../../components/Button';
import {
  AdminPropertyDetail,
  anchorProperty,
  freezeProperty,
  getAdminPropertyDetails,
  rejectProperty,
  requestPropertyChanges,
  verifyProperty,
} from '../../api/admin';
import {AdminStackParamList} from '../../navigation/AdminStack';
import {formatDateTime} from '../../utils/formatters';
import {AC} from '../../constants/adminColors';
import {useStrings} from '../../i18n';

type Props = NativeStackScreenProps<AdminStackParamList, 'AdminPropertyDetail'>;



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

type ReviewAction = 'verify' | 'reject' | 'request_changes' | 'freeze' | 'anchor';

const AdminPropertyDetailScreen = ({route, navigation}: Props) => {
  const strings = useStrings();
  const pd = strings.admin.propertyDetail;
  const [property, setProperty] = useState<AdminPropertyDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<ReviewAction | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchDetails = useCallback(async () => {
    try {
      const response = await getAdminPropertyDetails(route.params.id);
      setProperty(response);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : pd.errorLoad);
    } finally {
      setIsLoading(false);
    }
  }, [pd, route.params.id]);

  useEffect(() => {
    void fetchDetails();
  }, [fetchDetails]);

  const submitAction = useCallback(async () => {
    if (!activeAction || !property) return;
    if ((activeAction === 'reject' || activeAction === 'request_changes') && !actionNotes.trim()) {
      Alert.alert(pd.alertNotesRequiredTitle, pd.alertNotesRequiredMsg);
      return;
    }

    setIsSubmitting(true);
    try {
      if (activeAction === 'verify') {
        await verifyProperty(property.id);
      } else if (activeAction === 'reject') {
        await rejectProperty(property.id, actionNotes.trim());
      } else if (activeAction === 'request_changes') {
        await requestPropertyChanges(property.id, actionNotes.trim());
      } else if (activeAction === 'freeze') {
        await freezeProperty(property.id);
      } else {
        await anchorProperty(property.id);
      }
      setActiveAction(null);
      setActionNotes('');
      await fetchDetails();
      Alert.alert(pd.alertDone, pd.alertActionCompleted);
    } catch (error) {
      Alert.alert(
        pd.alertActionFailed,
        error instanceof Error ? error.message : pd.alertActionError,
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [activeAction, actionNotes, fetchDetails, pd, property]);

  if (isLoading) {
    return (
      <View style={styles.centeredState}>
        <ActivityIndicator size="large" color={AC.accent} />
        <Text style={styles.loadingText}>{pd.loadingText}</Text>
      </View>
    );
  }

  if (!property) {
    return (
      <View style={styles.centeredState}>
        <Text style={styles.errorTitle}>{pd.errorUnavailable}</Text>
        <Text style={styles.errorText}>{errorMessage ?? pd.errorTryAgain}</Text>
      </View>
    );
  }

  const status = property.verificationStatus;
  const canVerify = !['verified', 'sold'].includes(status);
  const canReject = status !== 'sold';
  const canRequestChanges = status !== 'sold';
  const canFreeze = !['frozen', 'sold'].includes(status);
  const canAnchor = status === 'verified' && !property.blockchainTransactionId;
  const needsNotes = activeAction === 'reject' || activeAction === 'request_changes';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>

      {/* Hero card */}
      <View style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <View style={styles.heroCopy}>
            <Text style={styles.heroTitle}>{property.title}</Text>
            <Text style={styles.heroLocation}>{property.location}</Text>
          </View>
          <StatusBadge status={status} />
        </View>
        <Text style={styles.heroDesc}>{property.description}</Text>
        <View style={styles.heroStats}>
          <View style={styles.heroStatBlock}>
            <Text style={styles.heroStatValue}>{formatCurrency(property.price)}</Text>
            <Text style={styles.heroStatLabel}>{pd.labelAsking}</Text>
          </View>
          <View style={styles.heroStatDivider} />
          <View style={styles.heroStatBlock}>
            <Text style={styles.heroStatValue}>{formatCurrency(property.propertyValue)}</Text>
            <Text style={styles.heroStatLabel}>{pd.labelValuation}</Text>
          </View>
          <View style={styles.heroStatDivider} />
          <View style={styles.heroStatBlock}>
            <Text style={styles.heroStatValue}>
              {property.availableShares}/{property.totalShares}
            </Text>
            <Text style={styles.heroStatLabel}>{pd.labelShares}</Text>
          </View>
        </View>
      </View>

      {/* Reviewer notes banner */}
      {property.reviewerNotes ? (
        <View style={styles.notesBanner}>
          <Text style={styles.notesBannerLabel}>{pd.reviewerNotesBanner}</Text>
          <Text style={styles.notesBannerText}>{property.reviewerNotes}</Text>
        </View>
      ) : null}

      {/* Rejection reason banner */}
      {property.rejectionReason && status === 'rejected' ? (
        <View style={styles.rejectionBanner}>
          <Text style={styles.rejectionLabel}>{pd.rejectionReasonBanner}</Text>
          <Text style={styles.rejectionText}>{property.rejectionReason}</Text>
        </View>
      ) : null}

      {/* Seller Linkage */}
      <SectionCard title={pd.sectionSellerLinkage} accentColor={AC.cyan}>
        <InfoRow label={pd.labelSellerName} value={property.ownerName} />
        <InfoRow label={pd.labelUsername} value={property.seller?.username ?? 'Unknown'} />
        <InfoRow label={pd.labelUserId} value={property.seller?.id ?? 'Unknown'} />
      </SectionCard>

      {/* Listing Profile */}
      <SectionCard title={pd.sectionEntity} accentColor={AC.accent}>
        <InfoRow label={pd.labelAsking} value={formatCurrency(property.price)} />
        <InfoRow label={pd.labelValuation} value={formatCurrency(property.propertyValue)} />
        <InfoRow
          label={pd.labelAvailableShares}
          value={`${property.availableShares}/${property.totalShares}`}
        />
        <InfoRow label={pd.labelOwnershipType} value={property.ownershipType} />
        <InfoRow label={pd.labelProofType} value={property.ownershipProofType} />
        <InfoRow label={pd.labelProofNumber} value={property.ownershipProofNumber} />
      </SectionCard>

      {/* Verification & Blockchain */}
      <SectionCard title={pd.sectionVerificationBlockchain} accentColor={AC.success}>
        <InfoRow label={pd.labelLifecycle} value={status} />
        <InfoRow label={pd.labelPropertyVerification} value={property.propertyVerificationStatus} />
        <InfoRow label={pd.labelIdentityVerification} value={property.identityVerificationStatus} />
        <InfoRow
          label={pd.labelVerificationRecord}
          value={property.verificationRecordId ?? pd.notAssigned}
        />
        <InfoRow label={pd.labelBlockchainStatus} value={property.blockchainStatus ?? pd.pendingText} />
        <InfoRow label={pd.labelBlockchainHash} value={property.blockchainHash ?? pd.pendingText} />
        <InfoRow
          label={pd.labelBlockchainTx}
          value={property.blockchainTransactionId ?? pd.pendingText}
        />
        <InfoRow
          label={pd.labelAnchoredAt}
          value={property.anchoredAt ? formatDateTime(property.anchoredAt) : pd.notAnchoredText}
        />
      </SectionCard>

      {/* Verification Payload */}
      {property.verificationPayload ? (
        <View style={styles.codeBlock}>
          <Text style={styles.codeBlockLabel}>{pd.sectionVerificationPayload}</Text>
          <Text style={styles.codeText}>
            {JSON.stringify(property.verificationPayload, null, 2)}
          </Text>
        </View>
      ) : null}

      {/* Audit Events */}
      <SectionCard title={pd.sectionAuditEvents}>
        {property.auditEvents.length === 0 ? (
          <Text style={styles.mutedNote}>{pd.noAuditEvents}</Text>
        ) : (
          property.auditEvents.map(item => (
            <View key={item.id} style={styles.auditRow}>
              <View style={styles.auditDot} />
              <View style={styles.auditCopy}>
                <Text style={styles.auditAction}>{item.actionType.replace(/_/g, ' ')}</Text>
                <Text style={styles.auditMeta}>
                  {item.actorName} · {formatDateTime(item.timestamp)}
                </Text>
              </View>
            </View>
          ))
        )}
      </SectionCard>

      {/* Review Actions */}
      <SectionCard title={pd.sectionReviewActions} accentColor={AC.danger}>
        {needsNotes ? (
          <View style={styles.notesInputWrapper}>
            <Text style={styles.notesInputLabel}>
              {activeAction === 'reject' ? pd.notesRejectLabel : pd.notesRequestChangesLabel}
            </Text>
            <TextInput
              style={styles.notesInput}
              value={actionNotes}
              onChangeText={setActionNotes}
              multiline
              placeholder={
                activeAction === 'reject'
                  ? pd.notesRejectPlaceholder
                  : pd.notesRequestChangesPlaceholder
              }
              placeholderTextColor={AC.textMuted}
            />
            <View style={styles.notesActions}>
              <Button
                label={pd.cancelButton}
                onPress={() => {
                  setActiveAction(null);
                  setActionNotes('');
                }}
                variant="secondary"
                size="sm"
                style={styles.notesActionBtn}
              />
              <Button
                label={activeAction === 'reject' ? pd.actionReject : pd.actionSendBack}
                onPress={() => void submitAction()}
                variant="danger"
                size="sm"
                loading={isSubmitting}
                style={styles.notesActionBtn}
              />
            </View>
          </View>
        ) : activeAction ? (
          <View style={styles.confirmRow}>
            <Text style={styles.confirmText}>{pd.confirmActionPrompt}</Text>
            <View style={styles.confirmBtns}>
              <Button
                label={pd.cancelButton}
                onPress={() => setActiveAction(null)}
                variant="secondary"
                size="sm"
              />
              <Button
                label={pd.confirmButton}
                onPress={() => void submitAction()}
                variant="primary"
                size="sm"
                loading={isSubmitting}
              />
            </View>
          </View>
        ) : (
          <View style={styles.actionGrid}>
            <Button
              label={pd.actionVerify}
              onPress={() => setActiveAction('verify')}
              variant="primary"
              size="sm"
              disabled={!canVerify}
              style={styles.actionBtn}
            />
            <Button
              label={pd.actionReject}
              onPress={() => setActiveAction('reject')}
              variant="danger"
              size="sm"
              disabled={!canReject}
              style={styles.actionBtn}
            />
            <Button
              label={pd.actionRequestChanges}
              onPress={() => setActiveAction('request_changes')}
              variant="secondary"
              size="sm"
              disabled={!canRequestChanges}
              style={styles.actionBtn}
            />
            <Button
              label={pd.actionFreeze}
              onPress={() => setActiveAction('freeze')}
              variant="danger"
              size="sm"
              disabled={!canFreeze}
              style={styles.actionBtn}
            />
            <Button
              label={pd.actionAnchor}
              onPress={() => setActiveAction('anchor')}
              variant="secondary"
              size="sm"
              disabled={!canAnchor}
              style={styles.actionBtn}
            />
          </View>
        )}
      </SectionCard>

      <Button
        label={pd.backToListings}
        onPress={() => navigation.navigate('PropertyVerification')}
        variant="secondary"
        size="sm"
        fullWidth
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: AC.bg,
    flex: 1,
  },
  content: {
    gap: 12,
    padding: 16,
    paddingBottom: 32,
  },
  centeredState: {
    alignItems: 'center',
    backgroundColor: AC.bg,
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    color: AC.textSecondary,
    marginTop: 12,
  },
  errorTitle: {
    color: AC.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  errorText: {
    color: AC.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },

  // Hero
  heroCard: {
    backgroundColor: AC.surfaceHigh,
    borderColor: AC.borderAccent,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  heroHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  heroCopy: {
    flex: 1,
  },
  heroTitle: {
    color: AC.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  heroLocation: {
    color: AC.textSecondary,
    fontSize: 13,
    marginTop: 4,
  },
  heroDesc: {
    color: AC.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 12,
  },
  heroStats: {
    alignItems: 'center',
    borderTopColor: AC.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    marginTop: 14,
    paddingTop: 14,
  },
  heroStatBlock: {
    alignItems: 'center',
    flex: 1,
  },
  heroStatValue: {
    color: AC.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  heroStatLabel: {
    color: AC.textMuted,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.4,
    marginTop: 3,
    textTransform: 'uppercase',
  },
  heroStatDivider: {
    backgroundColor: AC.border,
    height: 28,
    width: 1,
  },

  // Banners
  notesBanner: {
    backgroundColor: AC.warningDim,
    borderColor: AC.borderWarning,
    borderLeftWidth: 3,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  notesBannerLabel: {
    color: AC.warning,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  notesBannerText: {
    color: AC.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  rejectionBanner: {
    backgroundColor: AC.dangerDim,
    borderColor: AC.borderDanger,
    borderLeftWidth: 3,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  rejectionLabel: {
    color: AC.danger,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  rejectionText: {
    color: AC.textSecondary,
    fontSize: 13,
    lineHeight: 18,
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
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
    marginBottom: 10,
    textTransform: 'uppercase',
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
  },

  // Code block
  codeBlock: {
    backgroundColor: AC.codeBg,
    borderColor: AC.border,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  codeBlockLabel: {
    color: AC.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  codeText: {
    color: AC.codeText,
    fontFamily: 'monospace',
    fontSize: 11,
    lineHeight: 18,
  },

  // Audit events
  mutedNote: {
    color: AC.textMuted,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 4,
  },
  auditRow: {
    alignItems: 'flex-start',
    borderTopColor: AC.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 10,
  },
  auditDot: {
    backgroundColor: AC.accent,
    borderRadius: 4,
    height: 8,
    marginTop: 4,
    width: 8,
    flexShrink: 0,
  },
  auditCopy: {
    flex: 1,
  },
  auditAction: {
    color: AC.textPrimary,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  auditMeta: {
    color: AC.textMuted,
    fontSize: 12,
    marginTop: 2,
  },

  // Action forms
  notesInputWrapper: {
    gap: 10,
  },
  notesInputLabel: {
    color: AC.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  notesInput: {
    backgroundColor: AC.surfaceMid,
    borderColor: AC.border,
    borderRadius: 10,
    borderWidth: 1,
    color: AC.textPrimary,
    fontSize: 14,
    minHeight: 88,
    padding: 12,
    textAlignVertical: 'top',
  },
  notesActions: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'flex-end',
  },
  notesActionBtn: {
    flexShrink: 0,
  },
  confirmRow: {
    gap: 12,
  },
  confirmText: {
    color: AC.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  confirmBtns: {
    flexDirection: 'row',
    gap: 10,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionBtn: {
    flexBasis: '47%',
    flexGrow: 1,
  },
});

export default AdminPropertyDetailScreen;
