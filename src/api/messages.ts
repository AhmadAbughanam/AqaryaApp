import {getSecureToken} from '../services/secureStorage';
import {createAuthenticatedApiClient} from './client';

const api = createAuthenticatedApiClient();

const isDevToken = (t: string | null) => Boolean(t && t.startsWith('dev-jwt-'));

const now = (hh: number, mm: number) => {
  const d = new Date();
  d.setHours(hh, mm, 0, 0);
  return d.toISOString();
};

const DEV_THREADS: ThreadListItem[] = [
  {
    id: 'thread-001',
    subject: 'Joori Real Estate',
    listingId: 'prop-001',
    listingTitle: 'Jabal Amman Courtyard House',
    listingMarketType: 'sale',
    opportunityId: null,
    opportunityTitle: null,
    opportunityAssetClass: null,
    lastMessage: {body: 'Approved Agency — verified listing partner.', senderRole: 'admin', createdAt: now(5, 27)},
    messageCount: 3,
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    updatedAt: now(5, 27),
  },
  {
    id: 'thread-002',
    subject: 'Jordan Homes',
    listingId: 'prop-003',
    listingTitle: 'Modern Apartment in Abdali',
    listingMarketType: 'rent',
    opportunityId: null,
    opportunityTitle: null,
    opportunityAssetClass: null,
    lastMessage: {body: 'Apartment available for viewing this weekend.', senderRole: 'citizen', createdAt: now(5, 0)},
    messageCount: 5,
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    updatedAt: now(5, 0),
  },
  {
    id: 'thread-003',
    subject: 'Amer: Agarnar',
    listingId: 'prop-002',
    listingTitle: 'Luxury Villa in Khalda',
    listingMarketType: 'sale',
    opportunityId: null,
    opportunityTitle: null,
    opportunityAssetClass: null,
    lastMessage: {body: 'Inspection available on appointment only.', senderRole: 'admin', createdAt: now(9, 0)},
    messageCount: 2,
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    updatedAt: now(9, 0),
  },
  {
    id: 'thread-004',
    subject: 'Alli Real Estate',
    listingId: null,
    listingTitle: null,
    listingMarketType: null,
    opportunityId: 'opp-001',
    opportunityTitle: 'Prime Land in Abdoun',
    opportunityAssetClass: 'Land',
    lastMessage: {body: 'Investment details sent to your email address.', senderRole: 'admin', createdAt: now(2, 39)},
    messageCount: 4,
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    updatedAt: now(2, 39),
  },
  {
    id: 'thread-005',
    subject: 'Amer: Agency',
    listingId: 'prop-004',
    listingTitle: 'Luxury Villa in Khilda',
    listingMarketType: 'rent',
    opportunityId: null,
    opportunityTitle: null,
    opportunityAssetClass: null,
    lastMessage: {body: 'Appointment confirmed for next week only.', senderRole: 'admin', createdAt: now(7, 0)},
    messageCount: 1,
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    updatedAt: now(7, 0),
  },
  {
    id: 'thread-006',
    subject: 'Alli Real Estate',
    listingId: 'prop-001',
    listingTitle: 'Jabal Amman Courtyard House',
    listingMarketType: 'sale',
    opportunityId: null,
    opportunityTitle: null,
    opportunityAssetClass: null,
    lastMessage: {body: 'Inspection available to schedule now.', senderRole: 'citizen', createdAt: now(7, 45)},
    messageCount: 6,
    createdAt: new Date(Date.now() - 6 * 86400000).toISOString(),
    updatedAt: now(7, 45),
  },
];

export interface ThreadListItem {
  id: string;
  subject: string;
  listingId: string | null;
  listingTitle: string | null;
  listingMarketType: string | null;
  opportunityId: string | null;
  opportunityTitle: string | null;
  opportunityAssetClass: string | null;
  lastMessage: {
    body: string;
    senderRole: 'citizen' | 'admin';
    createdAt: string;
  } | null;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface MessageItem {
  id: string;
  body: string;
  senderId: string;
  senderName: string;
  senderRole: 'citizen' | 'admin';
  createdAt: string;
}

export interface ThreadDetail {
  id: string;
  subject: string;
  listing: {
    id: string;
    title: string;
    location: string;
    marketType: string;
    price: number;
  } | null;
  opportunity: {
    id: string;
    title: string;
    location: string;
    assetClass: string;
    pricePerShare: number;
  } | null;
  messages: MessageItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateThreadParams {
  subject: string;
  listingId?: string;
  opportunityId?: string;
  initialMessage: string;
}

export const getThreads = async (): Promise<ThreadListItem[]> => {
  const token = await getSecureToken();
  if (import.meta.env.DEV && isDevToken(token)) {
    return DEV_THREADS;
  }
  const response = await api.get<ThreadListItem[]>('/messages/threads');
  return response.data;
};

export const createThread = async (params: CreateThreadParams): Promise<ThreadDetail> => {
  const response = await api.post<ThreadDetail>('/messages/threads', params);
  return response.data;
};

export const getThreadDetail = async (threadId: string): Promise<ThreadDetail> => {
  const response = await api.get<ThreadDetail>(`/messages/threads/${threadId}`);
  return response.data;
};

export const sendMessage = async (threadId: string, body: string): Promise<MessageItem> => {
  const response = await api.post<MessageItem>(`/messages/threads/${threadId}/messages`, {body});
  return response.data;
};
