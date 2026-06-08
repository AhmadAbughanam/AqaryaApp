// Placeholder: Reusable Modal component scaffold.
// Reusable Modal component for the Riskify app.
// Supports title, subtitle, custom content, confirm/cancel actions, and variants.

import React, {useEffect, useRef} from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Modal as RNModal,
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
  ViewStyle,
} from 'react-native';
import {Colors} from '../constants/colors';
import Button from './Button';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ModalVariant = 'default' | 'confirm' | 'danger' | 'sheet';

interface ModalAction {
  label: string;
  onPress: () => void;
  loading?: boolean;
}

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
  primaryAction?: ModalAction;
  secondaryAction?: ModalAction;
  variant?: ModalVariant;
  closeOnBackdrop?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}

// ─── Component ────────────────────────────────────────────────────────────────

const Modal: React.FC<ModalProps> = ({
  visible,
  onClose,
  title,
  subtitle,
  children,
  primaryAction,
  secondaryAction,
  variant = 'default',
  closeOnBackdrop = true,
  contentStyle,
}) => {
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(60)).current;
  const scaleAnim = useRef(new Animated.Value(0.94)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          speed: 18,
          bounciness: 5,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          speed: 18,
          bounciness: 5,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 60,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.94,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, backdropAnim, slideAnim, scaleAnim]);

  const isSheet = variant === 'sheet';

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        {/* Backdrop */}
        <TouchableWithoutFeedback
          onPress={closeOnBackdrop ? onClose : undefined}>
          <Animated.View
            style={[styles.backdrop, {opacity: backdropAnim}]}
          />
        </TouchableWithoutFeedback>

        {/* Modal card */}
        <Animated.View
          style={[
            isSheet ? styles.sheet : styles.card,
            {
              transform: isSheet
                ? [{translateY: slideAnim}]
                : [{translateY: slideAnim}, {scale: scaleAnim}],
            },
          ]}>

          {/* Sheet drag handle */}
          {isSheet && <View style={styles.dragHandle} />}

          {/* Header */}
          {(title || subtitle) && (
            <View style={styles.header}>
              {title && (
                <Text
                  style={[
                    styles.title,
                    variant === 'danger' && styles.titleDanger,
                  ]}>
                  {title}
                </Text>
              )}
              {subtitle && (
                <Text style={styles.subtitle}>{subtitle}</Text>
              )}
            </View>
          )}

          {/* Close button */}
          <Pressable
            style={styles.closeButton}
            onPress={onClose}
            accessibilityLabel="Close modal"
            accessibilityRole="button"
            hitSlop={12}>
            <View style={styles.closeIcon}>
              <View style={[styles.closeLine, styles.closeLineLeft]} />
              <View style={[styles.closeLine, styles.closeLineRight]} />
            </View>
          </Pressable>

          {/* Content */}
          {children && (
            <View style={[styles.content, contentStyle]}>{children}</View>
          )}

          {/* Actions */}
          {(primaryAction || secondaryAction) && (
            <View style={styles.actions}>
              {secondaryAction && (
                <Button
                  label={secondaryAction.label}
                  onPress={secondaryAction.onPress}
                  variant="secondary"
                  size="md"
                  style={styles.actionButton}
                  loading={secondaryAction.loading}
                />
              )}
              {primaryAction && (
                <Button
                  label={primaryAction.label}
                  onPress={primaryAction.onPress}
                  variant={variant === 'danger' ? 'danger' : 'primary'}
                  size="md"
                  style={styles.actionButton}
                  loading={primaryAction.loading}
                />
              )}
            </View>
          )}
        </Animated.View>
      </KeyboardAvoidingView>
    </RNModal>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // ── Layout ────────────────────────────────────────────────────────────────
  keyboardView: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },

  // ── Backdrop ──────────────────────────────────────────────────────────────
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.overlay,
  },

  // ── Centered card modal ───────────────────────────────────────────────────
  card: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 24,
    marginHorizontal: 24,
    paddingBottom: 24,
    paddingHorizontal: 24,
    paddingTop: 28,
    shadowColor: Colors.shadowColorDark,
    shadowOffset: {width: 0, height: 12},
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
    width: '100%',
    maxWidth: 400,
  },

  // ── Bottom sheet modal ────────────────────────────────────────────────────
  sheet: {
    backgroundColor: Colors.backgroundSecondary,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    bottom: 0,
    paddingBottom: 36,
    paddingHorizontal: 24,
    paddingTop: 16,
    position: 'absolute',
    shadowColor: Colors.shadowColorDark,
    shadowOffset: {width: 0, height: -6},
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 12,
    width: '100%',
  },

  // ── Drag handle (sheet only) ──────────────────────────────────────────────
  dragHandle: {
    alignSelf: 'center',
    backgroundColor: Colors.border,
    borderRadius: 4,
    height: 4,
    marginBottom: 20,
    width: 40,
  },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    gap: 6,
    marginBottom: 16,
    paddingRight: 32, // Space for close button
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  titleDanger: {
    color: Colors.error,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '400',
    letterSpacing: 0.1,
    lineHeight: 20,
  },

  // ── Close button ──────────────────────────────────────────────────────────
  closeButton: {
    alignItems: 'center',
    backgroundColor: Colors.backgroundMuted,
    borderRadius: 20,
    height: 32,
    justifyContent: 'center',
    position: 'absolute',
    right: 16,
    top: 20,
    width: 32,
  },
  closeIcon: {
    alignItems: 'center',
    height: 14,
    justifyContent: 'center',
    width: 14,
  },
  closeLine: {
    backgroundColor: Colors.textSecondary,
    borderRadius: 2,
    height: 1.5,
    position: 'absolute',
    width: 14,
  },
  closeLineLeft: {
    transform: [{rotate: '45deg'}],
  },
  closeLineRight: {
    transform: [{rotate: '-45deg'}],
  },

  // ── Content ───────────────────────────────────────────────────────────────
  content: {
    marginBottom: 20,
  },

  // ── Actions ───────────────────────────────────────────────────────────────
  actions: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'flex-end',
  },
  actionButton: {
    flex: 1,
  },
});

export default Modal;
