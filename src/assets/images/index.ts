import aqaryaLogo from './brand/aqarya-logo.jpg';
import introSplash from './onboarding/splash-1.png';
import jordanMap from './backgrounds/jordan-map.png';
import profileHero from './backgrounds/profile-hero.png';
import profileAvatar from './placeholders/profile-placeholder.png';
import saleFull from './property/sale/full-width-390x190.png';
import rentFull from './property/rent/full-width-390x190.png';
import investFull from './property/investment/full-width-390x190.png';
import investHero from './property/investment/opportunity-hero-390x220.png';

export const AppImages = {
  logos: {aqarya: aqaryaLogo},
  backgrounds: {introSplash, jordanMap, profileHero},
  placeholders: {profileAvatar},
  property: {
    sale: {fullWidth: saleFull},
    rent: {fullWidth: rentFull},
    investment: {
      fullWidth: investFull,
      opportunityHero: investHero,
    },
  },
} as const;

export type AppImage = string;
