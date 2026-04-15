// Thread detail — polished messenger-style chat UI matching the app's warm neutral theme.

import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {useRoute, RouteProp} from '@react-navigation/native';
import {CitizenMessagesStackParamList} from '../../navigation/CitizenMessagesStack';
import {getThreadDetail, sendMessage, ThreadDetail, MessageItem} from '../../api/messages';
import {Colors} from '../../constants/colors';
import {useStrings} from '../../i18n';

type Route = RouteProp<CitizenMessagesStackParamList, 'ThreadDetail'>;

// ─── Data shape ───────────────────────────────────────────────────────────────

type ChatItem =
  | {kind: 'date'; label: string; key: string}
  | {
      kind: 'message';
      message: MessageItem;
      isFirstInGroup: boolean;
      isLastInGroup: boolean;
      key: string;
    };

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

const formatTime = (iso: string): string =>
  new Date(iso).toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit'});

const formatDateLabel = (iso: string): string => {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-US', {weekday: 'long', month: 'short', day: 'numeric'});
};

const sameDay = (a: string, b: string): boolean => {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
};

const buildChatItems = (messages: MessageItem[]): ChatItem[] => {
  const items: ChatItem[] = [];
  messages.forEach((msg, i) => {
    const prev = messages[i - 1];
    const next = messages[i + 1];
    if (!prev || !sameDay(prev.createdAt, msg.createdAt)) {
      items.push({kind: 'date', label: formatDateLabel(msg.createdAt), key: `date-${i}`});
    }
    const isFirstInGroup =
      !prev || prev.senderRole !== msg.senderRole || !sameDay(prev.createdAt, msg.createdAt);
    const isLastInGroup =
      !next || next.senderRole !== msg.senderRole || !sameDay(msg.createdAt, next.createdAt);
    items.push({kind: 'message', message: msg, isFirstInGroup, isLastInGroup, key: msg.id});
  });
  return items;
};

// ─── Context property card ────────────────────────────────────────────────────

const ContextCard = ({thread}: {thread: ThreadDetail}) => {
  const isListing = Boolean(thread.listing);
  const title = thread.listing?.title ?? thread.opportunity?.title;
  if (!title) return null;

  const location = thread.listing?.location ?? thread.opportunity?.location ?? '';
  const typeLabel = isListing
    ? thread.listing!.marketType === 'rent'
      ? 'For Rent'
      : 'For Sale'
    : 'Investment';

  return (
    <View style={styles.contextCard}>
      <View style={[styles.contextIconWrap, !isListing && styles.contextIconWrapInvest]}>
        <Text style={styles.contextIconText}>{isListing ? '⌂' : '◆'}</Text>
      </View>
      <View style={styles.contextInfo}>
        <Text style={styles.contextTitle} numberOfLines={1}>{title}</Text>
        {location ? (
          <Text style={styles.contextSub} numberOfLines={1}>{location}</Text>
        ) : null}
      </View>
      <View style={[styles.contextBadge, !isListing && styles.contextBadgeInvest]}>
        <Text style={styles.contextBadgeText}>{typeLabel}</Text>
      </View>
    </View>
  );
};

// ─── Date separator ───────────────────────────────────────────────────────────

const DateSeparator = ({label}: {label: string}) => (
  <View style={styles.dateSepRow}>
    <View style={styles.dateSepLine} />
    <Text style={styles.dateSepLabel}>{label}</Text>
    <View style={styles.dateSepLine} />
  </View>
);

// ─── Message bubble ───────────────────────────────────────────────────────────

