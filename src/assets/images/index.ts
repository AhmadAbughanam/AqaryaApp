import aqaryaLogo from './brand/aqarya-logo.jpg';
import sanadLogo from './brand/sanad-logo.png';
import introSplash from './onboarding/splash-1.png';
import jordanMap from './backgrounds/jordan-map.png';
import profileHero from './backgrounds/profile-hero.png';
import saleFull from './property/sale/full-width-390x190.png';
import rentFull from './property/rent/full-width-390x190.png';

export const AppImages = {
  logos: {aqarya: aqaryaLogo, sanad: sanadLogo},
  backgrounds: {introSplash, jordanMap, profileHero},
  property: {
    sale: {fullWidth: saleFull},
    rent: {fullWidth: rentFull},
  },
} as const;

export type AppImage = string;
