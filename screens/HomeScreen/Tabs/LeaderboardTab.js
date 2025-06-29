// screens/HomeScreen/Tabs/LeaderboardTab.js

import React from 'react';
import { Platform, StatusBar, StyleSheet, View } from 'react-native';
import LeaderboardScreen from '../../LeaderboardScreen/Leaderboard';

export default function LeaderboardTab() {
  return (
    <View style={styles.container}>
      <LeaderboardScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // push content down below the header + floating icon
    paddingTop: (Platform.OS === 'android'
      ? StatusBar.currentHeight
      : 0
    ) + 60,
  },
});