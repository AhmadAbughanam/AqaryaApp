import {createAuthenticatedApiClient} from './client';
import {VerificationStatus} from './properties';
import {getSecureToken} from '../services/secureStorage';

const adminApi = createAuthenticatedApiClient();

export type AdminActionType =
  | 'login'
  | 'listing_submitted'
  | 'listing_verified'
  | 'listing_rejected'
  | 'listing_changes_requested'
  | 'listing_frozen'
  | 'anchor'
  | 'simulate'
  | 'opportunity_submitted'
  | 'opportunity_approved'
  | 'opportunity_rejected'
  | 'opportunity_published'
  | 'opportunity_unpublished'
  | 'opportunity_simulate';

export type InvestmentOpportunityStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'published'
  | 'rejected';

export type InvestmentReviewAction = 'approve' | 'reject' | 'publish' | 'unpublish';

export interface AdminInvestmentOpportunity {
  id: string;
  title: string;
  location: string;
  sponsorName: string;
  assetClass: string;
  stage: string;
  riskBand: string;
  status: InvestmentOpportunityStatus;
  trustScore: number | null;
  trustBadge: 'verified' | 'premium_verified' | 'aqarya_approved' | null;
  pricePerShare: number;
  totalShares: number;
  availableShares: number;
  targetIrr: number;
  targetCashYield: number;
  targetHoldYears: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminInvestmentOpportunityDetail extends AdminInvestmentOpportunity {
  description: string;
  imageUrls: string[];
  ownershipStructure: string;
  distributionModel: string;
  exitModel: string;
  minimumShares: number;
  fundingGoal: number;
  fundedAmount: number;
  appreciationRate: number;
  occupancyRate: number;
  managementFeeRate: number;
  reviewNotes: string | null;
  rejectionReason: string | null;
  publishedAt: string | null;
  reviewedAt: string | null;
  reviewedBy: string | null;
  verificationRecordId: string | null;
  blockchainHash: string | null;
  blockchainTxId: string | null;
  blockchainStatus: 'pending' | 'anchored' | 'failed';
  anchoredAt: string | null;
}

export interface AdminProperty {
  id: string;
  title: string;
  ownerName: string;
  location: string;
  submissionDate: string;
  verificationStatus: VerificationStatus;
  propertyVerificationStatus: 'pending' | 'verified' | 'rejected';
  identityVerificationStatus: 'pending' | 'verified' | 'rejected';
  rejectionReason?: string | null;
  reviewerNotes?: string | null;
  verificationRecordId?: string | null;
  blockchainHash?: string | null;
  blockchainTransactionId?: string | null;
  blockchainStatus?: 'pending' | 'anchored' | 'failed';
  anchoredAt?: string | null;
  updatedAt: string;
}

export interface AdminPropertyDetail extends AdminProperty {
  price: number;
  propertyValue: number;
  totalShares: number;
  availableShares: number;
  ownershipType: string;
  ownershipProofType: string;
  ownershipProofNumber: string;
  description: string;
  imageUrls: string[];
  verificationPayload?: Record<string, unknown> | null;
  seller: {
    id: string;
    username: string;
    role: string;
  } | null;
  auditEvents: AuditLogItem[];
}

export interface AnchorResult {
  blockchainHash: string;
  blockchainTransactionId: string;
  anchoredAt: string;
}

export interface AnchoredPropertyResponse {
  property: AdminProperty;
  anchor: AnchorResult;
}

export interface AuditLogItem {
  id: string;
  actorId?: string | null;
  actorName: string;
  actorRole: string;
  actionType: AdminActionType;
  propertyId?: string;
  timestamp: string;
  metadata: Record<string, unknown>;
}

export interface AuditLogFilters {
  page?: number;
  limit?: number;
  actionType?: AdminActionType;
  dateFrom?: string;
  dateTo?: string;
}

export interface AuditLogsResponse {
  items: AuditLogItem[];
  page: number;
  limit: number;
  total: number;
}

export interface AdminAnalytics {
  // ─ Properties ──────────────────────────────────────────────────────────────
  totalProperties: number;
  verifiedProperties: number;
  pendingVerificationProperties: number;
  needsChangesProperties: number;
  rejectedProperties: number;
  frozenProperties: number;
  soldProperties: number;
  totalSimulations: number;
  totalAnchored: number;
  lastAnchoredAt: string | null;
  totalSimulationVolume: number;

