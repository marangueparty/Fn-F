// screens/AchievementsScreen/AchievementsScreen.js

import {
    SERVER_HOST_ANDROID,
    SERVER_HOST_DEVICE,
    SERVER_HOST_IOS,
} from '@env';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from 'react';
import {
    Dimensions,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { width: SCREEN_W } = Dimensions.get('window');
// helper: absolute threshold for level n
const thresholdForLevel = n => ((n * (n - 1)) / 2) * 60;

// fix: numeric literal instead of `forty`
const CIRCLE_SIZE = 40;  

const HOST =
  Platform.OS === 'android'
    ? SERVER_HOST_ANDROID
    : Platform.OS === 'ios'
    ? SERVER_HOST_IOS
    : SERVER_HOST_DEVICE;

const ACH_LIST = [
  {
    id: 'first_session',
    title: 'First Steps',
    description: 'Complete your first study session',
    icon: 'flag-checkered',
  },
  {
    id: 'focus_10h',
    title: '10 Hours Focus',
    description: 'Accumulate 600 min of focus',
    icon: 'clock-check-outline',
  },
  {
    id: 'streak_3',
    title: '3-Day Streak',
    description: 'Study at least once per day for 3 days',
    icon: 'calendar-star',
  },
];

export default function AchievementsScreen() {
  const [stats, setStats] = useState({
    totalFocus: 0,
    currentLevel: 1,
    nextLevel: 2,
    minutesToNext: 0,
    minutesForNext: 60,
    penalties: 0,
  });
  const [unlocked, setUnlocked] = useState({});

  useEffect(() => {
    (async () => {
      try {
        const token = await SecureStore.getItemAsync('userToken');

        // 1) stats
        const s = await fetch(`${HOST}/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const sj = await s.json();
        if (sj.success) {
          setStats({
            totalFocus:     sj.totalFocus,
            currentLevel:   sj.currentLevel,
            nextLevel:      sj.nextLevel,
            minutesToNext:  sj.minutesToNext,
            minutesForNext: sj.minutesForNext,
            penalties:      sj.penalties,
          });
        }

        // 2) achievements
        const a = await fetch(`${HOST}/achievements`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const aj = await a.json();
        if (aj.success && Array.isArray(aj.achievements)) {
          const map = {};
          aj.achievements.forEach(ac => { map[ac.id] = true });
          setUnlocked(map);
        }
      } catch (e) {
        console.warn(e);
      }
    })();
  }, []);

  const {
    currentLevel,
    nextLevel,
    minutesToNext,
    minutesForNext,
    penalties,
  } = stats;

  const penaltyColor =
    penalties >= 15 ? '#EB5757' :
    penalties >=  7 ? '#F2C94C' :
                      '#27AE60';

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Level bar */}
      <Text style={styles.header}>Focus Progress</Text>
      <View style={styles.levelBarWrapper}>
        <View style={styles.levelRow}>
          <View style={styles.levelCircle}>
            <Text style={styles.levelText}>{currentLevel}</Text>
          </View>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  flex:
                    (minutesForNext - minutesToNext) /
                    minutesForNext,
                },
              ]}
            />
          </View>
          <View style={styles.levelCircle}>
            <Text style={styles.levelText}>{nextLevel}</Text>
          </View>
        </View>
        <Text style={styles.progressLabel}>
          {minutesForNext - minutesToNext} / {minutesForNext} min to next level
        </Text>
      </View>

      {/* Penalties */}
      <Text style={styles.subheader}>Penalties Given</Text>
      <Text style={[styles.penaltyCount, { color: penaltyColor }]}>
        {penalties}
      </Text>

      {/* Achievements */}
      <Text style={styles.header}>Achievements</Text>
      <View style={styles.grid}>
        {ACH_LIST.map(a => {
          const done = !!unlocked[a.id];
          return (
            <View key={a.id} style={styles.card}>
              <Icon
                name={a.icon}
                size={48}
                color={done ? '#9B5DEB' : '#CCC'}
                style={styles.icon}
              />
              <Text style={[styles.title, done ? {} : styles.lockedText]}>
                {a.title}
              </Text>
              <Text style={[styles.desc,  done ? {} : styles.lockedText]}>
                {a.description}
              </Text>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop:  Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 10,
    paddingBottom: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 24,
    fontWeight: '600',
    marginVertical: 12,
  },
  levelBarWrapper: {
    width: '100%',
    marginBottom: 24,
    alignItems: 'center',
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  levelCircle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    backgroundColor: '#D3B5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelText: { fontWeight: '600', fontSize: 18 },
  progressTrack: {
    flex: 1,
    height: CIRCLE_SIZE * 0.6,
    backgroundColor: '#EDE7F6',
    marginHorizontal: 8,
    borderRadius: CIRCLE_SIZE * 0.3,
    overflow: 'hidden',
  },
  progressFill: {
    backgroundColor: '#9B5DEB',
  },
  progressLabel: {
    marginTop: 8,
    fontSize: 14,
    color: '#555',
  },
  subheader: {
    fontSize: 20,
    fontWeight: '500',
    marginTop: 16,
  },
  penaltyCount: {
    fontSize: 32,
    fontWeight: '700',
    marginVertical: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: SCREEN_W - 32,
  },
  card: {
    width: (SCREEN_W - 48) / 2,
    marginBottom: 24,
    alignItems: 'center',
  },
  icon: { marginBottom: 12 },
  title: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  desc: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    color: '#666',
  },
  lockedText: { color: '#AAA' },
});