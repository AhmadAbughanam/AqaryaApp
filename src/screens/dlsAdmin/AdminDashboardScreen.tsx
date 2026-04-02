import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import Button from '../../components/Button';
import Card from '../../components/Card';
import {AdminStackParamList} from '../../navigation/AdminStack';
import {Colors} from '../../constants/colors';

type Props = NativeStackScreenProps<AdminStackParamList, 'AdminDashboard'>;

const AdminDashboardScreen = ({navigation}: Props) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admin Dashboard</Text>
      <Text style={styles.subtitle}>
        Verification, audit review, and analytics are unified here for the admin role.
      </Text>

      <Card variant="dark" padding="md" style={styles.heroCard}>
        <Text style={styles.heroTitle}>Listing Operations</Text>
        <Text style={styles.heroCopy}>
          Review citizen sale listings, inspect blockchain verification data, and manage approval lifecycle actions.
        </Text>
      </Card>

      <View style={styles.sectionGrid}>
        <Card variant="default" padding="md" style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Sale Listings</Text>
          <Text style={styles.sectionCopy}>
            Pending, verified, rejected, frozen, and sold listings in one place.
          </Text>
          <Button
            label="Open Listings"
            onPress={() => navigation.navigate('PropertyVerification')}
            variant="primary"
            size="sm"
          />
        </Card>

        <Card variant="default" padding="md" style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Audit Review</Text>
          <Text style={styles.sectionCopy}>
            Search and inspect auditor-style events directly inside the admin area.
          </Text>
          <Button
            label="Open Audit Logs"
            onPress={() => navigation.navigate('AuditLogs')}
            variant="secondary"
            size="sm"
          />
        </Card>

        <Card variant="default" padding="md" style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Analytics</Text>
          <Text style={styles.sectionCopy}>
            Analyst metrics and operational health are available without a separate role.
          </Text>
          <Button
            label="Open Analytics"
            onPress={() => navigation.navigate('Analytics')}
            variant="secondary"
            size="sm"
          />
        </Card>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.backgroundPrimary,
    flex: 1,
    padding: 16,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  heroCard: {
    marginBottom: 16,
  },
  heroTitle: {
    color: Colors.textOnDark,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  heroCopy: {
    color: Colors.textOnDarkMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  sectionGrid: {
    gap: 12,
  },
  sectionCard: {
    gap: 12,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  sectionCopy: {
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
});

export default AdminDashboardScreen;
