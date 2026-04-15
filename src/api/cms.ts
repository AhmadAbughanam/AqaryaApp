import {createAuthenticatedApiClient} from './client';

const api = createAuthenticatedApiClient();

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Display helpers ──────────────────────────────────────────────────────────

export const AUDIENCE_LABELS: Record<AnnouncementAudience, string> = {
  all_citizens: 'All Citizens',
  all_providers: 'All Providers',
  one_user: 'Single User',
};

export const ANNOUNCEMENT_STATUS_LABELS: Record<AnnouncementStatus, string> = {
  active: 'Active',
  archived: 'Archived',
};

// ─── Admin: announcements ─────────────────────────────────────────────────────

export const createAnnouncement = async (
  dto: CreateAnnouncementRequest,
): Promise<Announcement> => {
  const response = await api.post<Announcement>('/admin/announcements', dto);
  return response.data;
};

export const getAnnouncements = async (params?: {
  page?: number;
  limit?: number;
  status?: AnnouncementStatus;
}): Promise<AnnouncementsResponse> => {
  const response = await api.get<AnnouncementsResponse>('/admin/announcements', {params});
  return response.data;
};

export const archiveAnnouncement = async (id: string): Promise<Announcement> => {
  const response = await api.patch<Announcement>(`/admin/announcements/${id}/archive`);
  return response.data;
};

// ─── Admin: content blocks ────────────────────────────────────────────────────

export const getAdminContentBlocks = async (): Promise<ContentBlock[]> => {
  const response = await api.get<ContentBlock[]>('/admin/content');
  return response.data;
};

export const upsertContentBlock = async (
  key: string,
  dto: UpsertContentBlockRequest,
): Promise<ContentBlock> => {
  const response = await api.put<ContentBlock>(`/admin/content/${key}`, dto);
  return response.data;
};

// ─── Citizen: active content blocks ──────────────────────────────────────────

export const getActiveContentBlocks = async (): Promise<ContentBlock[]> => {
  const response = await api.get<ContentBlock[]>('/content/active');
  return response.data;
};
