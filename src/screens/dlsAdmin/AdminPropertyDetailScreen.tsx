import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import Card from '../../components/Card';
import StatusBadge from '../../components/StatusBadge';
import {AdminPropertyDetail, getAdminPropertyDetails} from '../../api/admin';
import {AdminStackParamList} from '../../navigation/AdminStack';
import {formatDateTime} from '../../utils/formatters';
import {Colors} from '../../constants/colors';

type Props = NativeStackScreenProps<AdminStackParamList, 'AdminPropertyDetail'>;

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);

const InfoRow = ({label, value}: {label: string; value: string}) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const AdminPropertyDetailScreen = ({route}: Props) => {
  const [property, setProperty] = useState<AdminPropertyDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchDetails = useCallback(async () => {
    try {
      const response = await getAdminPropertyDetails(route.params.id);
      setProperty(response);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Unable to load property detail.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [route.params.id]);

  useEffect(() => {
    void fetchDetails();
  }, [fetchDetails]);

  if (isLoading) {
    return (
      <View style={styles.centeredState}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading property profile…</Text>
      </View>
    );
  }

  if (!property) {
    return (
      <View style={styles.centeredState}>
        <Text style={styles.errorTitle}>Property unavailable</Text>
        <Text style={styles.errorText}>{errorMessage ?? 'Try again shortly.'}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>
      <Card variant="dark" padding="md" style={styles.heroCard}>
        <View style={styles.heroTopRow}>
          <Text style={styles.heroTitle}>{property.title}</Text>
          <StatusBadge status={property.verificationStatus} />
        </View>
        <Text style={styles.heroSubtitle}>{property.location}</Text>
        <Text style={styles.heroBody}>{property.description}</Text>
      </Card>

      <Card variant="default" padding="md" style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Seller Linkage</Text>
        <InfoRow label="Seller name" value={property.ownerName} />
        <InfoRow label="Citizen username" value={property.seller?.username ?? 'Unknown'} />
        <InfoRow label="Citizen id" value={property.seller?.id ?? 'Unknown'} />
      </Card>

      <Card variant="default" padding="md" style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Listing Profile</Text>
        <InfoRow label="Asking price" value={formatCurrency(property.price)} />
        <InfoRow label="Valuation" value={formatCurrency(property.propertyValue)} />
        <InfoRow label="Available shares" value={`${property.availableShares}/${property.totalShares}`} />
        <InfoRow label="Ownership type" value={property.ownershipType} />
        <InfoRow label="Proof type" value={property.ownershipProofType} />
        <InfoRow label="Proof number" value={property.ownershipProofNumber} />
      </Card>

      <Card variant="default" padding="md" style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Verification And Blockchain</Text>
        <InfoRow label="Lifecycle" value={property.verificationStatus} />
        <InfoRow label="Property verification" value={property.propertyVerificationStatus} />
        <InfoRow label="Identity verification" value={property.identityVerificationStatus} />
        <InfoRow label="Verification record" value={property.verificationRecordId ?? 'Not assigned'} />
        <InfoRow label="Blockchain status" value={property.blockchainStatus ?? 'pending'} />
        <InfoRow label="Blockchain hash" value={property.blockchainHash ?? 'Pending'} />
        <InfoRow label="Blockchain tx" value={property.blockchainTransactionId ?? 'Pending'} />
        <InfoRow
          label="Anchored at"
          value={property.anchoredAt ? formatDateTime(property.anchoredAt) : 'Not anchored'}
        />
      </Card>

      {property.verificationPayload ? (
        <Card variant="dark" padding="md" style={styles.sectionCard}>
          <Text style={styles.sectionTitleDark}>Verification Payload</Text>
          <Text style={styles.payloadText}>
            {JSON.stringify(property.verificationPayload, null, 2)}
          </Text>
        </Card>
      ) : null}

      <Card variant="default" padding="md" style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Audit Events</Text>
        {property.auditEvents.length === 0 ? (
          <Text style={styles.emptyText}>No audit events recorded for this property.</Text>
        ) : (
          property.auditEvents.map(item => (
            <View key={item.id} style={styles.auditRow}>
              <Text style={styles.auditAction}>{item.actionType}</Text>
              <Text style={styles.auditMeta}>
                {item.actorName} • {formatDateTime(item.timestamp)}
              </Text>
            </View>
          ))
        )}
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.backgroundPrimary,
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  centeredState: {
    alignItems: 'center',
    backgroundColor: Colors.backgroundPrimary,
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    color: Colors.textSecondary,
    marginTop: 12,
  },
  errorTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  errorText: {
    color: Colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  heroCard: {
    marginBottom: 14,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  heroTitle: {
    color: Colors.textOnDark,
    flex: 1,
    fontSize: 22,
    fontWeight: '800',
  },
  heroSubtitle: {
    color: Colors.textOnDarkMuted,
    marginTop: 8,
  },
  heroBody: {
    color: Colors.textOnDark,
    lineHeight: 20,
    marginTop: 12,
  },
  sectionCard: {
    marginBottom: 14,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  sectionTitleDark: {
    color: Colors.textOnDark,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  infoRow: {
    borderTopColor: Colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  infoLabel: {
    color: Colors.textSecondary,
    flex: 1,
  },
  infoValue: {
    color: Colors.textPrimary,
    flex: 1,
    textAlign: 'right',
  },
  payloadText: {
    color: Colors.chatOnlineIndicator,
    fontFamily: 'monospace',
    fontSize: 11,
    lineHeight: 18,
  },
  emptyText: {
    color: Colors.textSecondary,
  },
  auditRow: {
    borderTopColor: Colors.border,
    borderTopWidth: 1,
    paddingVertical: 10,
  },
  auditAction: {
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  auditMeta: {
    color: Colors.textSecondary,
    marginTop: 4,
  },
});

export default AdminPropertyDetailScreen;
