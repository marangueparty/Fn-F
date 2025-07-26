// components/FocusProgress.js

import {
  SERVER_HOST_ANDROID,
  SERVER_HOST_DEVICE,
  SERVER_HOST_IOS,
} from '@env';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import moment from 'moment';
import { useCallback, useState } from 'react';
import {
  Alert,
  Dimensions,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text, TouchableOpacity, View
} from 'react-native';

const { width: SCREEN_W } = Dimensions.get('window');
const BAR_WIDTH = (SCREEN_W - 64) / 7; // 7 bars with spacing
const MAX_BAR_HEIGHT = 150;


const HOST =
  Platform.OS === 'android'
    ? SERVER_HOST_ANDROID
    : Platform.OS === 'ios'
      ? SERVER_HOST_IOS
      : SERVER_HOST_DEVICE;

export default function FocusProgress() {
  const [weeklyFocus, setWeeklyFocus] = useState(Array(7).fill(0));
  const [weeklyBreak, setWeeklyBreak] = useState(Array(7).fill(0));
  const [userGoal, setUserGoal] = useState(120);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  const fetchSessions = useCallback(async () => {
    try {
      const token = await SecureStore.getItemAsync('userToken');
      const [sessionsResp, goalResp] = await Promise.all([
        fetch(`${HOST}/sessions`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }),
        fetch(`${HOST}/focus-goal`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!sessionsResp.ok) throw new Error(`Sessions HTTP ${sessionsResp.status}`);
      if (!goalResp.ok) throw new Error(`Goal HTTP ${goalResp.status}`);

      const sessions = await sessionsResp.json();
      const goalData = await goalResp.json();

      if (goalData.success && goalData.goalMinutes) setUserGoal(goalData.goalMinutes);

      const focusMap = {};
      const breakMap = {};

      sessions.forEach(({ studyDuration, breakDuration, startedAt }) => {
        const date = typeof startedAt === 'string'
          ? new Date(startedAt)
          : startedAt.toDate
            ? startedAt.toDate()
            : startedAt;
        const day = moment(date).format('dddd');
        focusMap[day] = (focusMap[day] || 0) + studyDuration;
        breakMap[day] = (breakMap[day] || 0) + breakDuration;
      });

      const last7 = [...Array(7)].map((_, i) =>
        moment().subtract(6 - i, 'days').format('dddd')
      );

      setWeeklyFocus(last7.map(d => focusMap[d] || 0));
      setWeeklyBreak(last7.map(d => breakMap[d] || 0));
      setLoading(false);
    } catch (e) {
      console.warn('Error loading sessions or goal:', e);
      Alert.alert('Error', 'Could not load your sessions or goal.');
      setLoading(false);
    }
  }, [HOST]);

  useFocusEffect(
  useCallback(() => {
    async function fetchData() {
      await fetchSessions();
    }
    fetchData();
  }, [fetchSessions])
);

  if (loading) return <Text style={{ padding: 20, textAlign: 'center' }}>Loading...</Text>;

  const totalFocus = weeklyFocus.reduce((a, b) => a + b, 0);
  const totalBreak = weeklyBreak.reduce((a, b) => a + b, 0);

  // 1) map colors based on goal achievement
  const barColors = weeklyFocus.map(minutes => {
    if (minutes >= userGoal) return '#2ecc71'; // green
    if (minutes >= userGoal * 0.75) return '#f1c40f'; // yellow
    return '#e74c3c'; // red
  });

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Focus Collected</Text>
          <Text style={styles.summaryValue}>{totalFocus} min</Text>
          <Text style={[styles.summaryTitle, { marginTop: 12 }]}>Breaks</Text>
          <Text style={styles.summaryValue}>{totalBreak} min</Text>
          <Text style={[styles.summaryTitle, { marginTop: 20 }]}>
            Daily Focus Goal: {userGoal} min
          </Text>
        </View>
        <TouchableOpacity
        onPress={() => navigation.navigate('FocusGoal')}
        style={styles.button}
        >
          <Text style={styles.buttonText}>Set Focus Goal</Text>
          </TouchableOpacity>


        {/* Custom colored bar chart */}
        <View style={styles.chartContainer}>
          {weeklyFocus.map((minutes, i) => {
            const barHeight = Math.min((minutes / (userGoal || 1)) * MAX_BAR_HEIGHT, MAX_BAR_HEIGHT);
            return (
            <View key={i} style={styles.barGroup}>
              <View style={[styles.bar, { height: barHeight, backgroundColor: barColors[i] }]} />
              <Text style={styles.barLabel}>{minutes}</Text>
              <Text style={styles.barDay}>{moment().subtract(6 - i, 'days').format('ddd')}</Text>
              </View>
              );
              })}
        </View>

        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#2ecc71' }]} />
            <Text>Goal Met</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#f1c40f' }]} />
            <Text>Close to Goal</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#e74c3c' }]} />
            <Text>Below Goal</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 10,
  },
  container: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 20,
  },
  summaryCard: {
    width: SCREEN_W * 0.9,
    backgroundColor: '#d3b5f9',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 4,
    color: '#000',
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: SCREEN_W * 0.9,
    height: 180,
    alignItems: 'flex-end',
  },
  barGroup: {
    alignItems: 'center',
    width: BAR_WIDTH,
  },
  bar: {
    width: BAR_WIDTH * 0.6,
    borderRadius: 4,
  },
  barLabel: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '600',
  },
  barDay: {
    fontSize: 10,
    color: '#666',
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: SCREEN_W * 0.9,
    marginTop: 30,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 20,
    height: 20,
    marginRight: 6,
    borderRadius: 4,
  },
  button: {
    backgroundColor: '#5e17eb',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 24,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    textAlign: 'center',
  },
});
