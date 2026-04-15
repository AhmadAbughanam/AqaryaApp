// Intro screen — 4-slide onboarding pager, shown once on first launch.
// Language toggle on slide 1 immediately flips all slides to Arabic.

import React, {useRef, useState} from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewToken,
} from 'react-native';
import {useLanguage} from '../../i18n';
import {useIntroDismissed} from '../../store/introState';
import {AppImages} from '../../assets/images';

const {width: SW, height: SH} = Dimensions.get('window');

const IMG_SPLASH = AppImages.backgrounds.introSplash;
const IMG_LOGO = AppImages.logos.aqarya;

// ─── Slide keys ───────────────────────────────────────────────────────────────

type SlideKey = 'brand' | 'discover' | 'search' | 'invest';
const SLIDES: SlideKey[] = ['brand', 'discover', 'search', 'invest'];

// ─── Content (EN / AR) ────────────────────────────────────────────────────────

const CONTENT = {
  en: {
    langHint: 'Choose your language',
    discover: {
      label: 'Discover',
      title: 'Real\nOpportunities',
      sub:   'Browse verified properties across Jordan',
      checks: ['Verified Listings', 'Prime Locations', 'Trusted Agencies'],
    },
    search: {
      label: 'Search',
      title: 'With\nPrecision',
      sub:   'Smart filters, map browsing, real insights',
      checks: ['Advanced Filters', 'Interactive Map', 'Market Insights', 'Premium Agencies'],
    },
    invest: {
      label: 'Invest',
      title: 'With\nConfidence.',
      sub:   'Secure, verified opportunities for growth',
      checks: ['High ROI Projects', 'Verified Investments', 'Safe & Secure'],
      cta:   'Get Started',
    },
  },
  ar: {
    langHint: 'اختر لغتك',
    discover: {
      label: 'اكتشف',
      title: 'فرص\nحقيقية',
      sub:   'تصفح عقارات موثقة في مختلف أنحاء الأردن',
      checks: ['قوائم موثقة', 'مواقع مميزة', 'وكالات موثوقة'],
    },
    search: {
      label: 'ابحث',
      title: 'بدقة\nواحتراف',
      sub:   'فلاتر ذكية، تصفح بالخريطة، رؤى حقيقية',
      checks: ['فلاتر متقدمة', 'خريطة تفاعلية', 'رؤى السوق', 'وكالات متميزة'],
    },
    invest: {
      label: 'استثمر',
      title: 'بثقة\nوأمان.',
      sub:   'فرص موثقة وآمنة للنمو',
      checks: ['مشاريع عالية العائد', 'استثمارات موثقة', 'آمن وموثوق'],
      cta:   'ابدأ الآن',
    },
  },
} as const;

type Lang = keyof typeof CONTENT;

// ─── Shared blurred background ────────────────────────────────────────────────

const BlurBg = () => (
  <>
    <Image source={IMG_SPLASH} style={s.bgImage} resizeMode="cover" blurRadius={6} />
    <View style={s.bgOverlay} />
  </>
);

// ─── Language selector ────────────────────────────────────────────────────────

const LangSelector = ({
  language,
  onToggle,
}: {
  language: Lang;
  onToggle: (l: Lang) => void;
}) => (
  <View style={s.langWrap}>
    <Text style={s.langHint}>{CONTENT[language].langHint}</Text>
    <View style={s.langSegment}>
      <Pressable
        onPress={() => onToggle('en')}
        style={[s.langOption, language === 'en' && s.langOptionActive]}
        accessibilityRole="button"
        accessibilityLabel="Switch to English">
        <Text style={[s.langOptionText, language === 'en' && s.langOptionTextActive]}>
          English
        </Text>
      </Pressable>
      <Pressable
        onPress={() => onToggle('ar')}
        style={[s.langOption, language === 'ar' && s.langOptionActive]}
        accessibilityRole="button"
        accessibilityLabel="Switch to Arabic">
        <Text style={[s.langOptionText, language === 'ar' && s.langOptionTextActive]}>
          العربية
        </Text>
      </Pressable>
    </View>
  </View>
);

// ─── Check row ────────────────────────────────────────────────────────────────

const CheckRow = ({label, isRtl}: {label: string; isRtl: boolean}) => (
  <View style={[s.checkRow, isRtl && s.checkRowRtl]}>
    <View style={s.checkCircle}>
      <Text style={s.checkMark}>✓</Text>
    </View>
    <Text style={[s.checkLabel, isRtl && s.textRtl]}>{label}</Text>
  </View>
);

// ─── Slide 1 — Brand ──────────────────────────────────────────────────────────

