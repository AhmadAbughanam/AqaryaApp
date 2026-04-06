// Metro configuration for React Native.
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * Custom Metro configuration.
 * Add resolver/transformer overrides here when needed.
 */
const config = {};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
