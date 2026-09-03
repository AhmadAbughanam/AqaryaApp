import {
  announcements,
  auditEvents,
  contentBlocks,
  mockDelay,
  MockError,
  nowIso,
  notifications,
  properties,
  recordAudit,
  reports,
  threads,
  users,
  type MockUser,
  type PropertyRecord,
} from '../mock/db';
import type {VerificationStatus} from './properties';

export type AdminActionType =
  | 'login'
  | 'listing_submitted'
  | 'listing_verified'
  | 'listing_rejected'
  | 'listing_changes_requested'
  | 'listing_frozen'
  | 'anchor'
  | 'offer_submitted'
  | 'lease_offer_submitted'
  | 'opportunity_approved'
  | 'opportunity_rejected'
  | 'opportunity_published'
  | 'opportunity_unpublished';

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
  ownershipType: string;
  ownershipProofType: string;
  ownershipProofNumber: string;
  description: string;
  imageUrls: string[];
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
  providers: {
    total: number;
    unverified: number;
    underReview: number;
    verified: number;
    rejected: number;
    suspended: number;
  };
  moderation: {
    reportsOpen: number;
    reportsUnderReview: number;
    reportsResolved: number;
    reportsDismissed: number;
    unresolvedQualityFlags: number;
  };
  support: {
    totalThreads: number;
    totalMessages: number;
    recentMessages: number;
  };
  cms: {
    activeAnnouncements: number;
    archivedAnnouncements: number;
    activeContentBlocks: number;
  };
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

export type AccountType =
  | 'individual'
  | 'owner'
  | 'agency'
  | 'developer'
  | 'partner';
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

// ─── helpers ────────────────────────────────────────────────────────────────

const countFor = (userId: string) => ({
  properties: properties.filter(record => record.ownerId === userId).length,
  simulations: 0,
  threads: userId === 'citizen' ? threads.length : 0,
});

const toAdminProperty = (record: PropertyRecord): AdminProperty => ({
  id: record.id,
  title: record.title,
  ownerName: record.ownerName,
  location: record.location,
  submissionDate: record.submissionDate,
  verificationStatus: record.verificationStatus,
  propertyVerificationStatus: record.propertyVerificationStatus,
  identityVerificationStatus: record.identityVerificationStatus,
  rejectionReason: record.rejectionReason,
  reviewerNotes: record.reviewerNotes,
  verificationRecordId: record.verificationRecordId,
  blockchainHash: record.recordHash,
  blockchainTransactionId: record.recordStatus === 'sealed' ? record.recordHash : null,
  blockchainStatus: record.recordStatus === 'sealed' ? 'anchored' : 'pending',
  anchoredAt: record.recordStatus === 'sealed' ? record.updatedAt : null,
  updatedAt: record.updatedAt,
});

const auditItemsForProperty = (propertyId: string): AuditLogItem[] =>
  auditEvents
    .filter(event => event.propertyId === propertyId)
    .map(event => ({
      id: event.id,
      actorId: event.actorId,
      actorName: event.actorName,
      actorRole: event.actorRole,
      actionType: event.actionType as AdminActionType,
      propertyId: event.propertyId,
      timestamp: event.timestamp,
      metadata: event.metadata,
    }));

const findProperty = (id: string): PropertyRecord => {
  const record = properties.find(item => item.id === id);
  if (!record) throw new MockError('Property not found.', 404);
  return record;
};

// ─── property review ────────────────────────────────────────────────────────

export const getAdminProperties = async (
  status: VerificationStatus | 'all' = 'all',
): Promise<AdminProperty[]> => {
  await mockDelay();
  return properties
    .filter(record => status === 'all' || record.verificationStatus === status)
    .map(toAdminProperty);
};

export const getAdminPropertyDetails = async (
  propertyId: string,
): Promise<AdminPropertyDetail> => {
  await mockDelay();
  const record = findProperty(propertyId);
  const owner = users.find(user => user.id === record.ownerId);
  return {
    ...toAdminProperty(record),
    price: record.price,
    propertyValue: record.propertyValue,
    ownershipType: record.ownershipType,
    ownershipProofType: record.ownershipProofType,
    ownershipProofNumber: record.ownershipProofNumber,
    description: record.description,
    imageUrls: record.imageUrls,
    seller: {
      id: record.ownerId,
      username: owner?.username ?? record.ownerName,
      role: owner?.role ?? 'citizen',
    },
    auditEvents: auditItemsForProperty(record.id),
  };
};

