import {createAuthenticatedApiClient} from './client';

const api = createAuthenticatedApiClient();

// ─── Shared types ─────────────────────────────────────────────────────────────

export type ReportReason =
  | 'spam'
  | 'fraud'
  | 'misleading_info'
  | 'inappropriate'
  | 'duplicate'
  | 'other';

export type ReportStatus = 'open' | 'under_review' | 'resolved' | 'dismissed';

export type ReportTargetType = 'listing' | 'opportunity';

export type ModerateAction = 'mark_under_review' | 'resolve' | 'dismiss';

export type FlagSeverity = 'low' | 'medium' | 'high';

export interface CreateReportRequest {
  reason: ReportReason;
  notes?: string;
}

export interface ReportListItem {
  id: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  notes: string | null;
  status: ReportStatus;
  createdAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  reporter: {id: string; username: string};
  entityTitle: string | null;
  entityLocation: string | null;
}

export interface QualityFlagItem {
  id: string;
  rule: string;
  severity: FlagSeverity;
  details: string;
  createdAt: string;
}

export interface ReportDetail {
  id: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  notes: string | null;
  status: ReportStatus;
  createdAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  reporter: {id: string; username: string};
  entitySummary: {title: string; location: string; status: string} | null;
  qualityFlags: QualityFlagItem[];
}

export interface GetReportsParams {
  targetType?: ReportTargetType;
  status?: ReportStatus;
  reason?: ReportReason;
  page?: number;
  limit?: number;
}

export interface ReportsResponse {
  items: ReportListItem[];
  total: number;
  page: number;
  limit: number;
}

export interface ModerateReportRequest {
  action: ModerateAction;
  notes?: string;
}

export interface ModerateReportResponse {
  id: string;
  status: ReportStatus;
  reviewedAt: string | null;
  reviewedBy: string | null;
}

// ─── Citizen: submit reports ──────────────────────────────────────────────────

export const reportListing = async (
  propertyId: string,
  payload: CreateReportRequest,
): Promise<{id: string; status: ReportStatus}> => {
  const response = await api.post<{id: string; status: ReportStatus}>(
    `/reports/listings/${propertyId}`,
    payload,
  );
  return response.data;
};

export const reportOpportunity = async (
  opportunityId: string,
  payload: CreateReportRequest,
): Promise<{id: string; status: ReportStatus}> => {
  const response = await api.post<{id: string; status: ReportStatus}>(
    `/reports/opportunities/${opportunityId}`,
    payload,
  );
  return response.data;
};

// ─── Admin: moderation queue ──────────────────────────────────────────────────

export const getModerationReports = async (
  params: GetReportsParams = {},
): Promise<ReportsResponse> => {
  const response = await api.get<ReportsResponse>('/admin/moderation/reports', {
    params,
  });
  return response.data;
};

export const getModerationReportDetail = async (
  reportId: string,
): Promise<ReportDetail> => {
  const response = await api.get<ReportDetail>(
    `/admin/moderation/reports/${reportId}`,
  );
  return response.data;
};

export const moderateReport = async (
  reportId: string,
  payload: ModerateReportRequest,
): Promise<ModerateReportResponse> => {
  const response = await api.post<ModerateReportResponse>(
    `/admin/moderation/reports/${reportId}/action`,
    payload,
  );
  return response.data;
};

// ─── Reason display helpers ───────────────────────────────────────────────────

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  spam: 'Spam',
  fraud: 'Fraud / Scam',
  misleading_info: 'Misleading Information',
  inappropriate: 'Inappropriate Content',
  duplicate: 'Duplicate Listing',
  other: 'Other',
};

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  open: 'Open',
  under_review: 'Under Review',
  resolved: 'Resolved',
  dismissed: 'Dismissed',
};

export const FLAG_RULE_LABELS: Record<string, string> = {
  suspicious_pricing: 'Suspicious Pricing',
  missing_key_data: 'Missing Key Data',
  unrealistic_returns: 'Unrealistic Returns',
  unrealistic_cash_yield: 'Unrealistic Cash Yield',
  duplicate_signal: 'Potential Duplicate',
};