const BrandSlide = ({
  language,
  onToggle,
}: {
  language: Lang;
  onToggle: (l: Lang) => void;
}) => (
  <View style={s.slide}>
    <Image source={IMG_SPLASH} style={s.bgImage} resizeMode="cover" />
    <View style={s.brandOverlay} />
    <View style={s.brandTopRow}>
      <Image source={IMG_LOGO} style={s.brandLogoImg} resizeMode="contain" />
      <Text style={s.brandLogoEn}>Aqarya</Text>
      <Text style={s.brandLogoSep}> | </Text>
      <Text style={s.brandLogoAr}>عقاريا</Text>
    </View>
    <View style={s.brandCenter}>
      <LangSelector language={language} onToggle={onToggle} />
    </View>
  </View>
);

// ─── Slide 2 — Discover ───────────────────────────────────────────────────────

const DiscoverSlide = ({language}: {language: Lang}) => {
  const c = CONTENT[language].discover;
  const isRtl = language === 'ar';
  return (
    <View style={s.slide}>
      <BlurBg />
      <View style={s.contentBlock}>
        <Text style={[s.slideLabel, isRtl && s.textRtl]}>{c.label}</Text>
        <Text style={[s.slideTitle, isRtl && s.textRtl]}>{c.title}</Text>
        <Text style={[s.slideSub,  isRtl && s.textRtl]}>{c.sub}</Text>
        <View style={s.divider} />
        <View style={s.checks}>
          {c.checks.map(item => (
            <CheckRow key={item} label={item} isRtl={isRtl} />
          ))}
        </View>
      </View>
    </View>
  );
};

// ─── Slide 3 — Search ─────────────────────────────────────────────────────────

const SearchSlide = ({language}: {language: Lang}) => {
  const c = CONTENT[language].search;
  const isRtl = language === 'ar';
  return (
    <View style={s.slide}>
      <BlurBg />
      <View style={s.contentBlock}>
        <Text style={[s.slideLabel, isRtl && s.textRtl]}>{c.label}</Text>
        <Text style={[s.slideTitle, isRtl && s.textRtl]}>{c.title}</Text>
        <Text style={[s.slideSub,  isRtl && s.textRtl]}>{c.sub}</Text>
        <View style={s.divider} />
        <View style={s.checksGrid}>
          <View style={s.checksCol}>
            <CheckRow label={c.checks[0]} isRtl={isRtl} />
            <CheckRow label={c.checks[2]} isRtl={isRtl} />
          </View>
          <View style={s.checksCol}>
            <CheckRow label={c.checks[1]} isRtl={isRtl} />
            <CheckRow label={c.checks[3]} isRtl={isRtl} />
          </View>
        </View>
      </View>
    </View>
  );
};

// ─── Slide 4 — Invest ─────────────────────────────────────────────────────────

