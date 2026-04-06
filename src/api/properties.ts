import {getSecureToken} from '../services/secureStorage';
import {ApiError, createAuthenticatedApiClient} from './client';

export type VerificationStatus =
  | 'pending'
  | 'pending_verification'
  | 'verified'
  | 'rejected'
  | 'frozen'
  | 'sold';

export type MarketType = 'sale' | 'investment';

export interface PropertyListItem {
  id: string;
  title: string;
  location: string;
  ownerName: string;
  description: string;
  price: number;
  propertyValue: number;
  totalShares: number;
  availableShares: number;
  marketType: MarketType;
  verificationStatus: VerificationStatus;
  verificationTimestamp: string;
}

export interface PropertyAuditItem {
  id: string;
  actorName: string;
  actorRole: string;
  actionType: string;
  timestamp: string;
  metadata: Record<string, unknown>;
}

export interface PropertyDetails extends PropertyListItem {
  ownerId?: string | null;
  seller?: {
    id: string;
    username: string;
  } | null;
  ownershipType: string;
  ownershipProofType: string;
  ownershipProofNumber: string;
  pricePerShare: number;
  propertyVerificationStatus: 'pending' | 'verified' | 'rejected';
  identityVerificationStatus: 'pending' | 'verified' | 'rejected';
  rejectionReason?: string | null;
  blockchainHash: string;
  blockchainTransactionId: string;
  blockchainStatus: 'pending' | 'anchored' | 'failed';
  imageUrls: string[];
  createdAt: string;
  updatedAt: string;
  verificationRecordId?: string | null;
  verificationPayload?: Record<string, unknown> | null;
  auditTrail: PropertyAuditItem[];
}

export interface CreateSaleListingRequest {
  sourcePropertyId?: string;
  title: string;
  location: string;
  ownerName: string;
  ownershipType: string;
  ownershipProofType: string;
  ownershipProofNumber: string;
  description: string;
  imageUrls?: string[];
  price: number;
  propertyValue: number;
  totalShares?: number;
}

interface PaginatedPropertiesResponse {
  items: PropertyListItem[];
  page: number;
  limit: number;
  total: number;
}

interface Envelope<T> {
  data?: T;
  items?: T;
}

export interface PurchasePropertyResponse extends PropertyListItem {
  message: string;
}

export interface GetPropertiesParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface PropertiesPage {
  items: PropertyListItem[];
  page: number;
  limit: number;
  total: number;
  hasNextPage: boolean;
}

const propertiesApi = createAuthenticatedApiClient();

const isDevSessionToken = (token: string | null): boolean =>
  Boolean(token && token.startsWith('dev-jwt-'));

const devPropertyRecords: PropertyDetails[] = [
  {
    id: 'prop-001',
    title: 'Jabal Amman Courtyard House',
    location: 'Amman, Jabal Amman',
    ownerName: 'Mahmoud Al-Khatib',
    description: 'Verified family home listed for direct sale in a prime residential quarter.',
    price: 1550000,
    propertyValue: 1500000,
    totalShares: 1,
    availableShares: 1,
    marketType: 'sale',
    verificationStatus: 'verified',
    verificationTimestamp: '2026-02-12T09:20:00.000Z',
    ownerId: 'citizen',
    seller: {
      id: 'citizen',
      username: 'citizen',
    },
    ownershipType: 'Freehold',
    ownershipProofType: 'title_deed',
    ownershipProofNumber: 'TD-2026-1001',
    pricePerShare: 1550000,
    propertyVerificationStatus: 'verified',
    identityVerificationStatus: 'verified',
    rejectionReason: null,
    blockchainHash:
      '0x7f8dd31fa6f4214f9cc441ea77c9a3f2126e4a2ac69d8f39f8a6e6230a1d4d79',
    blockchainTransactionId:
      '0x3abf1dd923e9e7f55a89c4db03b8ad4f73f8fbcf6a9e1476c2d7d0cb4ce11f28',
    blockchainStatus: 'anchored',
    imageUrls: [],
    createdAt: '2025-11-03T10:00:00.000Z',
    updatedAt: '2026-02-12T09:20:00.000Z',
    verificationRecordId: 'aqarya-vrf-dev-sale-001',
    verificationPayload: {
      provider: 'mock-chain',
      ownershipSignals: {ownerLinkedToAccount: true},
    },
    auditTrail: [],
  },
  {
    id: 'prop-002',
    title: 'Irbid Hillside Villa',
    location: 'Irbid, University Street',
    ownerName: 'Rana Al-Majali',
    description: 'Standalone villa approved for sale and visible in the public sale marketplace.',
    price: 2250000,
    propertyValue: 2200000,
    totalShares: 1,
    availableShares: 1,
    marketType: 'sale',
    verificationStatus: 'verified',
    verificationTimestamp: '2026-01-24T14:45:00.000Z',
    ownerId: 'citizen2',
    seller: {
      id: 'citizen2',
      username: 'citizen2',
    },
    ownershipType: 'Leasehold',
    ownershipProofType: 'municipal_record',
    ownershipProofNumber: 'MR-2026-221',
    pricePerShare: 2250000,
    propertyVerificationStatus: 'verified',
    identityVerificationStatus: 'verified',
    rejectionReason: null,
    blockchainHash:
      '0x9bc84f1d53b0d239af0eb6a031fd84a0a2b6bd7f1705f51273f26b2a8a3d9910',
    blockchainTransactionId:
      '0xa1727d8a4a20bcf88a98dd2f970d6f7c0de9e4dd8fcb7d56ffec8b19e7f1119b',
    blockchainStatus: 'anchored',
    imageUrls: [],
    createdAt: '2025-10-11T11:30:00.000Z',
    updatedAt: '2026-01-24T14:45:00.000Z',
    verificationRecordId: 'aqarya-vrf-dev-sale-002',
    verificationPayload: {
      provider: 'mock-chain',
      ownershipSignals: {ownerLinkedToAccount: true},
    },
    auditTrail: [],
  },
];

