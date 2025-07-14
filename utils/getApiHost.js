import Constants from 'expo-constants';

export function getApiHost() {
  // Only do this in development
  if (__DEV__) {
    let debuggerHost = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost;
    if (debuggerHost) {
      let ip = debuggerHost.split(':')[0];
      // Use your backend port, e.g., 3000
      return `http://${ip}:3000`;
    }
  }
  // Fallback for production
  return 'https://your-production-api.com';
} 