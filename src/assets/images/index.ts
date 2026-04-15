// Central image registry.
// Keep all React Native image require() calls here so screens/components can
// reference named assets instead of fragile relative paths.

type StaticImage = ReturnType<typeof require>;

export const AppImages = {
  logos: {
    aqarya: require('./brand/aqarya-logo.jpg') as StaticImage,
    sanad: require('./brand/sanad-logo.png') as StaticImage,
  },
  backgrounds: {
    introSplash: require('./onboarding/splash-1.png') as StaticImage,
    jordanMap: require('./backgrounds/jordan-map.png') as StaticImage,
    profileHero: require('./backgrounds/profile-hero.png') as StaticImage,
  },
  placeholders: {
    profileAvatar: require('./placeholders/profile-placeholder.png') as StaticImage,
  },
  cities: {
    Amman: require('./cities/amman.png') as StaticImage,
    Irbid: require('./cities/irbid.png') as StaticImage,
    Zarqa: require('./cities/zarqa.png') as StaticImage,
  },
  property: {
    sale: {
      listingThumb: require('./property/sale/listing-thumb-110x118.png') as StaticImage,
      mapThumb: require('./property/sale/map-thumb-84x84.png') as StaticImage,
      fullWidth: require('./property/sale/full-width-390x190.png') as StaticImage,
      detailHero: require('./property/sale/detail-hero-390x220.png') as StaticImage,
    },
    rent: {
      listingThumb: require('./property/rent/listing-thumb-110x118.png') as StaticImage,
      mapThumb: require('./property/rent/map-thumb-84x84.png') as StaticImage,
      fullWidth: require('./property/rent/full-width-390x190.png') as StaticImage,
      detailHero: require('./property/rent/detail-hero-390x220.png') as StaticImage,
    },
    investment: {
      listingThumb: require('./property/investment/listing-thumb-110x118.png') as StaticImage,
      opportunityThumb: require('./property/investment/opportunity-thumb-110x118.png') as StaticImage,
      mapThumb: require('./property/investment/map-thumb-84x84.png') as StaticImage,
      fullWidth: require('./property/investment/full-width-390x190.png') as StaticImage,
      detailHero: require('./property/investment/detail-hero-390x220.png') as StaticImage,
      opportunityHero: require('./property/investment/opportunity-hero-390x220.png') as StaticImage,
    },
  },
} as const;

export type AppImage = StaticImage;