export const verifyProperty = async (propertyId: string): Promise<AdminProperty> => {
  await mockDelay();
  const record = findProperty(propertyId);
  record.verificationStatus = 'verified';
  record.propertyVerificationStatus = 'verified';
  record.identityVerificationStatus = 'verified';
  record.recordStatus = 'sealed';
  record.updatedAt = nowIso();
  record.verificationTimestamp = record.updatedAt;
  recordAudit({
    actorId: 'admin',
    actorName: 'Registry Reviewer',
    actorRole: 'admin',
    actionType: 'listing_verified',
    propertyId,
    metadata: {status: 'verified'},
  });
  return toAdminProperty(record);
};

export const freezeProperty = async (propertyId: string): Promise<AdminProperty> => {
  await mockDelay();
  const record = findProperty(propertyId);
  record.verificationStatus = 'frozen';
  record.updatedAt = nowIso();
  recordAudit({
    actorId: 'admin',
    actorName: 'Registry Reviewer',
    actorRole: 'admin',
    actionType: 'listing_frozen',
    propertyId,
    metadata: {},
  });
  return toAdminProperty(record);
};

export const anchorProperty = async (
  propertyId: string,
): Promise<AnchoredPropertyResponse> => {
  await mockDelay();
  const record = findProperty(propertyId);
  record.recordStatus = 'sealed';
  record.updatedAt = nowIso();
  recordAudit({
    actorId: 'admin',
    actorName: 'Registry Reviewer',
    actorRole: 'admin',
    actionType: 'anchor',
    propertyId,
    metadata: {recordHash: record.recordHash},
  });
  return {
    property: toAdminProperty(record),
    anchor: {
      blockchainHash: record.recordHash,
      blockchainTransactionId: record.recordHash,
      anchoredAt: record.updatedAt,
    },
  };
};

export const rejectProperty = async (
  propertyId: string,
  reason: string,
): Promise<AdminProperty> => {
  await mockDelay();
  const record = findProperty(propertyId);
  record.verificationStatus = 'rejected';
  record.propertyVerificationStatus = 'rejected';
  record.rejectionReason = reason;
  record.updatedAt = nowIso();
  recordAudit({
    actorId: 'admin',
    actorName: 'Registry Reviewer',
    actorRole: 'admin',
    actionType: 'listing_rejected',
    propertyId,
    metadata: {reason},
  });
  return toAdminProperty(record);
};

export const requestPropertyChanges = async (
  propertyId: string,
  notes: string,
): Promise<AdminProperty> => {
  await mockDelay();
  const record = findProperty(propertyId);
  record.verificationStatus = 'needs_changes';
  record.reviewerNotes = notes;
  record.updatedAt = nowIso();
  recordAudit({
    actorId: 'admin',
    actorName: 'Registry Reviewer',
    actorRole: 'admin',
    actionType: 'listing_changes_requested',
    propertyId,
    metadata: {notes},
  });
  return toAdminProperty(record);
};

// ─── audit + analytics ──────────────────────────────────────────────────────

export const getAuditLogs = async (
  filters: AuditLogFilters = {},
): Promise<AuditLogsResponse> => {
  await mockDelay();
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 20;
  const all: AuditLogItem[] = auditEvents.map(event => ({
    id: event.id,
    actorId: event.actorId,
    actorName: event.actorName,
    actorRole: event.actorRole,
    actionType: event.actionType as AdminActionType,
    propertyId: event.propertyId,
    timestamp: event.timestamp,
    metadata: event.metadata,
  }));
  const filtered = filters.actionType
    ? all.filter(item => item.actionType === filters.actionType)
    : all;
  const start = (page - 1) * limit;
  return {
    items: filtered.slice(start, start + limit),
    page,
    limit,
    total: filtered.length,
  };
};