const MessageBubble = ({
  message,
  isFirstInGroup,
  isLastInGroup,
}: {
  message: MessageItem;
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
}) => {
  const isCitizen = message.senderRole === 'citizen';
  const initials = getInitials(message.senderName);

  return (
    <View
      style={[
        styles.bubbleRow,
        isCitizen ? styles.bubbleRowSelf : styles.bubbleRowOther,
        !isLastInGroup && styles.bubbleRowGrouped,
      ]}>

      {/* Admin avatar column — keeps alignment consistent */}
      {!isCitizen && (
        <View style={styles.avatarCol}>
          {isLastInGroup ? (
            <View style={styles.adminAvatar}>
              <Text style={styles.adminAvatarText}>{initials}</Text>
            </View>
          ) : null}
        </View>
      )}

      {/* Bubble */}
      <View
        style={[
          styles.bubble,
          isCitizen ? styles.bubbleSelf : styles.bubbleOther,
          // Tail: clip bottom corner on last in group
          isCitizen && isLastInGroup && styles.bubbleSelfTail,
          !isCitizen && isLastInGroup && styles.bubbleOtherTail,
          // Slightly less rounded on top when grouped below another
          isCitizen && !isFirstInGroup && styles.bubbleSelfMid,
          !isCitizen && !isFirstInGroup && styles.bubbleOtherMid,
        ]}>

        {/* Sender name — only on first admin bubble in group */}
        {!isCitizen && isFirstInGroup && (
          <Text style={styles.senderName}>{message.senderName}</Text>
        )}

        <Text
          style={[
            styles.bubbleText,
            isCitizen ? styles.bubbleTextSelf : styles.bubbleTextOther,
          ]}>
          {message.body}
        </Text>

        <Text
          style={[
            styles.bubbleTime,
            isCitizen ? styles.bubbleTimeSelf : styles.bubbleTimeOther,
          ]}>
          {formatTime(message.createdAt)}
        </Text>
      </View>
    </View>
  );
};

// ─── Send button icon ─────────────────────────────────────────────────────────

const SendButton = ({
  onPress,
  enabled,
  loading,
}: {
  onPress: () => void;
  enabled: boolean;
  loading: boolean;
}) => (
  <Pressable
    onPress={onPress}
    disabled={!enabled || loading}
    style={({pressed}) => [
      styles.sendBtn,
      !enabled && styles.sendBtnDisabled,
      pressed && enabled && styles.sendBtnPressed,
    ]}
    accessibilityRole="button"
    accessibilityLabel="Send message">
    {loading ? (
      <ActivityIndicator size="small" color={Colors.white} />
    ) : (
      <Text style={[styles.sendBtnIcon, !enabled && styles.sendBtnIconDisabled]}>↑</Text>
    )}
  </Pressable>
);

// ─── Main screen ──────────────────────────────────────────────────────────────

const ThreadDetailScreen = () => {
  const strings = useStrings();
  const route = useRoute<Route>();
  const {threadId} = route.params;
  const flatListRef = useRef<FlatList<ChatItem>>(null);

  const [thread, setThread] = useState<ThreadDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getThreadDetail(threadId);
      setThread(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load thread.');
    } finally {
      setIsLoading(false);
    }
  }, [threadId]);

  useEffect(() => {
    void load();
  }, [load]);

  const chatItems = useMemo<ChatItem[]>(
    () => buildChatItems(thread?.messages ?? []),
    [thread?.messages],
  );

  const onSend = async () => {
    const body = replyText.trim();
    if (!body || isSending) return;
    setIsSending(true);
    try {
      const message = await sendMessage(threadId, body);
      setThread(prev =>
        prev ? {...prev, messages: [...prev.messages, message]} : prev,
      );
      setReplyText('');
      setTimeout(() => flatListRef.current?.scrollToEnd({animated: true}), 80);
    } catch {
      // non-critical — user can retry
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>{strings.thread.loadingText}</Text>
      </View>
    );
  }

  if (error || !thread) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error ?? strings.thread.notFound}</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={96}>

      {/* Property context card */}
      <ContextCard thread={thread} />

      {/* Message list */}
      <FlatList<ChatItem>
        ref={flatListRef}
        data={chatItems}
        keyExtractor={item => item.key}
        renderItem={({item}) => {
          if (item.kind === 'date') {
            return <DateSeparator label={item.label} />;
          }
          return (
            <MessageBubble
              message={item.message}
              isFirstInGroup={item.isFirstInGroup}
              isLastInGroup={item.isLastInGroup}
            />
          );
        }}
        contentContainerStyle={[
          styles.messageList,
          chatItems.length === 0 && styles.messageListEmpty,
        ]}
        onLayout={() => flatListRef.current?.scrollToEnd({animated: false})}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyText}>{strings.thread.emptyMessages}</Text>
          </View>
        }
      />

      {/* Composer */}
      <View style={styles.composer}>
        <TextInput
          style={styles.composerInput}
          placeholder={strings.thread.inputPlaceholder}
          placeholderTextColor={Colors.textMuted}
          value={replyText}
          onChangeText={setReplyText}
          multiline
          maxLength={2000}
          returnKeyType="default"
          accessibilityLabel="Message input"
          selectionColor={Colors.primary}
        />
        <SendButton
          onPress={() => void onSend()}
          enabled={Boolean(replyText.trim())}
          loading={isSending}
        />
      </View>
    </KeyboardAvoidingView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const AVATAR_SIZE = 36;
