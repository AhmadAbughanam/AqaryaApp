// Reusable status badge for property lifecycle states.
// Uses soft background + matching text color instead of solid fills —
// consistent with the airy mint/sage UI aesthetic.

import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {Colors} from '../constants/colors';

// ─── Types ────────────────────────────────────────────────────────────────────

export type PropertyStatus =
  | 'verified'
  | 'pending'
  | 'pending_verification'
  | 'frozen'
  | 'rejected'
  | 'sold';

interface StatusBadgeProps {
  status: PropertyStatus;
  showDot?: boolean; // Optional leading dot indicator
}

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  PropertyStatus,
  {label: string; background: string; textColor: string; dotColor: string}
> = {
  verified: {
    label: 'Verified',
    background: Colors.successLight,
    textColor: Colors.success,
    dotColor: Colors.success,
  },
  pending: {
    label: 'Pending',
    background: Colors.warningLight,
    textColor: Colors.warning,
    dotColor: Colors.warning,
  },
  pending_verification: {
    label: 'Pending',
    background: Colors.warningLight,
    textColor: Colors.warning,
    dotColor: Colors.warning,
  },
  frozen: {
    label: 'Frozen',
    background: Colors.infoLight,
    textColor: Colors.info,
    dotColor: Colors.info,
  },
  rejected: {
    label: 'Rejected',
    background: Colors.errorLight,
    textColor: Colors.error,
    dotColor: Colors.error,
  },
  sold: {
    label: 'Sold',
    background: Colors.backgroundMuted,
    textColor: Colors.textPrimary,
    dotColor: Colors.textPrimary,
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

const StatusBadge = ({status, showDot = false}: StatusBadgeProps) => {
  const config = STATUS_CONFIG[status];

  return (
    <View style={[styles.badge, {backgroundColor: config.background}]}>
      {showDot && (
        <View style={[styles.dot, {backgroundColor: config.dotColor}]} />
      )}
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
  text: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});

export default StatusBadge;
