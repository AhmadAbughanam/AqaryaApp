import {createAuthenticatedApiClient} from './client';

const api = createAuthenticatedApiClient();

export type NotificationType =
  | 'listing_status_change'
  | 'investment_milestone'
  | 'new_message'
  | 'saved_search_match'
  | 'system';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  isRead: boolean;
  createdAt: string;
}

export const getNotifications = async (): Promise<AppNotification[]> => {
  const response = await api.get<AppNotification[]>('/users/me/notifications');
  return response.data;
};

export const markNotificationRead = async (id: string): Promise<void> => {
  await api.patch(`/users/me/notifications/${id}/read`, {});
};
