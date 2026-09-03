import {
  CURRENT_USER,
  mockDelay,
  MockError,
  nowIso,
  properties,
  recordAudit,
  uid,
  type MarketType,
  type PropertyRecord,
  type VerificationStatus,
} from '../mock/db';

export type {MarketType, VerificationStatus};

export interface PropertyListItem {
  id: string;
  title: string;
  location: string;
  ownerName: string;
  description: string;
  price: number;
  propertyValue: number;
  marketType: MarketType;
  verificationStatus: VerificationStatus;
  verificationTimestamp: string;
  city?: string | null;
  propertyType?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  areaSqm?: number | null;
  amenities?: string[];
  latitude?: number | null;
  longitude?: number | null;
  imageUrls?: string[];
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
  ownerId: string;
  ownershipType: string;
  ownershipProofType: string;
  ownershipProofNumber: string;
  propertyVerificationStatus: 'pending' | 'verified' | 'rejected';
  identityVerificationStatus: 'pending' | 'verified' | 'rejected';
  rejectionReason?: string | null;
  recordHash: string;
  recordStatus: 'draft' | 'sealed';
  verificationRecordId?: string | null;
  createdAt: string;
  updatedAt: string;
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
  city?: string;
  propertyType?: string;
  bedrooms?: number;
  bathrooms?: number;
  areaSqm?: number;
  amenities?: string[];
  latitude?: number;
  longitude?: number;
}

export interface GetPropertiesParams {
  page?: number;
  limit?: number;
  search?: string;
  marketType?: MarketType;
  city?: string;
  propertyType?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  verifiedOnly?: boolean;
}

export interface PropertiesPage {
  items: PropertyListItem[];
  page: number;
  limit: number;
  total: number;
  hasNextPage: boolean;
}

export interface StructuredOfferResponse {
  id: string;
  propertyId: string;
  status: 'submitted';
  message: string;
}

const toListItem = (record: PropertyRecord): PropertyListItem => ({
  id: record.id,
  title: record.title,
  location: record.location,
  ownerName: record.ownerName,
  description: record.description,
  price: record.price,
  propertyValue: record.propertyValue,
  marketType: record.marketType,
  verificationStatus: record.verificationStatus,
  verificationTimestamp: record.verificationTimestamp,
  city: record.city,
  propertyType: record.propertyType,
  bedrooms: record.bedrooms,
  bathrooms: record.bathrooms,
  areaSqm: record.areaSqm,
  amenities: record.amenities,
  latitude: record.latitude,
  longitude: record.longitude,
  imageUrls: record.imageUrls,
});

const toDetails = (record: PropertyRecord): PropertyDetails => ({
  ...toListItem(record),
  ownerId: record.ownerId,
  ownershipType: record.ownershipType,
  ownershipProofType: record.ownershipProofType,
  ownershipProofNumber: record.ownershipProofNumber,
  propertyVerificationStatus: record.propertyVerificationStatus,
  identityVerificationStatus: record.identityVerificationStatus,
  rejectionReason: record.rejectionReason,
  recordHash: record.recordHash,
  recordStatus: record.recordStatus,
  verificationRecordId: record.verificationRecordId,
  createdAt: record.createdAt,
  updatedAt: record.updatedAt,
  auditTrail: [],
});

