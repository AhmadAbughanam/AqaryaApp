// Card for displaying a single simulated portfolio position.
// Redesigned with ownership ring, dark value pill, and stat grid.

import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {PortfolioItem} from '../api/investments';
import {formatCurrencyNoDecimals, formatNumber, formatDateTime} from '../utils/formatters';
import Card from './Card';
import {Colors} from '../constants/colors';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatCurrency = formatCurrencyNoDecimals;



// ─── Types ────────────────────────────────────────────────────────────────────

interface PortfolioCardProps {
  item: PortfolioItem;
}

// ─── Component ────────────────────────────────────────────────────────────────

const PortfolioCard = ({item}: PortfolioCardProps) => {
  const ownershipFormatted = item.ownershipPercentage.toFixed(2);

  return (
    <Card variant="default" padding="none" style={styles.card}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title} numberOfLines={2}>
            {item.propertyTitle}
          </Text>
          <Text style={styles.date}>
            {formatDateTime(item.createdAt)}
          </Text>
        </View>

        {/* Ownership ring badge */}
        <View style={styles.ownershipBadge}>
          <View style={styles.ownershipRingOuter}>
            <View style={styles.ownershipRingInner}>
              <Text style={styles.ownershipPercent}>{ownershipFormatted}</Text>
              <Text style={styles.ownershipSymbol}>%</Text>
            </View>
          </View>
          <Text style={styles.ownershipLabel}>Ownership</Text>
        </View>
      </View>

      {/* ── Dark value banner ── */}
      <View style={styles.valueBanner}>
        <View style={styles.valueBannerItem}>
          <Text style={styles.valueBannerLabel}>Simulated Value</Text>
          <Text style={styles.valueBannerAmount}>
            {formatCurrency(item.simulatedValue)}
          </Text>
        </View>
        <View style={styles.valueBannerDivider} />
        <View style={styles.valueBannerItem}>
          <Text style={styles.valueBannerLabel}>Per Share</Text>
          <Text style={styles.valueBannerAmount}>
            {formatCurrency(item.pricePerShare)}
          </Text>
        </View>
      </View>

      {/* ── Shares stat ── */}
      <View style={styles.sharesRow}>
        <View style={styles.sharesItem}>
          <Text style={styles.sharesValue}>
            {formatNumber(item.sharesOwned)}
          </Text>
          <Text style={styles.sharesLabel}>Shares Owned</Text>
        </View>

        {/* Ownership bar */}
        <View style={styles.ownershipBarWrapper}>
          <View style={styles.ownershipBarTrack}>
            <View
              style={[
                styles.ownershipBarFill,
                {width: `${Math.min(item.ownershipPercentage, 100)}%`},
              ]}
            />
          </View>
          <Text style={styles.ownershipBarLabel}>
            {ownershipFormatted}% of total shares
          </Text>
        </View>
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
    paddingBottom: 14,
  },
  headerLeft: {
    flex: 1,
    gap: 5,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.1,
    lineHeight: 22,
  },
  date: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '400',
  },

  // ── Ownership ring badge ──────────────────────────────────────────────────
  ownershipBadge: {
    alignItems: 'center',
    gap: 5,
  },
  ownershipRingOuter: {
    alignItems: 'center',
    borderColor: Colors.primaryLight,
    borderRadius: 32,
    borderWidth: 3,
    height: 64,
    justifyContent: 'center',
    width: 64,
  },
  ownershipRingInner: {
    alignItems: 'center',
    backgroundColor: Colors.backgroundMuted,
    borderRadius: 26,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  ownershipPercent: {
    color: Colors.primaryDark,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.5,
    lineHeight: 16,
  },
  ownershipSymbol: {
    color: Colors.primary,
    fontSize: 10,
    fontWeight: '600',
    lineHeight: 12,
  },
  ownershipLabel: {
    color: Colors.textSecondary,
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },

  // ── Dark value banner ─────────────────────────────────────────────────────
  valueBanner: {
    alignItems: 'center',
    backgroundColor: Colors.cardDark,
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  valueBannerItem: {
    alignItems: 'center',
    flex: 1,
    gap: 3,
  },
  valueBannerLabel: {
    color: Colors.textOnDarkMuted,
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  valueBannerAmount: {
    color: Colors.textOnDark,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  valueBannerDivider: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    height: 32,
    width: 1,
  },

  // ── Shares row ────────────────────────────────────────────────────────────
  sharesRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 16,
    padding: 16,
  },
  sharesItem: {
    alignItems: 'center',
    gap: 3,
    minWidth: 64,
  },
  sharesValue: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  sharesLabel: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },

  // ── Ownership bar ─────────────────────────────────────────────────────────
  ownershipBarWrapper: {
    flex: 1,
    gap: 6,
  },
  ownershipBarTrack: {
    backgroundColor: Colors.border,
    borderRadius: 100,
    height: 6,
    overflow: 'hidden',
  },
  ownershipBarFill: {
    backgroundColor: Colors.primary,
    borderRadius: 100,
    height: '100%',
  },
  ownershipBarLabel: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '400',
  },
});

export default PortfolioCard;