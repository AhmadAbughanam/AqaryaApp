// Reusable card for analytics summary metrics.
// Supports trend indicator, icon slot, and dark variant for featured stats.

import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import Card, {CardVariant} from './Card';
import {Colors} from '../constants/colors';

// ─── Types ────────────────────────────────────────────────────────────────────

export type TrendDirection = 'up' | 'down' | 'neutral';

interface AnalyticsCardProps {
  label: string;
  value: string | number;
  trend?: string;           // e.g. "+12%" or "−3%"
  trendDirection?: TrendDirection;
  icon?: React.ReactNode;
  variant?: CardVariant;    // 'default' | 'dark' | 'muted'
}

// ─── Component ────────────────────────────────────────────────────────────────

const AnalyticsCard = ({
  label,
  value,
  trend,
  trendDirection = 'neutral',
  icon,
  variant = 'default',
}: AnalyticsCardProps) => {
  const isDark = variant === 'dark';

  const trendColor =
    trendDirection === 'up'
      ? isDark ? Colors.chatOnlineIndicator : Colors.success
      : trendDirection === 'down'
      ? Colors.error
      : isDark ? Colors.textOnDarkMuted : Colors.textMuted;

  const trendArrow =
    trendDirection === 'up' ? '↑' : trendDirection === 'down' ? '↓' : '→';

  return (
    <Card variant={variant} padding="md" style={styles.card}>
      {/* Top row — label + icon */}
      <View style={styles.topRow}>
        <Text style={[styles.label, isDark && styles.labelDark]}>
          {label}
        </Text>
        {icon && (
          <View style={[styles.iconWrapper, isDark && styles.iconWrapperDark]}>
            {icon}
          </View>
        )}
      </View>

      {/* Value */}
      <Text style={[styles.value, isDark && styles.valueDark]}>
        {value}
      </Text>

      {/* Trend badge */}
      {trend && (
        <View style={styles.trendRow}>
          <Text style={[styles.trendText, {color: trendColor}]}>
            {trendArrow} {trend}
          </Text>
        </View>
      )}
    </Card>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 100,
  },

  // ── Top row ───────────────────────────────────────────────────────────────
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  // ── Label ─────────────────────────────────────────────────────────────────
  label: {
    color: Colors.textSecondary,
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  labelDark: {
    color: Colors.textOnDarkMuted,
  },

  // ── Icon ──────────────────────────────────────────────────────────────────
  iconWrapper: {
    alignItems: 'center',
    backgroundColor: Colors.backgroundMuted,
    borderRadius: 10,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  iconWrapperDark: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },

  // ── Value ─────────────────────────────────────────────────────────────────
  value: {
    color: Colors.textPrimary,
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  valueDark: {
    color: Colors.textOnDark,
  },

  // ── Trend ─────────────────────────────────────────────────────────────────
  trendRow: {
    alignSelf: 'flex-start',
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
});

export default AnalyticsCard;
