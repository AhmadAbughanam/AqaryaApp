import React, {useMemo, useState} from 'react';
import {Alert, ScrollView, StyleSheet, Text, View} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Input from '../../components/Input';
import {createSaleListing} from '../../api/properties';
import {CitizenStackParamList} from '../../navigation/CitizenStack';
import {Colors} from '../../constants/colors';

type Props = NativeStackScreenProps<CitizenStackParamList, 'SellProperty'>;

const SellPropertyScreen = ({navigation, route}: Props) => {
  const sourceProperty = route.params;
  const [form, setForm] = useState({
    title: sourceProperty?.title ?? '',
    location: sourceProperty?.location ?? '',
    ownerName: sourceProperty?.ownerName ?? '',
    ownershipType: sourceProperty?.ownershipType ?? '',
    ownershipProofType: sourceProperty?.ownershipProofType ?? '',
    ownershipProofNumber: sourceProperty?.ownershipProofNumber ?? '',
    description: sourceProperty?.description ?? '',
    price: sourceProperty?.price ? String(sourceProperty.price) : '',
    propertyValue: sourceProperty?.propertyValue ? String(sourceProperty.propertyValue) : '',
    imageUrls: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const helperText = useMemo(
    () =>
      'Submission creates a pending listing and starts property, identity, and blockchain verification.',
    [],
  );

  const updateField = (key: keyof typeof form, value: string) => {
    setForm(current => ({...current, [key]: value}));
  };

  const onSubmit = async () => {
    if (
      !form.title ||
      !form.location ||
      !form.ownerName ||
      !form.ownershipType ||
      !form.ownershipProofType ||
      !form.ownershipProofNumber ||
      !form.description ||
      !form.price ||
      !form.propertyValue
    ) {
      Alert.alert('Missing fields', 'Complete all required sale listing fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createSaleListing({
        sourcePropertyId: sourceProperty?.propertyId,
        title: form.title,
        location: form.location,
        ownerName: form.ownerName,
        ownershipType: form.ownershipType,
        ownershipProofType: form.ownershipProofType,
        ownershipProofNumber: form.ownershipProofNumber,
        description: form.description,
        imageUrls: form.imageUrls
          .split(',')
          .map(value => value.trim())
          .filter(Boolean),
        price: Number(form.price),
        propertyValue: Number(form.propertyValue),
        totalShares: 1,
      });

      Alert.alert(
        'Listing submitted',
        'Your property is now in the sale verification pipeline and will appear publicly after approval.',
        [
          {
            text: 'View Marketplace',
            onPress: () => navigation.navigate('SellingMarketplace'),
          },
        ],
      );
    } catch (error) {
      Alert.alert(
        'Submission failed',
        error instanceof Error ? error.message : 'Unable to submit listing.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Create Sale Listing</Text>
      <Text style={styles.subtitle}>
        {sourceProperty?.propertyId
          ? 'Complete the final sale details for a property you already own.'
          : helperText}
      </Text>

      <Card variant="default" padding="md" style={styles.formCard}>
        <View style={styles.formGroup}>
          <Input label="Title" value={form.title} onChangeText={value => updateField('title', value)} />
          <Input label="Location" value={form.location} onChangeText={value => updateField('location', value)} />
          <Input label="Owner Name" value={form.ownerName} onChangeText={value => updateField('ownerName', value)} />
          <Input label="Ownership Type" value={form.ownershipType} onChangeText={value => updateField('ownershipType', value)} />
          <Input
            label="Ownership Proof Type"
            value={form.ownershipProofType}
            onChangeText={value => updateField('ownershipProofType', value)}
          />
          <Input
            label="Ownership Proof Number"
            value={form.ownershipProofNumber}
            onChangeText={value => updateField('ownershipProofNumber', value)}
          />
          <Input
            label="Description"
            value={form.description}
            onChangeText={value => updateField('description', value)}
            multiline
          />
          <Input
            label="Asking Price"
            value={form.price}
            keyboardType="numeric"
            onChangeText={value => updateField('price', value.replace(/[^0-9.]/g, ''))}
          />
          <Input
            label="Current Valuation"
            value={form.propertyValue}
            keyboardType="numeric"
            onChangeText={value =>
              updateField('propertyValue', value.replace(/[^0-9.]/g, ''))
            }
          />
          <Input
            label="Image URLs"
            helperText="Comma-separated URLs if images are available."
            value={form.imageUrls}
            onChangeText={value => updateField('imageUrls', value)}
            multiline
          />
        </View>
      </Card>

      <Button
        label="Submit for Verification"
        onPress={() => void onSubmit()}
        variant="primary"
        size="lg"
        fullWidth
        loading={isSubmitting}
      />
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
  formCard: {
    marginBottom: 16,
  },
  formGroup: {
    gap: 14,
  },
});

export default SellPropertyScreen;
