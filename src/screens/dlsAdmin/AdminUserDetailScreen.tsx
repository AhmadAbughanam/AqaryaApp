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
  AdminUserDetail,
  ProviderReviewAction,
  getAdminUserDetail,
  reviewProviderAccount,
} from '../../api/admin';
import {AdminStackParamList} from '../../navigation/AdminStack';

import {AC} from '../../constants/adminColors';
import {useStrings} from '../../i18n';
import {formatDateTime} from '../../utils/formatters';


type Props = NativeStackScreenProps<AdminStackParamList, 'AdminUserDetail'>;

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

const AdminUserDetailScreen = ({route, navigation}: Props) => {
  const strings = useStrings();
  const ud = strings.admin.userDetail;
  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<ProviderReviewAction | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchDetails = useCallback(async () => {
    try {
      const response = await getAdminUserDetail(route.params.id);
      setUser(response);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : ud.errorLoad);
    } finally {
      setIsLoading(false);
    }
  }, [route.params.id, ud]);

  useEffect(() => {
    void fetchDetails();
  }, [fetchDetails]);

  const submitAction = useCallback(async () => {
    if (!activeAction || !user) return;
    if (activeAction === 'reject' && !actionNotes.trim()) {
      Alert.alert(ud.alertNotesRequiredTitle, ud.alertNotesRequiredMsg);
      return;
    }

    setIsSubmitting(true);
    try {
      await reviewProviderAccount(user.id, activeAction, actionNotes.trim() || undefined);
      setActiveAction(null);
      setActionNotes('');
      await fetchDetails();
      Alert.alert(ud.alertDone, ud.alertActionCompleted);
    } catch (error) {
      Alert.alert(
        ud.alertActionFailed,
        error instanceof Error ? error.message : ud.alertActionError,
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [activeAction, actionNotes, fetchDetails, ud, user]);

  if (isLoading) {
    return (
      <View style={styles.centeredState}>
        <ActivityIndicator size="large" color={AC.accent} />
        <Text style={styles.loadingText}>{ud.loadingText}</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.centeredState}>
        <Text style={styles.errorTitle}>{ud.errorUnavailable}</Text>
        <Text style={styles.errorText}>{errorMessage ?? ud.errorTryAgain}</Text>
      </View>
    );
  }

  const profile = user.providerProfile;
  const providerStatus = profile?.providerVerificationStatus;

  const canMarkUnderReview =
    !!profile && providerStatus !== 'under_review' && providerStatus !== 'verified';
  const canVerify = !!profile && providerStatus !== 'verified';
  const canReject = !!profile && providerStatus !== 'rejected';
  const canSuspend = !!profile && providerStatus !== 'suspended';
  const canUpdateNotes = !!profile;

  const needsNotesInput = activeAction === 'reject' || activeAction === 'update_notes';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>

      {/* Hero */}
      <View style={styles.heroCard}>
        <View style={styles.heroTopRow}>
          <View style={styles.heroAvatar}>
            <Text style={styles.heroAvatarText}>
              {user.username.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.heroUsername}>{user.username}</Text>
            <Text style={styles.heroRole}>
              {user.role}{profile ? ` · ${profile.accountType}` : ''}
            </Text>
            <Text style={styles.heroJoined}>{ud.joinedPrefix}{formatDateTime(user.createdAt)}</Text>
          </View>
          {profile ? (
            <StatusBadge status={providerStatus!} />
          ) : (
            <View style={styles.noProfileBadge}>
              <Text style={styles.noProfileText}>{ud.noProfileBadge}</Text>
            </View>
          )}
        </View>

        {/* Activity counters */}
        <View style={styles.activityStrip}>
          <View style={styles.activityBlock}>
            <Text style={styles.activityNum}>{user.counts.properties}</Text>
            <Text style={styles.activityLabel}>{ud.statProps}</Text>
          </View>
          <View style={styles.activityDivider} />
          <View style={styles.activityBlock}>
            <Text style={styles.activityNum}>{user.counts.simulations}</Text>
            <Text style={styles.activityLabel}>{ud.statInvest}</Text>
          </View>
          <View style={styles.activityDivider} />
          <View style={styles.activityBlock}>
            <Text style={styles.activityNum}>{user.counts.threads}</Text>
            <Text style={styles.activityLabel}>{ud.statThreads}</Text>
          </View>
          <View style={styles.activityDivider} />
          <View style={styles.activityBlock}>
            <Text style={styles.activityNum}>{user.counts.notifications}</Text>
            <Text style={styles.activityLabel}>{ud.statNotifs}</Text>
          </View>
        </View>
      </View>

      {/* Admin notes banner */}
      {profile?.adminNotes ? (
        <View style={styles.notesBanner}>
          <Text style={styles.notesBannerLabel}>{ud.adminNotesBanner}</Text>
          <Text style={styles.notesBannerText}>{profile.adminNotes}</Text>
        </View>
      ) : null}

      {/* Rejection banner */}
      {profile?.rejectionReason && providerStatus === 'rejected' ? (
        <View style={styles.rejectionBanner}>
          <Text style={styles.rejectionLabel}>{ud.rejectionReasonBanner}</Text>
          <Text style={styles.rejectionText}>{profile.rejectionReason}</Text>
        </View>
      ) : null}

      {/* Account info */}
      <SectionCard title={ud.sectionAccountActivity} accentColor={AC.accent}>
        <InfoRow label={ud.labelUserId} value={user.id} />
        <InfoRow label={ud.labelUsername} value={user.username} />
        <InfoRow label={ud.labelRole} value={user.role} />
        <InfoRow label={ud.labelJoined} value={formatDateTime(user.createdAt)} />
      </SectionCard>

      {/* Provider profile */}
      {profile ? (
        <>
          <SectionCard title={ud.sectionProviderIdentity} accentColor={AC.cyan}>
            <InfoRow label={ud.labelAccountType} value={profile.accountType} />
            <InfoRow
              label={ud.labelProviderVerificationStatus}
              value={profile.providerVerificationStatus.replace(/_/g, ' ')}
            />
            {profile.providerType ? (
              <InfoRow label={ud.labelProviderType} value={profile.providerType} />
            ) : null}
            {profile.businessName ? (
              <InfoRow label={ud.labelBusinessName} value={profile.businessName} />
            ) : null}
            {profile.contactPerson ? (
              <InfoRow label={ud.labelContactPerson} value={profile.contactPerson} />
            ) : null}
            {profile.phone ? <InfoRow label={ud.labelPhone} value={profile.phone} /> : null}
            {profile.email ? <InfoRow label={ud.labelEmail} value={profile.email} /> : null}
          </SectionCard>

          <SectionCard title={ud.sectionRegistration} accentColor={AC.success}>
            {profile.registrationNumber ? (
              <InfoRow label={ud.labelRegistrationNo} value={profile.registrationNumber} />
            ) : null}
            {profile.licenseNumber ? (
              <InfoRow label={ud.labelLicenseNo} value={profile.licenseNumber} />
            ) : null}
            <InfoRow
              label={ud.labelDocuments}
              value={
                profile.documentUrls.length > 0
                  ? `${profile.documentUrls.length}${ud.documentsCount}`
                  : ud.documentsNone
              }
            />
            {profile.submittedAt ? (
              <InfoRow label={ud.labelSubmitted} value={formatDateTime(profile.submittedAt)} />
            ) : null}
            {profile.reviewedAt ? (
              <InfoRow label={ud.labelReviewed} value={formatDateTime(profile.reviewedAt)} />
            ) : null}
          </SectionCard>
        </>
      ) : (
        <SectionCard title={ud.sectionAccount}>
          <Text style={styles.mutedNote}>{ud.noProviderProfile}</Text>
        </SectionCard>
      )}

      {/* Actions */}
      {profile ? (
        <SectionCard title={ud.sectionActions} accentColor={AC.danger}>
          {needsNotesInput ? (
            <View style={styles.notesInputWrapper}>
              <Text style={styles.notesInputLabel}>
                {activeAction === 'reject' ? ud.notesRejectLabel : ud.notesAdminLabel}
              </Text>
              <TextInput
                style={styles.notesInput}
                value={actionNotes}
                onChangeText={setActionNotes}
                multiline
                placeholder={
                  activeAction === 'reject'
                    ? ud.notesRejectPlaceholder
                    : ud.notesAdminPlaceholder
                }
                placeholderTextColor={AC.textMuted}
              />
              <View style={styles.notesActions}>
                <Button
                  label={ud.cancelButton}
                  onPress={() => {
                    setActiveAction(null);
                    setActionNotes('');
                  }}
                  variant="secondary"
                  size="sm"
                  style={styles.notesActionBtn}
                />
                <Button
                  label={activeAction === 'reject' ? ud.actionReject : ud.actionSaveNotes}
                  onPress={() => void submitAction()}
                  variant={activeAction === 'reject' ? 'danger' : 'primary'}
                  size="sm"
                  loading={isSubmitting}
                  style={styles.notesActionBtn}
                />
              </View>
            </View>
          ) : activeAction ? (
            <View style={styles.confirmRow}>
              <Text style={styles.confirmText}>{ud.confirmActionPrompt}</Text>
              <View style={styles.confirmBtns}>
                <Button
                  label={ud.cancelButton}
                  onPress={() => setActiveAction(null)}
                  variant="secondary"
                  size="sm"
                />
                <Button
                  label={ud.confirmButton}
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
                label={ud.actionMarkUnderReview}
                onPress={() => setActiveAction('under_review')}
                variant="secondary"
                size="sm"
                disabled={!canMarkUnderReview}
                style={styles.actionBtn}
              />
              <Button
                label={ud.actionVerify}
                onPress={() => setActiveAction('verify')}
                variant="primary"
                size="sm"
                disabled={!canVerify}
                style={styles.actionBtn}
              />
              <Button
                label={ud.actionReject}
                onPress={() => setActiveAction('reject')}
                variant="danger"
                size="sm"
                disabled={!canReject}
                style={styles.actionBtn}
              />
              <Button
                label={ud.actionSuspend}
                onPress={() => setActiveAction('suspend')}
                variant="danger"
                size="sm"
                disabled={!canSuspend}
                style={styles.actionBtn}
              />
              <Button
                label={ud.actionUpdateNotes}
                onPress={() => setActiveAction('update_notes')}
                variant="secondary"
                size="sm"
                disabled={!canUpdateNotes}
                style={styles.actionBtn}
              />
            </View>
          )}
        </SectionCard>
      ) : null}

      <Button
        label={ud.backToUsers}
        onPress={() => navigation.navigate('UserManagement')}
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
  heroTopRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
  },
  heroAvatar: {
    alignItems: 'center',
    backgroundColor: AC.accentDim,
    borderColor: AC.borderAccent,
    borderRadius: 22,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  heroAvatarText: {
    color: AC.accent,
    fontSize: 18,
    fontWeight: '800',
  },
  heroCopy: {
    flex: 1,
  },
  heroUsername: {
    color: AC.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  heroRole: {
    color: AC.textSecondary,
    fontSize: 12,
    marginTop: 3,
    textTransform: 'capitalize',
  },
  heroJoined: {
    color: AC.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  noProfileBadge: {
    backgroundColor: AC.surfaceMid,
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  noProfileText: {
    color: AC.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  activityStrip: {
    alignItems: 'center',
    borderTopColor: AC.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    marginTop: 14,
    paddingTop: 14,
  },
  activityBlock: {
    alignItems: 'center',
    flex: 1,
  },
  activityNum: {
    color: AC.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  activityLabel: {
    color: AC.textMuted,
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  activityDivider: {
    backgroundColor: AC.border,
    height: 24,
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
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
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
  mutedNote: {
    color: AC.textMuted,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    paddingVertical: 4,
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

export default AdminUserDetailScreen;
