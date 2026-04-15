import React, {useEffect, useState} from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {login} from '../../api/auth';
import {useAuth} from '../../store/AuthContext';
import {useStrings, useLanguage} from '../../i18n';
import {AppImages} from '../../assets/images';

const REMEMBERED_USERNAME_KEY = '@aqarya/remembered_username';

const LoginScreen = () => {
  const {signIn} = useAuth();
  const strings = useStrings();
  const {language, setLanguage} = useLanguage();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const l = strings.auth.login;

  // Restore remembered username on mount
  useEffect(() => {
    AsyncStorage.getItem(REMEMBERED_USERNAME_KEY)
      .then(saved => {
        if (saved) {
          setUsername(saved);
          setRememberMe(true);
        }
      })
      .catch(() => {});
  }, []);

  const onSignUp = () => {
    Alert.alert(l.signUpAlertTitle, l.signUpAlertMsg, [{text: l.signUpAlertOk}]);
  };

  const onSanadLogin = () => {
    Alert.alert(l.sanadAlertTitle, l.sanadAlertMsg, [{text: l.sanadAlertOk}]);
  };

  const onForgotPassword = () => {
    Alert.alert(
      l.forgotPasswordAlertTitle,
      l.forgotPasswordAlertMsg,
      [{text: l.forgotPasswordAlertOk}],
    );
  };

  const validateFields = (): boolean => {
    let valid = true;
    if (!username.trim()) {
      setUsernameError(l.usernameRequired);
      valid = false;
    } else {
      setUsernameError(null);
    }
    if (!password.trim()) {
      setPasswordError(l.passwordRequired);
      valid = false;
    } else {
      setPasswordError(null);
    }
    return valid;
  };

  const onSubmit = async () => {
    if (!validateFields()) {
      return;
    }
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const result = await login({
        username: username.trim(),
        password: password.trim(),
      });
      if (rememberMe) {
        await AsyncStorage.setItem(REMEMBERED_USERNAME_KEY, username.trim());
      } else {
        await AsyncStorage.removeItem(REMEMBERED_USERNAME_KEY);
      }
      await signIn(result.token, result.role);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : strings.auth.errors.invalidCredentials,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.screen}>
      {/* Jordan map — bottom-right watermark, intentionally placed */}
      <Image
        source={AppImages.backgrounds.jordanMap}
        style={styles.bgImage}
        resizeMode="cover"
        accessibilityElementsHidden
        importantForAccessibility="no"
      />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>

          {/* ── Language toggle — anchored top-right in layout flow ── */}
          <View style={styles.langRow}>
            <Pressable
              onPress={() => setLanguage('en')}
              style={[styles.langPill, language === 'en' && styles.langPillActive]}
              accessibilityRole="button"
              accessibilityLabel="Switch to English">
              <Text style={[styles.langPillText, language === 'en' && styles.langPillTextActive]}>
                EN
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setLanguage('ar')}
              style={[styles.langPill, language === 'ar' && styles.langPillActive]}
              accessibilityRole="button"
              accessibilityLabel="Switch to Arabic">
              <Text style={[styles.langPillText, language === 'ar' && styles.langPillTextActive]}>
                AR
              </Text>
            </Pressable>
          </View>

          {/* ── Wordmark — black text, no image box ── */}
          <View style={styles.logoRow}>
            <Text style={styles.wordmark}>Aqarya  |  عقاريا</Text>
          </View>

          {/* ── Orientation line for first-time users ── */}
          <Text style={styles.orientationLine}>{l.orientationLine}</Text>

          {/* ── Login card ── */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{l.title}</Text>
            <Text style={styles.cardSubtitle}>{l.subtitle}</Text>

            {/* Username field */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{l.usernameLabel}</Text>
              <View style={[
                styles.inputBox,
                usernameError ? styles.inputBoxError : null,
              ]}>
                <TextInput
                  style={styles.input}
                  placeholder={l.usernamePlaceholder}
                  placeholderTextColor="#AEAEAE"
                  value={username}
                  onChangeText={text => {
                    setUsername(text);
                    if (usernameError) {
                      setUsernameError(text.trim() ? null : l.usernameRequired);
                    }
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isSubmitting}
                  keyboardType="default"
                  selectionColor="#1A1A1A"
                />
              </View>
              {usernameError ? (
                <Text style={styles.fieldError}>{usernameError}</Text>
              ) : null}
            </View>

            {/* Password field */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{l.passwordLabel}</Text>
              <View style={[
                styles.inputBox,
                passwordError ? styles.inputBoxError : null,
              ]}>
                <TextInput
                  style={styles.input}
                  placeholder={l.passwordPlaceholder}
                  placeholderTextColor="#AEAEAE"
                  value={password}
                  onChangeText={text => {
                    setPassword(text);
                    if (passwordError) {
                      setPasswordError(text.trim() ? null : l.passwordRequired);
                    }
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isSubmitting}
                  secureTextEntry={!showPassword}
                  selectionColor="#1A1A1A"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(v => !v)}
                  style={styles.eyeButton}
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}>
                  <Text style={styles.eyeIcon}>{showPassword ? '◉' : '◎'}</Text>
                </TouchableOpacity>
              </View>
              {passwordError ? (
                <Text style={styles.fieldError}>{passwordError}</Text>
              ) : null}
            </View>

            {/* Remember me + Forgot password */}
            <View style={styles.rememberForgotRow}>
              <Pressable
                onPress={() => setRememberMe(v => !v)}
                style={styles.rememberRow}
                accessibilityRole="checkbox"
                accessibilityState={{checked: rememberMe}}
                accessibilityLabel={l.rememberMe}>
                <View style={[styles.checkBox, rememberMe && styles.checkBoxChecked]}>
                  {rememberMe ? <Text style={styles.checkMark}>✓</Text> : null}
                </View>
                <Text style={styles.rememberText}>{l.rememberMe}</Text>
              </Pressable>
              <Pressable
                onPress={onForgotPassword}
                accessibilityRole="button"
                accessibilityLabel={l.forgotPassword}>
                <Text style={styles.forgotText}>{l.forgotPassword}</Text>
              </Pressable>
            </View>

            {/* Error banner */}
            {errorMessage ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* Log in button */}
            <TouchableOpacity
              style={[styles.loginButton, isSubmitting && styles.loginButtonDisabled]}
              onPress={() => void onSubmit()}
              disabled={isSubmitting}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={l.submitButton}>
              <Text style={styles.loginButtonText}>
                {isSubmitting ? l.signingIn : l.submitButton}
              </Text>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>{l.or}</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* SANAD tagline */}
            <Text style={styles.sanadTaglineText}>{l.sanadTagline}</Text>

            {/* SANAD button — label left, logo right */}
            <Pressable
              onPress={onSanadLogin}
              style={({pressed}) => [
                styles.sanadButton,
                pressed && styles.sanadButtonPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={l.sanadButton}>
              <Text style={styles.sanadText}>{l.sanadButton}</Text>
              <Image
                source={AppImages.logos.sanad}
                style={styles.sanadLogo}
                resizeMode="contain"
              />
            </Pressable>

            {/* Sign-up row */}
            <View style={styles.signUpRow}>
              <Text style={styles.signUpPrompt}>{l.signUpPrompt}</Text>
              <Pressable
                onPress={onSignUp}
                accessibilityRole="link"
                accessibilityLabel={l.signUpLink}>
                <Text style={styles.signUpLink}>{l.signUpLink}</Text>
              </Pressable>
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#EDEDEB',
    flex: 1,
    overflow: 'hidden',
  },

  // ── Background map — bottom-left ─────────────────────────────────────────
  bgImage: {
    bottom: 0,
    height: 650,
    left: -25,
    opacity: 0.75,
    position: 'absolute',
    transform: [{rotate: '-5deg'}],
    width: 460,
  },

  // ── Layout ────────────────────────────────────────────────────────────────
  keyboardView: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 40,
    paddingTop: 16,
    paddingBottom: 16,
  },

  // ── Language toggle — in-flow, right-aligned ──────────────────────────────
  langRow: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  langPill: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.80)',
    borderColor: 'rgba(0,0,0,0.10)',
    borderRadius: 100,
    borderWidth: 1,
    justifyContent: 'center',
    minWidth: 44,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  langPillActive: {
    backgroundColor: '#1A1A1A',
    borderColor: '#1A1A1A',
  },
  langPillText: {
    color: '#1A1A1A',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  langPillTextActive: {
    color: '#FFFFFF',
  },

  // ── Wordmark — pure black text, no image box ──────────────────────────────
  logoRow: {
    alignItems: 'center',
    marginBottom: 6,
  },
  wordmark: {
    color: '#1A1A1A',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 0.2,
    textAlign: 'center',
  },

  // ── First-time orientation line ───────────────────────────────────────────
  orientationLine: {
    color: '#6A6A6A',
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 0.1,
    lineHeight: 18,
    marginBottom: 8,
    paddingHorizontal: 4,
    textAlign: 'center',
  },

  // ── Card ──────────────────────────────────────────────────────────────────
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    elevation: 6,
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 20,
    shadowColor: '#000000',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.07,
    shadowRadius: 20,
  },
  cardTitle: {
    color: '#1A1A1A',
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 6,
    textAlign: 'center',
  },
  cardSubtitle: {
    color: '#8A8A8A',
    fontSize: 14,
    fontWeight: '400',
    marginBottom: 16,
    textAlign: 'center',
  },

  // ── Form fields ───────────────────────────────────────────────────────────
  fieldGroup: {
    marginBottom: 12,
  },
  fieldLabel: {
    color: '#1A1A1A',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputBox: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E0E0DC',
    borderRadius: 12,
    borderWidth: 1.5,
    flexDirection: 'row',
    height: 54,
    paddingHorizontal: 16,
  },
  inputBoxError: {
    borderColor: '#C0544A',
  },
  input: {
    color: '#1A1A1A',
    flex: 1,
    fontSize: 15,
    fontWeight: '400',
    padding: 0,
  },
  eyeButton: {
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  eyeIcon: {
    color: '#3A3A3A',
    fontSize: 18,
  },
  fieldError: {
    color: '#C0544A',
    fontSize: 12,
    marginTop: 5,
  },

  // ── Remember me + Forgot password ─────────────────────────────────────────
  rememberForgotRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
    marginTop: -4,
  },
  rememberRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  checkBox: {
    alignItems: 'center',
    borderColor: '#CCCCCC',
    borderRadius: 4,
    borderWidth: 1.5,
    height: 18,
    justifyContent: 'center',
    width: 18,
  },
  checkBoxChecked: {
    backgroundColor: '#1A1A1A',
    borderColor: '#1A1A1A',
  },
  checkMark: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 14,
  },
  rememberText: {
    color: '#5A5A5A',
    fontSize: 13,
  },
  forgotText: {
    color: '#1A1A1A',
    fontSize: 13,
    fontWeight: '600',
  },

  // ── Error banner ──────────────────────────────────────────────────────────
  errorBanner: {
    backgroundColor: '#FAE8E6',
    borderRadius: 10,
    marginBottom: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  errorBannerText: {
    color: '#C0544A',
    fontSize: 13,
    fontWeight: '500',
  },

  // ── Log in button ─────────────────────────────────────────────────────────
  loginButton: {
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 14,
    height: 54,
    justifyContent: 'center',
    marginTop: 4,
  },
  loginButtonDisabled: {
    opacity: 0.55,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.1,
  },

  // ── Divider ───────────────────────────────────────────────────────────────
  dividerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    marginVertical: 20,
  },
  dividerLine: {
    backgroundColor: '#E8E8E4',
    flex: 1,
    height: 1,
  },
  dividerText: {
    color: '#AEAEAE',
    fontSize: 13,
    fontWeight: '400',
  },

  // ── SANAD tagline ─────────────────────────────────────────────────────────
  sanadTaglineText: {
    color: '#6A6A6A',
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 0.1,
    marginBottom: 10,
    textAlign: 'center',
  },

  // ── SANAD button — label left, logo right ────────────────────────────────
  sanadButton: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E0E0DC',
    borderRadius: 14,
    borderWidth: 1.5,
    flexDirection: 'row',
    height: 54,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  sanadButtonPressed: {
    backgroundColor: '#F5F5F3',
  },
  sanadLogo: {
    height: 26,
    width: 86,
  },
  sanadText: {
    color: '#1A1A1A',
    fontSize: 15,
    fontWeight: '600',
  },

  // ── Sign-up row ───────────────────────────────────────────────────────────
  signUpRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 22,
  },
  signUpPrompt: {
    color: '#8A8A8A',
    fontSize: 13,
  },
  signUpLink: {
    color: '#1A1A1A',
    fontSize: 13,
    fontWeight: '700',
  },
});

export default LoginScreen;
