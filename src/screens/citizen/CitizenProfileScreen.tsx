// Citizen profile screen — messenger-style layout matching design reference.

import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ImageBackground,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import Button from '../../components/Button';
import CitizenBrandBar from '../../components/CitizenBrandBar';
import {getMyProfile, CitizenProfile} from '../../api/profile';
import {updatePreferences} from '../../api/savedListings';
import {getWalletBalance, WalletBalance} from '../../api/wallet';
import {CitizenTabParamList} from '../../navigation/CitizenTabNavigator';
import {CitizenProfileStackParamList} from '../../navigation/CitizenProfileStack';
import {useAuth} from '../../store/AuthContext';
import {useLanguage, useStrings, SupportedLanguage} from '../../i18n';
import {Colors} from '../../constants/colors';
import {AppImages} from '../../assets/images';
import { formatFraction } from '../../utils/formatters';

type Props = NativeStackScreenProps<CitizenProfileStackParamList, 'Profile'>;

const HERO_BG = AppImages.backgrounds.profileHero;
const SANAD_LOGO = AppImages.logos.sanad;
const PROFILE_PLACEHOLDER = AppImages.placeholders.profileAvatar;

const AVATAR_H = 90;
const HERO_H = 160;

// ─── Menu icons ───────────────────────────────────────────────────────────────

const IC = 20;
const SW = 1.8;

// Shield: rounded-top rectangle + downward-pointing triangle
const ShieldIcon = ({color}: {color: string}) => (
  <View style={{width: IC, height: IC, alignItems: 'center', justifyContent: 'center'}}>
    <View style={{
      width: 14, height: 10,
      borderTopLeftRadius: 7, borderTopRightRadius: 7,
      borderColor: color, borderWidth: SW, borderBottomWidth: 0,
    }} />
    <View style={{
      width: 0, height: 0,
      borderLeftWidth: 7, borderRightWidth: 7, borderTopWidth: 7,
      borderLeftColor: 'transparent', borderRightColor: 'transparent',
      borderTopColor: color,
      marginTop: -SW / 2,
    }} />
  </View>
);

// Person: head circle + shoulder arc
const PersonMenuIcon = ({color}: {color: string}) => (
  <View style={{width: IC, height: IC, alignItems: 'center', justifyContent: 'center', gap: 2}}>
    <View style={{
      width: 8, height: 8, borderRadius: 4,
      borderWidth: SW, borderColor: color,
    }} />
    <View style={{
      width: 14, height: 7,
      borderTopLeftRadius: 7, borderTopRightRadius: 7,
      borderWidth: SW, borderColor: color, borderBottomWidth: 0,
    }} />
  </View>
);

// Bookmark: rectangle body + V-notch at bottom
const BookmarkIcon = ({color}: {color: string}) => {
  const bw = 13, bh = 14;
  const half = bw / 2;
  return (
    <View style={{width: IC, height: IC, alignItems: 'center', justifyContent: 'center'}}>
      {/* Top + left + right borders */}
      <View style={{
        position: 'absolute', top: 2,
        width: bw, height: bh,
        borderTopWidth: SW, borderLeftWidth: SW, borderRightWidth: SW,
        borderTopLeftRadius: 2, borderTopRightRadius: 2,
        borderColor: color,
      }} />
      {/* Bottom-left diagonal (▶ mirrored) */}
      <View style={{
        position: 'absolute', bottom: 2, left: (IC - bw) / 2,
        width: 0, height: 0,
        borderTopWidth: 5, borderRightWidth: half,
        borderTopColor: color, borderRightColor: 'transparent',
      }} />
      {/* Bottom-right diagonal */}
      <View style={{
        position: 'absolute', bottom: 2, right: (IC - bw) / 2,
        width: 0, height: 0,
        borderTopWidth: 5, borderLeftWidth: half,
        borderTopColor: color, borderLeftColor: 'transparent',
      }} />
    </View>
  );
};