  // ─ Investment pipeline ──────────────────────────────────────────────────────
  investments: {
    draft: number;
    submitted: number;
    underReview: number;
    approved: number;
    published: number;
    rejected: number;
    totalSimulations: number;
    totalSimulationVolume: number;
  };

  // ─ Provider verification ────────────────────────────────────────────────────
  providers: {
    total: number;
    unverified: number;
    underReview: number;
    verified: number;
    rejected: number;
    suspended: number;
  };

  // ─ Moderation ──────────────────────────────────────────────────────────────
  moderation: {
    reportsOpen: number;
    reportsUnderReview: number;
    reportsResolved: number;
    reportsDismissed: number;
    unresolvedQualityFlags: number;
  };

  // ─ Support / messaging ──────────────────────────────────────────────────────
  support: {
    totalThreads: number;
    totalMessages: number;
    recentMessages: number;
  };

  // ─ CMS ─────────────────────────────────────────────────────────────────────
  cms: {
    activeAnnouncements: number;
    archivedAnnouncements: number;
    activeContentBlocks: number;
  };

  // ─ Platform ─────────────────────────────────────────────────────────────────
  totalCitizenUsers: number;
}

export interface AdminDashboardSummary {
  pendingListings: number;
  pendingOpportunities: number;
  pendingProviders: number;
  openThreads: number;
  totalCitizenUsers: number;
  openReports: number;
  flaggedItems: number;
  activeAnnouncements: number;
  recentAuditHighlights: {
    id: string;
    actionType: string;
    actorName: string;
    actorRole: string;
    timestamp: string;
    metadata: Record<string, unknown>;
  }[];
}

interface Envelope<T> {
  data?: T;
  items?: T;
}

const unwrap = <T>(payload: T | Envelope<T>): T => {
  if (
    payload &&
    typeof payload === 'object' &&
    'data' in (payload as Envelope<T>) &&
    (payload as Envelope<T>).data !== undefined
  ) {
    return (payload as Envelope<T>).data as T;
  }

  if (
    payload &&
    typeof payload === 'object' &&
    'items' in (payload as Envelope<T>) &&
    (payload as Envelope<T>).items !== undefined
  ) {
    return (payload as Envelope<T>).items as T;
  }

  return payload as T;
};

const isDevSessionToken = (token: string | null): boolean =>
  Boolean(token && token.startsWith('dev-jwt-'));

const devAdminProperties: AdminPropertyDetail[] = [
  {
    id: 'pending-001',
    title: 'Zarqa Mixed Use Tower',
    ownerName: 'Omar Al-Hindi',
    location: 'Zarqa, New Downtown',
    submissionDate: '2026-03-01T08:30:00.000Z',
    verificationStatus: 'pending_verification',
    propertyVerificationStatus: 'pending',
    identityVerificationStatus: 'pending',
    verificationRecordId: 'aqarya-vrf-dev-001',
    blockchainHash: '0xpendinghash',
    blockchainTransactionId: null,
    blockchainStatus: 'pending',
    anchoredAt: null,
    updatedAt: '2026-03-01T08:30:00.000Z',
    price: 3050000,
    propertyValue: 3000000,
    totalShares: 15000,
    availableShares: 15000,
    ownershipType: 'Freehold',
    ownershipProofType: 'title_deed',
    ownershipProofNumber: 'CI-TD-001',
    description: 'Pending citizen listing combining office, retail, and serviced apartments.',
    imageUrls: [],
    verificationPayload: {
      provider: 'mock-chain',
      network: 'local-simnet',
    },
    seller: {
      id: 'citizen',
      username: 'citizen',
      role: 'citizen',
    },
    auditEvents: [],
  },
];

let devAuditLogs: AuditLogItem[] = [];

const toAdminProperty = (property: AdminPropertyDetail): AdminProperty => ({
  id: property.id,
  title: property.title,
  ownerName: property.ownerName,
  location: property.location,
  submissionDate: property.submissionDate,
  verificationStatus: property.verificationStatus,
  propertyVerificationStatus: property.propertyVerificationStatus,
  identityVerificationStatus: property.identityVerificationStatus,
  rejectionReason: property.rejectionReason,
  reviewerNotes: property.reviewerNotes,
  verificationRecordId: property.verificationRecordId,
  blockchainHash: property.blockchainHash,
  blockchainTransactionId: property.blockchainTransactionId,
  blockchainStatus: property.blockchainStatus,
  anchoredAt: property.anchoredAt,
  updatedAt: property.updatedAt,
});

const appendDevAudit = (
  actionType: AdminActionType,
  propertyId: string,
  metadata: Record<string, unknown> = {},
): void => {
  const item: AuditLogItem = {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    actorName: 'Dev Admin',
    actorRole: 'admin',
    actionType,
    propertyId,
    timestamp: new Date().toISOString(),
    metadata,
  };

  devAuditLogs = [item, ...devAuditLogs];

  const property = devAdminProperties.find(candidate => candidate.id === propertyId);
  if (property) {
    property.auditEvents = [item, ...property.auditEvents];
  }
};

export const getAdminProperties = async (
  status: VerificationStatus | 'all' = 'all',
): Promise<AdminProperty[]> => {
  const token = await getSecureToken();
  if (import.meta.env.DEV && isDevSessionToken(token)) {
    return devAdminProperties
      .filter(property => status === 'all' || property.verificationStatus === status)
      .map(toAdminProperty);
  }

  const response = await adminApi.get<AdminProperty[] | Envelope<AdminProperty[]>>(
    '/admin/properties',
    {
      params: {status},
    },
  );
  return unwrap<AdminProperty[]>(response.data);
};

export const getAdminPropertyDetails = async (
  propertyId: string,
): Promise<AdminPropertyDetail> => {
  const token = await getSecureToken();
  if (import.meta.env.DEV && isDevSessionToken(token)) {
    const property = devAdminProperties.find(item => item.id === propertyId);
    if (!property) {
      throw new Error('Property not found.');
    }
    return property;
  }

  const response = await adminApi.get<
    AdminPropertyDetail | Envelope<AdminPropertyDetail>
  >(`/admin/properties/${propertyId}`);
  return unwrap<AdminPropertyDetail>(response.data);
};

export const verifyProperty = async (propertyId: string): Promise<AdminProperty> => {
  const token = await getSecureToken();
  if (import.meta.env.DEV && isDevSessionToken(token)) {
    const target = devAdminProperties.find(property => property.id === propertyId);
    if (!target) {
      throw new Error('Property not found.');
    }

    target.verificationStatus = 'verified';
    target.propertyVerificationStatus = 'verified';
    target.identityVerificationStatus = 'verified';
    target.updatedAt = new Date().toISOString();
    appendDevAudit('listing_verified', propertyId, {status: target.verificationStatus});
    return toAdminProperty(target);
  }

  const response = await adminApi.post<AdminProperty | Envelope<AdminProperty>>(
    `/admin/properties/${propertyId}/verify`,
  );
  return unwrap<AdminProperty>(response.data);
};

export const freezeProperty = async (propertyId: string): Promise<AdminProperty> => {
  const token = await getSecureToken();
  if (import.meta.env.DEV && isDevSessionToken(token)) {
    const target = devAdminProperties.find(property => property.id === propertyId);
    if (!target) {
      throw new Error('Property not found.');
    }

    target.verificationStatus = 'frozen';
    target.updatedAt = new Date().toISOString();
    appendDevAudit('listing_frozen', propertyId, {status: target.verificationStatus});
    return toAdminProperty(target);
  }

  const response = await adminApi.post<AdminProperty | Envelope<AdminProperty>>(
    `/admin/properties/${propertyId}/freeze`,
  );
  return unwrap<AdminProperty>(response.data);
};

export const anchorProperty = async (
  propertyId: string,
): Promise<AnchoredPropertyResponse> => {
  const token = await getSecureToken();
  if (import.meta.env.DEV && isDevSessionToken(token)) {
    const target = devAdminProperties.find(property => property.id === propertyId);
    if (!target) {
      throw new Error('Property not found.');
    }

    const anchoredAt = new Date().toISOString();
    const blockchainHash = target.blockchainHash ?? `0x${Date.now().toString(16)}`;
    const blockchainTransactionId = `0x${Math.random()
      .toString(16)
      .slice(2)
      .padEnd(64, 'b')
      .slice(0, 64)}`;

    target.blockchainHash = blockchainHash;
    target.blockchainTransactionId = blockchainTransactionId;
    target.blockchainStatus = 'anchored';
    target.anchoredAt = anchoredAt;
    target.updatedAt = anchoredAt;

    appendDevAudit('anchor', propertyId, {blockchainHash, blockchainTransactionId});

    return {
      property: toAdminProperty(target),
      anchor: {
        blockchainHash,
        blockchainTransactionId,
        anchoredAt,
      },
    };
  }

  const response = await adminApi.post<
    AnchoredPropertyResponse | Envelope<AnchoredPropertyResponse>
  >(`/admin/properties/${propertyId}/anchor`);
  return unwrap<AnchoredPropertyResponse>(response.data);
};

export const getAuditLogs = async (
  filters: AuditLogFilters = {},
): Promise<AuditLogsResponse> => {
  const token = await getSecureToken();
  if (import.meta.env.DEV && isDevSessionToken(token)) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const start = (page - 1) * limit;

    return {
      items: devAuditLogs.slice(start, start + limit),
      page,
      limit,
      total: devAuditLogs.length,
    };
  }

