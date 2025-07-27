module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jestSetup.js'],
  moduleNameMapper: {
    '^react-native-dotenv$': '<rootDir>/__mocks__/react-native-dotenv.js',
  },
  transform: {
  '^.+\\.mjs$': 'babel-jest', // ← handles `.mjs` via Babel
  '^.+\\.[jt]sx?$': 'babel-jest', // default for JS/TS
},

  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?@?react-native|@react-navigation|@react-native|expo(nent)?|@expo(nent)?|react-navigation|@react-navigation|react-native-vector-icons|@react-native-community|expo-modules-core|expo-constants|expo-file-system|expo-font|expo-linking|expo-asset|@firebase/)/'
  ],
};








