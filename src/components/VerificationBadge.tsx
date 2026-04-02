// Visual badge for verification status values.
// Mirrors StatusBadge aesthetic — soft tinted backgrounds with matching text.
// Relies on VerificationStatus type from the properties API.

import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {VerificationStatus} from '../api/properties';
import {Colors} from '../constants/colors';

// ─── Types ────────────────────────────────────────────────────────────────────

interface VerificationBadgeProps {
  status: VerificationStatus;
  showDot?: boolean; // Optional leading dot indicator
  showIcon?: boolean; // Optional leading icon (✓ ✕ ⏸ ⏳)
}

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  VerificationStatus,
  {label: string; background: string; textColor: string; dotColor: string; icon: string}
> = {
  verified: {
    label: 'Verified',
    background: Colors.successLight,
    textColor: Colors.success,
    dotColor: Colors.success,
    icon: '✓',
  },
  pending: {
    label: 'Pending',
    background: Colors.warningLight,
    textColor: Colors.warning,
    dotColor: Colors.warning,
    icon: '⏳',
  },
  pending_verification: {
    label: 'Pending',
    background: Colors.warningLight,
    textColor: Colors.warning,
    dotColor: Colors.warning,
    icon: '⏳',
  },
  rejected: {
    label: 'Rejected',
    background: Colors.errorLight,
    textColor: Colors.error,
    dotColor: Colors.error,
    icon: '✕',
  },
  frozen: {
    label: 'Frozen',
    background: Colors.infoLight,
    textColor: Colors.info,
    dotColor: Colors.info,
    icon: '⏸',
  },
  sold: {
    label: 'Sold',
    background: Colors.backgroundMuted,
    textColor: Colors.textPrimary,
    dotColor: Colors.textPrimary,
    icon: '•',
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

const VerificationBadge = ({
  status,
  showDot = false,
  showIcon = false,
}: VerificationBadgeProps) => {
  const config = STATUS_CONFIG[status];

  return (
    <View style={[styles.badge, {backgroundColor: config.background}]}>
      {/* Dot indicator */}
      {showDot && !showIcon && (
        <View style={[styles.dot, {backgroundColor: config.dotColor}]} />
      )}

      {/* Icon */}
      {showIcon && (
        <Text style={[styles.icon, {color: config.textColor}]}>
          {config.icon}
        </Text>
      )}

      {/* Label */}
      <Text style={[styles.text, {color: config.textColor}]}>
        {config.label}
      </Text>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 100,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  dot: {
    borderRadius: 4,
    height: 6,
    width: 6,
  },
  icon: {
    fontSize: 11,
    fontWeight: '700',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});

export default VerificationBadge;
