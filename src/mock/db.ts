// In-memory data store for the Aqarya web client.
//
// Every `src/api/*` module resolves against the data below. Mutations live for
// the lifetime of the browser tab and reset on reload.

export const MOCK_LATENCY_MS = 200;

export const mockDelay = (ms: number = MOCK_LATENCY_MS): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));

export class MockError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'MockError';
    this.status = status;
  }
}

export const AUTH_ROLE_KEY = 'aqarya.auth.role';

export type SessionRole = 'citizen' | 'admin';

export const getSessionRole = (): SessionRole | null => {
  const stored = localStorage.getItem(AUTH_ROLE_KEY);
  return stored === 'citizen' || stored === 'admin' ? stored : null;
};

// The signed-in citizen used for ownership checks in the demo.
export const CURRENT_USER = {
  id: 'citizen',
  username: 'Layan Haddad',
};

export const nowIso = (): string => new Date().toISOString();

export const daysAgo = (days: number): string =>
  new Date(Date.now() - days * 86_400_000).toISOString();

export const atHour = (hh: number, mm: number): string => {
  const date = new Date();
  date.setHours(hh, mm, 0, 0);
  return date.toISOString();
};

export const uid = (prefix: string): string =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

// ─── Property records ────────────────────────────────────────────────────────
// One shared list backs both the citizen marketplace and the admin registry
// review console.

export type MarketType = 'sale' | 'rent';

export type VerificationStatus =
  | 'pending'
  | 'pending_verification'
  | 'needs_changes'
  | 'verified'
  | 'rejected'
  | 'frozen'
  | 'sold';

export interface PropertyRecord {
  id: string;
  title: string;
  location: string;
  city: string;
  propertyType: string;
  bedrooms: number | null;
  bathrooms: number | null;
  areaSqm: number | null;
  amenities: string[];
  latitude: number | null;
  longitude: number | null;
  ownerId: string;
  ownerName: string;
  description: string;
  price: number;
  propertyValue: number;
  marketType: MarketType;
  verificationStatus: VerificationStatus;
  verificationTimestamp: string;
  ownershipType: string;
  ownershipProofType: string;
  ownershipProofNumber: string;
  propertyVerificationStatus: 'pending' | 'verified' | 'rejected';
  identityVerificationStatus: 'pending' | 'verified' | 'rejected';
  rejectionReason: string | null;
  reviewerNotes: string | null;
  recordHash: string;
  recordStatus: 'draft' | 'sealed';
  verificationRecordId: string | null;
  submissionDate: string;
  createdAt: string;
  updatedAt: string;
  imageUrls: string[];
}

