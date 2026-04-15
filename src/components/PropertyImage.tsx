// PropertyImage — shows the first imageUrl if available, otherwise the
// correct market-type placeholder image (sell / renting / investment).
// Use as a drop-in replacement for the dot-grid View in list cards and hero areas.

import React, {useState} from 'react';
import {Image, StyleSheet, View, ViewStyle, ImageStyle} from 'react-native';
import {AppImages} from '../assets/images';

export type PropertyMarketType = 'sale' | 'rent' | 'investment' | 'invest';

const PLACEHOLDER: Record<string, ReturnType<typeof require>> = {
  sale: AppImages.property.sale.listingThumb,
  rent: AppImages.property.rent.listingThumb,
  investment: AppImages.property.investment.listingThumb,
  invest: AppImages.property.investment.listingThumb,
};

interface PropertyImageProps {
  imageUrls?: string[] | null;
  marketType?: PropertyMarketType | string | null;
  style?: ViewStyle;
  imageStyle?: ImageStyle;
  children?: React.ReactNode;
  fallbackSource?: ReturnType<typeof require>;
}

const PropertyImage = ({
  imageUrls,
  marketType,
  style,
  imageStyle,
  children,
  fallbackSource,
}: PropertyImageProps) => {
  const firstUrl = imageUrls && imageUrls.length > 0 ? imageUrls[0] : null;
  const placeholder = fallbackSource ?? PLACEHOLDER[marketType ?? 'sale'] ?? PLACEHOLDER.sale;
  const [urlFailed, setUrlFailed] = useState(false);

  const source = firstUrl && !urlFailed ? {uri: firstUrl} : placeholder;

  return (
    <View style={[styles.container, style]}>
      <Image
        source={source}
        style={[styles.image, imageStyle]}
        resizeMode="cover"
        onError={() => setUrlFailed(true)}
      />
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1A1A1A',
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
  },
  image: {
    bottom: 0,
    height: '100%',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    width: '100%',
  },
});

export default PropertyImage;
