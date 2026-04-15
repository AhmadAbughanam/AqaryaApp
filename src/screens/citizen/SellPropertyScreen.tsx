import React, {useState} from 'react';
import {Alert, Image, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {launchImageLibrary} from 'react-native-image-picker';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Input from '../../components/Input';
import SelectField, {SelectOption} from '../../components/SelectField';
import {createSaleListing} from '../../api/properties';
import {CitizenStackParamList} from '../../navigation/CitizenStack';
import {Colors} from '../../constants/colors';
import {useStrings} from '../../i18n';

const MAX_PHOTOS = 6;

type Props = NativeStackScreenProps<CitizenStackParamList, 'SellProperty'>;

const AMENITY_OPTIONS = [
  'Private garden',
  'Garage',
  'City views',
  'Swimming pool',
  'Garden',
  'Parking',
  'Elevator',
  'Gym',
  'Security',
];

const SellPropertyScreen = ({navigation, route}: Props) => {
  const strings = useStrings();
  const s = strings.sell;
  const sourceProperty = route.params;

  const ownershipTypeOptions: SelectOption[] = [
    {value: 'Freehold', label: s.ownershipTypeFreehold},
    {value: 'Leasehold', label: s.ownershipTypeLeasehold},
  ];
  const ownershipProofTypeOptions: SelectOption[] = [
    {value: 'title_deed', label: s.ownershipProofTitleDeed},
    {value: 'municipal_record', label: s.ownershipProofMunicipalRecord},
  ];
  const propertyTypeOptions: SelectOption[] = [
    {value: 'Apartment', label: s.propTypeApartment},
    {value: 'Villa', label: s.propTypeVilla},
    {value: 'Commercial', label: s.propTypeCommercial},
    {value: 'Land', label: s.propTypeLand},
  ];
  const cityOptions: SelectOption[] = [
    {value: 'Amman', label: s.cityAmman},
    {value: 'Irbid', label: s.cityIrbid},
    {value: 'Zarqa', label: s.cityZarqa},
    {value: 'Aqaba', label: s.cityAqaba},
    {value: 'Al-Salt', label: s.cityAlSalt},
  ];

  const [form, setForm] = useState({
    title: sourceProperty?.title ?? '',
    location: sourceProperty?.location ?? '',
    ownerName: sourceProperty?.ownerName ?? '',
    ownershipProofNumber: sourceProperty?.ownershipProofNumber ?? '',
    description: sourceProperty?.description ?? '',
    price: sourceProperty?.price ? String(sourceProperty.price) : '',
    propertyValue: sourceProperty?.propertyValue ? String(sourceProperty.propertyValue) : '',
    ownershipType: sourceProperty?.ownershipType ?? '',
    ownershipProofType: sourceProperty?.ownershipProofType ?? '',
    propertyType: '',
    city: '',
    latitude: '',
    longitude: '',
  });
  const [pickedImages, setPickedImages] = useState<string[]>([]);
  const [bedrooms, setBedrooms] = useState(0);
  const [bathrooms, setBathrooms] = useState(0);
  const [areaSqm, setAreaSqm] = useState('');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pickImage = () => {
    if (pickedImages.length >= MAX_PHOTOS) {
      Alert.alert(s.imagesLabel, s.photoLimitReached);
      return;
    }
    void launchImageLibrary(
      {mediaType: 'photo', selectionLimit: MAX_PHOTOS - pickedImages.length, quality: 0.8},
      response => {
        if (response.didCancel || response.errorCode) return;
        const uris = (response.assets ?? [])
          .map(a => a.uri)
          .filter((uri): uri is string => Boolean(uri));
        setPickedImages(prev => [...prev, ...uris].slice(0, MAX_PHOTOS));
      },
    );
  };

  const removeImage = (uri: string) => {
    setPickedImages(prev => prev.filter(u => u !== uri));
  };

  const updateField = (key: keyof typeof form, value: string) => {
    setForm(current => ({...current, [key]: value}));
  };

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities(current =>
      current.includes(amenity)
        ? current.filter(a => a !== amenity)
        : [...current, amenity],
    );
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
      Alert.alert(s.missingFieldsTitle, s.missingFieldsMessage);
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
        imageUrls: pickedImages,
        latitude: form.latitude ? Number(form.latitude) : undefined,
        longitude: form.longitude ? Number(form.longitude) : undefined,
        price: Number(form.price),
        propertyValue: Number(form.propertyValue),
        totalShares: 1,
        city: form.city || undefined,
        propertyType: form.propertyType || undefined,
        bedrooms: bedrooms > 0 ? bedrooms : undefined,
        bathrooms: bathrooms > 0 ? bathrooms : undefined,
        areaSqm: areaSqm ? Number(areaSqm) : undefined,
        amenities: selectedAmenities.length > 0 ? selectedAmenities : undefined,
      });

      Alert.alert(s.successTitle, s.successMessage, [
        {
          text: s.viewMarketplace,
          onPress: () => navigation.navigate('MyProperties'),
        },
      ]);
    } catch (error) {
      Alert.alert(
        s.failedTitle,
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
      <Text style={styles.title}>{s.screenTitle}</Text>
      <Text style={styles.subtitle}>
        {sourceProperty?.propertyId ? s.ownedSubtitle : s.helperText}
      </Text>

      <Card variant="default" padding="md" style={styles.formCard}>
        <View style={styles.formGroup}>
          <Input
            label={s.titleLabel}
            value={form.title}
            onChangeText={v => updateField('title', v)}
          />
          <Input
            label={s.locationLabel}
            value={form.location}
            onChangeText={v => updateField('location', v)}
          />
          <Input
            label={s.ownerNameLabel}
            value={form.ownerName}
            onChangeText={v => updateField('ownerName', v)}
          />

          <SelectField
            label={s.ownershipTypeLabel}
            value={form.ownershipType}
            options={ownershipTypeOptions}
            placeholder={s.selectPlaceholder}
            onChange={v => updateField('ownershipType', v)}
          />
          <SelectField
            label={s.ownershipProofTypeLabel}
            value={form.ownershipProofType}
            options={ownershipProofTypeOptions}
            placeholder={s.selectPlaceholder}
            onChange={v => updateField('ownershipProofType', v)}
          />

          <Input
            label={s.ownershipProofNumberLabel}
            value={form.ownershipProofNumber}
            onChangeText={v => updateField('ownershipProofNumber', v)}
          />

          <SelectField
            label={s.propertyTypeLabel}
            value={form.propertyType}
            options={propertyTypeOptions}
            placeholder={s.selectPlaceholder}
            onChange={v => updateField('propertyType', v)}
          />
          <SelectField
            label={s.cityLabel}
            value={form.city}
            options={cityOptions}
            placeholder={s.selectPlaceholder}
            onChange={v => updateField('city', v)}
          />

          <Input
            label={s.descriptionLabel}
            value={form.description}
            onChangeText={v => updateField('description', v)}
            multiline
          />

          {/* Bedrooms stepper */}
          <View style={styles.stepperWrapper}>
            <Text style={styles.stepperLabel}>{s.bedroomsLabel}</Text>
            <View style={styles.stepper}>
              <Pressable
                style={styles.stepperBtn}
                onPress={() => setBedrooms(n => Math.max(0, n - 1))}>
                <Text style={styles.stepperBtnText}>−</Text>
              </Pressable>
              <Text style={styles.stepperValue}>{bedrooms}</Text>
              <Pressable
                style={styles.stepperBtn}
                onPress={() => setBedrooms(n => n + 1)}>
                <Text style={styles.stepperBtnText}>+</Text>
              </Pressable>
            </View>
          </View>

          {/* Bathrooms stepper */}
          <View style={styles.stepperWrapper}>
            <Text style={styles.stepperLabel}>{s.bathroomsLabel}</Text>
            <View style={styles.stepper}>
              <Pressable
                style={styles.stepperBtn}
                onPress={() => setBathrooms(n => Math.max(0, n - 1))}>
                <Text style={styles.stepperBtnText}>−</Text>
              </Pressable>
              <Text style={styles.stepperValue}>{bathrooms}</Text>
              <Pressable
                style={styles.stepperBtn}
                onPress={() => setBathrooms(n => n + 1)}>
                <Text style={styles.stepperBtnText}>+</Text>
              </Pressable>
            </View>
          </View>

          <Input
            label={s.areaSqmLabel}
            value={areaSqm}
            keyboardType="numeric"
            onChangeText={v => setAreaSqm(v.replace(/[^0-9.]/g, ''))}
          />

          <Input
            label={s.askingPriceLabel}
            value={form.price}
            keyboardType="numeric"
            onChangeText={v => updateField('price', v.replace(/[^0-9.]/g, ''))}
          />
          <Input
            label={s.valuationLabel}
            value={form.propertyValue}
            keyboardType="numeric"
            onChangeText={v => updateField('propertyValue', v.replace(/[^0-9.]/g, ''))}
          />

          {/* Amenities multi-select */}
          <View style={styles.amenitiesWrapper}>
            <Text style={styles.amenitiesLabel}>{s.amenitiesLabel}</Text>
            <Text style={styles.amenitiesHelper}>{s.amenitiesHelper}</Text>
            <View style={styles.chipsGrid}>
              {AMENITY_OPTIONS.map(amenity => {
                const active = selectedAmenities.includes(amenity);
                return (
                  <Pressable
                    key={amenity}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => toggleAmenity(amenity)}>
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {amenity}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* ── Map location ─────────────────────────────────────────── */}
          <View style={styles.coordWrapper}>
            <Text style={styles.coordLabel}>{s.locationLabel} (Map)</Text>
            <Text style={styles.coordHelper}>
              Optional — enables your property to appear as a pin on the map.
            </Text>
            <View style={styles.coordRow}>
              <Input
                label="Latitude"
                value={form.latitude}
                keyboardType="numeric"
                onChangeText={v => updateField('latitude', v.replace(/[^0-9.\-]/g, ''))}
                style={styles.coordInput}
              />
              <Input
                label="Longitude"
                value={form.longitude}
                keyboardType="numeric"
                onChangeText={v => updateField('longitude', v.replace(/[^0-9.\-]/g, ''))}
                style={styles.coordInput}
              />
            </View>
          </View>

          {/* ── Photo picker ─────────────────────────────────────────── */}
          <View style={styles.photosWrapper}>
            <Text style={styles.photosLabel}>{s.imagesLabel}</Text>
            <Text style={styles.photosHelper}>{s.imagesHelper}</Text>
            {pickedImages.length > 0 && (
              <View style={styles.photoGrid}>
                {pickedImages.map(uri => (
                  <View key={uri} style={styles.photoThumbWrap}>
                    <Image source={{uri}} style={styles.photoThumb} resizeMode="cover" />
                    <Pressable
                      style={styles.photoRemoveBtn}
                      onPress={() => removeImage(uri)}
                      hitSlop={4}
                      accessibilityRole="button"
                      accessibilityLabel={s.removePhoto}>
                      <Text style={styles.photoRemoveText}>✕</Text>
                    </Pressable>
                  </View>
                ))}
                {pickedImages.length < MAX_PHOTOS && (
                  <Pressable
                    style={styles.photoAddTile}
                    onPress={pickImage}
                    accessibilityRole="button"
                    accessibilityLabel={s.addPhotoButton}>
                    <Text style={styles.photoAddIcon}>+</Text>
                  </Pressable>
                )}
              </View>
            )}
            {pickedImages.length === 0 && (
              <Pressable
                style={styles.photoAddBtn}
                onPress={pickImage}
                accessibilityRole="button"
                accessibilityLabel={s.addPhotoButton}>
                <Text style={styles.photoAddBtnIcon}>📷</Text>
                <Text style={styles.photoAddBtnText}>{s.addPhotoButton}</Text>
              </Pressable>
            )}
          </View>
        </View>
      </Card>

      <Button
        label={s.submitButton}
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
    paddingBottom: 16,
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
  stepperWrapper: {
    gap: 6,
  },
  stepperLabel: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.2,
    marginBottom: 2,
  },
  stepper: {
    alignItems: 'center',
    backgroundColor: Colors.inputBackground,
    borderColor: Colors.border,
    borderRadius: 14,
    borderWidth: 1.5,
    flexDirection: 'row',
    minHeight: 52,
    paddingHorizontal: 8,
  },
  stepperBtn: {
    alignItems: 'center',
    backgroundColor: Colors.backgroundMuted,
    borderRadius: 10,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  stepperBtnText: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 22,
  },
  stepperValue: {
    color: Colors.textPrimary,
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
  amenitiesWrapper: {
    gap: 6,
  },
  amenitiesLabel: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  amenitiesHelper: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  chipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  chip: {
    backgroundColor: Colors.backgroundMuted,
    borderColor: Colors.border,
    borderRadius: 100,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  chipTextActive: {
    color: Colors.textOnDark,
  },

  // ── Coordinates ──────────────────────────────────────────────────────────
  coordWrapper: {
    gap: 6,
  },
  coordLabel: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  coordHelper: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  coordRow: {
    flexDirection: 'row',
    gap: 10,
  },
  coordInput: {
    flex: 1,
  },

  // ── Photo picker ─────────────────────────────────────────────────────────
  photosWrapper: {
    gap: 6,
  },
  photosLabel: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  photosHelper: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 6,
  },
  photoThumbWrap: {
    borderRadius: 10,
    height: 90,
    overflow: 'visible',
    position: 'relative',
    width: 90,
  },
  photoThumb: {
    borderColor: Colors.border,
    borderRadius: 10,
    borderWidth: 1,
    height: 90,
    width: 90,
  },
  photoRemoveBtn: {
    alignItems: 'center',
    backgroundColor: Colors.textPrimary,
    borderColor: Colors.white,
    borderRadius: 11,
    borderWidth: 1.5,
    height: 22,
    justifyContent: 'center',
    position: 'absolute',
    right: -6,
    top: -6,
    width: 22,
  },
  photoRemoveText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '800',
    lineHeight: 12,
  },
  photoAddTile: {
    alignItems: 'center',
    backgroundColor: Colors.backgroundMuted,
    borderColor: Colors.border,
    borderRadius: 10,
    borderStyle: 'dashed',
    borderWidth: 1.5,
    height: 90,
    justifyContent: 'center',
    width: 90,
  },
  photoAddIcon: {
    color: Colors.textMuted,
    fontSize: 28,
    fontWeight: '300',
    lineHeight: 32,
  },
  photoAddBtn: {
    alignItems: 'center',
    backgroundColor: Colors.backgroundMuted,
    borderColor: Colors.border,
    borderRadius: 14,
    borderStyle: 'dashed',
    borderWidth: 1.5,
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    marginTop: 4,
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  photoAddBtnIcon: {
    fontSize: 22,
  },
  photoAddBtnText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default SellPropertyScreen;