export const properties: PropertyRecord[] = [
  {
    id: 'prop-001',
    title: 'Jabal Amman Courtyard House',
    location: 'Amman, Jabal Amman',
    city: 'Amman',
    propertyType: 'Villa',
    bedrooms: 4,
    bathrooms: 3,
    areaSqm: 280,
    amenities: ['Private garden', 'Garage', 'City views'],
    latitude: 31.9539,
    longitude: 35.9106,
    ownerId: 'owner-khatib',
    ownerName: 'Mahmoud Al-Khatib',
    description:
      'A source-authenticated family home offered for direct sale in a prime residential quarter of Amman.',
    price: 415000,
    propertyValue: 400000,
    marketType: 'sale',
    verificationStatus: 'verified',
    verificationTimestamp: daysAgo(12),
    ownershipType: 'Freehold',
    ownershipProofType: 'title_deed',
    ownershipProofNumber: 'TD-2026-1001',
    propertyVerificationStatus: 'verified',
    identityVerificationStatus: 'verified',
    rejectionReason: null,
    reviewerNotes: null,
    recordHash: 'AQ-7F8DD31F',
    recordStatus: 'sealed',
    verificationRecordId: 'aqarya-vrf-sale-001',
    submissionDate: daysAgo(30),
    createdAt: daysAgo(30),
    updatedAt: daysAgo(12),
    imageUrls: [],
  },
  {
    id: 'prop-002',
    title: 'Marj Al-Hamam Standalone Villa',
    location: 'Amman, Marj Al-Hamam',
    city: 'Amman',
    propertyType: 'Villa',
    bedrooms: 5,
    bathrooms: 4,
    areaSqm: 390,
    amenities: ['Swimming pool', 'Garden', 'Garage'],
    latitude: 31.8894,
    longitude: 35.8386,
    ownerId: 'owner-majali',
    ownerName: 'Rana Al-Majali',
    description:
      'Standalone villa cleared for sale after ownership and identity checks against the land registry.',
    price: 610000,
    propertyValue: 600000,
    marketType: 'sale',
    verificationStatus: 'verified',
    verificationTimestamp: daysAgo(24),
    ownershipType: 'Freehold',
    ownershipProofType: 'title_deed',
    ownershipProofNumber: 'TD-2026-2210',
    propertyVerificationStatus: 'verified',
    identityVerificationStatus: 'verified',
    rejectionReason: null,
    reviewerNotes: null,
    recordHash: 'AQ-9BC84F1D',
    recordStatus: 'sealed',
    verificationRecordId: 'aqarya-vrf-sale-002',
    submissionDate: daysAgo(40),
    createdAt: daysAgo(40),
    updatedAt: daysAgo(24),
    imageUrls: [],
  },
  {
    id: 'prop-003',
    title: 'Sweifieh Modern Apartment',
    location: 'Amman, Sweifieh',
    city: 'Amman',
    propertyType: 'Apartment',
    bedrooms: 2,
    bathrooms: 2,
    areaSqm: 130,
    amenities: ['Parking', 'Elevator', 'Gym', 'Security'],
    latitude: 31.9481,
    longitude: 35.87,
    ownerId: 'owner-nabulsi',
    ownerName: 'Khalid Al-Nabulsi',
    description:
      'Bright two-bedroom apartment offered for rent through a structured digital lease.',
    price: 600,
    propertyValue: 170000,
    marketType: 'rent',
    verificationStatus: 'verified',
    verificationTimestamp: daysAgo(6),
    ownershipType: 'Freehold',
    ownershipProofType: 'title_deed',
    ownershipProofNumber: 'TD-2026-3300',
    propertyVerificationStatus: 'verified',
    identityVerificationStatus: 'verified',
    rejectionReason: null,
    reviewerNotes: null,
    recordHash: 'AQ-SWEIFIEH03',
    recordStatus: 'sealed',
    verificationRecordId: 'aqarya-vrf-rent-001',
    submissionDate: daysAgo(15),
    createdAt: daysAgo(15),
    updatedAt: daysAgo(6),
    imageUrls: [],
  },
  {
    id: 'prop-004',
    title: 'Abdoun Garden Apartment',
    location: 'Amman, Abdoun',
    city: 'Amman',
    propertyType: 'Apartment',
    bedrooms: 3,
    bathrooms: 2,
    areaSqm: 175,
    amenities: ['Garden', 'Parking', 'Security'],
    latitude: 31.9454,
    longitude: 35.8862,
    ownerId: 'owner-habboubi',
    ownerName: 'Sana Al-Habboubi',
    description:
      'Spacious ground-floor apartment with a private garden, available for a structured rental contract.',
    price: 780,
    propertyValue: 260000,
    marketType: 'rent',
    verificationStatus: 'verified',
    verificationTimestamp: daysAgo(5),
    ownershipType: 'Freehold',
    ownershipProofType: 'title_deed',
    ownershipProofNumber: 'TD-2026-4410',
    propertyVerificationStatus: 'verified',
    identityVerificationStatus: 'verified',
    rejectionReason: null,
    reviewerNotes: null,
    recordHash: 'AQ-ABDOUN04',
    recordStatus: 'sealed',
    verificationRecordId: 'aqarya-vrf-rent-002',
    submissionDate: daysAgo(18),
    createdAt: daysAgo(18),
    updatedAt: daysAgo(5),
    imageUrls: [],
  },
  {
    id: 'prop-005',
    title: 'Umrah District Plot — City Grid',
    location: 'Umrah City, District 4',
    city: 'Umrah',
    propertyType: 'Land',
    bedrooms: null,
    bathrooms: null,
    areaSqm: 750,
    amenities: ['Registered plot', 'Master-plan reference'],
    latitude: 32.05,
    longitude: 36.2,
    ownerId: CURRENT_USER.id,
    ownerName: CURRENT_USER.username,
    description:
      'Serviced residential plot in the new Umrah city grid with a single master-plan reference tied to the parcel.',
    price: 96000,
    propertyValue: 95000,
    marketType: 'sale',
    verificationStatus: 'verified',
    verificationTimestamp: daysAgo(3),
    ownershipType: 'Freehold',
    ownershipProofType: 'master_plan_reference',
    ownershipProofNumber: 'UMR-D4-0192',
    propertyVerificationStatus: 'verified',
    identityVerificationStatus: 'verified',
    rejectionReason: null,
    reviewerNotes: null,
    recordHash: 'AQ-UMRAHD40192',
    recordStatus: 'sealed',
    verificationRecordId: 'aqarya-vrf-sale-005',
    submissionDate: daysAgo(20),
    createdAt: daysAgo(20),
    updatedAt: daysAgo(3),
    imageUrls: [],
  },
  {
    id: 'prop-100',
    title: 'Zarqa Mixed-Use Building',
    location: 'Zarqa, New Downtown',
    city: 'Zarqa',
    propertyType: 'Commercial',
    bedrooms: null,
    bathrooms: null,
    areaSqm: 620,
    amenities: ['Retail frontage', 'Two upper floors'],
    latitude: 32.0728,
    longitude: 36.0876,
    ownerId: CURRENT_USER.id,
    ownerName: CURRENT_USER.username,
    description:
      'Citizen-submitted listing combining ground-floor retail with two residential floors. Awaiting source verification.',
    price: 305000,
    propertyValue: 300000,
    marketType: 'sale',
    verificationStatus: 'pending_verification',
    verificationTimestamp: daysAgo(2),
    ownershipType: 'Freehold',
    ownershipProofType: 'title_deed',
    ownershipProofNumber: 'CI-TD-0007',
    propertyVerificationStatus: 'pending',
    identityVerificationStatus: 'pending',
    rejectionReason: null,
    reviewerNotes: null,
    recordHash: 'AQ-PENDING100',
    recordStatus: 'draft',
    verificationRecordId: 'aqarya-vrf-pending-100',
    submissionDate: daysAgo(2),
    createdAt: daysAgo(2),
    updatedAt: daysAgo(2),
    imageUrls: [],
  },
];

