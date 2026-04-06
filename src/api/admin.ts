import {createAuthenticatedApiClient} from './client';
import {VerificationStatus} from './properties';
import {getSecureToken} from '../services/secureStorage';

const adminApi = createAuthenticatedApiClient();

export type AdminActionType =
  | 'listing_submitted'
  | 'listing_verified'
  | 'listing_rejected'
  | 'listing_frozen'
  | 'anchor'
  | 'login'
  | 'simulate';

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
  totalProperties: number;
  verifiedProperties: number;
  pendingVerificationProperties: number;
  frozenProperties: number;
  soldProperties: number;
  totalSimulations: number;
  totalAnchored: number;
  lastAnchoredAt: string | null;
  totalSimulationVolume: number;
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

let devAdminProperties: AdminPropertyDetail[] = [
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
  if (__DEV__ && isDevSessionToken(token)) {
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
  if (__DEV__ && isDevSessionToken(token)) {
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
  if (__DEV__ && isDevSessionToken(token)) {
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
  if (__DEV__ && isDevSessionToken(token)) {
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
  if (__DEV__ && isDevSessionToken(token)) {
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
  if (__DEV__ && isDevSessionToken(token)) {
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

export const getAnalytics = async (): Promise<AdminAnalytics> => {
  const token = await getSecureToken();
  if (__DEV__ && isDevSessionToken(token)) {
    return {
      totalProperties: devAdminProperties.length,
      verifiedProperties: devAdminProperties.filter(
        property => property.verificationStatus === 'verified',
      ).length,
      pendingVerificationProperties: devAdminProperties.filter(
        property => property.verificationStatus === 'pending_verification',
      ).length,
      frozenProperties: devAdminProperties.filter(
        property => property.verificationStatus === 'frozen',
      ).length,
      soldProperties: devAdminProperties.filter(
        property => property.verificationStatus === 'sold',
      ).length,
      totalSimulations: 0,
      totalAnchored: devAdminProperties.filter(
        property => property.blockchainStatus === 'anchored',
      ).length,
      lastAnchoredAt: null,
      totalSimulationVolume: 0,
    };
  }

  const response = await adminApi.get<AdminAnalytics | Envelope<AdminAnalytics>>(
    '/admin/analytics',
  );
  return unwrap<AdminAnalytics>(response.data);
};
