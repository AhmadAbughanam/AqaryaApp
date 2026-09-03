import {
  CURRENT_USER,
  mockDelay,
  MockError,
  nowIso,
  properties,
  threads,
  uid,
  type MockThread,
} from '../mock/db';

export interface ThreadListItem {
  id: string;
  subject: string;
  listingId: string | null;
  listingTitle: string | null;
  listingMarketType: string | null;
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
  opportunity: null;
  messages: MessageItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateThreadParams {
  subject: string;
  listingId?: string;
  initialMessage: string;
}

const toListItem = (thread: MockThread): ThreadListItem => {
  const listing = thread.listingId
    ? properties.find(record => record.id === thread.listingId)
    : undefined;
  const last = thread.messages[thread.messages.length - 1] ?? null;
  return {
    id: thread.id,
    subject: thread.subject,
    listingId: thread.listingId,
    listingTitle: listing?.title ?? null,
    listingMarketType: listing?.marketType ?? null,
    lastMessage: last
      ? {body: last.body, senderRole: last.senderRole, createdAt: last.createdAt}
      : null,
    messageCount: thread.messages.length,
    createdAt: thread.createdAt,
    updatedAt: thread.updatedAt,
  };
};

const toDetail = (thread: MockThread): ThreadDetail => {
  const listing = thread.listingId
    ? properties.find(record => record.id === thread.listingId)
    : undefined;
  return {
    id: thread.id,
    subject: thread.subject,
    listing: listing
      ? {
          id: listing.id,
          title: listing.title,
          location: listing.location,
          marketType: listing.marketType,
          price: listing.price,
        }
      : null,
    opportunity: null,
    messages: thread.messages.map(message => ({...message})),
    createdAt: thread.createdAt,
    updatedAt: thread.updatedAt,
  };
};

export const getThreads = async (): Promise<ThreadListItem[]> => {
  await mockDelay();
  return [...threads]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .map(toListItem);
};

export const getThreadDetail = async (threadId: string): Promise<ThreadDetail> => {
  await mockDelay();
  const thread = threads.find(item => item.id === threadId);
  if (!thread) throw new MockError('Conversation not found.', 404);
  return toDetail(thread);
};

export const createThread = async (
  params: CreateThreadParams,
): Promise<ThreadDetail> => {
  await mockDelay();
  const thread: MockThread = {
    id: uid('thread'),
    subject: params.subject,
    listingId: params.listingId ?? null,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    messages: [
      {
        id: uid('m'),
        body: params.initialMessage,
        senderId: CURRENT_USER.id,
        senderName: CURRENT_USER.username,
        senderRole: 'citizen',
        createdAt: nowIso(),
      },
    ],
  };
  threads.unshift(thread);
  return toDetail(thread);
};

export const sendMessage = async (
  threadId: string,
  body: string,
): Promise<MessageItem> => {
  await mockDelay(120);
  const thread = threads.find(item => item.id === threadId);
  if (!thread) throw new MockError('Conversation not found.', 404);
  const message: MessageItem = {
    id: uid('m'),
    body,
    senderId: CURRENT_USER.id,
    senderName: CURRENT_USER.username,
    senderRole: 'citizen',
    createdAt: nowIso(),
  };
  thread.messages.push(message);
  thread.updatedAt = message.createdAt;
  return message;
};
