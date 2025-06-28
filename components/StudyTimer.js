// components/StudyTimer.js

import {
  SERVER_HOST_ANDROID,
  SERVER_HOST_DEVICE,
  SERVER_HOST_IOS,
} from '@env';
import Slider from '@react-native-community/slider';
import { useNavigation } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useRef, useState } from 'react';
import { AppState, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import WhiteNoisePlayer from './WhiteNoisePlayer';

const HOST =
  Platform.OS === 'android'
    ? SERVER_HOST_ANDROID
    : Platform.OS === 'ios'
      ? SERVER_HOST_IOS
      : SERVER_HOST_DEVICE;

export default function StudyTimer() {
  const navigation = useNavigation();

  const [duration,     setDuration]    = useState(25);
  const [rounds,       setRounds]      = useState(1);
  const [roundIdx,     setRoundIdx]    = useState(1);
  const [secondsLeft,  setSecondsLeft] = useState(duration * 60);
  const [pickupCount,  setPickupCount] = useState(0);
  const timerRef = useRef(null);

  // ask for notification permissions once
  useEffect(() => {
    Notifications.requestPermissionsAsync();
  }, []);

  // count app-background events as pickups
  useEffect(() => {
    let prev = AppState.currentState;
    const listener = newState => {
      if (
        prev === 'active' &&
        (newState === 'inactive' || newState === 'background')
      ) {
        setPickupCount(c => c + 1);
      }
      prev = newState;
    };
    const sub = AppState.addEventListener('change', listener);
    return () => sub.remove();
  }, []);

  // reset countdown when duration changes
  useEffect(() => {
    setSecondsLeft(duration * 60);
  }, [duration]);

  // start the timer
  const startTimer = () => {
    clearInterval(timerRef.current);
    setPickupCount(0);
    setRoundIdx(1);
    setSecondsLeft(duration * 60);

    timerRef.current = setInterval(() => {
      setSecondsLeft(prev => Math.max(prev - 1, 0));
    }, 1000);
  };

  // report session to backend
  const logSession = async breakDur => {
    try {
      const token = await SecureStore.getItemAsync('userToken');
      await fetch(`${HOST}/sessions/complete`, {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify({
          studyDuration: duration,
          breakDuration: breakDur,
          pickupCount,
        }),
      });
    } catch (e) {
      console.warn('Complete session failed:', e);
    }
  };

  // watch for timer / rounds
  useEffect(() => {
    if (secondsLeft > 0) return;
    clearInterval(timerRef.current);

    const breakTime = Math.floor(duration / 5) * 60 * 1000; // ms

    // intermediate break
    if (roundIdx < rounds) {
      // schedule break-end notification at now + breakTime
      Notifications.scheduleNotificationAsync({
        content: {
          title: "🏁 Break Over",
          body:  `Your ${Math.floor(duration/5)}-minute break is up!`,
        },
        trigger: Platform.OS === 'ios'
          ? { date: new Date(Date.now() + breakTime) }
          : { seconds: Math.floor(duration/5) * 60, repeats: false },
      });

      navigation.navigate('BreakScreen', {
        breakDuration: Math.floor(duration / 5),
        onBreakEnd: () => {
          setRoundIdx(i => i + 1);
          setSecondsLeft(duration * 60);
          startTimer();
        },
      });
      return;
    }

    // final completion
    (async () => {
      // schedule study-end notification now? no, it's past.
      await logSession(Math.floor(duration / 5));

      Notifications.scheduleNotificationAsync({
        content: {
          title: "🎉 All Rounds Complete",
          body:  `You finished ${rounds} round(s)!`,
        },
        trigger: null, // immediate
      });

      navigation.navigate('Home', {
        screen: 'Focus',
        params: { refreshKey: Date.now() },
      });
    })();
  }, [secondsLeft]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Study Duration</Text>
      <View style={styles.circleShadow}>
        <AnimatedCircularProgress
          size={200}
          width={14}
          fill={(duration - 5) / (120 - 5) * 100}
          tintColor="#5e17eb"
          backgroundColor="#e0e0e0"
          rotation={0}
          lineCap="round"
        >
          {() => (
            <TouchableOpacity
              onPress={() => setDuration(d => Math.min(120, d + 5))}
              onLongPress={() => setDuration(d => Math.max(5, d - 5))}
            >
              <Text style={styles.durationText}>🕒 {duration} min</Text>
            </TouchableOpacity>
          )}
        </AnimatedCircularProgress>
      </View>
      <Text style={styles.subtleHint}>Tap to +5 | Hold to −5</Text>

      <Text style={styles.label}>Rounds: {rounds}</Text>
      <Slider
        minimumValue={1}
        maximumValue={10}
        step={1}
        value={rounds}
        onValueChange={setRounds}
        style={styles.slider}
      />

      <Text style={styles.timer}>
        {`${Math.floor(secondsLeft / 60)
          .toString()
          .padStart(2,'0')}:${(secondsLeft % 60)
          .toString()
          .padStart(2,'0')}`}
      </Text>

      <TouchableOpacity style={styles.button} onPress={startTimer}>
        <Text style={styles.buttonText}>Start</Text>
      </TouchableOpacity>

      <WhiteNoisePlayer />
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { alignItems:'center', padding:20 },
  label:       { fontSize:16, marginVertical:10 },
  slider:      { width:'90%' },
  timer:       { fontSize:48, marginVertical:20 },
  button:      {
    backgroundColor:'#5e17eb',
    paddingVertical:12,
    paddingHorizontal:24,
    borderRadius:8,
  },
  buttonText:  { color:'#fff', fontWeight:'bold', fontSize:18 },
  durationText:{ fontSize:24, fontWeight:'600', color:'#222', textAlign:'center', marginBottom:4 },
  subtleHint:  { fontSize:12, color:'#999', textAlign:'center', marginTop:6, marginBottom:12 },
  circleShadow:{ shadowColor:'#000', shadowOffset:{width:0,height:2}, shadowOpacity:0.1, shadowRadius:6, elevation:5 },
});