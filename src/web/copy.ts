import type {SupportedLanguage} from '../i18n';

export const copy = {
  en: {
    tagline: 'Verified property, built on trust',
    signOut: 'Sign out',
    language: 'العربية',
    citizenNav: {
      home: 'Discover',
      map: 'Map',
      properties: 'My properties',
      portfolio: 'Portfolio',
      messages: 'Messages',
      wallet: 'Wallet',
      profile: 'Profile',
    },
    adminNav: {
      dashboard: 'Command center',
      properties: 'Listings',
      investments: 'Investments',
      users: 'Users',
      moderation: 'Moderation',
      content: 'Content',
      audit: 'Audit log',
      analytics: 'Analytics',
    },
  },
  ar: {
    tagline: 'عقارات موثّقة، مبنية على الثقة',
    signOut: 'تسجيل الخروج',
    language: 'English',
    citizenNav: {
      home: 'اكتشف',
      map: 'الخريطة',
      properties: 'عقاراتي',
      portfolio: 'المحفظة الاستثمارية',
      messages: 'الرسائل',
      wallet: 'المحفظة',
      profile: 'حسابي',
    },
    adminNav: {
      dashboard: 'مركز التحكم',
      properties: 'القوائم',
      investments: 'الاستثمارات',
      users: 'المستخدمون',
      moderation: 'الإشراف',
      content: 'المحتوى',
      audit: 'سجل التدقيق',
      analytics: 'التحليلات',
    },
  },
} as const satisfies Record<SupportedLanguage, unknown>;
