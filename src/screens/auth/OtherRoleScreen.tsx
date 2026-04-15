// Landing screen for authenticated users whose role is neither citizen nor admin.
import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {useAuth} from '../../store/AuthContext';
import {useStrings} from '../../i18n';

const OtherRoleScreen = () => {
  const {role, signOut} = useAuth();
  const strings = useStrings();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{strings.otherRole.title}</Text>
      <Text style={styles.subtitle}>{strings.otherRole.roleLabel}: {role ?? strings.otherRole.unknown}</Text>
      <Text style={styles.note}>{strings.otherRole.note}</Text>

      <Pressable onPress={() => void signOut()} style={styles.button}>
        <Text style={styles.buttonText}>{strings.otherRole.signOut}</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  note: {
    color: '#5C5C5C',
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#1769E0',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default OtherRoleScreen;
