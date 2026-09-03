import {getNotifications, markNotificationRead} from '../../api/notifications';
import {EmptyState, ErrorState, LoadingState, PageHeader, formatDate} from '../ui';
import {useAsyncData} from '../useAsyncData';

export function NotificationsPage() {
  const result = useAsyncData(getNotifications);
  async function read(id: string) {
    await markNotificationRead(id);
    result.refresh();
  }
  return (
    <>
      <PageHeader title="Notifications" />
      {result.loading ? <LoadingState /> : null}
      {result.error ? <ErrorState message={result.error} retry={result.refresh} /> : null}
      {result.data && !result.data.length ? <EmptyState title="You're all caught up" description="New platform updates will appear here." /> : null}
      <div className="notification-list">{result.data?.map(item => <button className={`notification ${item.isRead ? '' : 'notification--unread'}`} key={item.id} onClick={() => void read(item.id)} type="button"><span className="notification__dot" /><div><strong>{item.title}</strong><p>{item.body}</p><small>{formatDate(item.createdAt)}</small></div></button>)}</div>
    </>
  );
}