export const getProperties = async (
  params: GetPropertiesParams = {},
): Promise<PropertiesPage> => {
  await mockDelay();
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  const market = params.marketType ?? 'sale';
  const query = params.search?.trim().toLowerCase();

  let records = properties.filter(record => record.marketType === market);
  if (query) {
    records = records.filter(
      record =>
        record.title.toLowerCase().includes(query) ||
        record.location.toLowerCase().includes(query) ||
        record.city.toLowerCase().includes(query),
    );
  }
  if (params.city) {
    const city = params.city.toLowerCase();
    records = records.filter(record => record.city.toLowerCase().includes(city));
  }
  if (params.propertyType) {
    const type = params.propertyType.toLowerCase();
    records = records.filter(record => record.propertyType.toLowerCase() === type);
  }
  if (params.minPrice !== undefined) {
    records = records.filter(record => record.price >= params.minPrice!);
  }
  if (params.maxPrice !== undefined) {
    records = records.filter(record => record.price <= params.maxPrice!);
  }
  if (params.bedrooms !== undefined) {
    records = records.filter(record => (record.bedrooms ?? 0) >= params.bedrooms!);
  }
  if (params.verifiedOnly) {
    records = records.filter(record => record.verificationStatus === 'verified');
  }

  const start = (page - 1) * limit;
  const pageItems = records.slice(start, start + limit).map(toListItem);
  return {
    items: pageItems,
    page,
    limit,
    total: records.length,
    hasNextPage: start + limit < records.length,
  };
};

export const getPropertyDetails = async (id: string): Promise<PropertyDetails> => {
  await mockDelay();
  const record = properties.find(item => item.id === id);
  if (!record) {
    throw new MockError('The requested property was not found.', 404);
  }
  return toDetails(record);
};

export const createSaleListing = async (
  payload: CreateSaleListingRequest,
): Promise<PropertyListItem> => {
  await mockDelay();
  const timestamp = nowIso();
  const record: PropertyRecord = {
    id: uid('prop'),
    title: payload.title,
    location: payload.location,
    city: payload.city ?? payload.location.split(',')[0]?.trim() ?? 'Amman',
    propertyType: payload.propertyType ?? 'Apartment',
    bedrooms: payload.bedrooms ?? null,
    bathrooms: payload.bathrooms ?? null,
    areaSqm: payload.areaSqm ?? null,
    amenities: payload.amenities ?? [],
    latitude: payload.latitude ?? null,
    longitude: payload.longitude ?? null,
    ownerId: CURRENT_USER.id,
    ownerName: payload.ownerName || CURRENT_USER.username,
    description: payload.description,
    price: payload.price,
    propertyValue: payload.propertyValue,
    marketType: 'sale',
    verificationStatus: 'pending_verification',
    verificationTimestamp: timestamp,
    ownershipType: payload.ownershipType,
    ownershipProofType: payload.ownershipProofType,
    ownershipProofNumber: payload.ownershipProofNumber,
    propertyVerificationStatus: 'pending',
    identityVerificationStatus: 'pending',
    rejectionReason: null,
    reviewerNotes: null,
    recordHash: `AQ-${uid('').slice(0, 10).toUpperCase()}`,
    recordStatus: 'draft',
    verificationRecordId: uid('aqarya-vrf'),
    submissionDate: timestamp,
    createdAt: timestamp,
    updatedAt: timestamp,
    imageUrls: payload.imageUrls ?? [],
  };
  properties.unshift(record);
  recordAudit({
    actorId: CURRENT_USER.id,
    actorName: CURRENT_USER.username,
    actorRole: 'citizen',
    actionType: 'listing_submitted',
    propertyId: record.id,
    metadata: {title: record.title},
  });
  return toListItem(record);
};

export const submitStructuredOffer = async (
  id: string,
): Promise<StructuredOfferResponse> => {
  await mockDelay();
  const record = properties.find(item => item.id === id);
  if (!record) {
    throw new MockError('This property is no longer available.', 404);
  }
  recordAudit({
    actorId: CURRENT_USER.id,
    actorName: CURRENT_USER.username,
    actorRole: 'citizen',
    actionType: record.marketType === 'rent' ? 'lease_offer_submitted' : 'offer_submitted',
    propertyId: record.id,
    metadata: {price: record.price},
  });
  return {
    id: uid('offer'),
    propertyId: record.id,
    status: 'submitted',
    message:
      record.marketType === 'rent'
        ? 'Your structured rental request was submitted. The owner and Aqarya support will follow up.'
        : 'Your structured offer was submitted. It is now on the record for this property.',
  };
};
