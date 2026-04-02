// Placeholder: Reusable Button component scaffold.
// Reusable Button component for the Riskify app.
// Variants: primary (dark forest), secondary (outlined sage), ghost, danger.
// Sizes: sm, md, lg.
// Supports loading state, disabled state, left/right icons.

import React, {useRef} from 'react';
import {
  ActivityIndicator,
  Animated,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
  ViewStyle,
  TextStyle,
  StyleProp,
} from 'react-native';
import {Colors} from '../constants/colors';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'dark';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
}

// ─── Component ────────────────────────────────────────────────────────────────

const Button: React.FC<ButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  style,
  labelStyle,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.96,
        useNativeDriver: true,
        speed: 50,
        bounciness: 4,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0.85,
        duration: 80,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 50,
        bounciness: 6,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const isDisabled = disabled || loading;

  // ── Resolve variant styles ──
  const containerStyle = [
    styles.base,
    styles[`size_${size}`],
    styles[`variant_${variant}`],
    isDisabled && styles.disabled,
    isDisabled && styles[`disabled_${variant}`],
    fullWidth && styles.fullWidth,
    style,
  ];

  const textStyle = [
    styles.label,
    styles[`label_${size}`],
    styles[`label_${variant}`],
    isDisabled && styles.labelDisabled,
    labelStyle,
  ];

  const spinnerColor =
    variant === 'primary' || variant === 'dark'
      ? Colors.textOnDark
      : Colors.primary;

  return (
    <TouchableWithoutFeedback
      onPress={isDisabled ? undefined : onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{disabled: isDisabled, busy: loading}}>
      <Animated.View
        style={[
          containerStyle,
          {transform: [{scale: scaleAnim}], opacity: opacityAnim},
        ]}>
        {loading ? (
          <ActivityIndicator size="small" color={spinnerColor} />
        ) : (
          <>
            {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
            <Text style={textStyle}>{label}</Text>
            {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
          </>
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
    borderRadius: 100, // Fully pill-shaped — matches the UI
    flexDirection: 'row',
    justifyContent: 'center',
  },
  fullWidth: {
    alignSelf: 'stretch',
  },

  // ── Sizes ────────────────────────────────────────────────────────────────
  size_sm: {
    gap: 6,
    minWidth: 80,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  size_md: {
    gap: 8,
    minWidth: 120,
    paddingHorizontal: 24,
    paddingVertical: 13,
  },
  size_lg: {
    gap: 10,
    minWidth: 160,
    paddingHorizontal: 32,
    paddingVertical: 17,
  },

  // ── Variants ─────────────────────────────────────────────────────────────

  // Primary — deep forest green fill (main CTA)
  variant_primary: {
    backgroundColor: Colors.primaryDark,
    shadowColor: Colors.primaryDark,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 3,
  },

  // Dark — same as primary, alias for dark stat card CTAs
  variant_dark: {
    backgroundColor: Colors.cardDark,
    shadowColor: Colors.cardDark,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 3,
  },

  // Secondary — outlined with sage green border
  variant_secondary: {
    backgroundColor: Colors.backgroundSecondary,
    borderColor: Colors.primary,
    borderWidth: 1.5,
    shadowColor: Colors.shadowColor,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },

  // Ghost — no background, just text
  variant_ghost: {
    backgroundColor: Colors.transparent,
  },

  // Danger — muted red for destructive actions
  variant_danger: {
    backgroundColor: Colors.error,
    shadowColor: Colors.error,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 4,
  },

  // ── Disabled states ──────────────────────────────────────────────────────
  disabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  disabled_primary: {
    backgroundColor: Colors.primaryLight,
  },
  disabled_dark: {
    backgroundColor: Colors.primaryLight,
  },
  disabled_secondary: {
    borderColor: Colors.border,
  },
  disabled_ghost: {
    opacity: 0.4,
  },
  disabled_danger: {
    backgroundColor: Colors.errorLight,
  },

  // ── Labels ───────────────────────────────────────────────────────────────
  label: {
    fontWeight: '600',
    letterSpacing: 0.3,
    flexShrink: 1,
    textAlign: 'center',
  },

  // Label sizes
  label_sm: {
    fontSize: 13,
  },
  label_md: {
    fontSize: 15,
  },
  label_lg: {
    fontSize: 17,
  },

  // Label colors per variant
  label_primary: {
    color: Colors.textOnDark,
  },
  label_dark: {
    color: Colors.textOnDark,
  },
  label_secondary: {
    color: Colors.primary,
  },
  label_ghost: {
    color: Colors.primary,
  },
  label_danger: {
    color: Colors.textOnDark,
  },

  // Disabled label
  labelDisabled: {
    color: Colors.textMuted,
  },

  // ── Icons ─────────────────────────────────────────────────────────────────
  iconLeft: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconRight: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Button;