  const response = await adminApi.get<
    AuditLogsResponse | Envelope<AuditLogsResponse>
  >('/admin/audit-logs', {
    params: {
      page: filters.page ?? 1,
      limit: filters.limit ?? 20,
      actionType: filters.actionType,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
    },
  });
  return unwrap<AuditLogsResponse>(response.data);
};

export const getDashboardSummary = async (): Promise<AdminDashboardSummary> => {
  const response = await adminApi.get<AdminDashboardSummary | Envelope<AdminDashboardSummary>>(
    '/admin/dashboard/summary',
  );
  return unwrap<AdminDashboardSummary>(response.data);
};

export const getAnalytics = async (): Promise<AdminAnalytics> => {
  const token = await getSecureToken();
  if (import.meta.env.DEV && isDevSessionToken(token)) {
    const verified = devAdminProperties.filter(p => p.verificationStatus === 'verified').length;
    const pending = devAdminProperties.filter(p => p.verificationStatus === 'pending_verification').length;
    const frozen = devAdminProperties.filter(p => p.verificationStatus === 'frozen').length;
    const sold = devAdminProperties.filter(p => p.verificationStatus === 'sold').length;
    const anchored = devAdminProperties.filter(p => p.blockchainStatus === 'anchored').length;
    return {
      totalProperties: devAdminProperties.length,
      verifiedProperties: verified,
      pendingVerificationProperties: pending,
      needsChangesProperties: 0,
      rejectedProperties: 0,
      frozenProperties: frozen,
      soldProperties: sold,
      totalSimulations: 0,
      totalAnchored: anchored,
      lastAnchoredAt: null,
      totalSimulationVolume: 0,
      investments: {draft: 0, submitted: 1, underReview: 0, approved: 0, published: 0, rejected: 0, totalSimulations: 0, totalSimulationVolume: 0},
      providers: {total: 0, unverified: 0, underReview: 0, verified: 0, rejected: 0, suspended: 0},
      moderation: {reportsOpen: 0, reportsUnderReview: 0, reportsResolved: 0, reportsDismissed: 0, unresolvedQualityFlags: 0},
      support: {totalThreads: 0, totalMessages: 0, recentMessages: 0},
      cms: {activeAnnouncements: 0, archivedAnnouncements: 0, activeContentBlocks: 0},
      totalCitizenUsers: 0,
    };
  }

  const response = await adminApi.get<AdminAnalytics | Envelope<AdminAnalytics>>(
    '/admin/analytics',
  );
  return unwrap<AdminAnalytics>(response.data);
};

