// Shared brand bar for citizen screens.
// CitizenBrandLogo   — just the centre logo + bilingual name (for headers with their own left/right buttons).
// CitizenBrandBar    — full three-column row: left slot | logo+name | right slot.
//                      Both sides use flex:1 so the centre stays perfectly centred
//                      regardless of side content width.

import React from 'react';
import {Image, StyleSheet, Text, View} from 'react-native';
import {Colors} from '../constants/colors';
import {AppImages} from '../assets/images';

interface BrandBarProps {
  left?: React.ReactNode;
  right?: React.ReactNode;
  isDark?: boolean;
}

// ─── Centre piece only (logo + "Aqarya | عقاريا") ───────────────────────────

export const CitizenBrandLogo = ({isDark}: {isDark?: boolean}) => (
  <View style={s.center}>
    <Image
      source={AppImages.logos.aqarya}
      style={s.logo}
      resizeMode="contain"
    />
    <Text style={[s.nameEn, isDark && s.textLight]}>Aqarya</Text>
    <Text style={[s.sep,    isDark && s.sepLight]}> | </Text>
    <Text style={[s.nameAr, isDark && s.textLight]}>عقاريا</Text>
  </View>
);

// ─── Full three-column bar ────────────────────────────────────────────────────

const CitizenBrandBar = ({left, right, isDark}: BrandBarProps) => (
  <View style={s.row}>
    <View style={s.sideLeft}>{left ?? null}</View>
    <CitizenBrandLogo isDark={isDark} />
    <View style={s.sideRight}>{right ?? null}</View>
  </View>
);

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  sideLeft: {
    alignItems: 'flex-start',
    flex: 1,
  },
  sideRight: {
    alignItems: 'flex-end',
    flex: 1,
  },
  center: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  logo: {
    borderRadius: 6,
    height: 28,
    marginRight: 8,
    width: 28,
  },
  nameEn: {
    color: Colors.textPrimary,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  sep: {
    color: Colors.textSecondary,
    fontSize: 17,
    fontWeight: '300',
  },
  nameAr: {
    color: Colors.textPrimary,
    fontSize: 17,
    fontWeight: '800',
  },
  textLight: {
    color: '#FFFFFF',
  },
  sepLight: {
    color: 'rgba(255,255,255,0.50)',
  },
});

export default CitizenBrandBar;
