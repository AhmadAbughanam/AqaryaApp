import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import Card from '../../components/Card';
import VerificationBadge from '../../components/VerificationBadge';
import Button from '../../components/Button';
import Input from '../../components/Input';
import {formatCurrency, formatDateTime} from '../../utils/formatters';
import {buyProperty, getProperties, PropertyListItem} from '../../api/properties';
import {CitizenStackParamList} from '../../navigation/CitizenStack';
import {Colors} from '../../constants/colors';
import {useStrings} from '../../i18n';

type Props = NativeStackScreenProps<CitizenStackParamList, 'MyProperties'>;

const PAGE_SIZE = 20;



const PropertyListScreen = ({navigation}: Props) => {
  const strings = useStrings();
  const [items, setItems] = useState<PropertyListItem[]>([]);
  const [search, setSearch] = useState('');
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [buyingPropertyId, setBuyingPropertyId] = useState<string | null>(null);

  const loadListings = useCallback(async () => {
    try {
      const response = await getProperties({
        page: 1,
        limit: PAGE_SIZE,
        search: search.trim() || undefined,
        marketType: 'sale',
      });
      setItems(response.items);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Unable to load verified listings.',
      );
    } finally {
      setIsInitialLoading(false);
      setIsRefreshing(false);
    }
  }, [search]);

  useEffect(() => {
    void loadListings();
  }, [loadListings]);

  const onBuyProperty = (property: PropertyListItem) => {
    Alert.alert(
      strings.propertyDetail.confirmBuyTitle,
      `Buy ${property.title} for ${formatCurrency(property.price)}?`,
      [
        {text: strings.propertyDetail.confirmBuyCancel, style: 'cancel'},
        {
          text: strings.propertyDetail.confirmBuyConfirm,
          onPress: () => {
            void (async () => {
              try {
                setBuyingPropertyId(property.id);
                await buyProperty(property.id);
                Alert.alert(strings.propertyList.purchaseComplete, strings.propertyList.purchaseCompleteMsg);
                await loadListings();
              } catch (error) {
                Alert.alert(
                  strings.propertyList.purchaseFailed,
                  error instanceof Error ? error.message : 'Unable to complete the purchase.',
                );
              } finally {
                setBuyingPropertyId(null);
              }
            })();
          },
        },
      ],
    );
  };

  const renderItem = ({item}: {item: PropertyListItem}) => (
    <Card variant="default" padding="md" style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderCopy}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardLocation}>{item.location}</Text>
        </View>
        <VerificationBadge status={item.verificationStatus} />
      </View>

      <Text style={styles.cardDescription} numberOfLines={2}>
        {item.description}
      </Text>

      <View style={styles.metricsRow}>
        <View style={styles.metricPill}>
          <Text style={styles.metricValue}>{formatCurrency(item.price)}</Text>
          <Text style={styles.metricLabel}>{strings.propertyList.askingPrice}</Text>
        </View>
        <View style={styles.metricPill}>
          <Text style={styles.metricValue}>{formatCurrency(item.propertyValue)}</Text>
          <Text style={styles.metricLabel}>{strings.propertyList.valuation}</Text>
        </View>
        <View style={styles.metricPill}>
          <Text style={styles.metricValue}>{strings.propertyList.directSale}</Text>
          <Text style={styles.metricLabel}>{strings.propertyList.listingType}</Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.metaText}>{`${strings.propertyList.ownerLabel}: ${item.ownerName}`}</Text>
        <Text style={styles.metaText}>
          {`${strings.propertyList.verifiedAtLabel} ${formatDateTime(item.verificationTimestamp)}`}
        </Text>
      </View>

      <View style={styles.actionsRow}>
        <Button
          label={strings.propertyList.detailsButton}
          onPress={() => navigation.navigate('PropertyDetail', {id: item.id})}
          variant="secondary"
          size="sm"
          style={styles.actionButton}
        />
        <Button
          label={strings.propertyList.buyButton}
          onPress={() => onBuyProperty(item)}
          variant="primary"
          size="sm"
          style={styles.actionButton}
          loading={buyingPropertyId === item.id}
        />
      </View>
    </Card>
  );

  if (isInitialLoading) {
    return (
      <View style={styles.centeredState}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>{strings.propertyList.loadingText}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => {
              setIsRefreshing(true);
              void loadListings();
            }}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.screenTitle}>{strings.propertyList.homesForSale}</Text>
            <Text style={styles.screenSubtitle}>
              {strings.propertyList.listingSubtitle}
            </Text>

            <View style={styles.topActionRow}>
              <Button
                label={strings.propertyList.sellButton}
                onPress={() => navigation.navigate('SellProperty')}
                variant="primary"
                size="sm"
                style={styles.topActionButton}
              />
              <Button
                label={strings.propertyList.investButton}
                onPress={() => navigation.navigate('InvestmentSimulation')}
                variant="secondary"
                size="sm"
                style={styles.topActionButton}
              />
            </View>

            <Input
              label={strings.propertyList.searchLabel}
              placeholder={strings.propertyList.searchInputPlaceholder}
              value={search}
              onChangeText={setSearch}
              autoCapitalize="none"
              containerStyle={styles.searchInput}
            />
            <Button
              label={strings.propertyList.applySearch}
              onPress={() => {
                setIsInitialLoading(true);
                void loadListings();
              }}
              variant="dark"
              size="sm"
            />

            {errorMessage ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{errorMessage}</Text>
              </View>
            ) : null}
          </View>
        }
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>{strings.propertyList.verifiedEmpty}</Text>
            <Text style={styles.emptyText}>
              {strings.propertyList.adjustSearch}
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
    paddingBottom: 16,
  },
  header: {
    marginBottom: 16,
  },
  screenTitle: {
    color: Colors.textPrimary,
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  screenSubtitle: {
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  topActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  topActionButton: {
    flex: 1,
    minWidth: 0,
  },
  searchInput: {
    marginBottom: 10,
  },
  errorBanner: {
    backgroundColor: Colors.errorLight,
    borderRadius: 12,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  errorBannerText: {
    color: Colors.error,
    fontSize: 13,
    fontWeight: '500',
  },
  card: {
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  cardHeaderCopy: {
    flex: 1,
  },
  cardTitle: {
    color: Colors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
  },
  cardLocation: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginTop: 4,
  },
  cardDescription: {
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 12,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  metricPill: {
    flex: 1,
    backgroundColor: Colors.backgroundMuted,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  metricValue: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  metricLabel: {
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 3,
    textTransform: 'uppercase',
  },
  metaRow: {
    marginTop: 12,
    gap: 4,
  },
  metaText: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
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
    fontSize: 14,
    textAlign: 'center',
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
});

export default PropertyListScreen;