function seedProperty(p: {
  id: string;
  title: string;
  city: string;
  area: string;
  type: string;
  market: MarketType;
  price: number;
  sqm: number;
  beds?: number;
  baths?: number;
  lat: number;
  lng: number;
  amenities?: string[];
  days: number;
  owner: string;
}): PropertyRecord {
  const ts = daysAgo(p.days);
  return {
    id: p.id,
    title: p.title,
    location: `${p.city}, ${p.area}`,
    city: p.city,
    propertyType: p.type,
    bedrooms: p.beds ?? null,
    bathrooms: p.baths ?? null,
    areaSqm: p.sqm,
    amenities: p.amenities ?? [],
    latitude: p.lat,
    longitude: p.lng,
    ownerId: `owner-${p.id}`,
    ownerName: p.owner,
    description:
      p.market === 'rent'
        ? `${p.title} — offered for rent through a structured digital lease, checked for ownership and identity.`
        : `${p.title} — offered for direct sale with a source-authenticated record and a single registry reference.`,
    price: p.price,
    propertyValue: p.market === 'rent' ? p.price * 260 : Math.round(p.price * 0.97),
    marketType: p.market,
    verificationStatus: 'verified',
    verificationTimestamp: ts,
    ownershipType: 'Freehold',
    ownershipProofType: p.type === 'Land' ? 'master_plan_reference' : 'title_deed',
    ownershipProofNumber: `TD-2026-${p.id.replace(/\D/g, '') || '0000'}`,
    propertyVerificationStatus: 'verified',
    identityVerificationStatus: 'verified',
    rejectionReason: null,
    reviewerNotes: null,
    recordHash: `AQ-${p.id.toUpperCase().replace(/[^A-Z0-9]/g, '')}`,
    recordStatus: 'sealed',
    verificationRecordId: `aqarya-vrf-${p.id}`,
    submissionDate: daysAgo(p.days + 12),
    createdAt: ts,
    updatedAt: ts,
    imageUrls: [],
  };
}

