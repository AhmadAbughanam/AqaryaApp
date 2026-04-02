// Reusable pressable action button with loading, disabled states and press animation.
// Used for quick inline actions — approve, reject, invest, share, etc.

import React, {useRef} from 'react';
import {
  ActivityIndicator,
  Animated,
  StyleProp,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  ViewStyle,
} from 'react-native';
import {Colors} from '../constants/colors';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ActionButtonVariant =
  | 'primary'   // Sage green — default positive action
  | 'dark'      // Deep forest — main CTA (matches dark stat cards)
  | 'danger'    // Muted red — destructive actions (reject, delete)
  | 'neutral'   // Muted sage — secondary/neutral actions
  | 'ghost';    // Transparent with border — subtle actions

interface ActionButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: ActionButtonVariant;
  style?: StyleProp<ViewStyle>;
  fullWidth?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

const ActionButton = ({
  title,
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary',
  style,
  fullWidth = false,
}: ActionButtonProps) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 6,
    }).start();
  };

  const isDisabled = disabled || loading;

  const spinnerColor =
    variant === 'ghost' || variant === 'neutral'
      ? Colors.primary
      : Colors.textOnDark;

  return (
    <TouchableWithoutFeedback
      onPress={isDisabled ? undefined : onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{disabled: isDisabled, busy: loading}}>
      <Animated.View
        style={[
          styles.base,
          styles[`variant_${variant}`],
          isDisabled && styles.disabled,
          isDisabled && styles[`disabled_${variant}`],
          fullWidth && styles.fullWidth,
          {transform: [{scale: scaleAnim}]},
          style,
        ]}>
        {loading ? (
          <ActivityIndicator size="small" color={spinnerColor} />
        ) : (
          <Text
            style={[
              styles.label,
              styles[`label_${variant}`],
              isDisabled && styles.labelDisabled,
            ]}>
            {title}
          </Text>
        )}
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // ── Base ──────────────────────────────────────────────────────────────────
  base: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 100, // Pill-shaped — matches the UI
    justifyContent: 'center',
    minHeight: 42,
    minWidth: 96,
    paddingHorizontal: 20,
    paddingVertical: 11,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },

  // ── Variants ─────────────────────────────────────────────────────────────
  variant_primary: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  variant_dark: {
    backgroundColor: Colors.primaryDark,
    shadowColor: Colors.primaryDark,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 5,
  },
  variant_danger: {
    backgroundColor: Colors.error,
    shadowColor: Colors.error,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 4,
  },
  variant_neutral: {
    backgroundColor: Colors.backgroundMuted,
    borderColor: Colors.border,
    borderWidth: 1,
    elevation: 0,
  },
  variant_ghost: {
    backgroundColor: Colors.transparent,
    borderColor: Colors.primary,
    borderWidth: 1.5,
    elevation: 0,
  },

  // ── Disabled ──────────────────────────────────────────────────────────────
  disabled: {
    elevation: 0,
    shadowOpacity: 0,
  },
  disabled_primary: {
    backgroundColor: Colors.primaryLight,
  },
  disabled_dark: {
    backgroundColor: Colors.primaryLight,
  },
  disabled_danger: {
    backgroundColor: Colors.errorLight,
  },
  disabled_neutral: {
    opacity: 0.5,
  },
  disabled_ghost: {
    opacity: 0.4,
  },

  // ── Labels ────────────────────────────────────────────────────────────────
  label: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  label_primary: {
    color: Colors.textOnDark,
  },
  label_dark: {
    color: Colors.textOnDark,
  },
  label_danger: {
    color: Colors.textOnDark,
  },
  label_neutral: {
    color: Colors.textPrimary,
  },
  label_ghost: {
    color: Colors.primary,
  },
  labelDisabled: {
    color: Colors.textMuted,
  },
});

export default ActionButton;