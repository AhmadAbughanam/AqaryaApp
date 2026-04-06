// Login screen for username/password auth and token persistence through global auth context.

import React, {useState} from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {login} from '../../api/auth';
import {useAuth} from '../../store/AuthContext';
import {Colors} from '../../constants/colors';
import {Strings} from '../../constants/strings';
import Input from '../../components/Input';
import Button from '../../components/Button';
import BrandLogo from '../../components/BrandLogo';

const LoginScreen = () => {
  const {signIn} = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async () => {
    if (!username.trim() || !password.trim()) {
      setErrorMessage('Username and password are required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const result = await login({
        username: username.trim(),
        password: password.trim(),
      });
      await signIn(result.token, result.role);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : Strings.auth.errors.invalidCredentials,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.screen}>
      {/* Decorative blobs */}
      <View style={styles.blobTopRight} />
      <View style={styles.blobBottomLeft} />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>

          <View style={styles.logoSection}>
            <View style={styles.logoWrapper}>
              <BrandLogo size={96} cornerRatio={0.24} />
            </View>
            <Text style={styles.brandName}>{Strings.app.name}</Text>
            <Text style={styles.brandTagline}>{Strings.app.tagline}</Text>
          </View>

          {/* ── Card ── */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{Strings.auth.login.title}</Text>
            <Text style={styles.cardSubtitle}>
              {Strings.auth.login.subtitle}
            </Text>

            {/* Username */}
            <Input
              label={Strings.auth.login.emailLabel}
              placeholder={Strings.auth.login.emailPlaceholder}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isSubmitting}
              keyboardType="email-address"
              containerStyle={styles.inputSpacing}
              leftIcon={<Text style={styles.inputIcon}>✉</Text>}
            />

            {/* Password */}
            <Input
              label={Strings.auth.login.passwordLabel}
              placeholder={Strings.auth.login.passwordPlaceholder}
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isSubmitting}
              secureTextEntry={!showPassword}
              containerStyle={styles.inputSpacing}
              leftIcon={<Text style={styles.inputIcon}>🔒</Text>}
              rightIcon={
                <Text
                  style={styles.showHideText}
                  onPress={() => setShowPassword(v => !v)}>
                  {showPassword ? 'Hide' : 'Show'}
                </Text>
              }
            />

            {/* Error message */}
            {errorMessage ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorIcon}>⚠</Text>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* Submit */}
            <Button
              label={
                isSubmitting
                  ? Strings.auth.login.signingIn
                  : Strings.auth.login.submitButton
              }
              onPress={onSubmit}
              variant="primary"
              size="lg"
              loading={isSubmitting}
              disabled={isSubmitting}
              fullWidth
              style={styles.submitButton}
            />
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    backgroundColor: Colors.backgroundPrimary,
    flex: 1,
    overflow: 'hidden',
  },

  // ── Decorative blobs ──────────────────────────────────────────────────────
  blobTopRight: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 200,
    height: 340,
    opacity: 0.5,
    position: 'absolute',
    right: -100,
    top: -100,
    width: 340,
  },
  blobBottomLeft: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 200,
    bottom: -120,
    height: 300,
    left: -100,
    opacity: 0.4,
    position: 'absolute',
    width: 300,
  },

  // ── Layout ────────────────────────────────────────────────────────────────
  keyboardView: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },

  // ── Logo section ──────────────────────────────────────────────────────────
  logoSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  brandName: {
    color: Colors.textPrimary,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  brandTagline: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '400',
    letterSpacing: 0.2,
  },

  // ── Card ──────────────────────────────────────────────────────────────────
  card: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 28,
    elevation: 8,
    paddingHorizontal: 24,
    paddingVertical: 28,
    shadowColor: Colors.shadowColorDark,
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.1,
    shadowRadius: 24,
  },
  cardTitle: {
    color: Colors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 0.1,
    marginBottom: 4,
  },
  cardSubtitle: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '400',
    marginBottom: 24,
  },

  // ── Inputs ────────────────────────────────────────────────────────────────
  inputSpacing: {
    marginBottom: 16,
  },
  inputIcon: {
    fontSize: 16,
  },
  showHideText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },

  // ── Error ─────────────────────────────────────────────────────────────────
  errorContainer: {
    alignItems: 'center',
    backgroundColor: Colors.errorLight,
    borderRadius: 12,
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  errorIcon: {
    color: Colors.error,
    fontSize: 14,
  },
  errorText: {
    color: Colors.error,
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },

  // ── Submit ────────────────────────────────────────────────────────────────
  submitButton: {
    marginTop: 8,
  },
});

export default LoginScreen;