const InvestSlide = ({
  language,
  onGetStarted,
}: {
  language: Lang;
  onGetStarted: () => void;
}) => {
  const c = CONTENT[language].invest;
  const isRtl = language === 'ar';
  return (
    <View style={s.slide}>
      <BlurBg />
      <View style={s.contentBlock}>
        <Text style={[s.slideLabel, isRtl && s.textRtl]}>{c.label}</Text>
        <Text style={[s.slideTitle, isRtl && s.textRtl]}>{c.title}</Text>
        <Text style={[s.slideSub,  isRtl && s.textRtl]}>{c.sub}</Text>
        <View style={s.divider} />
        <View style={s.checks}>
          {c.checks.map(item => (
            <CheckRow key={item} label={item} isRtl={isRtl} />
          ))}
        </View>
        <TouchableOpacity
          style={s.ctaBtn}
          onPress={onGetStarted}
          activeOpacity={0.88}
          accessibilityRole="button"
          accessibilityLabel={c.cta}>
          <Text style={s.ctaBtnText}>{c.cta}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─── Main screen ──────────────────────────────────────────────────────────────

const IntroScreen = () => {
  const {language, setLanguage} = useLanguage();
  const dismiss = useIntroDismissed();
  const [activeIndex, setActiveIndex] = useState(0);
  const lang = (language === 'ar' ? 'ar' : 'en') as Lang;

  const onViewableItemsChanged = useRef(
    ({viewableItems}: {viewableItems: ViewToken[]}) => {
      const idx = viewableItems[0]?.index;
      if (idx != null) setActiveIndex(idx);
    },
  ).current;

  const renderItem = ({item}: {item: SlideKey}) => {
    switch (item) {
      case 'brand':
        return <BrandSlide language={lang} onToggle={setLanguage} />;
      case 'discover':
        return <DiscoverSlide language={lang} />;
      case 'search':
        return <SearchSlide language={lang} />;
      case 'invest':
        return <InvestSlide language={lang} onGetStarted={dismiss} />;
    }
  };

  return (
    <View style={s.screen}>
      <FlatList
        data={SLIDES}
        keyExtractor={k => k}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{itemVisiblePercentThreshold: 50}}
        bounces={false}
        style={s.list}
      />
      <View style={s.dotsWrap} pointerEvents="none">
        {SLIDES.map((k, i) => (
          <View key={k} style={[s.dot, i === activeIndex && s.dotActive]} />
        ))}
      </View>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  screen: {backgroundColor: '#0D0C0A', flex: 1},
  list:   {flex: 1},

  // ── Base ─────────────────────────────────────────────────────────────────────
  slide: {height: SH, overflow: 'hidden', width: SW},
  bgImage: {height: SH, left: 0, position: 'absolute', top: 0, width: SW},
  bgOverlay: {
    backgroundColor: 'rgba(10,9,7,0.42)',
    bottom: 0, left: 0, position: 'absolute', right: 0, top: 0,
  },

  // ── Slide 1 — brand ──────────────────────────────────────────────────────────
  brandOverlay: {
    backgroundColor: 'rgba(10,9,7,0.10)',
    bottom: 0, left: 0, position: 'absolute', right: 0, top: 0,
  },
  brandTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 26,
    paddingTop: 58,
  },
  brandLogoImg: {borderRadius: 7, height: 30, marginRight: 9, width: 30},
  brandLogoEn:  {color: '#1A1A1A', fontSize: 19, fontWeight: '800', letterSpacing: 0.2},
  brandLogoSep: {color: '#666', fontSize: 19, fontWeight: '300'},
  brandLogoAr:  {color: '#1A1A1A', fontSize: 19, fontWeight: '800'},
  brandCenter: {
    alignItems: 'center',
    bottom: 0, justifyContent: 'center', left: 0,
    position: 'absolute', right: 0, top: 0,
  },

  // ── Language selector ─────────────────────────────────────────────────────────
  langWrap:    {alignItems: 'center', gap: 16},
  langHint: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  langSegment: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderColor: 'rgba(255,255,255,0.30)',
    borderRadius: 50,
    borderWidth: 1,
    flexDirection: 'row',
    padding: 4,
  },
  langOption: {
    alignItems: 'center',
    borderRadius: 46,
    justifyContent: 'center',
    paddingHorizontal: 38,
    paddingVertical: 14,
  },
  langOptionActive: {
    backgroundColor: '#FFFFFF',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.18,
    shadowRadius: 10,
  },
  langOptionText: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  langOptionTextActive: {color: '#1A1A1A', fontWeight: '700'},

  // ── Content block ─────────────────────────────────────────────────────────────
  contentBlock: {
    bottom: 0,
    justifyContent: 'flex-end',
    left: 0,
    paddingBottom: 72,
    paddingHorizontal: 30,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  slideLabel: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 3,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  slideTitle: {
    color: '#FFFFFF',
    fontSize: 48,
    fontWeight: '200',
    letterSpacing: -1,
    lineHeight: 54,
    marginBottom: 12,
  },
  slideSub: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 21,
  },
  divider: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    height: 1,
    marginVertical: 22,
  },
  checks:     {gap: 14},
  checksGrid: {flexDirection: 'row', gap: 10},
  checksCol:  {flex: 1, gap: 14},

  // ── RTL helpers ───────────────────────────────────────────────────────────────
  textRtl:     {textAlign: 'right'},
  checkRow:    {alignItems: 'center', flexDirection: 'row', gap: 12},
  checkRowRtl: {flexDirection: 'row-reverse'},
  checkCircle: {
    alignItems: 'center',
    borderColor: 'rgba(255,255,255,0.40)',
    borderRadius: 11,
    borderWidth: 1.5,
    height: 22,
    justifyContent: 'center',
    width: 22,
  },
  checkMark:  {color: 'rgba(255,255,255,0.85)', fontSize: 10, fontWeight: '700', lineHeight: 12},
  checkLabel: {color: 'rgba(255,255,255,0.80)', fontSize: 14, fontWeight: '400', letterSpacing: 0.1},

  // ── CTA ───────────────────────────────────────────────────────────────────────
  ctaBtn: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    height: 56,
    justifyContent: 'center',
    marginTop: 28,
  },
  ctaBtnText: {color: '#0D0C0A', fontSize: 16, fontWeight: '700', letterSpacing: 0.3},

  // ── Dots ──────────────────────────────────────────────────────────────────────
  dotsWrap: {
    alignSelf: 'center',
    bottom: 30,
    flexDirection: 'row',
    gap: 6,
    position: 'absolute',
  },
  dot:       {backgroundColor: 'rgba(255,255,255,0.30)', borderRadius: 4, height: 5, width: 16},
  dotActive: {backgroundColor: '#FFFFFF', width: 28},
});

export default IntroScreen;
