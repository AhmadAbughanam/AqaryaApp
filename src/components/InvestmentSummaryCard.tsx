// Summary metrics card for portfolio overview statistics.
// Redesigned as a dark banner with three stat columns — matching the
// floating stat card aesthetic from the screenshot.

import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import Card from './Card';
import {Colors} from '../constants/colors';
import {formatCompactCurrency, formatNumber} from '../utils/formatters';


// ─── Types ────────────────────────────────────────────────────────────────────

interface InvestmentSummaryCardProps {
  totalSimulations: number;
  totalPortfolioValue: number;
  uniqueProperties: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────





// ─── Sub-component ────────────────────────────────────────────────────────────

interface StatColumnProps {
  value: string;
  label: string;
  highlight?: boolean;
}

const StatColumn = ({value, label, highlight = false}: StatColumnProps) => (
  <View style={styles.statColumn}>
    <Text
      style={[styles.statValue, highlight && styles.statValueHighlight]}
      numberOfLines={1}>
      {value}
    </Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

// ─── Component ────────────────────────────────────────────────────────────────

const InvestmentSummaryCard = ({
  totalSimulations,
  totalPortfolioValue,
  uniqueProperties,
}: InvestmentSummaryCardProps) => {
  return (
    <Card variant="dark" padding="none" style={styles.card}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerDot} />
        <Text style={styles.heading}>Simulation Summary</Text>
      </View>

      {/* ── Divider ── */}
      <View style={styles.divider} />

      {/* ── Stats row ── */}
      <View style={styles.statsRow}>
        <StatColumn
          value={formatNumber(totalSimulations)}
          label="Simulations"
        />
        <View style={styles.columnDivider} />
        <StatColumn
          value={formatCompactCurrency(totalPortfolioValue)}
          label="Portfolio Value"
          highlight
        />
        <View style={styles.columnDivider} />
        <StatColumn
          value={formatNumber(uniqueProperties)}
          label="Properties"
        />
      </View>

    </Card>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    marginBottom: 20,
    overflow: 'hidden',
  },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
  },
  headerDot: {
    backgroundColor: Colors.chatOnlineIndicator,
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  heading: {
    color: Colors.textOnDark,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },

  // ── Divider ───────────────────────────────────────────────────────────────
  divider: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    height: 1,
    marginHorizontal: 20,
  },

  // ── Stats row ─────────────────────────────────────────────────────────────
  statsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  statColumn: {
    alignItems: 'center',
    flex: 1,
    gap: 5,
  },
  statValue: {
    color: Colors.textOnDark,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  statValueHighlight: {
    color: Colors.chatOnlineIndicator, // Fresh green for the portfolio value
  },
  statLabel: {
    color: Colors.textOnDarkMuted,
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  columnDivider: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    height: 36,
    width: 1,
  },
});

export default InvestmentSummaryCard;