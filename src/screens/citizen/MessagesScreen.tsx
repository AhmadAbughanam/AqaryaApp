// Messages screen — thread list styled as a messenger inbox.

import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {CitizenMessagesStackParamList} from '../../navigation/CitizenMessagesStack';
import {getThreads, ThreadListItem} from '../../api/messages';
import {Colors} from '../../constants/colors';
import {useStrings} from '../../i18n';

type Nav = NativeStackNavigationProp<CitizenMessagesStackParamList, 'ThreadList'>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  '#1A1A1A', '#2A2A28', '#333330', '#3D3D3A',
  '#444442', '#525250', '#5C5C59',
];

const getAvatarColor = (seed: string): string => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash * 31) + seed.charCodeAt(i)) >>> 0;
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
};

const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

const formatTime = (isoString: string): string => {
  const date = new Date(isoString);
  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${hours}:${minutes} ${ampm}`;
};

// ─── Thread row ───────────────────────────────────────────────────────────────

const ThreadRow = ({
  thread,
  onPress,
}: {
  thread: ThreadListItem;
  onPress: () => void;
}) => {
  const strings = useStrings();
  const isOpportunity = Boolean(thread.opportunityId);
  const displayName = thread.subject;
  const propertyTitle = thread.listingTitle ?? thread.opportunityTitle ?? '';
  const preview = thread.lastMessage?.body ?? '';
  const time = thread.lastMessage
    ? formatTime(thread.lastMessage.createdAt)
    : formatTime(thread.updatedAt);
  // Unread: last message was from the other side (admin)
  const hasUnread = thread.lastMessage?.senderRole === 'admin';
  const typeLabel = isOpportunity
    ? strings.market.invest
    : thread.listingMarketType === 'rent'
    ? strings.market.rent
    : strings.market.buy;

  const avatarBg = getAvatarColor(thread.id);
  const initials = getInitials(displayName);

  return (
    <Pressable
      onPress={onPress}
      style={({pressed}) => [styles.row, pressed && styles.rowPressed]}
      accessibilityRole="button"
      accessibilityLabel={`Thread: ${displayName}`}>

      {/* Avatar */}
      <View style={styles.avatarWrap}>
        <View style={[styles.avatar, {backgroundColor: avatarBg}]}>
          <Text style={styles.avatarInitials}>{initials}</Text>
        </View>
        {hasUnread ? <View style={styles.unreadDot} /> : null}
        <View style={styles.verifiedBadge}>
          <Text style={styles.verifiedText}>✓</Text>
        </View>
      </View>

      {/* Body */}
      <View style={styles.body}>
        {/* Row 1: name + time */}
        <View style={styles.topRow}>
          <Text style={styles.name} numberOfLines={1}>{displayName}</Text>
          <Text style={styles.time}>{time}</Text>
        </View>

        {/* Row 2: property title */}
        {propertyTitle ? (
          <Text style={styles.propertyTitle} numberOfLines={1}>{propertyTitle}</Text>
        ) : null}

        {/* Row 3: preview + type badge */}
        <View style={styles.previewRow}>
          <Text style={styles.preview} numberOfLines={1}>{preview}</Text>
          <View style={[styles.typeBadge, isOpportunity && styles.typeBadgeInvest]}>
            <Text style={styles.typeBadgeText}>{typeLabel}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
};

// ─── Main screen ──────────────────────────────────────────────────────────────

const MessagesScreen = () => {
  const navigation = useNavigation<Nav>();
  const strings = useStrings();

  const menuOptions = [
    {label: strings.messages.menuMarkAllRead, key: 'read'},
    {label: strings.messages.menuFilterListing, key: 'filter_listing'},
    {label: strings.messages.menuFilterInvest, key: 'filter_invest'},
    {label: strings.messages.menuRefresh, key: 'refresh'},
  ];
  const [threads, setThreads] = useState<ThreadListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'listing' | 'invest'>('all');
  const menuBtnRef = useRef<View>(null);
  const [menuY, setMenuY] = useState(0);
  const [_menuX, setMenuX] = useState(0);

  const load = useCallback(async () => {
    try {
      const data = await getThreads();
      setThreads(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load messages.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleMenuOption = (key: string) => {
    setMenuVisible(false);
    if (key === 'refresh') {
      setIsRefreshing(true);
      void load();
    } else if (key === 'filter_listing') {
      setActiveFilter('listing');
    } else if (key === 'filter_invest') {
      setActiveFilter('invest');
    } else if (key === 'read') {
      // mark all read — visual only in dev
    }
  };

  const displayedThreads = threads.filter(t => {
    if (activeFilter === 'listing') return !t.opportunityId;
    if (activeFilter === 'invest') return Boolean(t.opportunityId);
    return true;
  });

  const openMenu = () => {
    menuBtnRef.current?.measure((_fx, _fy, _w, _h, px, py) => {
      setMenuX(px);
      setMenuY(py + _h + 4);
      setMenuVisible(true);
    });
  };

  return (
    <View style={styles.screen}>

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <View style={styles.topBar}>
        <View style={styles.topBarSide} />
        <Text style={styles.topBarTitle}>{strings.messages.screenTitle}</Text>
        <View style={styles.topBarSide}>
          <Pressable
            ref={menuBtnRef}
            onPress={openMenu}
            style={({pressed}) => [styles.menuBtn, pressed && {opacity: 0.6}]}
            accessibilityRole="button"
            accessibilityLabel="Options">
            <View style={styles.menuDot} />
            <View style={styles.menuDot} />
            <View style={styles.menuDot} />
          </Pressable>
        </View>
      </View>

      {/* ── Dropdown menu ───────────────────────────────────────────────── */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}>
        <Pressable style={styles.menuOverlay} onPress={() => setMenuVisible(false)}>
          <View style={[styles.menuDropdown, {top: menuY, right: 16}]}>
            {menuOptions.map((opt, i) => (
              <Pressable
                key={opt.key}
                onPress={() => handleMenuOption(opt.key)}
                style={({pressed}) => [
                  styles.menuItem,
                  i < menuOptions.length - 1 && styles.menuItemBorder,
                  pressed && styles.menuItemPressed,
                ]}
                accessibilityRole="button">
                <Text style={styles.menuItemText}>{opt.label}</Text>
                {opt.key === 'filter_listing' && activeFilter === 'listing' ? (
                  <Text style={styles.menuItemCheck}>✓</Text>
                ) : opt.key === 'filter_invest' && activeFilter === 'invest' ? (
                  <Text style={styles.menuItemCheck}>✓</Text>
                ) : null}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>

      {/* ── Section label ───────────────────────────────────────────────── */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionLabel}>
          {activeFilter === 'listing'
            ? strings.messages.filterListings
            : activeFilter === 'invest'
            ? strings.messages.filterInvestments
            : strings.messages.sectionMyProperties}
        </Text>
        {activeFilter !== 'all' ? (
          <Pressable onPress={() => setActiveFilter('all')} hitSlop={8}>
            <Text style={styles.clearFilter}>{strings.messages.clearFilter} ✕</Text>
          </Pressable>
        ) : null}
      </View>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={displayedThreads}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          renderItem={({item}) => (
            <ThreadRow
              thread={item}
              onPress={() =>
                navigation.navigate('ThreadDetail', {
                  threadId: item.id,
                  subject: item.subject,
                })
              }
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
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>💬</Text>
              <Text style={styles.emptyTitle}>{strings.messages.emptyTitle}</Text>
              <Text style={styles.emptyBody}>{strings.messages.emptySubtitle}</Text>
            </View>
          }
          contentContainerStyle={displayedThreads.length === 0 ? styles.emptyContainer : undefined}
        />
      )}
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    backgroundColor: Colors.white,
    flex: 1,
  },

  // ── Top bar ───────────────────────────────────────────────────────────────
  topBar: {
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderBottomColor: Colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 14,
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  topBarSide: {
    alignItems: 'flex-end',
    width: 44,
  },
  topBarTitle: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.1,
  },
  menuBtn: {
    alignItems: 'center',
    gap: 4,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  menuDot: {
    backgroundColor: Colors.textPrimary,
    borderRadius: 2,
    height: 4,
    width: 4,
  },

  // ── Dropdown menu ─────────────────────────────────────────────────────────
  menuOverlay: {
    flex: 1,
  },
  menuDropdown: {
    backgroundColor: Colors.white,
    borderColor: Colors.border,
    borderRadius: 12,
    borderWidth: 1,
    elevation: 8,
    minWidth: 200,
    position: 'absolute',
    shadowColor: Colors.shadowColorDark,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  menuItem: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  menuItemBorder: {
    borderBottomColor: Colors.border,
    borderBottomWidth: 1,
  },
  menuItemPressed: {
    backgroundColor: Colors.backgroundMuted,
  },
  menuItemText: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '500',
  },
  menuItemCheck: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },

  // ── Section header ────────────────────────────────────────────────────────
  sectionHeader: {
    alignItems: 'center',
    backgroundColor: Colors.white,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 6,
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  sectionLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  clearFilter: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },

  // ── Thread row ────────────────────────────────────────────────────────────
  row: {
    alignItems: 'center',
    backgroundColor: Colors.white,
    flexDirection: 'row',
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  rowPressed: {
    backgroundColor: Colors.backgroundMuted,
  },
  separator: {
    backgroundColor: Colors.border,
    height: 1,
    marginLeft: 86,
  },

  // ── Avatar ────────────────────────────────────────────────────────────────
  avatarWrap: {
    flexShrink: 0,
    height: 54,
    position: 'relative',
    width: 54,
  },
  avatar: {
    alignItems: 'center',
    borderRadius: 27,
    height: 54,
    justifyContent: 'center',
    width: 54,
  },
  avatarInitials: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  unreadDot: {
    backgroundColor: Colors.error,
    borderColor: Colors.white,
    borderRadius: 6,
    borderWidth: 1.5,
    height: 12,
    position: 'absolute',
    right: 1,
    top: 1,
    width: 12,
  },
  verifiedBadge: {
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    borderColor: Colors.white,
    borderRadius: 10,
    borderWidth: 1.5,
    bottom: 0,
    height: 20,
    justifyContent: 'center',
    position: 'absolute',
    right: 0,
    width: 20,
  },
  verifiedText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '800',
    lineHeight: 12,
  },

  // ── Body ──────────────────────────────────────────────────────────────────
  body: {
    flex: 1,
    gap: 3,
  },
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  name: {
    color: Colors.textPrimary,
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.1,
    marginRight: 8,
  },
  time: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  propertyTitle: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '500',
    opacity: 0.85,
  },
  previewRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  preview: {
    color: Colors.textSecondary,
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },
  typeBadge: {
    backgroundColor: Colors.backgroundMuted,
    borderRadius: 100,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  typeBadgeInvest: {
    backgroundColor: Colors.infoLight,
  },
  typeBadgeText: {
    color: Colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },

  // ── Empty / error ─────────────────────────────────────────────────────────
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

export default MessagesScreen;
