// Placeholder: Reusable Input component scaffold.
// Reusable Input component for the Riskify app.
// Supports label, helper text, error state, left/right icons, and multiline.

import React, {useRef, useState} from 'react';
import {
  Animated,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableWithoutFeedback,
  View,
  ViewStyle,
} from 'react-native';
import {Colors} from '../constants/colors';

// ─── Types ────────────────────────────────────────────────────────────────────

interface InputProps extends TextInputProps {
  label?: string;
  helperText?: string;
  errorText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
}

// ─── Component ────────────────────────────────────────────────────────────────

const Input: React.FC<InputProps> = ({
  label,
  helperText,
  errorText,
  leftIcon,
  rightIcon,
  containerStyle,
  onFocus,
  onBlur,
  multiline,
  style,
  ...rest
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const borderAnim = useRef(new Animated.Value(0)).current;

  const hasError = Boolean(errorText);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    Animated.timing(borderAnim, {
      toValue: 1,
      duration: 180,
      useNativeDriver: false,
    }).start();
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    Animated.timing(borderAnim, {
      toValue: 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
    onBlur?.(e);
  };

  const animatedBorderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [
      hasError ? Colors.error : Colors.border,
      hasError ? Colors.error : Colors.borderFocus,
    ],
  });

  const animatedShadowOpacity = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.12],
  });

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {/* Label */}
      {label && (
        <Text
          style={[
            styles.label,
            isFocused && styles.labelFocused,
            hasError && styles.labelError,
          ]}>
          {label}
        </Text>
      )}

      {/* Input row */}
      <Animated.View
        style={[
          styles.inputContainer,
          multiline && styles.inputContainerMultiline,
          {
            borderColor: animatedBorderColor,
            shadowOpacity: animatedShadowOpacity,
          },
          hasError && styles.inputContainerError,
        ]}>
        {/* Left icon */}
        {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}

        {/* Text input */}
        <TextInput
          style={[
            styles.input,
            leftIcon ? styles.inputWithLeftIcon : null,
            rightIcon ? styles.inputWithRightIcon : null,
            multiline && styles.inputMultiline,
            style,
          ]}
          placeholderTextColor={Colors.textMuted}
          onFocus={handleFocus}
          onBlur={handleBlur}
          multiline={multiline}
          selectionColor={Colors.primary}
          cursorColor={Colors.primary}
          {...rest}
        />

        {/* Right icon */}
        {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
      </Animated.View>

      {/* Helper / Error text */}
      {(helperText || errorText) && (
        <Text style={[styles.helperText, hasError && styles.errorText]}>
          {errorText ?? helperText}
        </Text>
      )}
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // ── Wrapper ──────────────────────────────────────────────────────────────
  wrapper: {
    gap: 6,
  },

  // ── Label ─────────────────────────────────────────────────────────────────
  label: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.2,
    marginBottom: 2,
  },
  labelFocused: {
    color: Colors.primary,
  },
  labelError: {
    color: Colors.error,
  },

  // ── Input container ───────────────────────────────────────────────────────
  inputContainer: {
    alignItems: 'center',
    backgroundColor: Colors.inputBackground,
    borderColor: Colors.border,
    borderRadius: 14,
    borderWidth: 1.5,
    flexDirection: 'row',
    minHeight: 52,
    paddingHorizontal: 16,
    shadowColor: Colors.primary,
    shadowOffset: {width: 0, height: 3},
    shadowRadius: 8,
    elevation: 0,
  },
  inputContainerMultiline: {
    alignItems: 'flex-start',
    minHeight: 100,
    paddingVertical: 12,
  },
  inputContainerError: {
    borderColor: Colors.error,
    backgroundColor: Colors.errorLight,
  },

  // ── Text input ────────────────────────────────────────────────────────────
  input: {
    color: Colors.textPrimary,
    flex: 1,
    fontSize: 15,
    fontWeight: '400',
    letterSpacing: 0.1,
    paddingVertical: 0, // Remove default Android padding
  },
  inputWithLeftIcon: {
    marginLeft: 10,
  },
  inputWithRightIcon: {
    marginRight: 10,
  },
  inputMultiline: {
    textAlignVertical: 'top',
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

  // ── Helper / Error text ───────────────────────────────────────────────────
  helperText: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 0.1,
    marginTop: 2,
  },
  errorText: {
    color: Colors.error,
  },
});

export default Input;