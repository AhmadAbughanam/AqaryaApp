// Reusable card container with consistent elevation, spacing, and variants.
// Variants: default (white), dark (forest green), muted (mint), flat (no shadow).

import React from 'react';
import {StyleProp, StyleSheet, View, ViewStyle} from 'react-native';
import {Colors} from '../constants/colors';

// ─── Types ────────────────────────────────────────────────────────────────────

export type CardVariant = 'default' | 'dark' | 'muted' | 'flat';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  padding?: CardPadding;
  style?: StyleProp<ViewStyle>;
}

// ─── Component ────────────────────────────────────────────────────────────────

const Card = ({
  children,
  variant = 'default',
  padding = 'md',
  style,
}: CardProps) => {
  return (
    <View
      style={[
        styles.base,
        styles[`variant_${variant}`],
        styles[`padding_${padding}`],
        style,
      ]}>
      {children}
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // ── Base ──────────────────────────────────────────────────────────────────
  base: {
    borderRadius: 20, // Rounded corners matching the UI
    overflow: 'hidden',
  },

  // ── Variants ─────────────────────────────────────────────────────────────

  // Default — white card with soft sage shadow (property cards, modals)
  variant_default: {
    backgroundColor: Colors.backgroundSecondary,
    borderColor: Colors.border,
    borderWidth: 1,
    shadowColor: Colors.shadowColor,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },

  // Dark — deep forest green (floating stat cards in the screenshot)
  variant_dark: {
    backgroundColor: Colors.cardDark,
    borderWidth: 0,
    shadowColor: Colors.shadowColorDark,
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },

  // Muted — soft mint background (subtle section containers)
  variant_muted: {
    backgroundColor: Colors.backgroundMuted,
    borderColor: Colors.primaryLight,
    borderWidth: 1,
    shadowColor: Colors.shadowColor,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 1,
  },

  // Flat — no shadow, no border (inline content areas)
  variant_flat: {
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 0,
    elevation: 0,
  },

  // ── Padding ───────────────────────────────────────────────────────────────
  padding_none: {
    padding: 0,
  },
  padding_sm: {
    padding: 10,
  },
  padding_md: {
    padding: 16,
  },
  padding_lg: {
    padding: 24,
  },
});

export default Card;
