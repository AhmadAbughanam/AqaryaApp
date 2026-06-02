// Card for displaying pilot properties available for fractional simulation.
// Redesigned to match the Riskify dark-stat-card aesthetic with share availability bar.

import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {PilotProperty} from '../api/investments';
import Card from './Card';
import ActionButton from './ActionButton';
import {Colors} from '../constants/colors';
import {formatCurrencyUsd, formatNumber} from '../utils/formatters';

// ─── Types ────────────────────────────────────────────────────────────────────

interface InvestmentCardProps {
  property: PilotProperty;
  onSelect: (property: PilotProperty) => void;
  disabled?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

const InvestmentCard = ({
  property,
  onSelect,
  disabled = false,
}: InvestmentCardProps) => {
  const availabilityRatio =
    property.totalShares > 0
      ? property.availableShares / property.totalShares
      : 0;

  const availabilityPercent = Math.round(availabilityRatio * 100);

  return (
    <Card variant="default" padding="none" style={styles.card}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title} numberOfLines={1}>
            {property.title}
          </Text>
          <Text style={styles.location}>📍 {property.location}</Text>
        </View>

        {/* Property value dark pill */}
        <View style={styles.valuePill}>
          <Text style={styles.valuePillLabel}>Value</Text>
          <Text style={styles.valuePillAmount}>
            {formatCurrencyUsd(property.propertyValue)}
          </Text>
        </View>
      </View>

      {/* ── Stats row ── */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {formatCurrencyUsd(property.pricePerShare)}
          </Text>
          <Text style={styles.statLabel}>Per Share</Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {formatNumber(property.totalShares)}
          </Text>
          <Text style={styles.statLabel}>Total Shares</Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <Text style={[styles.statValue, styles.statValueAvailable]}>
            {formatNumber(property.availableShares)}
          </Text>
          <Text style={styles.statLabel}>Available</Text>
        </View>
      </View>

      {/* ── Availability bar ── */}
      <View style={styles.barSection}>
        <View style={styles.barLabelRow}>
          <Text style={styles.barLabel}>Share Availability</Text>
          <Text style={styles.barPercent}>{availabilityPercent}%</Text>
        </View>
        <View style={styles.barTrack}>
          <View
            style={[
              styles.barFill,
              {
                width: `${availabilityPercent}%`,
                backgroundColor:
                  availabilityPercent > 50
                    ? Colors.primary
                    : availabilityPercent > 20
                    ? Colors.warning
                    : Colors.error,
              },
            ]}
          />
        </View>
      </View>

      {/* ── Action ── */}
      <View style={styles.footer}>
        <ActionButton
          title="Simulate Shares"
          onPress={() => onSelect(property)}
          disabled={disabled}
          variant="dark"
          fullWidth
        />
      </View>
    </Card>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    marginBottom: 14,
    overflow: 'hidden',
  },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    padding: 16,
    paddingBottom: 12,
  },
  headerLeft: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  location: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '400',
  },

  // Value pill — dark card style from the screenshot
  valuePill: {
    alignItems: 'center',
    backgroundColor: Colors.cardDark,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  valuePillLabel: {
    color: Colors.textOnDarkMuted,
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  valuePillAmount: {
    color: Colors.textOnDark,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },

  // ── Stats row ─────────────────────────────────────────────────────────────
  statsRow: {
    alignItems: 'center',
    backgroundColor: Colors.backgroundMuted,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
    gap: 3,
  },
  statValue: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  statValueAvailable: {
    color: Colors.primary,
  },
  statLabel: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  statDivider: {
    backgroundColor: Colors.border,
    height: 32,
    width: 1,
  },

  // ── Availability bar ──────────────────────────────────────────────────────
  barSection: {
    gap: 8,
    padding: 16,
    paddingBottom: 12,
  },
  barLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  barLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  barPercent: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  barTrack: {
    backgroundColor: Colors.border,
    borderRadius: 100,
    height: 6,
    overflow: 'hidden',
  },
  barFill: {
    borderRadius: 100,
    height: '100%',
  },

  // ── Footer ────────────────────────────────────────────────────────────────
  footer: {
    padding: 16,
    paddingTop: 4,
  },
});

export default InvestmentCard;