properties.push(
  seedProperty({id: 'prop-011', title: 'Sweifieh Bright Two-Bedroom', city: 'Amman', area: 'Sweifieh', type: 'Apartment', market: 'sale', price: 92000, sqm: 118, beds: 2, baths: 2, lat: 31.949, lng: 35.868, amenities: ['Elevator', 'Parking'], days: 4, owner: 'Dana Odeh'}),
  seedProperty({id: 'prop-012', title: 'Dabouq Hillside Villa', city: 'Amman', area: 'Dabouq', type: 'Villa', market: 'sale', price: 720000, sqm: 460, beds: 6, baths: 5, lat: 31.998, lng: 35.79, amenities: ['Swimming pool', 'Garden', 'Garage', 'Staff room'], days: 9, owner: 'Faris Tabbaa'}),
  seedProperty({id: 'prop-013', title: 'Umrah District 2 Townhouse', city: 'Umrah', area: 'District 2', type: 'Villa', market: 'sale', price: 138000, sqm: 210, beds: 3, baths: 3, lat: 32.052, lng: 36.19, amenities: ['Master-plan reference', 'Garden'], days: 2, owner: 'Umrah City Development'}),
  seedProperty({id: 'prop-014', title: 'Umrah Grid Commercial Plot', city: 'Umrah', area: 'District 5', type: 'Land', market: 'sale', price: 210000, sqm: 900, lat: 32.06, lng: 36.205, amenities: ['Registered plot', 'Corner frontage'], days: 15, owner: 'Umrah City Development'}),
  seedProperty({id: 'prop-015', title: 'Irbid University District Flat', city: 'Irbid', area: 'University Street', type: 'Apartment', market: 'sale', price: 74000, sqm: 135, beds: 3, baths: 2, lat: 32.552, lng: 35.85, amenities: ['Parking'], days: 21, owner: 'Lina Shboul'}),
  seedProperty({id: 'prop-016', title: 'Aqaba Sea-View Apartment', city: 'Aqaba', area: 'South Beach', type: 'Apartment', market: 'sale', price: 165000, sqm: 140, beds: 2, baths: 2, lat: 29.51, lng: 34.99, amenities: ['Sea view', 'Shared pool', 'Security'], days: 6, owner: 'Marwan Qadi'}),
  seedProperty({id: 'prop-017', title: 'Zarqa Starter Apartment', city: 'Zarqa', area: 'Al-Zawahra', type: 'Apartment', market: 'sale', price: 58000, sqm: 110, beds: 2, baths: 1, lat: 32.072, lng: 36.088, amenities: ['Parking'], days: 30, owner: 'Huda Btoush'}),
  seedProperty({id: 'prop-018', title: 'Jubeiha Compact Studio', city: 'Amman', area: 'Al-Jubeiha', type: 'Apartment', market: 'sale', price: 44000, sqm: 62, beds: 1, baths: 1, lat: 32.02, lng: 35.87, amenities: ['Furnished'], days: 12, owner: 'Yousef Amr'}),
  seedProperty({id: 'prop-021', title: 'Abdali Serviced One-Bedroom', city: 'Amman', area: 'Al-Abdali', type: 'Apartment', market: 'rent', price: 520, sqm: 78, beds: 1, baths: 1, lat: 31.964, lng: 35.909, amenities: ['Furnished', 'Gym', 'Concierge'], days: 3, owner: 'Boulevard Residences'}),
  seedProperty({id: 'prop-022', title: 'Khalda Villa Floor', city: 'Amman', area: 'Khalda', type: 'Villa', market: 'rent', price: 1100, sqm: 280, beds: 4, baths: 3, lat: 31.99, lng: 35.83, amenities: ['Private entrance', 'Garden', 'Garage'], days: 8, owner: 'Nada Kilani'}),
  seedProperty({id: 'prop-023', title: 'Umrah District 4 Two-Bedroom', city: 'Umrah', area: 'District 4', type: 'Apartment', market: 'rent', price: 430, sqm: 105, beds: 2, baths: 2, lat: 32.05, lng: 36.2, amenities: ['New build', 'Parking'], days: 5, owner: 'Umrah City Development'}),
  seedProperty({id: 'prop-024', title: 'Irbid Student Studio', city: 'Irbid', area: 'Yarmouk', type: 'Apartment', market: 'rent', price: 190, sqm: 40, beds: 1, baths: 1, lat: 32.535, lng: 35.86, amenities: ['Furnished'], days: 18, owner: 'Sami Zoubi'}),
  seedProperty({id: 'prop-025', title: 'Shmeisani Office Suite', city: 'Amman', area: 'Shmeisani', type: 'Commercial', market: 'rent', price: 900, sqm: 160, lat: 31.968, lng: 35.9, amenities: ['Fitted', 'Parking', 'Reception'], days: 11, owner: 'Capital Offices'}),
);

