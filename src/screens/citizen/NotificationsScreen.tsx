// Notifications screen — in-app activity feed.
// Shows listing status changes, investment milestones, new messages, and saved-search matches.
// Tapping a notification marks it as read.

import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {getNotifications, markNotificationRead, AppNotification} from '../../api/notifications';
import {Colors} from '../../constants/colors';
import {useStrings} from '../../i18n';

const TYPE_COLOR: Record<string, string> = {
  listing_status_change: '#1A1A1A',
  investment_milestone: '#D4A853',
  new_message: '#444442',
  saved_search_match: '#4A7A9B',
  system: '#AEAEAE',
};

const TYPE_INITIAL: Record<string, string> = {
  listing_status_change: 'L',
  investment_milestone: '◆',
  new_message: 'M',
  saved_search_match: 'S',
  system: 'i',
};

const formatRelativeTime = (isoString: string): string => {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(isoString).toLocaleDateString('en-US', {month: 'short', day: 'numeric'});
};

const NotificationRow = ({
  notification,
  onPress,
}: {
  notification: AppNotification;
  onPress: () => void;
}) => (
  <Pressable
    onPress={onPress}
    style={({pressed}) => [
      styles.row,
      !notification.isRead && styles.rowUnread,
      pressed && styles.rowPressed,
    ]}
    accessibilityRole="button"
    accessibilityLabel={notification.title}>
    <View style={[
      styles.rowIconWrap,
      {backgroundColor: TYPE_COLOR[notification.type] ?? '#9DB8AF'},
      !notification.isRead && styles.rowIconWrapUnread,
    ]}>
      <Text style={styles.rowIconText}>{TYPE_INITIAL[notification.type] ?? 'i'}</Text>
    </View>
    <View style={styles.rowBody}>
      <View style={styles.rowTopRow}>
        <Text
          style={[styles.rowTitle, !notification.isRead && styles.rowTitleUnread]}
          numberOfLines={1}>
          {notification.title}
        </Text>
        <Text style={styles.rowTime}>{formatRelativeTime(notification.createdAt)}</Text>
      </View>
      <Text style={styles.rowBodyText} numberOfLines={2}>
        {notification.body}
      </Text>
    </View>
    {!notification.isRead && <View style={styles.unreadDot} />}
  </Pressable>
);

const NotificationsScreen = () => {
  const strings = useStrings();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await getNotifications();
      setNotifications(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load notifications.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onNotificationPress = async (notification: AppNotification) => {
    if (!notification.isRead) {
      try {
        await markNotificationRead(notification.id);
        setNotifications(prev =>
          prev.map(n => (n.id === notification.id ? {...n, isRead: true} : n)),
        );
      } catch {
        // non-critical — don't surface to user
      }
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerLabel}>Activity</Text>
          <Text style={styles.headerTitle}>{strings.notifications.screenTitle}</Text>
        </View>
        {notifications.some(n => !n.isRead) && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>
              {notifications.filter(n => !n.isRead).length} {strings.notifications.unreadLabel}
            </Text>
          </View>
        )}
      </View>

      {error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={item => item.id}
          renderItem={({item}) => (
            <NotificationRow
              notification={item}
              onPress={() => void onNotificationPress(item)}
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => {
                setIsRefreshing(true);
                void load();
              }}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🔔</Text>
              <Text style={styles.emptyTitle}>{strings.notifications.emptyTitle}</Text>
              <Text style={styles.emptyBody}>{strings.notifications.emptyBody}</Text>
            </View>
          }
          contentContainerStyle={notifications.length === 0 ? styles.emptyContainer : undefined}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    backgroundColor: Colors.backgroundPrimary,
    flex: 1,
  },
  header: {
    alignItems: 'flex-start',
    backgroundColor: Colors.backgroundSecondary,
    borderBottomColor: Colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 16,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  headerLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.5,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 0.1,
  },
  unreadBadge: {
    alignSelf: 'center',
    backgroundColor: Colors.errorLight,
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  unreadBadgeText: {
    color: Colors.error,
    fontSize: 12,
    fontWeight: '700',
  },
  centered: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  errorText: {
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  row: {
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    borderBottomColor: Colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  rowUnread: {
    backgroundColor: '#F0F7F3',
  },
  rowPressed: {
    backgroundColor: Colors.backgroundMuted,
  },
  rowIconWrap: {
    alignItems: 'center',
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    width: 48,
    flexShrink: 0,
  },
  rowIconWrapUnread: {
    // subtle ring for unread state
    shadowColor: Colors.primary,
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  rowIconText: {
    color: Colors.textOnDark,
    fontSize: 14,
    fontWeight: '800',
  },
  rowBody: {
    flex: 1,
    gap: 3,
  },
  rowTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rowTitle: {
    color: Colors.textPrimary,
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  rowTitleUnread: {
    fontWeight: '800',
  },
  rowTime: {
    color: Colors.textMuted,
    fontSize: 11,
  },
  rowBodyText: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  unreadDot: {
    backgroundColor: Colors.primaryDark,
    borderRadius: 5,
    height: 8,
    width: 8,
    flexShrink: 0,
  },
  emptyContainer: {
    flexGrow: 1,
  },
  emptyState: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 16,
  },
  emptyTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyBody: {
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
});

export default NotificationsScreen;
