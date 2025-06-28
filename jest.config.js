module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jestSetup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?@?react-native|@react-navigation|@react-native|expo(nent)?|@expo(nent)?|react-navigation|@react-navigation|react-native-vector-icons|@react-native-community|expo-modules-core|expo-constants|expo-file-system|expo-font|expo-linking|expo-asset)/'
  ],
};