// ─── Audit trail ────────────────────────────────────────────────────────────

export interface AuditEvent {
  id: string;
  actorId: string | null;
  actorName: string;
  actorRole: string;
  actionType: string;
  propertyId?: string;
  timestamp: string;
  metadata: Record<string, unknown>;
}

export const auditEvents: AuditEvent[] = [
  {
    id: 'audit-seed-1',
    actorId: 'admin',
    actorName: 'Registry Reviewer',
    actorRole: 'admin',
    actionType: 'listing_verified',
    propertyId: 'prop-001',
    timestamp: daysAgo(12),
    metadata: {status: 'verified'},
  },
  {
    id: 'audit-seed-2',
    actorId: 'admin',
    actorName: 'Registry Reviewer',
    actorRole: 'admin',
    actionType: 'listing_submitted',
    propertyId: 'prop-100',
    timestamp: daysAgo(2),
    metadata: {},
  },
];

export const recordAudit = (event: Omit<AuditEvent, 'id' | 'timestamp'>): AuditEvent => {
  const entry: AuditEvent = {...event, id: uid('audit'), timestamp: nowIso()};
  auditEvents.unshift(entry);
  return entry;
};

// ─── Saved records ──────────────────────────────────────────────────────────

export const savedPropertyIds = new Set<string>(['prop-002']);

// ─── Message threads ────────────────────────────────────────────────────────

export interface MockMessage {
  id: string;
  body: string;
  senderId: string;
  senderName: string;
  senderRole: 'citizen' | 'admin';
  createdAt: string;
}

export interface MockThread {
  id: string;
  subject: string;
  listingId: string | null;
  messages: MockMessage[];
  createdAt: string;
  updatedAt: string;
}