const BUBBLE_MAX = '74%';

const styles = StyleSheet.create({
  screen: {
    backgroundColor: Colors.backgroundPrimary,
    flex: 1,
  },
  centered: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginTop: 12,
  },
  errorText: {
    color: Colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },

  // ── Context card ──────────────────────────────────────────────────────────
  contextCard: {
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    borderBottomColor: Colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  contextIconWrap: {
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    borderRadius: 10,
    flexShrink: 0,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  contextIconWrapInvest: {
    backgroundColor: Colors.infoLight,
  },
  contextIconText: {
    color: Colors.textPrimary,
    fontSize: 18,
  },
  contextInfo: {
    flex: 1,
    gap: 2,
  },
  contextTitle: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  contextSub: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  contextBadge: {
    backgroundColor: Colors.backgroundMuted,
    borderColor: Colors.border,
    borderRadius: 100,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  contextBadgeInvest: {
    backgroundColor: Colors.infoLight,
    borderColor: Colors.info,
  },
  contextBadgeText: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },

  // ── Message list ──────────────────────────────────────────────────────────
  messageList: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 6,
  },
  messageListEmpty: {
    flexGrow: 1,
  },

  // ── Date separator ────────────────────────────────────────────────────────
  dateSepRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
    marginTop: 8,
  },
  dateSepLine: {
    backgroundColor: Colors.border,
    flex: 1,
    height: 1,
  },
  dateSepLabel: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },

  // ── Bubble row ────────────────────────────────────────────────────────────
  bubbleRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    marginBottom: 10,
  },
  bubbleRowGrouped: {
    marginBottom: 3,
  },
  bubbleRowSelf: {
    justifyContent: 'flex-end',
  },
  bubbleRowOther: {
    justifyContent: 'flex-start',
    gap: 8,
  },

  // ── Admin avatar ──────────────────────────────────────────────────────────
  avatarCol: {
    alignItems: 'center',
    flexShrink: 0,
    height: AVATAR_SIZE,
    justifyContent: 'center',
    width: AVATAR_SIZE,
  },
  adminAvatar: {
    alignItems: 'center',
    backgroundColor: Colors.primaryDark,
    borderRadius: AVATAR_SIZE / 2,
    height: AVATAR_SIZE,
    justifyContent: 'center',
    width: AVATAR_SIZE,
  },
  adminAvatarText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  // ── Bubble ────────────────────────────────────────────────────────────────
  bubble: {
    borderRadius: 18,
    maxWidth: BUBBLE_MAX,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleSelf: {
    backgroundColor: Colors.primary,
  },
  bubbleSelfTail: {
    borderBottomRightRadius: 4,
  },
  bubbleSelfMid: {
    borderTopRightRadius: 6,
  },
  bubbleOther: {
    backgroundColor: Colors.backgroundSecondary,
    borderColor: Colors.border,
    borderWidth: 1,
  },
  bubbleOtherTail: {
    borderBottomLeftRadius: 4,
  },
  bubbleOtherMid: {
    borderTopLeftRadius: 6,
  },
  senderName: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 20,
  },
  bubbleTextSelf: {
    color: Colors.white,
  },
  bubbleTextOther: {
    color: Colors.textPrimary,
  },
  bubbleTime: {
    fontSize: 10,
    marginTop: 5,
  },
  bubbleTimeSelf: {
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'right',
  },
  bubbleTimeOther: {
    color: Colors.textMuted,
  },

  // ── Empty state ───────────────────────────────────────────────────────────
  emptyState: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 12,
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },

  // ── Composer ──────────────────────────────────────────────────────────────
  composer: {
    alignItems: 'flex-end',
    backgroundColor: Colors.backgroundSecondary,
    borderTopColor: Colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingBottom: Platform.OS === 'ios' ? 28 : 14,
    paddingHorizontal: 14,
    paddingTop: 12,
  },
  composerInput: {
    backgroundColor: Colors.backgroundPrimary,
    borderColor: Colors.border,
    borderRadius: 22,
    borderWidth: 1.5,
    color: Colors.textPrimary,
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    maxHeight: 110,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  sendBtn: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 22,
    flexShrink: 0,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  sendBtnDisabled: {
    backgroundColor: Colors.backgroundMuted,
  },
  sendBtnPressed: {
    opacity: 0.75,
  },
  sendBtnIcon: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 22,
  },
  sendBtnIconDisabled: {
    color: Colors.textMuted,
  },
});

export default ThreadDetailScreen;
