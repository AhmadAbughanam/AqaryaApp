import {formatCurrency} from '../../utils/formatters';
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
  AdminInvestmentOpportunityDetail,
  InvestmentReviewAction,
  getAdminInvestmentOpportunityDetails,
  reviewInvestmentOpportunity,
} from '../../api/admin';
import {AdminStackParamList} from '../../navigation/AdminStack';
import {formatDateTime} from '../../utils/formatters';
import {AC} from '../../constants/adminColors';
import {useStrings} from '../../i18n';

type Props = NativeStackScreenProps<AdminStackParamList, 'AdminInvestmentDetail'>;



const formatPercent = (value: number): string => `${value}%`;

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

const AdminInvestmentDetailScreen = ({route, navigation}: Props) => {
  const strings = useStrings();
  const id = strings.admin.investmentDetail;
  const [opportunity, setOpportunity] = useState<AdminInvestmentOpportunityDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<InvestmentReviewAction | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchDetails = useCallback(async () => {
    try {
      const response = await getAdminInvestmentOpportunityDetails(route.params.id);
      setOpportunity(response);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : id.errorLoad);
    } finally {
      setIsLoading(false);
    }
  }, [id, route.params.id]);

  useEffect(() => {
    void fetchDetails();
  }, [fetchDetails]);

  const submitAction = useCallback(async () => {
    if (!activeAction || !opportunity) return;
    if (activeAction === 'reject' && !actionNotes.trim()) {
      Alert.alert(id.alertNotesRequiredTitle, id.alertNotesRequiredMsg);
      return;
    }

    setIsSubmitting(true);
    try {
      await reviewInvestmentOpportunity(
        opportunity.id,
        activeAction,
        actionNotes.trim() || undefined,
      );
      setActiveAction(null);
      setActionNotes('');
      await fetchDetails();
      Alert.alert(id.alertDone, id.alertActionCompleted);
    } catch (error) {
      Alert.alert(
        id.alertActionFailed,
        error instanceof Error ? error.message : id.alertActionError,
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [activeAction, actionNotes, fetchDetails, id, opportunity]);

  if (isLoading) {
    return (
      <View style={styles.centeredState}>
        <ActivityIndicator size="large" color={AC.accent} />
        <Text style={styles.loadingText}>{id.loadingText}</Text>
      </View>
    );
  }

  if (!opportunity) {
    return (
      <View style={styles.centeredState}>
        <Text style={styles.errorTitle}>{id.errorUnavailable}</Text>
        <Text style={styles.errorText}>{errorMessage ?? id.errorTryAgain}</Text>
      </View>
    );
  }

  const status = opportunity.status;
  const canApprove = status === 'submitted' || status === 'under_review';
  const canReject = status !== 'published';
  const canPublish = status === 'approved';
  const canUnpublish = status === 'published';
  const needsNotes = activeAction === 'reject';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>

      {/* Hero */}
      <View style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <View style={styles.heroCopy}>
            <Text style={styles.heroTitle}>{opportunity.title}</Text>
            <Text style={styles.heroLocation}>{opportunity.location}</Text>
          </View>
          <StatusBadge status={status} />
        </View>
        <Text style={styles.heroDesc}>{opportunity.description}</Text>

        {/* Key metrics strip */}
        <View style={styles.metricsStrip}>
          <View style={styles.metricBlock}>
            <Text style={[styles.metricValue, {color: AC.success}]}>
              {formatPercent(opportunity.targetIrr)}
            </Text>
            <Text style={styles.metricLabel}>{id.metricIRR}</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricBlock}>
            <Text style={styles.metricValue}>
              {formatCurrency(opportunity.pricePerShare)}
            </Text>
            <Text style={styles.metricLabel}>{id.metricPerShare}</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricBlock}>
            <Text style={[styles.metricValue, {color: AC.warning}]}>
              {opportunity.riskBand}
            </Text>
            <Text style={styles.metricLabel}>{id.metricRisk}</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricBlock}>
            <Text style={styles.metricValue}>{opportunity.targetHoldYears}y</Text>
            <Text style={styles.metricLabel}>{id.metricHold}</Text>
          </View>
        </View>
      </View>

      {/* Banners */}
      {opportunity.reviewNotes ? (
        <View style={styles.notesBanner}>
          <Text style={styles.notesBannerLabel}>{id.reviewNotesBanner}</Text>
          <Text style={styles.notesBannerText}>{opportunity.reviewNotes}</Text>
        </View>
      ) : null}

      {opportunity.rejectionReason && status === 'rejected' ? (
        <View style={styles.rejectionBanner}>
          <Text style={styles.rejectionLabel}>{id.rejectionReasonBanner}</Text>
          <Text style={styles.rejectionText}>{opportunity.rejectionReason}</Text>
        </View>
      ) : null}

      {/* Sponsor */}
      <SectionCard title={id.sectionSponsor} accentColor={AC.cyan}>
        <InfoRow label={id.labelSponsor} value={opportunity.sponsorName} />
        <InfoRow label={id.labelAssetClass} value={opportunity.assetClass} />
        <InfoRow label={id.labelStage} value={opportunity.stage} />
        <InfoRow label={id.labelRiskBand} value={opportunity.riskBand} />
        {opportunity.trustBadge ? (
          <InfoRow label={id.labelTrustBadge} value={opportunity.trustBadge} />
        ) : null}
        {opportunity.trustScore !== null ? (
          <InfoRow label={id.labelTrustScore} value={String(opportunity.trustScore)} />
        ) : null}
      </SectionCard>

      {/* Financials */}
      <SectionCard title={id.sectionFinancials} accentColor={AC.success}>
        <InfoRow label={id.labelPricePerShare} value={formatCurrency(opportunity.pricePerShare)} />
        <InfoRow label={id.labelFundingGoal} value={formatCurrency(opportunity.fundingGoal)} />
        <InfoRow label={id.labelFundedAmount} value={formatCurrency(opportunity.fundedAmount)} />
        <InfoRow
          label={id.labelAvailableShares}
          value={`${opportunity.availableShares}/${opportunity.totalShares}`}
        />
        <InfoRow label={id.labelMinShares} value={String(opportunity.minimumShares)} />
        <InfoRow label={id.labelIRR} value={formatPercent(opportunity.targetIrr)} />
        <InfoRow label={id.labelCashYield} value={formatPercent(opportunity.targetCashYield)} />
        <InfoRow label={id.labelHoldPeriod} value={`${opportunity.targetHoldYears} yrs`} />
        <InfoRow label={id.labelAppreciationRate} value={formatPercent(opportunity.appreciationRate)} />
        <InfoRow label={id.labelOccupancyRate} value={formatPercent(opportunity.occupancyRate)} />
        <InfoRow label={id.labelManagementFee} value={formatPercent(opportunity.managementFeeRate)} />
      </SectionCard>

      {/* Structure */}
      <SectionCard title={id.sectionStructure} accentColor={AC.accent}>
        <InfoRow label={id.labelOwnership} value={opportunity.ownershipStructure} />
        <InfoRow label={id.labelDistribution} value={opportunity.distributionModel} />
        <InfoRow label={id.labelExitModel} value={opportunity.exitModel} />
      </SectionCard>

      {/* Review & Blockchain */}
      <SectionCard title={id.sectionReviewBlockchain}>
        <InfoRow label={id.labelStatus} value={status} />
        {opportunity.reviewedBy ? (
          <InfoRow label={id.labelReviewedBy} value={opportunity.reviewedBy} />
        ) : null}
        {opportunity.reviewedAt ? (
          <InfoRow label={id.labelReviewedAt} value={formatDateTime(opportunity.reviewedAt)} />
        ) : null}
        {opportunity.publishedAt ? (
          <InfoRow label={id.labelPublishedAt} value={formatDateTime(opportunity.publishedAt)} />
        ) : null}
        <InfoRow
          label={id.labelVerificationRecord}
          value={opportunity.verificationRecordId ?? id.notAssigned}
        />
        <InfoRow label={id.labelBlockchainStatus} value={opportunity.blockchainStatus ?? id.pendingText} />
        <InfoRow label={id.labelBlockchainHash} value={opportunity.blockchainHash ?? id.pendingText} />
        <InfoRow label={id.labelBlockchainTx} value={opportunity.blockchainTxId ?? id.pendingText} />
        {opportunity.anchoredAt ? (
          <InfoRow label={id.labelAnchoredAt} value={formatDateTime(opportunity.anchoredAt)} />
        ) : null}
        <InfoRow label={id.labelCreated} value={formatDateTime(opportunity.createdAt)} />
        <InfoRow label={id.labelUpdated} value={formatDateTime(opportunity.updatedAt)} />
      </SectionCard>

      {/* Review Actions */}
      <SectionCard title={id.sectionReviewActions} accentColor={AC.danger}>
        {needsNotes ? (
          <View style={styles.notesInputWrapper}>
            <Text style={styles.notesInputLabel}>{id.notesRejectLabel}</Text>
            <TextInput
              style={styles.notesInput}
              value={actionNotes}
              onChangeText={setActionNotes}
              multiline
              placeholder={id.notesRejectPlaceholder}
              placeholderTextColor={AC.textMuted}
            />
            <View style={styles.notesActions}>
              <Button
                label={id.cancelButton}
                onPress={() => {
                  setActiveAction(null);
                  setActionNotes('');
                }}
                variant="secondary"
                size="sm"
                style={styles.notesActionBtn}
              />
              <Button
                label={id.actionReject}
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
            <Text style={styles.confirmText}>{id.confirmActionPrompt}</Text>
            <View style={styles.confirmBtns}>
              <Button
                label={id.cancelButton}
                onPress={() => setActiveAction(null)}
                variant="secondary"
                size="sm"
              />
              <Button
                label={id.confirmButton}
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
              label={id.actionApprove}
              onPress={() => setActiveAction('approve')}
              variant="primary"
              size="sm"
              disabled={!canApprove}
              style={styles.actionBtn}
            />
            <Button
              label={id.actionReject}
              onPress={() => setActiveAction('reject')}
              variant="danger"
              size="sm"
              disabled={!canReject}
              style={styles.actionBtn}
            />
            <Button
              label={id.actionPublish}
              onPress={() => setActiveAction('publish')}
              variant="primary"
              size="sm"
              disabled={!canPublish}
              style={styles.actionBtn}
            />
            <Button
              label={id.actionUnpublish}
              onPress={() => setActiveAction('unpublish')}
              variant="secondary"
              size="sm"
              disabled={!canUnpublish}
              style={styles.actionBtn}
            />
          </View>
        )}
      </SectionCard>

      <Button
        label={id.backToInvestments}
        onPress={() => navigation.navigate('InvestmentReview')}
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
  metricsStrip: {
    alignItems: 'center',
    borderTopColor: AC.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    marginTop: 14,
    paddingTop: 14,
  },
  metricBlock: {
    alignItems: 'center',
    flex: 1,
  },
  metricValue: {
    color: AC.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  metricLabel: {
    color: AC.textMuted,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.4,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  metricDivider: {
    backgroundColor: AC.border,
    height: 26,
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

export default AdminInvestmentDetailScreen;