export const threads: MockThread[] = [
  {
    id: 'thread-001',
    subject: 'Jabal Amman Courtyard House',
    listingId: 'prop-001',
    createdAt: daysAgo(3),
    updatedAt: atHour(9, 27),
    messages: [
      {
        id: 'm-1',
        body: 'Is the courtyard house still available for a structured offer this month?',
        senderId: CURRENT_USER.id,
        senderName: CURRENT_USER.username,
        senderRole: 'citizen',
        createdAt: daysAgo(3),
      },
      {
        id: 'm-2',
        body: 'Yes. The record is verified and sealed — you can submit a structured offer from the listing.',
        senderId: 'admin',
        senderName: 'Aqarya Support',
        senderRole: 'admin',
        createdAt: atHour(9, 27),
      },
    ],
  },
  {
    id: 'thread-002',
    subject: 'Sweifieh Modern Apartment',
    listingId: 'prop-003',
    createdAt: daysAgo(2),
    updatedAt: atHour(10, 5),
    messages: [
      {
        id: 'm-3',
        body: 'Can I view the Sweifieh apartment this weekend before signing the digital lease?',
        senderId: CURRENT_USER.id,
        senderName: CURRENT_USER.username,
        senderRole: 'citizen',
        createdAt: daysAgo(2),
      },
      {
        id: 'm-4',
        body: 'A viewing is arranged for Saturday. The structured rental contract will be ready to review after.',
        senderId: 'admin',
        senderName: 'Aqarya Support',
        senderRole: 'admin',
        createdAt: atHour(10, 5),
      },
    ],
  },
];

// ─── Notifications ──────────────────────────────────────────────────────────

export interface MockNotification {
  id: string;
  type:
    | 'listing_status_change'
    | 'new_message'
    | 'saved_search_match'
    | 'system';
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  isRead: boolean;
  createdAt: string;
}

export const notifications: MockNotification[] = [
  {
    id: 'notif-1',
    type: 'listing_status_change',
    title: 'Listing verified',
    body: 'Jabal Amman Courtyard House passed ownership and identity checks and is now source-authenticated.',
    data: {propertyId: 'prop-001'},
    isRead: false,
    createdAt: daysAgo(12),
  },
  {
    id: 'notif-2',
    type: 'new_message',
    title: 'New message from Aqarya Support',
    body: 'You have a reply about the Sweifieh Modern Apartment structured lease.',
    data: {threadId: 'thread-002'},
    isRead: false,
    createdAt: atHour(10, 6),
  },
  {
    id: 'notif-3',
    type: 'system',
    title: 'Your submission is under review',
    body: 'Zarqa Mixed-Use Building was received and is queued for source verification.',
    data: {propertyId: 'prop-100'},
    isRead: true,
    createdAt: daysAgo(2),
  },
];

// ─── Moderation reports ─────────────────────────────────────────────────────

export interface MockReport {
  id: string;
  targetType: 'listing';
  targetId: string;
  reason:
    | 'spam'
    | 'fraud'
    | 'misleading_info'
    | 'inappropriate'
    | 'duplicate'
    | 'other';
  notes: string | null;
  status: 'open' | 'under_review' | 'resolved' | 'dismissed';
  createdAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  reporterId: string;
  reporterName: string;
}

export const reports: MockReport[] = [
  {
    id: 'report-1',
    targetType: 'listing',
    targetId: 'prop-002',
    reason: 'duplicate',
    notes: 'This villa looks identical to another listing in Marj Al-Hamam.',
    status: 'open',
    createdAt: daysAgo(1),
    reviewedAt: null,
    reviewedBy: null,
    reporterId: CURRENT_USER.id,
    reporterName: CURRENT_USER.username,
  },
];

// ─── CMS: announcements + help content ──────────────────────────────────────

export type MockAnnouncementType =
  | 'system'
  | 'listing_status_change'
  | 'investment_milestone'
  | 'new_message'
  | 'saved_search_match'
  | 'provider_status_change'
  | 'report_update';

export interface MockAnnouncement {
  id: string;
  title: string;
  body: string;
  type: MockAnnouncementType;
  audience: 'all_citizens' | 'all_providers' | 'one_user';
  targetUserId: string | null;
  status: 'active' | 'archived';
  createdBy: string;
  createdAt: string;
  sentAt: string | null;
  archivedAt: string | null;
}

