// Numeric share input field for investment simulation forms.
// Features animated focus border, increment/decrement controls, and max shares hint.

import React, {useRef, useState} from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {Colors} from '../constants/colors';
import { formatCurrency } from '../utils/formatters';


// ─── Types ────────────────────────────────────────────────────────────────────

interface ShareInputProps {
  value: string;
  onChangeText: (value: string) => void;
  disabled?: boolean;
  maxShares?: number;       // Shows hint + clamps input
  pricePerShare?: number;   // Shows live total cost preview
  label?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// ─── Component ────────────────────────────────────────────────────────────────

const ShareInput = ({
  value,
  onChangeText,
  disabled = false,
  maxShares,
  pricePerShare,
  label = 'Shares to Simulate',
}: ShareInputProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const borderAnim = useRef(new Animated.Value(0)).current;

  const numericValue = parseInt(value, 10) || 0;
  const totalCost =
    pricePerShare && numericValue > 0 ? numericValue * pricePerShare : null;
  const isOverMax = maxShares !== undefined && numericValue > maxShares;

  const handleFocus = () => {
    setIsFocused(true);
    Animated.timing(borderAnim, {
      toValue: 1,
      duration: 180,
      useNativeDriver: false,
    }).start();
  };

  const handleBlur = () => {
    setIsFocused(false);
    Animated.timing(borderAnim, {
      toValue: 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  };

  const handleDecrement = () => {
    if (disabled) {return;}
    const next = Math.max(0, numericValue - 1);
    onChangeText(next === 0 ? '' : String(next));
  };

  const handleIncrement = () => {
    if (disabled) {return;}
    const next = numericValue + 1;
    if (maxShares !== undefined && next > maxShares) {return;}
    onChangeText(String(next));
  };

  const handleChange = (text: string) => {
    // Allow only digits
    const cleaned = text.replace(/[^0-9]/g, '');
    if (maxShares !== undefined) {
      const num = parseInt(cleaned, 10) || 0;
      if (num > maxShares) {
        onChangeText(String(maxShares));
        return;
      }
    }
    onChangeText(cleaned);
  };

  const animatedBorderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [
      isOverMax ? Colors.error : Colors.border,
      isOverMax ? Colors.error : Colors.borderFocus,
    ],
  });

  const animatedShadowOpacity = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.1],
  });

  return (
    <View style={styles.wrapper}>
      {/* Label row */}
      <View style={styles.labelRow}>
        <Text
          style={[
            styles.label,
            isFocused && !isOverMax && styles.labelFocused,
            isOverMax && styles.labelError,
          ]}>
          {label}
        </Text>
        {maxShares !== undefined && (
          <Text style={styles.maxHint}>Max: {maxShares.toLocaleString()}</Text>
        )}
      </View>

      {/* Input row */}
      <Animated.View
        style={[
          styles.inputContainer,
          disabled && styles.inputContainerDisabled,
          {
            borderColor: animatedBorderColor,
            shadowOpacity: animatedShadowOpacity,
          },
        ]}>

        {/* Decrement button */}
        <Pressable
          onPress={handleDecrement}
          disabled={disabled || numericValue <= 0}
          style={({pressed}) => [
            styles.stepButton,
            pressed && styles.stepButtonPressed,
            (disabled || numericValue <= 0) && styles.stepButtonDisabled,
          ]}
          accessibilityLabel="Decrease shares"
          hitSlop={8}>
          <Text
            style={[
              styles.stepIcon,
              (disabled || numericValue <= 0) && styles.stepIconDisabled,
            ]}>
            −
          </Text>
        </Pressable>

        {/* Text input */}
        <TextInput
          value={value}
          onChangeText={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          keyboardType="number-pad"
          placeholder="0"
          placeholderTextColor={Colors.textMuted}
          editable={!disabled}
          style={[styles.input, disabled && styles.inputDisabled]}
          selectionColor={Colors.primary}
          cursorColor={Colors.primary}
          textAlign="center"
        />

        {/* Increment button */}
        <Pressable
          onPress={handleIncrement}
          disabled={
            disabled ||
            (maxShares !== undefined && numericValue >= maxShares)
          }
          style={({pressed}) => [
            styles.stepButton,
            pressed && styles.stepButtonPressed,
            (disabled ||
              (maxShares !== undefined && numericValue >= maxShares)) &&
              styles.stepButtonDisabled,
          ]}
          accessibilityLabel="Increase shares"
          hitSlop={8}>
          <Text
            style={[
              styles.stepIcon,
              (disabled ||
                (maxShares !== undefined && numericValue >= maxShares)) &&
                styles.stepIconDisabled,
            ]}>
            +
          </Text>
        </Pressable>
      </Animated.View>

      {/* Footer row — error or total cost preview */}
      {isOverMax ? (
        <Text style={styles.errorText}>
          Exceeds available shares ({maxShares?.toLocaleString()})
        </Text>
      ) : totalCost !== null ? (
        <View style={styles.costPreview}>
          <Text style={styles.costLabel}>Estimated Total</Text>
          <Text style={styles.costValue}>{formatCurrency(totalCost)}</Text>
        </View>
      ) : null}
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper: {
    gap: 6,
    marginBottom: 4,
  },

  // ── Label row ─────────────────────────────────────────────────────────────
  labelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  label: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  labelFocused: {
    color: Colors.primary,
  },
  labelError: {
    color: Colors.error,
  },
  maxHint: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '400',
  },

  // ── Input container ───────────────────────────────────────────────────────
  inputContainer: {
    alignItems: 'center',
    backgroundColor: Colors.inputBackground,
    borderColor: Colors.border,
    borderRadius: 14,
    borderWidth: 1.5,
    flexDirection: 'row',
    height: 56,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: {width: 0, height: 3},
    shadowRadius: 8,
    elevation: 0,
  },
  inputContainerDisabled: {
    backgroundColor: Colors.backgroundMuted,
    borderColor: Colors.border,
    opacity: 0.6,
  },

  // ── Step buttons ──────────────────────────────────────────────────────────
  stepButton: {
    alignItems: 'center',
    backgroundColor: Colors.backgroundMuted,
    height: '100%',
    justifyContent: 'center',
    width: 52,
  },
  stepButtonPressed: {
    backgroundColor: Colors.primaryLight,
  },
  stepButtonDisabled: {
    opacity: 0.4,
  },
  stepIcon: {
    color: Colors.primaryDark,
    fontSize: 22,
    fontWeight: '300',
    lineHeight: 26,
  },
  stepIconDisabled: {
    color: Colors.textMuted,
  },

  // ── Text input ────────────────────────────────────────────────────────────
  input: {
    color: Colors.textPrimary,
    flex: 1,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
    paddingVertical: 0,
  },
  inputDisabled: {
    color: Colors.textMuted,
  },

  // ── Footer ────────────────────────────────────────────────────────────────
  errorText: {
    color: Colors.error,
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  costPreview: {
    alignItems: 'center',
    backgroundColor: Colors.backgroundMuted,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  costLabel: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  costValue: {
    color: Colors.primaryDark,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
});

export default ShareInput;