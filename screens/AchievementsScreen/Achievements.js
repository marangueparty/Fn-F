// screens/AchievementsScreen/AchievementsScreen.js

import {
  SERVER_HOST_ANDROID,
  SERVER_HOST_DEVICE,
  SERVER_HOST_IOS,
} from '@env';
import { useIsFocused } from '@react-navigation/native';
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
const CIRCLE_SIZE = 40;

const HOST =
  Platform.OS === 'android'
    ? SERVER_HOST_ANDROID
    : Platform.OS === 'ios'
    ? SERVER_HOST_IOS
    : SERVER_HOST_DEVICE;

const ACH_LIST = [
  { id: 'first_session', title: 'First Steps',    desc: 'Complete your first study session',      icon: 'flag-checkered' },
  { id: 'focus_10h',     title: '10 Hours Focus', desc: 'Accumulate 600 min of focus',             icon: 'clock-check-outline' },
  { id: 'streak_3',      title: '3-Day Streak',   desc: 'Study at least once per day for 3 days',  icon: 'calendar-star' },
];

export default function AchievementsScreen() {
  const isFocused = useIsFocused();

  const [stats, setStats]       = useState({
    totalFocus:     0,
    currentLevel:   1,
    nextLevel:      2,
    minutesToNext:  0,
    minutesForNext: 60,
    penalties:      0,
  });
  const [unlocked, setUnlocked] = useState({});

  useEffect(() => {
    if (!isFocused) return;
    (async () => {
      try {
        const token = await SecureStore.getItemAsync('userToken');
        const res   = await fetch(`${HOST}/achievements/current`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        if (data.success) {
          // 1) update stats
          setStats(data.stats);

          // 2) build unlocked map from server
          const map = {};
          data.achievements.forEach(id => (map[id] = true));

          // 3) ALWAYS unlock "First Steps" once you've done any focus
          if (data.stats.totalFocus > 0) {
            map['first_session'] = true;
          }

          setUnlocked(map);
        }
      } catch (e) {
        console.warn('Error loading achievements:', e);
      }
    })();
  }, [isFocused]);

  const { currentLevel, nextLevel, minutesToNext, minutesForNext, penalties } = stats;
  const penaltyColor =
    penalties >= 15 ? '#EB5757' :
    penalties >=  7 ? '#F2C94C' :
                      '#27AE60';

  // fraction of level completed
  const completedFraction = (minutesForNext - minutesToNext) / minutesForNext;

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
                { flex: completedFraction },
              ]}
            />
          </View>
          <View style={styles.levelCircle}>
            <Text style={styles.levelText}>{nextLevel}</Text>
          </View>
        </View>
        {/* SHOW completed minutes, not remaining */}
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
              />
              <Text style={[styles.title, done ? {} : styles.lockedText]}>
                {a.title}
              </Text>
              <Text style={[styles.desc, done ? {} : styles.lockedText]}>
                {a.desc}
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
    paddingTop:      Platform.OS==='android' ? StatusBar.currentHeight+10 : 10,
    paddingBottom:   20,
    paddingHorizontal: 16,
    alignItems:      'center',
    backgroundColor: '#fff',
  },
  header:           { fontSize:24, fontWeight:'600', marginVertical:12 },
  levelBarWrapper:  { width:'100%', marginBottom:24, alignItems:'center' },
  levelRow:         { flexDirection:'row', alignItems:'center', width:'100%' },
  levelCircle:      {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE/2,
    backgroundColor: '#D3B5F9',
    justifyContent:'center',
    alignItems:'center',
  },
  levelText:        { fontWeight:'600', fontSize:18 },
  progressTrack:    {
    flex:1,
    height: CIRCLE_SIZE*0.6,
    backgroundColor:'#EDE7F6',
    marginHorizontal:8,
    borderRadius:CIRCLE_SIZE*0.3,
    overflow:'hidden',
    flexDirection:'row',
  },
  progressFill:     { backgroundColor:'#9B5DEB' },
  progressLabel:    { marginTop:8, fontSize:14, color:'#555' },
  subheader:        { fontSize:20, fontWeight:'500', marginTop:16 },
  penaltyCount:     { fontSize:32, fontWeight:'700', marginVertical:8 },
  grid:             {
    flexDirection:'row',
    flexWrap:'wrap',
    justifyContent:'space-between',
    width: SCREEN_W - 32,
  },
  card:             { width:(SCREEN_W - 48)/2, marginBottom:24, alignItems:'center' },
  title:            { fontSize:16, fontWeight:'500', textAlign:'center' },
  desc:             { fontSize:12, textAlign:'center', marginTop:4, color:'#666' },
  lockedText:       { color:'#AAA' },
});