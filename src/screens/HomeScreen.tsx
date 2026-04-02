// Simple home screen placeholder for choosing the initial app flow.
import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

const HomeScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>AqaryaApp Home</Text>
      <Text style={styles.subtitle}>Use role-based login to continue.</Text>
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
    color: '#555555',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default HomeScreen;
