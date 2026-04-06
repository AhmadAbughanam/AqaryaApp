// Chatbot screen — matches the Riskify Manager chat UI from the design.
// Emmy avatar, voice message indicator, dark user bubbles, white bot bubbles.

import React, {useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  ChatMessage,
  sendMessageToLocalLLM,
} from '../../services/chatbotService';
import {Colors} from '../../constants/colors';
import {Strings} from '../../constants/strings';

// ─── Sub-components ───────────────────────────────────────────────────────────

// Emmy avatar — circular with initials
const EmmyAvatar = ({size = 36}: {size?: number}) => (
  <View style={[styles.emmyAvatar, {width: size, height: size, borderRadius: size / 2}]}>
    <Text style={styles.emmyAvatarText}>E</Text>
  </View>
);

// Typing indicator — three bouncing dots
const TypingIndicator = () => (
  <View style={styles.typingWrapper}>
    <EmmyAvatar size={32} />
    <View style={styles.typingBubble}>
      <Text style={styles.typingDots}>• • •</Text>
    </View>
  </View>
);

// Message bubble
const MessageBubble = ({item}: {item: ChatMessage}) => {
  const isUser = item.role === 'user';

  return (
    <View style={[styles.bubbleRow, isUser ? styles.bubbleRowUser : styles.bubbleRowBot]}>
      {/* Bot avatar — only on assistant messages */}
      {!isUser && <EmmyAvatar size={32} />}

      <View
        style={[
          styles.bubble,
          isUser ? styles.bubbleUser : styles.bubbleBot,
        ]}>
        <Text style={[styles.bubbleText, isUser ? styles.bubbleTextUser : styles.bubbleTextBot]}>
          {item.content}
        </Text>
      </View>
    </View>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

const ChatBotScreen = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const listRef = useRef<FlatList<ChatMessage>>(null);

  const resetConversation = () => {
    setMessages([]);
    setInput('');
  };

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        listRef.current?.scrollToEnd({animated: true});
      }, 100);
    }
  }, [messages]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isSending) {return;}

    setInput('');
    setIsSending(true);

    try {
      const {updatedContext} = await sendMessageToLocalLLM(trimmed, messages);
      setMessages(updatedContext);
    } catch {
      const fallback: ChatMessage = {
        id: `assistant-error-${Date.now()}`,
        role: 'assistant',
        content: Strings.chatbot.errorMessage,
        createdAt: new Date().toISOString(),
      };
      setMessages(prev => [...prev, fallback]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <EmmyAvatar size={44} />
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{Strings.chatbot.assistantName}</Text>
          <View style={styles.headerStatusRow}>
            <View style={styles.onlineDot} />
            <Text style={styles.headerStatus}>{Strings.chatbot.onlineStatus}</Text>
          </View>
        </View>
        {/* Close / X button */}
        <Pressable
          onPress={resetConversation}
          style={({pressed}) => [
            styles.headerCloseBtn,
            pressed && styles.headerCloseBtnPressed,
          ]}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Reset chat">
          <Text style={styles.headerCloseBtnText}>✕</Text>
        </Pressable>
      </View>

      {/* ── Message list ── */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>

        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({item}) => <MessageBubble item={item} />}

          ListHeaderComponent={
            messages.length === 0 ? (
              /* Welcome message */
              <View style={styles.welcomeWrapper}>
                <View style={styles.bubbleRow}>
                  <EmmyAvatar size={32} />
                  <View style={styles.bubbleBot}>
                    <Text style={styles.bubbleTextBot}>
                      {Strings.chatbot.welcomeMessage}
                    </Text>
                  </View>
                </View>
              </View>
            ) : null
          }

          ListFooterComponent={
            isSending ? <TypingIndicator /> : null
          }
        />

        {/* ── Input row ── */}
        <View style={styles.inputBar}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder={Strings.chatbot.inputPlaceholder}
            placeholderTextColor={Colors.textMuted}
            style={styles.input}
            editable={!isSending}
            multiline
            maxLength={500}
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
          />
          <Pressable
            onPress={handleSend}
            disabled={isSending || !input.trim()}
            style={({pressed}) => [
              styles.sendBtn,
              (isSending || !input.trim()) && styles.sendBtnDisabled,
              pressed && styles.sendBtnPressed,
            ]}>
            {isSending ? (
              <ActivityIndicator size="small" color={Colors.textOnDark} />
            ) : (
              <Text style={styles.sendBtnIcon}>➤</Text>
            )}
          </Pressable>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    backgroundColor: Colors.backgroundPrimary,
    flex: 1,
  },
  flex: {
    flex: 1,
  },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    borderBottomColor: Colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerInfo: {
    flex: 1,
    gap: 3,
  },
  headerName: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  headerStatusRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  onlineDot: {
    backgroundColor: Colors.chatOnlineIndicator,
    borderRadius: 4,
    height: 7,
    width: 7,
  },
  headerStatus: {
    color: Colors.chatOnlineIndicator,
    fontSize: 12,
    fontWeight: '500',
  },
  headerCloseBtn: {
    alignItems: 'center',
    backgroundColor: Colors.backgroundMuted,
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  headerCloseBtnPressed: {
    opacity: 0.8,
  },
  headerCloseBtnText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },

  // ── Emmy avatar ───────────────────────────────────────────────────────────
  emmyAvatar: {
    alignItems: 'center',
    backgroundColor: Colors.primaryDark,
    justifyContent: 'center',
  },
  emmyAvatarText: {
    color: Colors.textOnDark,
    fontSize: 15,
    fontWeight: '800',
  },

  // ── Message list ──────────────────────────────────────────────────────────
  listContent: {
    flexGrow: 1,
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  welcomeWrapper: {
    marginBottom: 4,
  },

  // ── Bubbles ───────────────────────────────────────────────────────────────
  bubbleRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 8,
    maxWidth: '88%',
  },
  bubbleRowUser: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  bubbleRowBot: {
    alignSelf: 'flex-start',
  },
  bubble: {
    borderRadius: 18,
    maxWidth: '100%',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleUser: {
    backgroundColor: Colors.chatBubbleUser,
    borderBottomRightRadius: 4,
  },
  bubbleBot: {
    backgroundColor: Colors.chatBubbleBot,
    borderBottomLeftRadius: 4,
    borderColor: Colors.chatBubbleBotBorder,
    borderWidth: 1,
    // Shadow
    shadowColor: Colors.shadowColor,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 20,
  },
  bubbleTextUser: {
    color: Colors.textOnDark,
  },
  bubbleTextBot: {
    color: Colors.textPrimary,
  },

  // ── Typing indicator ──────────────────────────────────────────────────────
  typingWrapper: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  typingBubble: {
    backgroundColor: Colors.chatBubbleBot,
    borderColor: Colors.chatBubbleBotBorder,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  typingDots: {
    color: Colors.textMuted,
    fontSize: 16,
    letterSpacing: 3,
  },

  // ── Input bar ─────────────────────────────────────────────────────────────
  inputBar: {
    alignItems: 'flex-end',
    backgroundColor: Colors.backgroundSecondary,
    borderTopColor: Colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingBottom: Platform.OS === 'ios' ? 16 : 12,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  input: {
    backgroundColor: Colors.chatInputBackground,
    borderColor: Colors.border,
    borderRadius: 22,
    borderWidth: 1.5,
    color: Colors.textPrimary,
    flex: 1,
    fontSize: 15,
    maxHeight: 100,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  sendBtn: {
    alignItems: 'center',
    backgroundColor: Colors.primaryDark,
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    shadowColor: Colors.primaryDark,
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
    width: 44,
  },
  sendBtnDisabled: {
    backgroundColor: Colors.primaryLight,
    elevation: 0,
    shadowOpacity: 0,
  },
  sendBtnPressed: {
    opacity: 0.85,
    transform: [{scale: 0.95}],
  },
  sendBtnIcon: {
    color: Colors.textOnDark,
    fontSize: 16,
    marginLeft: 2,
  },
});

export default ChatBotScreen;
