// Landing screen for authenticated users whose role is neither citizen nor admin.
import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {useAuth} from '../../store/AuthContext';

const OtherRoleScreen = () => {
  const {role, signOut} = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Authenticated</Text>
      <Text style={styles.subtitle}>Role: {role ?? 'unknown'}</Text>
      <Text style={styles.note}>
        This account is signed in, but no dedicated app stack is assigned yet.
      </Text>

      <Pressable onPress={() => void signOut()} style={styles.button}>
        <Text style={styles.buttonText}>Sign Out</Text>
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
