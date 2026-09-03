import {
  announcements,
  contentBlocks,
  mockDelay,
  MockError,
  nowIso,
  uid,
} from '../mock/db';

export type AnnouncementAudience = 'all_citizens' | 'all_providers' | 'one_user';
export type AnnouncementStatus = 'active' | 'archived';
export type AnnouncementType =
  | 'system'
  | 'listing_status_change'
  | 'investment_milestone'
  | 'new_message'
  | 'saved_search_match'
  | 'provider_status_change'
  | 'report_update';

export interface Announcement {
  id: string;
  title: string;
  body: string;
  type: AnnouncementType;
  audience: AnnouncementAudience;
  targetUserId: string | null;
  status: AnnouncementStatus;
  createdBy: string;
  createdAt: string;
  sentAt: string | null;
  archivedAt: string | null;
}

export interface AnnouncementsResponse {
  items: Announcement[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateAnnouncementRequest {
  title: string;
  body: string;
  type: AnnouncementType;
  audience: AnnouncementAudience;
  targetUserId?: string;
}

export interface ContentBlock {
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

export interface UpsertContentBlockRequest {
  title: string;
  body: string;
  icon?: string;
  order?: number;
  active?: boolean;
}

export const AUDIENCE_LABELS: Record<AnnouncementAudience, string> = {
  all_citizens: 'All Citizens',
  all_providers: 'All Providers',
  one_user: 'Single User',
};

export const ANNOUNCEMENT_STATUS_LABELS: Record<AnnouncementStatus, string> = {
  active: 'Active',
  archived: 'Archived',
};

export const createAnnouncement = async (
  dto: CreateAnnouncementRequest,
): Promise<Announcement> => {
  await mockDelay();
  const announcement: Announcement = {
    id: uid('ann'),
    title: dto.title,
    body: dto.body,
    type: dto.type,
    audience: dto.audience,
    targetUserId: dto.targetUserId ?? null,
    status: 'active',
    createdBy: 'admin',
    createdAt: nowIso(),
    sentAt: nowIso(),
    archivedAt: null,
  };
  announcements.unshift(announcement);
  return announcement;
};

export const getAnnouncements = async (params?: {
  page?: number;
  limit?: number;
  status?: AnnouncementStatus;
}): Promise<AnnouncementsResponse> => {
  await mockDelay();
  const filtered = params?.status
    ? announcements.filter(item => item.status === params.status)
    : announcements;
  return {
    items: filtered.map(item => ({...item})),
    total: filtered.length,
    page: params?.page ?? 1,
    limit: params?.limit ?? filtered.length,
  };
};

export const archiveAnnouncement = async (id: string): Promise<Announcement> => {
  await mockDelay();
  const target = announcements.find(item => item.id === id);
  if (!target) throw new MockError('Announcement not found.', 404);
  target.status = 'archived';
  target.archivedAt = nowIso();
  return {...target};
};

export const getAdminContentBlocks = async (): Promise<ContentBlock[]> => {
  await mockDelay();
  return [...contentBlocks]
    .sort((a, b) => a.order - b.order)
    .map(block => ({...block}));
};

export const upsertContentBlock = async (
  key: string,
  dto: UpsertContentBlockRequest,
): Promise<ContentBlock> => {
  await mockDelay();
  const existing = contentBlocks.find(block => block.key === key);
  if (existing) {
    existing.title = dto.title;
    existing.body = dto.body;
    existing.icon = dto.icon ?? existing.icon;
    existing.order = dto.order ?? existing.order;
    existing.active = dto.active ?? existing.active;
    existing.updatedAt = nowIso();
    existing.updatedBy = 'admin';
    return {...existing};
  }
  const block: ContentBlock = {
    id: uid('cb'),
    key,
    title: dto.title,
    body: dto.body,
    icon: dto.icon ?? null,
    order: dto.order ?? contentBlocks.length + 1,
    active: dto.active ?? true,
    updatedAt: nowIso(),
    updatedBy: 'admin',
  };
  contentBlocks.push(block);
  return {...block};
};

export const getActiveContentBlocks = async (): Promise<ContentBlock[]> => {
  await mockDelay();
  return contentBlocks
    .filter(block => block.active)
    .sort((a, b) => a.order - b.order)
    .map(block => ({...block}));
};
