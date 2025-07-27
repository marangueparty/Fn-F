// components/StudyTimer.js

import Slider from '@react-native-community/slider';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useRef, useState } from 'react';
import { Alert, AppState, Dimensions, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import { getApiHost } from '../utils/getApiHost';
import WhiteNoisePlayer from './WhiteNoisePlayer';

const HOST = getApiHost();
const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function StudyTimer() {
  const navigation = useNavigation();
  const route = useRoute();

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

  // count app‐background events as pickups
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
  const logSession = async (breakDur, sessionDuration, sessionPickupCount) => {
    console.log('logSession called', { sessionDuration, breakDur, sessionPickupCount });
    try {
      const token = await SecureStore.getItemAsync('userToken');
      console.log('Token used for logSession:', token);
      const resp = await fetch(`${HOST}/sessions/complete`, {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify({
          studyDuration: sessionDuration,
          breakDuration: breakDur,
          pickupCount: sessionPickupCount,
        }),
      });
      if (!resp.ok) {
        const errorText = await resp.text();
        console.error('Failed to log session:', resp.status, errorText);
        Alert.alert('Session Not Saved', `Failed to log session: ${resp.status}`);
      } else {
        console.log('Session logged successfully');
      }
    } catch (e) {
      console.warn('Complete session failed:', e);
      Alert.alert('Session Not Saved', `Error: ${e.message}`);
    }
  };

  // Listen for breakJustEnded param and log session if needed
  useEffect(() => {
    if (route.params && route.params.breakJustEnded && route.params.sessionData) {
      const { duration: sessionDuration, breakDuration, pickupCount: sessionPickupCount } = route.params.sessionData;
      logSession(breakDuration, sessionDuration, sessionPickupCount);
      // Reset the param so it doesn't trigger again
      navigation.setParams({ breakJustEnded: false, sessionData: null });
    }
  }, [route.params?.breakJustEnded]);

  // watch for timer / rounds
  useEffect(() => {
    if (secondsLeft > 0) return;
    clearInterval(timerRef.current);

    const breakMin  = Math.floor(duration / 5);
    const breakTime = breakMin * 60 * 1000; // ms

    // intermediate break
    if (roundIdx < rounds) {
      logSession(breakMin, duration, pickupCount);

      Notifications.scheduleNotificationAsync({
        content: {
          title: "\uD83C\uDFC1 Break Over",
          body:  `Your ${breakMin}-minute break is up!`,
        },
        trigger:
          Platform.OS === 'ios'
            ? { date: new Date(Date.now() + breakTime) }
            : { seconds: breakMin * 60, repeats: false },
      });

      navigation.navigate('BreakScreen', {
        breakDuration: breakMin,
        onBreakEnd: () => {
          logSession(breakMin, duration, pickupCount);
          setRoundIdx(i => i + 1);
          setSecondsLeft(duration * 60);
          startTimer();
        },
      });
      return;
    }

    // final break: now passing onBreakEnd so the final logSession fires
    if (roundIdx <= rounds) {
      Notifications.scheduleNotificationAsync({
        content: {
          title: "Study Session Ended",
          body:  "Time for a break!",
        },
        trigger: null,
      });

      navigation.navigate('BreakScreen', {
        breakDuration: breakMin,
        onBreakEnd: () => {
          logSession(breakMin, duration, pickupCount);
        },
      });
      return;
    }
  }, [secondsLeft]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Study Duration</Text>
      <View style={styles.circleShadow}>
        <AnimatedCircularProgress
          size={SCREEN_WIDTH * 0.55}
          width={SCREEN_WIDTH * 0.055}
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
              <Text style={[styles.durationText, { fontSize: SCREEN_WIDTH * 0.06 }]}>
                🕒 {duration} min
              </Text>
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
        style={[styles.slider, { width: SCREEN_WIDTH * 0.85 }]}
      />

      <Text style={[styles.timer, { fontSize: SCREEN_WIDTH * 0.07 }]}>
        {`${String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:${String(secondsLeft % 60).padStart(2, '0')}`}
      </Text>

      <TouchableOpacity
        style={[
          styles.button,
          {
            width: SCREEN_WIDTH * 0.35,
            borderRadius: SCREEN_WIDTH * 0.175,
            paddingVertical: SCREEN_WIDTH * 0.035,
            marginBottom: SCREEN_WIDTH * 0.02,
          },
        ]}
        onPress={startTimer}
      >
        <Text style={[styles.buttonText, { fontSize: SCREEN_WIDTH * 0.04 }]}>
          Start
        </Text>
      </TouchableOpacity>

      <Text style={{ fontSize: SCREEN_WIDTH * 0.04, color: '#5e17eb' }}>
        Pick-ups detected: {pickupCount}
      </Text>

      <WhiteNoisePlayer />
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, alignItems:'center', justifyContent:'flex-start', padding: '5%', paddingBottom: SCREEN_WIDTH * 0.12 },
  label:       { fontSize:16, marginVertical:10 },
  slider:      {},
  timer:       { marginTop: 20, marginBottom: 8, fontWeight:'bold', textAlign:'center' },
  button:      {
    backgroundColor:'#5e17eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  buttonText:  { color:'#fff', fontWeight:'bold' },
  durationText:{ fontWeight:'600', color:'#222', textAlign:'center', marginBottom:4 },
  subtleHint:  { fontSize:12, color:'#999', textAlign:'center', marginTop:6, marginBottom:12 },
  circleShadow:{ shadowColor:'#000', shadowOffset:{width:0,height:2}, shadowOpacity:0.1, shadowRadius:6, elevation:5 },
});