// Search & filter screen — accessed from the Home search bar filter button.
// Covers all filterable fields available in the property database:
// property type, city, bedrooms, bathrooms, area range, price range,
// amenities, sort order, and verified-only toggle.

import React, {useState} from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {CitizenHomeStackParamList, FilterParams} from '../../navigation/CitizenHomeStack';
import {Colors} from '../../constants/colors';
import {AppImages} from '../../assets/images';

type Props = NativeStackScreenProps<CitizenHomeStackParamList, 'SearchFilter'>;

// ─── Option constants ─────────────────────────────────────────────────────────

const PROPERTY_TYPES = ['Residential', 'Villa', 'Apartment', 'Land', 'Commercial'];

const CITIES = ['Amman', 'Irbid', 'Zarqa', 'Aqaba', 'Al-Salt'];

const BEDROOM_OPTIONS: Array<{label: string; value: number}> = [
  {label: 'Studio', value: 0},
  {label: '1', value: 1},
  {label: '2', value: 2},
  {label: '3', value: 3},
  {label: '4', value: 4},
  {label: '5+', value: 5},
];

const BATHROOM_OPTIONS: Array<{label: string; value: number}> = [
  {label: '1', value: 1},
  {label: '2', value: 2},
  {label: '3', value: 3},
  {label: '4+', value: 4},
];

const AMENITIES = [
  'Swimming pool',
  'Garden',
  'Private garden',
  'Garage',
  'Parking',
  'Elevator',
  'Gym',
  'Security',
  'City views',
];