export const rejectProperty = async (
  propertyId: string,
  reason: string,
): Promise<AdminProperty> => {
  const response = await adminApi.post<AdminProperty | Envelope<AdminProperty>>(
    `/admin/properties/${propertyId}/reject`,
    {reason},
  );
  return unwrap<AdminProperty>(response.data);
};

export const requestPropertyChanges = async (
  propertyId: string,
  notes: string,
): Promise<AdminProperty> => {
  const response = await adminApi.post<AdminProperty | Envelope<AdminProperty>>(
    `/admin/properties/${propertyId}/request-changes`,
    {notes},
  );
  return unwrap<AdminProperty>(response.data);
};

// ─── User / Provider Management ──────────────────────────────────────────────

export type AccountType = 'individual' | 'owner' | 'agency' | 'developer' | 'partner';
export type ProviderVerificationStatus =
  | 'unverified'
  | 'under_review'
  | 'verified'
  | 'rejected'
  | 'suspended';
export type ProviderReviewAction =
  | 'under_review'
  | 'verify'
  | 'reject'
  | 'suspend'
  | 'update_notes';

export interface AdminUser {
  id: string;
  username: string;
  role: string;
  createdAt: string;
  providerProfile: {
    accountType: AccountType;
    providerVerificationStatus: ProviderVerificationStatus;
    businessName: string | null;
    contactPerson: string | null;
  } | null;
  counts: {
    properties: number;
    simulations: number;
    threads: number;
  };
}