const purchasedDevPropertiesByUser: Record<string, string[]> = {};

const normalizePropertiesResponse = (
  data:
    | PropertyListItem[]
    | PaginatedPropertiesResponse
    | Envelope<PropertyListItem[] | PaginatedPropertiesResponse>,
  fallbackPage: number,
  fallbackLimit: number,
): PropertiesPage => {
  const normalizedData: PropertyListItem[] | PaginatedPropertiesResponse =
    data &&
    typeof data === 'object' &&
    'data' in (data as Envelope<PropertyListItem[] | PaginatedPropertiesResponse>) &&
    (data as Envelope<PropertyListItem[] | PaginatedPropertiesResponse>).data !==
      undefined
      ? ((data as Envelope<PropertyListItem[] | PaginatedPropertiesResponse>).data as
          | PropertyListItem[]
          | PaginatedPropertiesResponse)
      : (data as PropertyListItem[] | PaginatedPropertiesResponse);

  if (Array.isArray(normalizedData)) {
    return {
      items: normalizedData,
      page: fallbackPage,
      limit: fallbackLimit,
      total: normalizedData.length,
      hasNextPage: false,
    };
  }

  return {
    items: normalizedData.items,
    page: normalizedData.page,
    limit: normalizedData.limit,
    total: normalizedData.total,
    hasNextPage: normalizedData.page * normalizedData.limit < normalizedData.total,
  };
};

export const getProperties = async (
  params: GetPropertiesParams = {},
): Promise<PropertiesPage> => {
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;

  const token = await getSecureToken();
  if (!token) {
    throw new ApiError('Authentication required. Please sign in again.', 401);
  }

  if (__DEV__ && isDevSessionToken(token)) {
    const query = params.search?.trim().toLowerCase();
    const records = query
      ? devPropertyRecords.filter(
          property =>
            property.title.toLowerCase().includes(query) ||
            property.location.toLowerCase().includes(query),
        )
      : devPropertyRecords;
    const start = (page - 1) * limit;
    const items = records.slice(start, start + limit).map(property => ({
      id: property.id,
      title: property.title,
      location: property.location,
      ownerName: property.ownerName,
      description: property.description,
      price: property.price,
      propertyValue: property.propertyValue,
      totalShares: property.totalShares,
      availableShares: property.availableShares,
      marketType: property.marketType,
      verificationStatus: property.verificationStatus,
      verificationTimestamp: property.verificationTimestamp,
    }));

    return {
      items,
      page,
      limit,
      total: records.length,
      hasNextPage: start + limit < records.length,
    };
  }

  const response = await propertiesApi.get<
    | PropertyListItem[]
    | PaginatedPropertiesResponse
    | Envelope<PropertyListItem[] | PaginatedPropertiesResponse>
  >('/properties', {
    params: {
      page,
      limit,
      search: params.search,
    },
  });

  return normalizePropertiesResponse(response.data, page, limit);
};

export const getPropertyDetails = async (id: string): Promise<PropertyDetails> => {
  const token = await getSecureToken();
  if (!token) {
    throw new ApiError('Authentication required. Please sign in again.', 401);
  }

  if (__DEV__ && isDevSessionToken(token)) {
    const found = devPropertyRecords.find(property => property.id === id);

    if (!found) {
      throw new ApiError('The requested property was not found.', 404);
    }

    return found;
  }

  const response = await propertiesApi.get<PropertyDetails | Envelope<PropertyDetails>>(
    `/properties/${id}`,
  );

  if (
    response.data &&
    typeof response.data === 'object' &&
    'data' in (response.data as Envelope<PropertyDetails>) &&
    (response.data as Envelope<PropertyDetails>).data
  ) {
    return (response.data as Envelope<PropertyDetails>).data as PropertyDetails;
  }

  return response.data as PropertyDetails;
};