export const getAnalytics = async (): Promise<AdminAnalytics> => {
  await mockDelay();
  const byStatus = (status: VerificationStatus) =>
    properties.filter(record => record.verificationStatus === status).length;
  const sealed = properties.filter(record => record.recordStatus === 'sealed').length;
  const providerList = users.filter(user => user.providerVerificationStatus);
  const providerCount = (status: string) =>
    providerList.filter(user => user.providerVerificationStatus === status).length;
  const messageCount = threads.reduce((sum, thread) => sum + thread.messages.length, 0);
  return {
    totalProperties: properties.length,
    verifiedProperties: byStatus('verified'),
    pendingVerificationProperties: byStatus('pending_verification'),
    needsChangesProperties: byStatus('needs_changes'),
    rejectedProperties: byStatus('rejected'),
    frozenProperties: byStatus('frozen'),
    soldProperties: byStatus('sold'),
    totalSimulations: 0,
    totalAnchored: sealed,
    lastAnchoredAt: properties.find(record => record.recordStatus === 'sealed')?.updatedAt ?? null,
    totalSimulationVolume: 0,
    investments: {
      draft: 0,
      submitted: OPPORTUNITIES.filter(o => o.status === 'submitted').length,
      underReview: OPPORTUNITIES.filter(o => o.status === 'under_review').length,
      approved: OPPORTUNITIES.filter(o => o.status === 'approved').length,
      published: OPPORTUNITIES.filter(o => o.status === 'published').length,
      rejected: OPPORTUNITIES.filter(o => o.status === 'rejected').length,
      totalSimulations: 0,
      totalSimulationVolume: 0,
    },
    providers: {
      total: providerList.length,
      unverified: providerCount('unverified'),
      underReview: providerCount('under_review'),
      verified: providerCount('verified'),
      rejected: providerCount('rejected'),
      suspended: providerCount('suspended'),
    },
    moderation: {
      reportsOpen: reports.filter(report => report.status === 'open').length,
      reportsUnderReview: reports.filter(report => report.status === 'under_review').length,
      reportsResolved: reports.filter(report => report.status === 'resolved').length,
      reportsDismissed: reports.filter(report => report.status === 'dismissed').length,
      unresolvedQualityFlags: reports.filter(
        report => report.reason === 'duplicate' && report.status === 'open',
      ).length,
    },
    support: {
      totalThreads: threads.length,
      totalMessages: messageCount,
      recentMessages: messageCount,
    },
    cms: {
      activeAnnouncements: announcements.filter(item => item.status === 'active').length,
      archivedAnnouncements: announcements.filter(item => item.status === 'archived').length,
      activeContentBlocks: contentBlocks.filter(block => block.active).length,
    },
    totalCitizenUsers: users.filter(user => user.role === 'citizen').length,
  };
};

export const getDashboardSummary = async (): Promise<AdminDashboardSummary> => {
  await mockDelay();
  return {
    pendingListings: properties.filter(
      record => record.verificationStatus === 'pending_verification',
    ).length,
    pendingOpportunities: OPPORTUNITIES.filter(
      o => o.status === 'submitted' || o.status === 'under_review',
    ).length,
    pendingProviders: users.filter(
      user => user.providerVerificationStatus === 'under_review',
    ).length,
    openThreads: threads.length,
    totalCitizenUsers: users.filter(user => user.role === 'citizen').length,
    openReports: reports.filter(report => report.status === 'open').length,
    flaggedItems: reports.filter(
      report => report.reason === 'duplicate' && report.status === 'open',
    ).length,
    activeAnnouncements: announcements.filter(item => item.status === 'active').length,
    recentAuditHighlights: auditEvents.slice(0, 6).map(event => ({
      id: event.id,
      actionType: event.actionType,
      actorName: event.actorName,
      actorRole: event.actorRole,
      timestamp: event.timestamp,
      metadata: event.metadata,
    })),
  };
};

// ─── users / providers ──────────────────────────────────────────────────────

const toAdminUser = (user: MockUser): AdminUser => ({
  id: user.id,
  username: user.username,
  role: user.role,
  createdAt: user.createdAt,
  providerProfile: user.providerVerificationStatus
    ? {
        accountType: user.accountType,
        providerVerificationStatus: user.providerVerificationStatus,
        businessName: user.businessName,
        contactPerson: user.contactPerson,
      }
    : null,
  counts: countFor(user.id),
});

export const getAdminUsers = async (
  accountType?: string,
  providerStatus?: string,
): Promise<AdminUser[]> => {
  await mockDelay();
  return users
    .filter(user => !accountType || user.accountType === accountType)
    .filter(
      user => !providerStatus || user.providerVerificationStatus === providerStatus,
    )
    .map(toAdminUser);
};

