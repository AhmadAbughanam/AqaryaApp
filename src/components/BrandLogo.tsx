import React from 'react';
import {Image, ImageResizeMode, StyleSheet, View} from 'react-native';
import {Colors} from '../constants/colors';

interface BrandLogoProps {
  size?: number;
  resizeMode?: ImageResizeMode;
  imageScale?: number;
  cornerRatio?: number;
}

const BrandLogo = ({
  size = 80,
  resizeMode = 'cover',
  imageScale = 1,
  cornerRatio = 0.22,
}: BrandLogoProps) => {
  const innerSize = Math.round(size * imageScale);
  const frameRadius = size * cornerRatio;
  const imageRadius = innerSize * cornerRatio;

  return (
    <View
      style={[
        styles.frame,
        {height: size, width: size, borderRadius: frameRadius},
      ]}>
      <Image
        source={require('../../logo.jpeg')}
        style={{
          height: innerSize,
          width: innerSize,
          borderRadius: imageRadius,
        }}
        resizeMode={resizeMode}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  frame: {
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: Colors.primaryDark,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
});

export default BrandLogo;
