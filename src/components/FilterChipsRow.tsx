// Horizontally scrollable row of filter chip pills.
// Reusable across Home and Properties screens.

import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {FilterChip} from '../types/market';
import {Colors} from '../constants/colors';

interface FilterChipsRowProps {
  chips: FilterChip[];
  selectedKey: string;
  onSelect: (key: string) => void;
  style?: object;
}

const FilterChipsRow = ({
  chips,
  selectedKey,
  onSelect,
  style,
}: FilterChipsRowProps) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.row, style]}
      accessibilityRole="menu">
      {chips.map(chip => {
        const isSelected = chip.key === selectedKey;
        return (
          <Chip
            key={chip.key}
            label={chip.label}
            isSelected={isSelected}
            onPress={() => onSelect(chip.key)}
          />
        );
      })}
    </ScrollView>
  );
};

const Chip = ({
  label,
  isSelected,
  onPress,
}: {
  label: string;
  isSelected: boolean;
  onPress: () => void;
}) => (
  <Pressable
    onPress={onPress}
    style={({pressed}) => [
      styles.chip,
      isSelected ? styles.chipSelected : styles.chipDefault,
      pressed && styles.chipPressed,
    ]}
    accessibilityRole="menuitem"
    accessibilityLabel={label}
    accessibilityState={{selected: isSelected}}>
    <View style={styles.chipInner}>
      {isSelected && <View style={styles.activeDot} />}
      <Text
        style={[
          styles.chipLabel,
          isSelected ? styles.chipLabelSelected : styles.chipLabelDefault,
        ]}>
        {label}
      </Text>
    </View>
  </Pressable>
);

const styles = StyleSheet.create({
  row: {
    gap: 8,
    paddingHorizontal: 2,
    paddingVertical: 4,
  },

  chip: {
    borderRadius: 100,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },

  chipDefault: {
    backgroundColor: Colors.backgroundSecondary,
    borderColor: Colors.border,
    borderWidth: 1.5,
  },

  chipSelected: {
    backgroundColor: Colors.primaryDark,
    borderColor: Colors.primaryDark,
    borderWidth: 1.5,
  },

  chipPressed: {
    opacity: 0.75,
  },

  chipInner: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
  },

  activeDot: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 3,
    height: 5,
    width: 5,
  },

  chipLabel: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.1,
  },

  chipLabelDefault: {
    color: Colors.textSecondary,
  },

  chipLabelSelected: {
    color: Colors.textOnDark,
  },
});

export default FilterChipsRow;