export const announcements: MockAnnouncement[] = [
  {
    id: 'ann-1',
    title: 'Umrah pilot: verification before publishing',
    body: 'Every listing in the Umrah pilot is tied to a master-plan reference and checked before it becomes visible.',
    type: 'system',
    audience: 'all_citizens',
    targetUserId: null,
    status: 'active',
    createdBy: 'admin',
    createdAt: daysAgo(9),
    sentAt: daysAgo(9),
    archivedAt: null,
  },
];

export interface MockContentBlock {
  id: string;
  key: string;
  title: string;
  body: string;
  icon: string | null;
  order: number;
  active: boolean;
  updatedAt: string;
  updatedBy: string | null;
}

export const contentBlocks: MockContentBlock[] = [
  {
    id: 'cb-1',
    key: 'sanad-identity',
    title: 'Signing in with SANAD',
    body: 'Aqarya uses your SANAD digital identity to link you to actions that carry legal or financial weight. Browsing stays open; identity is requested only when you make an offer, sign a lease, or submit a listing.',
    icon: '☒',
    order: 1,
    active: true,
    updatedAt: daysAgo(9),
    updatedBy: 'admin',
  },
  {
    id: 'cb-2',
    key: 'structured-offer',
    title: 'What a structured offer is',
    body: 'Instead of an open chat negotiation, a structured offer captures price, validity period, and basic conditions so every party sees the same terms and the trail is auditable.',
    icon: '☑',
    order: 2,
    active: true,
    updatedAt: daysAgo(9),
    updatedBy: 'admin',
  },
  {
    id: 'cb-3',
    key: 'dls-registry',
    title: 'The land registry stays authoritative',
    body: 'Aqarya does not replace the Department of Lands and Survey. Legal ownership, registration, and transfer remain with the competent authority; Aqarya links to them through an authorised integration.',
    icon: '⚖',
    order: 3,
    active: true,
    updatedAt: daysAgo(9),
    updatedBy: 'admin',
  },
];

// ─── Users (admin console) ─────────────────────────────────────────────────

export interface MockUser {
  id: string;
  username: string;
  role: string;
  createdAt: string;
  accountType: 'individual' | 'owner' | 'agency' | 'developer' | 'partner';
  providerVerificationStatus:
    | 'unverified'
    | 'under_review'
    | 'verified'
    | 'rejected'
    | 'suspended'
    | null;
  businessName: string | null;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  registrationNumber: string | null;
  licenseNumber: string | null;
  adminNotes: string | null;
  rejectionReason: string | null;
}

export const users: MockUser[] = [
  {
    id: 'citizen',
    username: CURRENT_USER.username,
    role: 'citizen',
    createdAt: daysAgo(120),
    accountType: 'individual',
    providerVerificationStatus: null,
    businessName: null,
    contactPerson: null,
    phone: null,
    email: 'layan.haddad@example.jo',
    registrationNumber: null,
    licenseNumber: null,
    adminNotes: null,
    rejectionReason: null,
  },
  {
    id: 'agency-joori',
    username: 'joori.realestate',
    role: 'citizen',
    createdAt: daysAgo(75),
    accountType: 'agency',
    providerVerificationStatus: 'under_review',
    businessName: 'Joori Real Estate',
    contactPerson: 'Nadia Joori',
    phone: '+962 7 9000 1234',
    email: 'office@joori.jo',
    registrationNumber: 'CR-2024-55120',
    licenseNumber: 'REB-AMM-4471',
    adminNotes: null,
    rejectionReason: null,
  },
  {
    id: 'developer-umrah',
    username: 'umrah.citydev',
    role: 'citizen',
    createdAt: daysAgo(50),
    accountType: 'developer',
    providerVerificationStatus: 'verified',
    businessName: 'Umrah City Development',
    contactPerson: 'Tariq Salameh',
    phone: '+962 7 9555 8899',
    email: 'projects@umrahcity.jo',
    registrationNumber: 'CR-2023-11002',
    licenseNumber: 'DEV-UMR-0091',
    adminNotes: 'Master-plan partner for the pilot district.',
    rejectionReason: null,
  },
];
