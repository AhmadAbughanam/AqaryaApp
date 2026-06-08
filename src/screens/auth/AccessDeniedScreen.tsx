// Access denied screen shown when current role is not authorized for a screen.

import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {Colors} from '../../constants/colors';
import {useStrings} from '../../i18n';
import {useAuth} from '../../store/AuthContext';
import Button from '../../components/Button';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AccessDeniedScreenProps {
  message?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

const AccessDeniedScreen = ({message}: AccessDeniedScreenProps) => {
  const {signOut} = useAuth();
  const strings = useStrings();

  return (
    <View style={styles.screen}>
      {/* Decorative blobs */}
      <View style={styles.blobTopRight} />
      <View style={styles.blobBottomLeft} />

      <View style={styles.content}>
        {/* Icon */}
        <View style={styles.iconWrapper}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconEmoji}>🔒</Text>
          </View>
          {/* Decorative ring */}
          <View style={styles.iconRing} />
        </View>

        {/* Text */}
        <Text style={styles.title}>
          {strings.auth.accessDenied.title}
        </Text>
        <Text style={styles.message}>
          {message ?? strings.auth.accessDenied.message}
        </Text>

        {/* Dark info pill */}
        <View style={styles.infoPill}>
          <Text style={styles.infoPillText}>
            {strings.auth.accessDenied.adminNote}
          </Text>
        </View>

        {/* Action */}
        <Button
          label={strings.auth.accessDenied.signOutButton}
          onPress={() => void signOut()}
          variant="primary"
          size="lg"
          fullWidth
          style={styles.button}
        />
      </View>
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
    height: 320,
    opacity: 0.5,
    position: 'absolute',
    right: -80,
    top: -80,
    width: 320,
  },
  blobBottomLeft: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 200,
    bottom: -100,
    height: 280,
    left: -80,
    opacity: 0.4,
    position: 'absolute',
    width: 280,
  },

  // ── Content ───────────────────────────────────────────────────────────────
  content: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },

  // ── Icon ──────────────────────────────────────────────────────────────────
  iconWrapper: {
    alignItems: 'center',
    height: 100,
    justifyContent: 'center',
    marginBottom: 28,
    width: 100,
  },
  iconCircle: {
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 36,
    elevation: 6,
    height: 80,
    justifyContent: 'center',
    shadowColor: Colors.primaryDark,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.12,
    shadowRadius: 12,
    width: 80,
    zIndex: 1,
  },
  iconEmoji: {
    fontSize: 32,
  },
  iconRing: {
    borderColor: Colors.primaryLight,
    borderRadius: 50,
    borderWidth: 2,
    height: 100,
    position: 'absolute',
    width: 100,
  },

  // ── Text ──────────────────────────────────────────────────────────────────
  title: {
    color: Colors.textPrimary,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 0.2,
    marginBottom: 10,
    textAlign: 'center',
  },
  message: {
    color: Colors.textSecondary,
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 22,
    marginBottom: 24,
    textAlign: 'center',
  },

  // ── Info pill ─────────────────────────────────────────────────────────────
  infoPill: {
    backgroundColor: Colors.cardDark,
    borderRadius: 16,
    marginBottom: 32,
    paddingHorizontal: 20,
    paddingVertical: 14,
    width: '100%',
  },
  infoPillText: {
    color: Colors.textOnDarkMuted,
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 19,
    textAlign: 'center',
  },

  // ── Button ────────────────────────────────────────────────────────────────
  button: {
    width: '100%',
  },
});

export default AccessDeniedScreen;
