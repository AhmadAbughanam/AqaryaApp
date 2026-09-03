import {
  CURRENT_USER,
  mockDelay,
  MockError,
  nowIso,
  properties,
  reports,
} from '../mock/db';

export type ReportReason =
  | 'spam'
  | 'fraud'
  | 'misleading_info'
  | 'inappropriate'
  | 'duplicate'
  | 'other';

export type ReportStatus = 'open' | 'under_review' | 'resolved' | 'dismissed';

export type ReportTargetType = 'listing';

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

const listingSummary = (targetId: string) =>
  properties.find(record => record.id === targetId) ?? null;

const toListItem = (report: (typeof reports)[number]): ReportListItem => {
  const listing = listingSummary(report.targetId);
  return {
    id: report.id,
    targetType: report.targetType,
    targetId: report.targetId,
    reason: report.reason,
    notes: report.notes,
    status: report.status,
    createdAt: report.createdAt,
    reviewedAt: report.reviewedAt,
    reviewedBy: report.reviewedBy,
    reporter: {id: report.reporterId, username: report.reporterName},
    entityTitle: listing?.title ?? null,
    entityLocation: listing?.location ?? null,
  };
};

export const reportListing = async (
  propertyId: string,
  payload: CreateReportRequest,
): Promise<{id: string; status: ReportStatus}> => {
  await mockDelay();
  const report = {
    id: `report-${Date.now().toString(36)}`,
    targetType: 'listing' as const,
    targetId: propertyId,
    reason: payload.reason,
    notes: payload.notes ?? null,
    status: 'open' as const,
    createdAt: nowIso(),
    reviewedAt: null,
    reviewedBy: null,
    reporterId: CURRENT_USER.id,
    reporterName: CURRENT_USER.username,
  };
  reports.unshift(report);
  return {id: report.id, status: report.status};
};

export const getModerationReports = async (
  params: GetReportsParams = {},
): Promise<ReportsResponse> => {
  await mockDelay();
  let filtered = [...reports];
  if (params.status) filtered = filtered.filter(item => item.status === params.status);
  if (params.reason) filtered = filtered.filter(item => item.reason === params.reason);
  return {
    items: filtered.map(toListItem),
    total: filtered.length,
    page: params.page ?? 1,
    limit: params.limit ?? filtered.length,
  };
};

export const getModerationReportDetail = async (
  reportId: string,
): Promise<ReportDetail> => {
  await mockDelay();
  const report = reports.find(item => item.id === reportId);
  if (!report) throw new MockError('Report not found.', 404);
  const listing = listingSummary(report.targetId);
  const qualityFlags: QualityFlagItem[] =
    report.reason === 'duplicate'
      ? [
          {
            id: `flag-${report.id}`,
            rule: 'duplicate_signal',
            severity: 'medium',
            details:
              'Another verified listing shares the same neighbourhood, size, and price band.',
            createdAt: report.createdAt,
          },
        ]
      : [];
  return {
    id: report.id,
    targetType: report.targetType,
    targetId: report.targetId,
    reason: report.reason,
    notes: report.notes,
    status: report.status,
    createdAt: report.createdAt,
    reviewedAt: report.reviewedAt,
    reviewedBy: report.reviewedBy,
    reporter: {id: report.reporterId, username: report.reporterName},
    entitySummary: listing
      ? {
          title: listing.title,
          location: listing.location,
          status: listing.verificationStatus,
        }
      : null,
    qualityFlags,
  };
};

export const moderateReport = async (
  reportId: string,
  payload: ModerateReportRequest,
): Promise<ModerateReportResponse> => {
  await mockDelay();
  const report = reports.find(item => item.id === reportId);
  if (!report) throw new MockError('Report not found.', 404);
  report.status =
    payload.action === 'mark_under_review'
      ? 'under_review'
      : payload.action === 'resolve'
        ? 'resolved'
        : 'dismissed';
  if (payload.action !== 'mark_under_review') {
    report.reviewedAt = nowIso();
    report.reviewedBy = 'admin';
  }
  return {
    id: report.id,
    status: report.status,
    reviewedAt: report.reviewedAt,
    reviewedBy: report.reviewedBy,
  };
};

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
  duplicate_signal: 'Potential Duplicate',
};
