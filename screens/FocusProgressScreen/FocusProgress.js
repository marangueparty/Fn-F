// components/FocusProgress.js

import {
  SERVER_HOST_ANDROID,
  SERVER_HOST_DEVICE,
  SERVER_HOST_IOS,
} from '@env';
import { useFocusEffect } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store'; // ← add this import
import moment from 'moment';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  Dimensions,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { BarChart } from 'react-native-chart-kit';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const CHART_WIDTH  = SCREEN_W - 32;
const CHART_HEIGHT = SCREEN_H * 0.3;

const HOST =
  Platform.OS === 'android'
    ? SERVER_HOST_ANDROID
    : Platform.OS === 'ios'
      ? SERVER_HOST_IOS
      : SERVER_HOST_DEVICE;

export default function FocusProgress() {
  const [weeklyFocus, setWeeklyFocus] = useState(Array(7).fill(0));
  const [weeklyBreak, setWeeklyBreak] = useState(Array(7).fill(0));

  const fetchSessions = useCallback(async () => {
    try {
      // 1) retrieve the stored token
      const token = await SecureStore.getItemAsync('userToken');

      // 2) include it in your GET /sessions call
      const resp = await fetch(`${HOST}/sessions`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const sessions = await resp.json();

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
    } catch (e) {
      console.warn('Error loading sessions:', e);
      Alert.alert('Error', 'Could not load your sessions.');
    }
  }, [HOST]);

  useFocusEffect(
    useCallback(() => {
      fetchSessions();
    }, [fetchSessions])
  );

  const totalFocus = weeklyFocus.reduce((a, b) => a + b, 0);
  const totalBreak = weeklyBreak.reduce((a, b) => a + b, 0);
  const maxFocus   = Math.max(...weeklyFocus, 1);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Focus Collected</Text>
          <Text style={styles.summaryValue}>{totalFocus} min</Text>
          <Text style={[styles.summaryTitle, { marginTop: 12 }]}>Breaks</Text>
          <Text style={styles.summaryValue}>{totalBreak} min</Text>
        </View>

        <BarChart
          data={{
            labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
            datasets: [{ data: weeklyFocus }],
          }}
          width={CHART_WIDTH}
          height={CHART_HEIGHT}
          fromZero
          segments={maxFocus}
          chartConfig={{
            backgroundGradientFrom: '#fff',
            backgroundGradientTo:   '#fff',
            decimalPlaces:          0,
            color:        (opacity=1) => `rgba(155,93,229,${opacity})`,
            labelColor:   () => '#333',
            formatYLabel: label =>
              (label === '0' || label === String(maxFocus)) ? label : '',
          }}
          style={styles.chart}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android'
      ? StatusBar.currentHeight + 10
      : 10,
  },
  container: {
    alignItems:    'center',
    paddingTop:    80,
    paddingBottom: 20,
  },
  summaryCard: {
    width:           SCREEN_W * 0.9,
    backgroundColor: '#d3b5f9',
    borderRadius:    8,
    padding:         16,
    alignItems:      'center',
    marginBottom:    24,
  },
  summaryTitle: {
    fontSize:   16,
    fontWeight: '600',
    color:      '#333',
  },
  summaryValue: {
    fontSize:   24,
    fontWeight: '700',
    marginTop:  4,
    color:      '#000',
  },
  chart: {
    marginVertical: 20,
    borderRadius:   8,
    transform:      [{ translateX: -SCREEN_W * 0.05 }],
  },
});