const SORT_OPTIONS: Array<{label: string; value: FilterParams['sort']}> = [
  {label: 'Newest', value: 'newest'},
  {label: 'Price ↑', value: 'price_asc'},
  {label: 'Price ↓', value: 'price_desc'},
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const trackFillPercent = (raw: string, absMax: number): `${number}%` => {
  const v = parseInt(raw, 10);
  if (isNaN(v) || v <= 0) {return '0%';}
  return `${Math.min((v / absMax) * 100, 100)}%`;
};

// ─── Component ────────────────────────────────────────────────────────────────

const SearchFilterScreen = ({navigation, route}: Props) => {
  const initial = route.params?.initialFilters;

  const [propertyType, setPropertyType] = useState<string | undefined>(initial?.propertyType);
  const [city, setCity] = useState<string | undefined>(initial?.city);
  const [bedrooms, setBedrooms] = useState<number | undefined>(initial?.bedrooms);
  const [bathrooms, setBathrooms] = useState<number | undefined>(initial?.bathrooms);
  const [minArea, setMinArea] = useState(initial?.minAreaSqm != null ? String(initial.minAreaSqm) : '');
  const [maxArea, setMaxArea] = useState(initial?.maxAreaSqm != null ? String(initial.maxAreaSqm) : '');
  const [minPrice, setMinPrice] = useState(initial?.minPrice != null ? String(initial.minPrice) : '');
  const [maxPrice, setMaxPrice] = useState(initial?.maxPrice != null ? String(initial.maxPrice) : '');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(initial?.amenities ?? []);
  const [sort, setSort] = useState<FilterParams['sort']>(initial?.sort);
  const [verifiedOnly, setVerifiedOnly] = useState(initial?.verifiedOnly ?? false);

  const toggleAmenity = (a: string) => {
    setSelectedAmenities(prev =>
      prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a],
    );
  };

  const onReset = () => {
    setPropertyType(undefined);
    setCity(undefined);
    setBedrooms(undefined);
    setBathrooms(undefined);
    setMinArea('');
    setMaxArea('');
    setMinPrice('');
    setMaxPrice('');
    setSelectedAmenities([]);
    setSort(undefined);
    setVerifiedOnly(false);
  };

  const onApply = () => {
    const filters: FilterParams = {};
    if (propertyType) {filters.propertyType = propertyType;}
    if (city) {filters.city = city;}
    if (bedrooms !== undefined) {filters.bedrooms = bedrooms;}
    if (bathrooms !== undefined) {filters.bathrooms = bathrooms;}
    const minA = parseInt(minArea, 10);
    const maxA = parseInt(maxArea, 10);
    if (!isNaN(minA) && minA > 0) {filters.minAreaSqm = minA;}
    if (!isNaN(maxA) && maxA > 0) {filters.maxAreaSqm = maxA;}
    const minP = parseInt(minPrice, 10);
    const maxP = parseInt(maxPrice, 10);
    if (!isNaN(minP) && minP > 0) {filters.minPrice = minP;}
    if (!isNaN(maxP) && maxP > 0) {filters.maxPrice = maxP;}
    if (selectedAmenities.length > 0) {filters.amenities = selectedAmenities;}
    if (sort) {filters.sort = sort;}
    if (verifiedOnly) {filters.verifiedOnly = true;}
    navigation.navigate('HomeMain', {filters});
  };

  return (
    <View style={styles.screen}>

      {/* ── Top bar ───────────────────────────────────────────────────────── */}
      <View style={styles.topBar}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={({pressed}) => [styles.backBtn, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Go back">
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <View style={styles.logoRow}>
          <Image
            source={AppImages.logos.aqarya}
            style={styles.logoIcon}
            resizeMode="cover"
          />
          <Text style={styles.logoText}>Aqarya</Text>
        </View>
        <View style={styles.topBarRight} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">

        {/* ── Property Type ─────────────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>Property Type</Text>
        <View style={styles.chipsWrap}>
          {PROPERTY_TYPES.map(type => {
            const active = propertyType === type;
            return (
              <Pressable
                key={type}
                onPress={() => setPropertyType(active ? undefined : type)}
                style={({pressed}) => [styles.chip, active && styles.chipActive, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityState={{selected: active}}>
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {type}{active ? ' ✓' : ''}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* ── City ─────────────────────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>City</Text>
        <View style={styles.chipsWrap}>
          {CITIES.map(c => {
            const active = city === c;
            return (
              <Pressable
                key={c}
                onPress={() => setCity(active ? undefined : c)}
                style={({pressed}) => [styles.chip, active && styles.chipActive, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityState={{selected: active}}>
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {c}{active ? ' ✓' : ''}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* ── Bedrooms ──────────────────────────────────────────────────── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Bedrooms</Text>
          {bedrooms !== undefined ? (
            <Text style={styles.sectionHint}>
              {bedrooms === 0 ? 'Studio' : bedrooms >= 5 ? '5+' : `${bedrooms}+`}
            </Text>
          ) : null}
        </View>
        <View style={styles.chipsRow}>
          {BEDROOM_OPTIONS.map(opt => {
            const active = bedrooms === opt.value;
            return (
              <Pressable
                key={opt.value}
                onPress={() => setBedrooms(active ? undefined : opt.value)}
                style={({pressed}) => [styles.chipCircle, active && styles.chipCircleActive, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityState={{selected: active}}>
                <Text style={[styles.chipCircleText, active && styles.chipCircleTextActive]}>
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* ── Bathrooms ─────────────────────────────────────────────────── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Bathrooms</Text>
          {bathrooms !== undefined ? (
            <Text style={styles.sectionHint}>
              {bathrooms >= 4 ? '4+' : `${bathrooms}+`}
            </Text>
          ) : null}
        </View>
        <View style={styles.chipsRow}>
          {BATHROOM_OPTIONS.map(opt => {
            const active = bathrooms === opt.value;
            return (
              <Pressable
                key={opt.value}
                onPress={() => setBathrooms(active ? undefined : opt.value)}
                style={({pressed}) => [styles.chipCircle, active && styles.chipCircleActive, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityState={{selected: active}}>
                <Text style={[styles.chipCircleText, active && styles.chipCircleTextActive]}>
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* ── Area ─────────────────────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>Area</Text>
        <View style={styles.rangeRow}>
          <Text style={styles.rangeLabel}>min</Text>
          <View style={styles.rangeInputBox}>
            <TextInput
              style={styles.rangeInput}
              value={minArea}
              onChangeText={setMinArea}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor={Colors.textMuted}
              accessibilityLabel="Minimum area in square metres"
            />
            {minArea.length > 0 ? <Text style={styles.rangeCheck}>✓</Text> : null}
          </View>
          <View style={styles.trackContainer}>
            <View style={styles.trackBg} />
            <View style={[styles.trackFill, {
              left: trackFillPercent(minArea, 1000),
              right: `${100 - parseFloat(trackFillPercent(maxArea || '1000', 1000))}%` as `${number}%`,
            }]} />
          </View>
          <View style={styles.rangeInputBox}>
            <TextInput
              style={styles.rangeInput}
              value={maxArea}
              onChangeText={setMaxArea}
              keyboardType="number-pad"
              placeholder="500"
              placeholderTextColor={Colors.textMuted}
              accessibilityLabel="Maximum area in square metres"
            />
          </View>
          <Text style={styles.rangeUnit}>m²</Text>
        </View>

        {/* ── Price Range ───────────────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>Price Range</Text>
        <View style={styles.rangeRow}>
          <Text style={styles.rangeLabel}>min</Text>
          <View style={styles.rangeInputBox}>
            <TextInput
              style={styles.rangeInput}
              value={minPrice}
              onChangeText={setMinPrice}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor={Colors.textMuted}
              accessibilityLabel="Minimum price"
            />
            {minPrice.length > 0 ? <Text style={styles.rangeCheck}>✓</Text> : null}
          </View>
          <View style={styles.trackContainer}>
            <View style={styles.trackBg} />
            <View style={[styles.trackFill, {
              left: trackFillPercent(minPrice, 5_000_000),
              right: `${100 - parseFloat(trackFillPercent(maxPrice || '5000000', 5_000_000))}%` as `${number}%`,
            }]} />
          </View>
          <View style={styles.rangeInputBox}>
            <TextInput
              style={styles.rangeInput}
              value={maxPrice}
              onChangeText={setMaxPrice}
              keyboardType="number-pad"
              placeholder="Any"
              placeholderTextColor={Colors.textMuted}
              accessibilityLabel="Maximum price"
            />
          </View>
          <Text style={styles.rangeUnit}>$</Text>
        </View>

        {/* ── Amenities ────────────────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>Amenities</Text>
        <View style={styles.chipsWrap}>
          {AMENITIES.map(amenity => {
            const active = selectedAmenities.includes(amenity);
            return (
              <Pressable
                key={amenity}
                onPress={() => toggleAmenity(amenity)}
                style={({pressed}) => [styles.chip, active && styles.chipActive, pressed && styles.pressed]}
                accessibilityRole="checkbox"
                accessibilityState={{checked: active}}>
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {amenity}{active ? ' ✓' : ''}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* ── Sort ─────────────────────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>Sort By</Text>
        <View style={styles.chipsRow}>
          {SORT_OPTIONS.map(opt => {
            const active = sort === opt.value;
            return (
              <Pressable
                key={opt.value}
                onPress={() => setSort(active ? undefined : opt.value)}
                style={({pressed}) => [styles.chip, active && styles.chipActive, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityState={{selected: active}}>
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* ── Verified Only ────────────────────────────────────────────── */}
        <View style={styles.checkboxRow}>
          <Pressable
            onPress={() => setVerifiedOnly(v => !v)}
            style={({pressed}) => [styles.checkboxItem, pressed && styles.pressed]}
            accessibilityRole="checkbox"
            accessibilityLabel="Verified only"
            accessibilityState={{checked: verifiedOnly}}>
            <View style={[styles.checkbox, verifiedOnly && styles.checkboxChecked]}>
              {verifiedOnly ? <Text style={styles.checkboxTick}>✓</Text> : null}
            </View>
            <Text style={styles.checkboxLabel}>Verified Only</Text>
          </Pressable>
        </View>

      </ScrollView>

      {/* ── Footer buttons ───────────────────────────────────────────────── */}
      <View style={styles.footer}>
        <Pressable
          onPress={onReset}
          style={({pressed}) => [styles.resetBtn, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Reset all filters">
          <Text style={styles.resetBtnText}>Reset</Text>
        </Pressable>
        <Pressable
          onPress={onApply}
          style={({pressed}) => [styles.applyBtn, pressed && {opacity: 0.8}]}
          accessibilityRole="button"
          accessibilityLabel="Apply filters">
          <Text style={styles.applyBtnText}>Apply Filters</Text>
        </Pressable>
      </View>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    backgroundColor: Colors.backgroundSecondary,
    flex: 1,
  },

  // ── Top bar ───────────────────────────────────────────────────────────────
  topBar: {
    alignItems: 'center',
    borderBottomColor: Colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 14,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  backBtn: {
    alignItems: 'center',
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  backIcon: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: '500',
  },
  logoRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  logoIcon: {
    borderRadius: 6,
    height: 30,
    width: 30,
  },
  logoText: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  topBarRight: {
    width: 36,
  },

  // ── Scroll ────────────────────────────────────────────────────────────────
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 12,
  },

  // ── Section headers ───────────────────────────────────────────────────────
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.1,
    marginBottom: 14,
    marginTop: 8,
  },
  sectionHeaderRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
    marginTop: 8,
  },
  sectionHint: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },

  // ── Wrapping chips (type, city, amenities, sort) ──────────────────────────
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  chip: {
    backgroundColor: Colors.backgroundSecondary,
    borderColor: Colors.border,
    borderRadius: 100,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  chipActive: {
    borderColor: Colors.primaryDark,
  },
  chipText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  chipTextActive: {
    color: Colors.primaryDark,
    fontWeight: '700',
  },

  // ── Circle chips (bedrooms, bathrooms) ────────────────────────────────────
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  chipCircle: {
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    borderColor: Colors.border,
    borderRadius: 100,
    borderWidth: 1.5,
    height: 44,
    justifyContent: 'center',
    minWidth: 44,
    paddingHorizontal: 10,
  },
  chipCircleActive: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  chipCircleText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  chipCircleTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },

  // ── Range row (area, price) ───────────────────────────────────────────────
  rangeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  rangeLabel: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
    minWidth: 26,
  },
  rangeInputBox: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 3,
  },
  rangeInput: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    minWidth: 40,
    padding: 0,
    textAlign: 'center',
  },
  rangeCheck: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  rangeUnit: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  trackContainer: {
    flex: 1,
    height: 20,
    justifyContent: 'center',
    position: 'relative',
  },
  trackBg: {
    backgroundColor: Colors.border,
    borderRadius: 100,
    height: 4,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  trackFill: {
    backgroundColor: Colors.primary,
    borderRadius: 100,
    height: 4,
    position: 'absolute',
  },

  // ── Checkbox ──────────────────────────────────────────────────────────────
  checkboxRow: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 20,
    marginTop: 4,
  },
  checkboxItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  checkbox: {
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    borderColor: Colors.border,
    borderRadius: 6,
    borderWidth: 1.5,
    height: 22,
    justifyContent: 'center',
    width: 22,
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkboxTick: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  checkboxLabel: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '500',
  },

  // ── Footer ────────────────────────────────────────────────────────────────
  footer: {
    borderTopColor: Colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 16,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  resetBtn: {
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    borderColor: Colors.border,
    borderRadius: 100,
    borderWidth: 1.5,
    flex: 1,
    paddingVertical: 14,
  },
  resetBtnText: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  applyBtn: {
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 100,
    flex: 2,
    paddingVertical: 14,
  },
  applyBtnText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '700',
  },

  pressed: {
    opacity: 0.75,
  },
});

export default SearchFilterScreen;
