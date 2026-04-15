// Segmented switcher for the three citizen market modes: Buy | Rent | Invest.
// Reusable across Home and future browse screens.

import React, {useRef} from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {MarketMode} from '../types/market';
import {useMarketStrings} from '../hooks/useMarketStrings';
import {Colors} from '../constants/colors';

interface MarketModeSwitcherProps {
  value: MarketMode;
  onChange: (mode: MarketMode) => void;
}

const MarketModeSwitcher = ({value, onChange}: MarketModeSwitcherProps) => {
  const {modeOptions} = useMarketStrings();

  return (
    <View style={styles.container} accessibilityRole="tablist">
      {modeOptions.map((option, index) => {
        const isActive = option.key === value;
        return (
          <ModeButton
            key={option.key}
            label={option.label}
            isActive={isActive}
            isFirst={index === 0}
            isLast={index === modeOptions.length - 1}
            onPress={() => onChange(option.key)}
          />
        );
      })}
    </View>
  );
};

const ModeButton = ({
  label,
  isActive,
  isFirst,
  isLast,
  onPress,
}: {
  label: string;
  isActive: boolean;
  isFirst: boolean;
  isLast: boolean;
  onPress: () => void;
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 6,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.buttonWrapper}
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{selected: isActive}}>
      <Animated.View
        style={[
          styles.button,
          isActive ? styles.buttonActive : styles.buttonInactive,
          isActive && isFirst && styles.buttonActiveFirst,
          isActive && isLast && styles.buttonActiveLast,
          isActive && !isFirst && !isLast && styles.buttonActiveMiddle,
          {transform: [{scale: scaleAnim}]},
        ]}>
        <Text
          style={[
            styles.label,
            isActive ? styles.labelActive : styles.labelInactive,
          ]}>
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F7F7F5',
    borderColor: '#ECECEA',
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    height: 42,
    overflow: 'hidden',
  },

  buttonWrapper: {
    flex: 1,
  },

  button: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },

  buttonActive: {
    backgroundColor: Colors.primaryDark,
  },
  buttonActiveFirst: {
    borderBottomLeftRadius: 19,
    borderTopLeftRadius: 19,
  },
  buttonActiveMiddle: {
    borderRadius: 0,
  },
  buttonActiveLast: {
    borderBottomRightRadius: 19,
    borderTopRightRadius: 19,
  },

  buttonInactive: {
    backgroundColor: Colors.transparent,
  },

  label: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0,
  },

  labelActive: {
    color: Colors.textOnDark,
  },

  labelInactive: {
    color: Colors.textSecondary,
  },
});

export default MarketModeSwitcher;
