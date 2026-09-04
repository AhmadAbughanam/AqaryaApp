import {
  CURRENT_USER,
  auditEvents,
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
  viewerIsOwner: boolean;
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
  sourcePropertyId: string;
  title: string;
  description: string;
  price: number;
  validForDays: number;
}

export type OfferFundingMethod = 'cash' | 'bank_financing' | 'mixed';

export interface StructuredOfferRequest {
  amount: number;
  validForDays: number;
  fundingMethod: OfferFundingMethod;
  preferredStartDate?: string;
  conditions?: string;
  identityConsent: boolean;
  officialHandoffConsent: boolean;
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
  sort?: 'newest' | 'price_asc' | 'price_desc';
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
  reference: string;
  submittedAt: string;
  nextSteps: string[];
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
  viewerIsOwner: record.ownerId === CURRENT_USER.id,
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
  auditTrail: auditEvents
    .filter(event => event.propertyId === record.id)
    .map(event => ({
      id: event.id,
      actorName: event.actorName,
      actorRole: event.actorRole,
      actionType: event.actionType,
      timestamp: event.timestamp,
      metadata: event.metadata,
    })),
});

export const getProperties = async (
  params: GetPropertiesParams = {},
): Promise<PropertiesPage> => {
  await mockDelay();
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  const market = params.marketType ?? 'sale';
  const query = params.search?.trim().toLowerCase();

  let records = properties.filter(
    record => record.marketType === market && record.verificationStatus === 'verified',
  );
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

  const sort = params.sort ?? 'newest';
  records = [...records].sort((a, b) => {
    if (sort === 'price_asc') return a.price - b.price;
    if (sort === 'price_desc') return b.price - a.price;
    return b.createdAt.localeCompare(a.createdAt);
  });

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
  const record = properties.find(item => item.id === payload.sourcePropertyId);
  if (!record || record.ownerId !== CURRENT_USER.id) {
    throw new MockError('Choose a property linked to your verified portfolio.', 400);
  }
  if (
    record.propertyVerificationStatus !== 'verified' ||
    record.identityVerificationStatus !== 'verified' ||
    record.recordStatus !== 'sealed'
  ) {
    throw new MockError('This property must finish source and identity verification before it can be listed.', 409);
  }
  if (!payload.title.trim() || !payload.description.trim()) {
    throw new MockError('Add a clear headline and property description.', 400);
  }
  if (!Number.isFinite(payload.price) || payload.price <= 0) {
    throw new MockError('Enter a valid asking price.', 400);
  }
  if (!Number.isInteger(payload.validForDays) || payload.validForDays < 7 || payload.validForDays > 90) {
    throw new MockError('Listing validity must be between 7 and 90 days.', 400);
  }

  const timestamp = nowIso();
  record.title = payload.title.trim();
  record.description = payload.description.trim();
  record.price = payload.price;
  record.marketType = 'sale';
  record.verificationStatus = 'pending_verification';
  record.submissionDate = timestamp;
  record.updatedAt = timestamp;
  recordAudit({
    actorId: CURRENT_USER.id,
    actorName: CURRENT_USER.username,
    actorRole: 'citizen',
    actionType: 'listing_submitted',
    propertyId: record.id,
    metadata: {
      title: record.title,
      askingPrice: record.price,
      sourceRecord: record.recordHash,
      validForDays: payload.validForDays,
    },
  });
  return toListItem(record);
};

export const submitStructuredOffer = async (
  id: string,
  payload: StructuredOfferRequest,
): Promise<StructuredOfferResponse> => {
  await mockDelay();
  const record = properties.find(item => item.id === id);
  if (!record) {
    throw new MockError('This property is no longer available.', 404);
  }
  if (record.verificationStatus !== 'verified') {
    throw new MockError('Offers are only available for verified listings.', 409);
  }
  if (record.ownerId === CURRENT_USER.id) {
    throw new MockError('You cannot submit an offer on your own property.', 409);
  }
  if (!Number.isFinite(payload.amount) || payload.amount <= 0) {
    throw new MockError('Enter a valid offer amount.', 400);
  }
  if (!Number.isInteger(payload.validForDays) || payload.validForDays < 1 || payload.validForDays > 30) {
    throw new MockError('Offer validity must be between 1 and 30 days.', 400);
  }
  if (!payload.identityConsent || !payload.officialHandoffConsent) {
    throw new MockError('Both confirmations are required before submitting.', 400);
  }
  const submittedAt = nowIso();
  const reference = `AQO-${uid('').slice(0, 8).toUpperCase()}`;
  recordAudit({
    actorId: CURRENT_USER.id,
    actorName: CURRENT_USER.username,
    actorRole: 'citizen',
    actionType: record.marketType === 'rent' ? 'lease_offer_submitted' : 'offer_submitted',
    propertyId: record.id,
    metadata: {
      amount: payload.amount,
      conditions: payload.conditions?.trim() || null,
      fundingMethod: payload.fundingMethod,
      preferredStartDate: payload.preferredStartDate || null,
      reference,
      validForDays: payload.validForDays,
    },
  });
  return {
    id: uid('offer'),
    propertyId: record.id,
    status: 'submitted',
    reference,
    submittedAt,
    nextSteps: [
      'The owner reviews the structured terms and responds through Aqarya.',
      'If accepted, Aqarya prepares the required document and action checklist.',
      'Payment and registration continue through licensed and competent authorities.',
    ],
    message:
      record.marketType === 'rent'
        ? 'Your structured rental request was submitted. The owner and Aqarya support will follow up.'
        : 'Your structured offer was submitted. It is now on the record for this property.',
  };
};