export interface AdminUserDetail {
  id: string;
  username: string;
  role: string;
  createdAt: string;
  counts: {
    properties: number;
    simulations: number;
    threads: number;
    notifications: number;
  };
  providerProfile: {
    accountType: AccountType;
    providerVerificationStatus: ProviderVerificationStatus;
    businessName: string | null;
    contactPerson: string | null;
    phone: string | null;
    email: string | null;
    registrationNumber: string | null;
    licenseNumber: string | null;
    providerType: string | null;
    documentUrls: string[];
    adminNotes: string | null;
    rejectionReason: string | null;
    submittedAt: string | null;
    reviewedAt: string | null;
    reviewedBy: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
}

export const getAdminUsers = async (
  accountType?: string,
  providerStatus?: string,
): Promise<AdminUser[]> => {
  const params: Record<string, string> = {};
  if (accountType) {
    params.accountType = accountType;
  }
  if (providerStatus) {
    params.providerStatus = providerStatus;
  }
  const response = await adminApi.get<AdminUser[] | Envelope<AdminUser[]>>(
    '/admin/users',
    {params},
  );
  return unwrap<AdminUser[]>(response.data);
};

export const getAdminUserDetail = async (userId: string): Promise<AdminUserDetail> => {
  const response = await adminApi.get<AdminUserDetail | Envelope<AdminUserDetail>>(
    `/admin/users/${userId}`,
  );
  return unwrap<AdminUserDetail>(response.data);
};

export const reviewProviderAccount = async (
  userId: string,
  action: ProviderReviewAction,
  notes?: string,
): Promise<AdminUserDetail> => {
  const response = await adminApi.post<AdminUserDetail | Envelope<AdminUserDetail>>(
    `/admin/users/${userId}/provider-review`,
    {action, notes},
  );
  return unwrap<AdminUserDetail>(response.data);
};

export const getAdminInvestmentOpportunities = async (
  status?: InvestmentOpportunityStatus | 'all',
): Promise<AdminInvestmentOpportunity[]> => {
  const response = await adminApi.get<
    AdminInvestmentOpportunity[] | Envelope<AdminInvestmentOpportunity[]>
  >('/admin/investment-opportunities', {
    params: status && status !== 'all' ? {status} : undefined,
  });
  return unwrap<AdminInvestmentOpportunity[]>(response.data);
};

export const getAdminInvestmentOpportunityDetails = async (
  opportunityId: string,
): Promise<AdminInvestmentOpportunityDetail> => {
  const response = await adminApi.get<
    AdminInvestmentOpportunityDetail | Envelope<AdminInvestmentOpportunityDetail>
  >(`/admin/investment-opportunities/${opportunityId}`);
  return unwrap<AdminInvestmentOpportunityDetail>(response.data);
};

export const reviewInvestmentOpportunity = async (
  opportunityId: string,
  action: InvestmentReviewAction,
  notes?: string,
): Promise<AdminInvestmentOpportunity> => {
  const response = await adminApi.post<
    AdminInvestmentOpportunity | Envelope<AdminInvestmentOpportunity>
  >(`/admin/investment-opportunities/${opportunityId}/review`, {action, notes});
  return unwrap<AdminInvestmentOpportunity>(response.data);
};