export const getAdminUserDetail = async (
  userId: string,
): Promise<AdminUserDetail> => {
  await mockDelay();
  const user = users.find(item => item.id === userId);
  if (!user) throw new MockError('User not found.', 404);
  const counts = countFor(user.id);
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    createdAt: user.createdAt,
    counts: {
      ...counts,
      notifications: user.id === 'citizen' ? notifications.length : 0,
    },
    providerProfile: user.providerVerificationStatus
      ? {
          accountType: user.accountType,
          providerVerificationStatus: user.providerVerificationStatus,
          businessName: user.businessName,
          contactPerson: user.contactPerson,
          phone: user.phone,
          email: user.email,
          registrationNumber: user.registrationNumber,
          licenseNumber: user.licenseNumber,
          providerType: user.accountType,
          documentUrls: [],
          adminNotes: user.adminNotes,
          rejectionReason: user.rejectionReason,
          submittedAt: user.createdAt,
          reviewedAt: null,
          reviewedBy: null,
          createdAt: user.createdAt,
          updatedAt: user.createdAt,
        }
      : null,
  };
};

export const reviewProviderAccount = async (
  userId: string,
  action: ProviderReviewAction,
  notes?: string,
): Promise<AdminUserDetail> => {
  await mockDelay();
  const user = users.find(item => item.id === userId);
  if (!user) throw new MockError('User not found.', 404);
  if (action === 'verify') user.providerVerificationStatus = 'verified';
  else if (action === 'reject') user.providerVerificationStatus = 'rejected';
  else if (action === 'suspend') user.providerVerificationStatus = 'suspended';
  else if (action === 'under_review') user.providerVerificationStatus = 'under_review';
  if (notes !== undefined) user.adminNotes = notes;
  return getAdminUserDetail(userId);
};

// ─── investment opportunities (governance view) ─────────────────────────────

const OPPORTUNITIES: AdminInvestmentOpportunityDetail[] = [
  {
    id: 'opp-001',
    title: 'Umrah District 4 — Serviced Plots Block',
    location: 'Umrah City, District 4',
    sponsorName: 'Umrah City Development',
    assetClass: 'Land',
    stage: 'Master-plan phase',
    riskBand: 'Moderate',
    status: 'under_review',
    trustScore: 72,
    trustBadge: 'verified',
    pricePerShare: 500,
    totalShares: 4000,
    availableShares: 4000,
    targetIrr: 14,
    targetCashYield: 0,
    targetHoldYears: 5,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    description:
      'A block of serviced residential plots inside the new Umrah city grid, each tied to a single master-plan reference.',
    imageUrls: [],
    ownershipStructure: 'State-owned land under phased development',
    distributionModel: 'Capital appreciation on plot resale',
    exitModel: 'Plot-by-plot sale after registration',
    minimumShares: 4,
    fundingGoal: 2_000_000,
    fundedAmount: 0,
    appreciationRate: 12,
    occupancyRate: 0,
    managementFeeRate: 1,
    reviewNotes: null,
    rejectionReason: null,
    publishedAt: null,
    reviewedAt: null,
    reviewedBy: null,
    verificationRecordId: 'aqarya-vrf-opp-001',
    blockchainHash: 'AQ-OPP001',
    blockchainTxId: null,
    blockchainStatus: 'pending',
    anchoredAt: null,
  },
];

export const getAdminInvestmentOpportunities = async (
  status?: InvestmentOpportunityStatus | 'all',
): Promise<AdminInvestmentOpportunity[]> => {
  await mockDelay();
  return OPPORTUNITIES.filter(
    opportunity => !status || status === 'all' || opportunity.status === status,
  ).map(({description, imageUrls, ...summary}) => {
    void description;
    void imageUrls;
    return summary;
  });
};

export const getAdminInvestmentOpportunityDetails = async (
  opportunityId: string,
): Promise<AdminInvestmentOpportunityDetail> => {
  await mockDelay();
  const opportunity = OPPORTUNITIES.find(item => item.id === opportunityId);
  if (!opportunity) throw new MockError('Opportunity not found.', 404);
  return {...opportunity};
};

export const reviewInvestmentOpportunity = async (
  opportunityId: string,
  action: InvestmentReviewAction,
  notes?: string,
): Promise<AdminInvestmentOpportunity> => {
  await mockDelay();
  const opportunity = OPPORTUNITIES.find(item => item.id === opportunityId);
  if (!opportunity) throw new MockError('Opportunity not found.', 404);
  if (action === 'approve') opportunity.status = 'approved';
  else if (action === 'reject') {
    opportunity.status = 'rejected';
    opportunity.rejectionReason = notes ?? null;
  } else if (action === 'publish') opportunity.status = 'published';
  else if (action === 'unpublish') opportunity.status = 'approved';
  opportunity.reviewNotes = notes ?? opportunity.reviewNotes;
  opportunity.updatedAt = nowIso();
  const {description, imageUrls, ...summary} = opportunity;
  void description;
  void imageUrls;
  return summary;
};