// Bell: dome + flat base + clapper dot
const BellIcon = ({color}: {color: string}) => (
  <View style={{width: IC, height: IC, alignItems: 'center', justifyContent: 'center'}}>
    {/* Dome */}
    <View style={{
      width: 14, height: 9,
      borderTopLeftRadius: 7, borderTopRightRadius: 7,
      borderWidth: SW, borderColor: color, borderBottomWidth: 0,
      marginBottom: 0,
    }} />
    {/* Base bar */}
    <View style={{width: 16, height: SW, backgroundColor: color, marginTop: -SW / 2}} />
    {/* Clapper */}
    <View style={{
      width: 4, height: 4, borderRadius: 2,
      borderWidth: SW, borderColor: color,
      marginTop: 1,
    }} />
  </View>
);

// Globe: circle + vertical line + horizontal line
const GlobeIcon = ({color}: {color: string}) => (
  <View style={{width: IC, height: IC, alignItems: 'center', justifyContent: 'center'}}>
    <View style={{
      width: 16, height: 16, borderRadius: 8,
      borderWidth: SW, borderColor: color,
      alignItems: 'center', justifyContent: 'center',
    }}>
      {/* Vertical line */}
      <View style={{position: 'absolute', width: SW, height: 16, backgroundColor: color}} />
      {/* Horizontal line */}
      <View style={{position: 'absolute', height: SW, width: 16, backgroundColor: color}} />
    </View>
  </View>
);

// Question mark in circle
const QuestionIcon = ({color}: {color: string}) => (
  <View style={{width: IC, height: IC, alignItems: 'center', justifyContent: 'center'}}>
    <View style={{
      width: 18, height: 18, borderRadius: 9,
      borderWidth: SW, borderColor: color,
      alignItems: 'center', justifyContent: 'center',
    }}>
      <Text style={{color, fontSize: 11, fontWeight: '700', lineHeight: 14}}>?</Text>
    </View>
  </View>
);

// Document: rectangle with three horizontal lines
const DocIcon = ({color}: {color: string}) => (
  <View style={{width: IC, height: IC, alignItems: 'center', justifyContent: 'center'}}>
    <View style={{
      width: 14, height: 17, borderWidth: SW,
      borderColor: color, borderRadius: 2,
      paddingTop: 3, paddingHorizontal: 3,
      gap: 3,
    }}>
      {[0, 1, 2].map(i => (
        <View key={i} style={{height: SW, backgroundColor: color, borderRadius: 1}} />
      ))}
    </View>
  </View>
);

// Wallet: rectangle body + top flap bar
const WalletMenuIcon = ({color}: {color: string}) => (
  <View style={{width: IC, height: IC, alignItems: 'center', justifyContent: 'center'}}>
    {/* Body */}
    <View style={{
      width: 15, height: 11,
      borderWidth: SW, borderColor: color,
      borderRadius: 2,
    }} />
    {/* Flap bar across top */}
    <View style={{
      position: 'absolute', top: 2,
      width: 15, height: SW,
      backgroundColor: color,
    }} />
    {/* Coin slot */}
    <View style={{
      position: 'absolute', right: 2, top: 5,
      width: 4, height: 4, borderRadius: 2,
      borderWidth: SW, borderColor: color,
    }} />
  </View>
);

// Power: open circle arc + vertical stem
const PowerIcon = ({color}: {color: string}) => (
  <View style={{width: IC, height: IC, alignItems: 'center', justifyContent: 'center'}}>
    {/* Circle arc — full circle minus a top gap, achieved by layering */}
    <View style={{
      width: 14, height: 14, borderRadius: 7,
      borderWidth: SW, borderColor: color,
      alignItems: 'center', justifyContent: 'center',
    }}>
      {/* White mask to break the top arc */}
      <View style={{
        position: 'absolute', top: -SW,
        width: 6, height: SW + 1,
        backgroundColor: Colors.white,
      }} />
    </View>
    {/* Vertical stem */}
    <View style={{
      position: 'absolute', top: 1,
      width: SW, height: 8,
      backgroundColor: color,
      borderRadius: SW,
    }} />
  </View>
);

// ─── Menu row ─────────────────────────────────────────────────────────────────

const MenuRow = ({
  iconNode,
  label,
  right,
  onPress,
  danger,
  hideDivider,
}: {
  iconNode: React.ReactNode;
  label: string;
  right?: string;
  onPress: () => void;
  danger?: boolean;
  hideDivider?: boolean;
}) => (
  <Pressable
    onPress={onPress}
    style={({pressed}) => [
      styles.menuRow,
      !hideDivider && styles.menuRowBorder,
      pressed && styles.menuRowPressed,
    ]}
    accessibilityRole="button"
    accessibilityLabel={label}>
    <View style={styles.menuIconWrap}>{iconNode}</View>
    <Text style={[styles.menuLabel, danger && styles.menuLabelDanger]}>{label}</Text>
    {right ? <Text style={styles.menuRight}>{right}</Text> : null}
    {!danger ? <Text style={styles.menuChevron}>›</Text> : null}
  </Pressable>
);

