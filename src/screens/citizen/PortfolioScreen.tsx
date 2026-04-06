import React, {useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {getPortfolio, PortfolioItem} from '../../api/investments';
import Card from '../../components/Card';
import StatusBadge from '../../components/StatusBadge';
import {Colors} from '../../constants/colors';

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);

const PortfolioScreen = () => {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    void fetchPortfolio();
  }, []);

  const fetchPortfolio = async () => {
    try {
      const response = await getPortfolio();
      setItems(response);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Unable to load simulation history.',
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const summary = useMemo(() => {
    return {
      totalSimulations: items.length,
      totalOutlay: items.reduce((acc, cur) => acc + cur.totalAmount, 0),
      expectedAnnualReturn: items.reduce(
        (acc, cur) => acc + cur.expectedAnnualReturn,
        0,
      ),
    };
  }, [items]);

  if (isLoading) {
    return (
      <View style={styles.centeredState}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading simulation history…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={item => item.simulationId}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => {
              setIsRefreshing(true);
              void fetchPortfolio();
            }}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Simulation History</Text>
            <Text style={styles.subtitle}>
              Review your recorded investment commitments, cash yield, and exit assumptions.
            </Text>

            <View style={styles.summaryRow}>
              <Card variant="dark" padding="md" style={styles.summaryCard}>
                <Text style={styles.darkStatValue}>{summary.totalSimulations}</Text>
                <Text style={styles.darkStatLabel}>Records</Text>
              </Card>
              <Card variant="default" padding="md" style={styles.summaryCard}>
                <Text style={styles.lightStatValue}>
                  {formatCurrency(summary.totalOutlay)}
                </Text>
                <Text style={styles.lightStatLabel}>Total Outlay</Text>
              </Card>
            </View>

            <Card variant="default" padding="md" style={styles.expectedCard}>
              <Text style={styles.expectedLabel}>Expected annual return</Text>
              <Text style={styles.expectedValue}>
                {formatCurrency(summary.expectedAnnualReturn)}
              </Text>
            </Card>

            {errorMessage ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{errorMessage}</Text>
              </View>
            ) : null}
          </View>
        }
        renderItem={({item}) => (
          <Card variant="default" padding="md" style={styles.itemCard}>
            <View style={styles.itemTopRow}>
              <View style={styles.itemCopy}>
                <Text style={styles.itemTitle}>{item.propertyTitle}</Text>
                <Text style={styles.itemSubtitle}>{item.location}</Text>
              </View>
              <StatusBadge status={item.propertyStatus} />
            </View>
            <Text style={styles.itemMeta}>Shares owned {item.sharesOwned}</Text>
            {item.projectProfile ? (
              <Text style={styles.itemMeta}>
                {item.projectProfile.assetClass} | {item.projectProfile.riskBand} |{' '}
                {item.projectProfile.distributionFrequency}
              </Text>
            ) : null}
            <Text style={styles.itemMeta}>
              Fees {formatCurrency(item.platformFee + item.governmentFee)}
            </Text>
            <Text style={styles.itemMeta}>
              Total amount {formatCurrency(item.totalAmount)}
            </Text>
            <Text style={styles.itemMeta}>
              Annual cash flow{' '}
              {formatCurrency(item.annualIncomeEstimate ?? item.expectedAnnualReturn)}
            </Text>
            <Text style={styles.itemMeta}>
              5Y upside {formatCurrency(item.expectedFiveYearReturn)}
            </Text>
            <Text style={styles.itemMeta}>
              Equity multiple {(item.projectedEquityMultiple ?? 1).toFixed(2)}x
            </Text>
          </Card>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No simulations yet</Text>
            <Text style={styles.emptyText}>
              Run a buy simulation from the marketplace to build history.
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.backgroundPrimary,
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  centeredState: {
    alignItems: 'center',
    backgroundColor: Colors.backgroundPrimary,
    flex: 1,
    justifyContent: 'center',
  },
  loadingText: {
    color: Colors.textSecondary,
    marginTop: 12,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 24,
    fontWeight: '800',
  },
  subtitle: {
    color: Colors.textSecondary,
    marginTop: 4,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
  },
  summaryCard: {
    flex: 1,
  },
  darkStatValue: {
    color: Colors.textOnDark,
    fontSize: 24,
    fontWeight: '800',
  },
  darkStatLabel: {
    color: Colors.textOnDarkMuted,
    marginTop: 4,
  },
  lightStatValue: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
  },
  lightStatLabel: {
    color: Colors.textMuted,
    marginTop: 4,
  },
  expectedCard: {
    marginTop: 12,
  },
  expectedLabel: {
    color: Colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  expectedValue: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  errorBanner: {
    backgroundColor: Colors.errorLight,
    borderRadius: 12,
    marginTop: 12,
    padding: 12,
  },
  errorBannerText: {
    color: Colors.error,
  },
  itemCard: {
    marginBottom: 12,
  },
  itemTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  itemCopy: {
    flex: 1,
  },
  itemTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  itemSubtitle: {
    color: Colors.textSecondary,
    marginTop: 4,
  },
  itemMeta: {
    color: Colors.textSecondary,
    marginTop: 10,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 64,
  },
  emptyTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyText: {
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});

export default PortfolioScreen;