export const createSaleListing = async (
  payload: CreateSaleListingRequest,
): Promise<PropertyListItem> => {
  const token = await getSecureToken();
  if (!token) {
    throw new ApiError('Authentication required. Please sign in again.', 401);
  }

  if (__DEV__ && isDevSessionToken(token)) {
    const newProperty: PropertyDetails = {
      id: `prop-${Date.now()}`,
      title: payload.title,
      location: payload.location,
      ownerName: payload.ownerName,
      description: payload.description,
      price: payload.price,
      propertyValue: payload.propertyValue,
      totalShares: 1,
      availableShares: 1,
      marketType: 'sale',
      verificationStatus: 'pending_verification',
      verificationTimestamp: new Date().toISOString(),
      ownerId: 'citizen',
      seller: {
        id: 'citizen',
        username: 'citizen',
      },
      ownershipType: payload.ownershipType,
      ownershipProofType: payload.ownershipProofType,
      ownershipProofNumber: payload.ownershipProofNumber,
      pricePerShare: payload.price,
      propertyVerificationStatus: 'pending',
      identityVerificationStatus: 'pending',
      rejectionReason: null,
      blockchainHash: `0xdev${Date.now().toString(16)}`,
      blockchainTransactionId: '',
      blockchainStatus: 'pending',
      imageUrls: payload.imageUrls ?? [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      verificationRecordId: `aqarya-vrf-dev-${Date.now()}`,
      verificationPayload: {
        provider: 'mock-chain',
        ownershipSignals: {ownerLinkedToAccount: true},
      },
      auditTrail: [],
    };

    devPropertyRecords.unshift(newProperty);
    return {
      id: newProperty.id,
      title: newProperty.title,
      location: newProperty.location,
      ownerName: newProperty.ownerName,
      description: newProperty.description,
      price: newProperty.price,
      propertyValue: newProperty.propertyValue,
      totalShares: newProperty.totalShares,
      availableShares: newProperty.availableShares,
      marketType: newProperty.marketType,
      verificationStatus: newProperty.verificationStatus,
      verificationTimestamp: newProperty.verificationTimestamp,
    };
  }

  const response = await propertiesApi.post<PropertyListItem | Envelope<PropertyListItem>>(
    '/properties/sell-listings',
    payload,
  );

  if (
    response.data &&
    typeof response.data === 'object' &&
    'data' in (response.data as Envelope<PropertyListItem>) &&
    (response.data as Envelope<PropertyListItem>).data
  ) {
    return (response.data as Envelope<PropertyListItem>).data as PropertyListItem;
  }

  return response.data as PropertyListItem;
};

export const buyProperty = async (id: string): Promise<PurchasePropertyResponse> => {
  const token = await getSecureToken();
  if (!token) {
    throw new ApiError('Authentication required. Please sign in again.', 401);
  }

  if (__DEV__ && isDevSessionToken(token)) {
    const property = devPropertyRecords.find(record => record.id === id);
    if (!property || property.marketType !== 'sale') {
      throw new ApiError('This property is not available for direct purchase.', 404);
    }
    if (property.verificationStatus !== 'verified' || property.availableShares < 1) {
      throw new ApiError('This property is no longer available.', 400);
    }

    const userId = token.split('-')[2] || 'citizen';
    if (property.ownerId === userId) {
      throw new ApiError('You already own this property.', 400);
    }

    property.ownerId = userId;
    property.ownerName = userId;
    property.seller = {id: userId, username: userId};
    property.verificationStatus = 'sold';
    property.availableShares = 0;
    property.updatedAt = new Date().toISOString();

    const purchased = purchasedDevPropertiesByUser[userId] ?? [];
    purchasedDevPropertiesByUser[userId] = [...purchased, property.id];

    return {
      id: property.id,
      title: property.title,
      location: property.location,
      ownerName: property.ownerName,
      description: property.description,
      price: property.price,
      propertyValue: property.propertyValue,
      totalShares: property.totalShares,
      availableShares: property.availableShares,
      marketType: property.marketType,
      verificationStatus: property.verificationStatus,
      verificationTimestamp: property.verificationTimestamp,
      message: 'Property purchased successfully.',
    };
  }

  const response = await propertiesApi.post<
    PurchasePropertyResponse | Envelope<PurchasePropertyResponse>
  >(`/properties/${id}/buy`);

  if (
    response.data &&
    typeof response.data === 'object' &&
    'data' in (response.data as Envelope<PurchasePropertyResponse>) &&
    (response.data as Envelope<PurchasePropertyResponse>).data
  ) {
    return (response.data as Envelope<PurchasePropertyResponse>)
      .data as PurchasePropertyResponse;
  }

  return response.data as PurchasePropertyResponse;
};