// ─── Main screen ──────────────────────────────────────────────────────────────

const CitizenProfileScreen = ({navigation}: Props) => {
  const tabNav = navigation.getParent<BottomTabNavigationProp<CitizenTabParamList>>();
  const {signOut} = useAuth();
  const {language, setLanguage} = useLanguage();
  const strings = useStrings();

  const [profile, setProfile] = useState<CitizenProfile | null>(null);
  const [walletBalance, setWalletBalance] = useState<WalletBalance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [_isSavingPrefs, setIsSavingPrefs] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      const [response, bal] = await Promise.all([
        getMyProfile(),
        getWalletBalance().catch(() => null),
      ]);
      setProfile(response);
      setWalletBalance(bal);
      setNotificationsEnabled(response.preference.notificationsEnabled);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Unable to load profile.',
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const onToggleNotifications = async (value: boolean) => {
    setNotificationsEnabled(value);
    setIsSavingPrefs(true);
    try {
      await updatePreferences({notificationsEnabled: value});
    } catch {
      setNotificationsEnabled(!value);
      Alert.alert(strings.profile.errorLabel, strings.profile.notifError);
    } finally {
      setIsSavingPrefs(false);
    }
  };

  const onChangeLanguage = async (lang: SupportedLanguage) => {
    setLanguage(lang);
    try {
      await updatePreferences({language: lang});
    } catch {
      // Non-critical — local preference persists via AsyncStorage.
    }
  };

  const onLogOut = () => {
    Alert.alert(strings.profile.logOutTitle, strings.profile.logOutMessage, [
      {text: strings.common.cancel, style: 'cancel'},
      {text: strings.profile.menuLogOut, style: 'destructive', onPress: () => void signOut()},
    ]);
  };

  if (isLoading) {
    return (
      <View style={styles.centeredState}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>{strings.profile.loadingText}</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.centeredState}>
        <Text style={styles.errorTitle}>{strings.profile.unavailableTitle}</Text>
        <Text style={styles.errorMessage}>
          {errorMessage ?? strings.profile.unavailableMessage}
        </Text>
        <Button
          label={strings.profile.signOut}
          onPress={() => void signOut()}
          variant="secondary"
          size="sm"
          style={styles.errorSignOut}
        />
      </View>
    );
  }

  const langLabel = language === 'ar' ? 'العربية' : 'English';
  const notifLabel = notificationsEnabled ? strings.profile.notifOn : strings.profile.notifOff;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={() => {
            setIsRefreshing(true);
            void loadProfile();
          }}
          tintColor={Colors.primary}
          colors={[Colors.primary]}
        />
      }>

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <View style={styles.topBar}>
        <CitizenBrandBar />
      </View>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <View style={styles.heroWrap}>
        <ImageBackground
          source={HERO_BG}
          style={styles.heroBg}
          imageStyle={styles.heroBgImg}
          resizeMode="cover">
          {/* White fade overlay at the bottom */}
          <View style={styles.heroFade} />
        </ImageBackground>

        {/* Avatar overlapping hero bottom */}
        <View style={styles.avatarOuter}>
          <Image
            source={PROFILE_PLACEHOLDER}
            style={styles.avatarInner}
            resizeMode="cover"
          />
        </View>
      </View>

      {/* ── Identity + Stats (single attached card) ─────────────────────── */}
      <View style={styles.profileCard}>
        <View style={styles.identity}>
          <Text style={styles.idName}>{profile.user.username}</Text>
          <View style={styles.idPhoneRow}>
            <Text style={styles.idPhone}>@{profile.user.username.toLowerCase()}</Text>
            <View style={styles.idCheck}>
              <Text style={styles.idCheckText}>✓</Text>
            </View>
          </View>
          <View style={styles.sanadBadge}>
            <Image source={SANAD_LOGO} style={styles.sanadLogo} resizeMode="contain" />
            <Text style={styles.sanadText}>{strings.profile.sanadVerified}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <Pressable
            style={styles.statItem}
            onPress={() => tabNav?.navigate('PropertiesTab', {screen: 'MyProperties'})}
            accessibilityRole="button"
            accessibilityLabel={strings.profile.statSaved}>
            <Text style={styles.statIcon}>♡</Text>
            <Text style={styles.statValue}>{profile.aggregates.savedCount}</Text>
            <Text style={styles.statLabel}>{strings.profile.statSaved}</Text>
          </Pressable>

          <View style={styles.statDivider} />

          <Pressable
            style={styles.statItem}
            onPress={() => tabNav?.navigate('PropertiesTab', {screen: 'MyProperties'})}
            accessibilityRole="button"
            accessibilityLabel={strings.profile.statMyProperties}>
            <Text style={styles.statIcon}>⌂</Text>
            <Text style={styles.statValue}>{profile.aggregates.ownedPropertyCount}</Text>
            <Text style={styles.statLabel}>{strings.profile.statMyProperties}</Text>
          </Pressable>

          <View style={styles.statDivider} />

          <Pressable
            style={styles.statItem}
            onPress={() => tabNav?.navigate('PropertiesTab', {screen: 'MyProperties'})}
            accessibilityRole="button"
            accessibilityLabel={strings.profile.statListings}>
            <Text style={styles.statIcon}>☰</Text>
            <Text style={styles.statValue}>{profile.aggregates.listedForSaleCount}</Text>
            <Text style={styles.statLabel}>{strings.profile.statListings}</Text>
          </Pressable>
        </View>
      </View>

      {/* ── Menu card ───────────────────────────────────────────────────── */}
      <View style={styles.menuCard}>
        <MenuRow
          iconNode={<ShieldIcon color={Colors.textPrimary} />}
          label={strings.profile.menuVerification}
          onPress={() =>
            Alert.alert(
              strings.profile.verificationStatusTitle,
              `Property: ${profile.aggregates.ownedPropertyCount > 0 ? strings.profile.propertyVerified : strings.profile.propertyPending}\nIdentity: ${strings.profile.identityVerified}`,
            )
          }
          hideDivider
        />
        <MenuRow
          iconNode={<PersonMenuIcon color={Colors.textPrimary} />}
          label={strings.profile.menuManageAccount}
          onPress={() =>
            Alert.alert(strings.profile.manageAccountTitle, strings.profile.manageAccountComingSoon)
          }
        />
        <MenuRow
          iconNode={<WalletMenuIcon color={Colors.textPrimary} />}
          label={strings.profile.menuWallet}
          right={walletBalance != null
            ? `JOD ${formatFraction(walletBalance.availableBalance)}`
            : undefined}
          onPress={() => navigation.navigate('Wallet')}
        />
        <MenuRow
          iconNode={<BookmarkIcon color={Colors.textPrimary} />}
          label={strings.profile.menuSavedAndSearches}
          onPress={() =>
            tabNav?.navigate('PropertiesTab', {screen: 'MyProperties'})
          }
        />
        <MenuRow
          iconNode={<BellIcon color={Colors.textPrimary} />}
          label={strings.profile.menuNotifications}
          right={notifLabel}
          onPress={() => void onToggleNotifications(!notificationsEnabled)}
        />
        <MenuRow
          iconNode={<GlobeIcon color={Colors.textPrimary} />}
          label={strings.profile.languageLabel}
          right={langLabel}
          onPress={() =>
            void onChangeLanguage(language === 'ar' ? 'en' : 'ar')
          }
        />
        <MenuRow
          iconNode={<QuestionIcon color={Colors.textPrimary} />}
          label={strings.profile.helpButton}
          onPress={() => tabNav?.navigate('PropertiesTab', {screen: 'Help'})}
        />
        <MenuRow
          iconNode={<DocIcon color={Colors.textPrimary} />}
          label={strings.profile.menuTerms}
          onPress={() =>
            Alert.alert(strings.profile.termsTitle, strings.profile.termsMessage)
          }
        />

        {/* Separator before logout */}
        <View style={styles.menuSeparator} />

        <MenuRow
          iconNode={<PowerIcon color="#C0392B" />}
          label={strings.profile.menuLogOut}
          onPress={onLogOut}
          danger
          hideDivider
        />
      </View>

      <View style={styles.bottomPad} />
    </ScrollView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    backgroundColor: Colors.backgroundPrimary,
    flex: 1,
  },
  content: {
    paddingBottom: 0,
  },

  // ── Top bar ───────────────────────────────────────────────────────────────
  topBar: {
    backgroundColor: Colors.white,
    borderBottomColor: Colors.border,
    borderBottomWidth: 1,
    paddingBottom: 14,
    paddingHorizontal: 20,
    paddingTop: 16,
  },

  // ── Hero ──────────────────────────────────────────────────────────────────
  heroWrap: {
    height: HERO_H + AVATAR_H / 2,
    position: 'relative',
  },
  heroBg: {
    height: HERO_H,
    overflow: 'hidden',
    width: '100%',
  },
  heroBgImg: {
    opacity: 0.65,
  },
  heroFade: {
    bottom: 0,
    height: 70,
    left: 0,
    position: 'absolute',
    right: 0,
    // Simulated white gradient via background
    backgroundColor: 'transparent',
    // React Native doesn't support gradients natively without a library.
    // Use a semi-transparent white overlay instead:
    // backgroundColor: 'rgba(245,247,246,0.6)',
  },
  avatarOuter: {
    alignSelf: 'center',
    backgroundColor: Colors.white,
    borderRadius: (AVATAR_H + 8) / 2,
    bottom: 0,
    height: AVATAR_H + 8,
    position: 'absolute',
    width: AVATAR_H + 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInner: {
    alignItems: 'center',
    backgroundColor: Colors.primaryDark,
    borderRadius: AVATAR_H / 2,
    height: AVATAR_H,
    justifyContent: 'center',
    width: AVATAR_H,
  },

  // ── Identity ──────────────────────────────────────────────────────────────
  identity: {
    alignItems: 'center',
    gap: 6,
    paddingBottom: 16,
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  idName: {
    color: Colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  idPhoneRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  idPhone: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  idCheck: {
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    height: 20,
    justifyContent: 'center',
    width: 20,
  },
  idCheckText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '800',
  },
  sanadBadge: {
    alignItems: 'center',
    backgroundColor: Colors.backgroundMuted,
    borderRadius: 100,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  sanadLogo: {
    height: 16,
    width: 40,
  },
  sanadText: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  // ── Profile card (identity + stats merged) ───────────────────────────────
  profileCard: {
    backgroundColor: Colors.white,
    borderColor: Colors.border,
    borderRadius: 20,
    borderWidth: 1,
    marginHorizontal: 20,
    overflow: 'hidden',
  },
  statsRow: {
    borderTopColor: Colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
    gap: 4,
    paddingVertical: 18,
  },
  statDivider: {
    backgroundColor: Colors.border,
    width: 1,
  },
  statIcon: {
    color: Colors.primary,
    fontSize: 18,
  },
  statValue: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
  },
  statLabel: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
    textAlign: 'center',
  },

  // ── Menu card ─────────────────────────────────────────────────────────────
  menuCard: {
    backgroundColor: Colors.white,
    borderColor: Colors.border,
    borderRadius: 20,
    borderWidth: 1,
    marginHorizontal: 20,
    marginTop: 16,
    overflow: 'hidden',
  },
  menuRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  menuRowBorder: {
    borderTopColor: Colors.border,
    borderTopWidth: 1,
  },
  menuRowPressed: {
    backgroundColor: Colors.backgroundMuted,
  },
  menuIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 26,
  },
  menuLabel: {
    color: Colors.textPrimary,
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  menuLabelDanger: {
    color: '#C0392B',
    fontWeight: '600',
  },
  menuRight: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
    marginRight: 4,
  },
  menuChevron: {
    color: Colors.textMuted,
    fontSize: 20,
    fontWeight: '300',
  },
  menuSeparator: {
    backgroundColor: Colors.backgroundMuted,
    height: 6,
  },

  // ── Error / loading ───────────────────────────────────────────────────────
  centeredState: {
    alignItems: 'center',
    backgroundColor: Colors.backgroundPrimary,
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    color: Colors.textSecondary,
    marginTop: 12,
  },
  errorTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  errorMessage: {
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  errorSignOut: {
    marginTop: 24,
  },
  bottomPad: {
    height: 20,
  },

});

export default CitizenProfileScreen;
