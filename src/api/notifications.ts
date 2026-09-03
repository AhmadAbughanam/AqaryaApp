import {mockDelay, notifications} from '../mock/db';

export type NotificationType =
  | 'listing_status_change'
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
  await mockDelay();
  return notifications.map(item => ({...item}));
};

export const markNotificationRead = async (id: string): Promise<void> => {
  await mockDelay(80);
  const target = notifications.find(item => item.id === id);
  if (target) target.isRead = true;
};
