import { useNavigation } from '@react-navigation/native';
import { Audio } from 'expo-av';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useEffect, useRef, useState } from 'react';
import { PanResponder, StyleSheet, Text, TouchableOpacity, Vibration, View } from 'react-native';
import Svg, { Circle, G, Line } from 'react-native-svg';
import { db } from '../firebase';

const RADIUS = 120;
const STROKE_WIDTH = 14;
const FULL_CIRCLE = 2 * Math.PI;
const CENTER = RADIUS;

export default function StudyDialScreen() {
  const [studyMinutes, setStudyMinutes] = useState(25);
  const [secondsLeft, setSecondsLeft] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const navigation = useNavigation();
  const timerRef = useRef(null);
  const soundRef = useRef(null);

  const polarToMinutes = (x, y) => {
    const angle = Math.atan2(y - CENTER, x - CENTER) * (180 / Math.PI) + 180;
    return Math.round(angle / 360 * 115 + 5); // from 5 to 120
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !isRunning,
      onPanResponderMove: (e) => {
        const { locationX, locationY } = e.nativeEvent;
        const minutes = Math.min(120, Math.max(5, polarToMinutes(locationX, locationY)));
        setStudyMinutes(minutes);
      },
    })
  ).current;

  const startCountdown = async () => {
    setSecondsLeft(studyMinutes * 60);
    setIsRunning(true);

    try {
      await addDoc(collection(db, 'sessions'), {
        studyDuration: studyMinutes,
        breakDuration: Math.floor(studyMinutes / 5),
        startedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error('Failed to log session:', err);
    }
  };

  const playSound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(require('../assets/chime-sound-7143.mp3'));
      soundRef.current = sound;
      await sound.playAsync();
    } catch (err) {
      console.warn('Could not play sound:', err);
    }
  };

  useEffect(() => {
    if (secondsLeft === 0) {
      clearInterval(timerRef.current);
      setIsRunning(false);
      Vibration.vibrate(1000);
      playSound();
      navigation.replace('BreakScreen', { breakMinutes: Math.floor(studyMinutes / 5) });
    }
    if (secondsLeft !== null && secondsLeft > 0) {
      timerRef.current = setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timerRef.current);
    }
  }, [secondsLeft]);

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const tickMarks = Array.from({ length: 12 }).map((_, i) => {
    const angle = (i / 12) * 2 * Math.PI;
    const x1 = CENTER + (RADIUS - STROKE_WIDTH - 8) * Math.cos(angle);
    const y1 = CENTER + (RADIUS - STROKE_WIDTH - 8) * Math.sin(angle);
    const x2 = CENTER + (RADIUS - 6) * Math.cos(angle);
    const y2 = CENTER + (RADIUS - 6) * Math.sin(angle);
    return <Line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#ccc" strokeWidth={2} />;
  });

  const strokeLength = FULL_CIRCLE * (RADIUS - STROKE_WIDTH / 2);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isRunning ? 'Focus Time' : 'Set Your Study Duration'}</Text>

      <View {...(!isRunning ? panResponder.panHandlers : {})}>
        <Svg width={RADIUS * 2} height={RADIUS * 2}>
          <G>
            <Circle
              cx={CENTER}
              cy={CENTER}
              r={RADIUS - STROKE_WIDTH / 2}
              stroke="#eee"
              strokeWidth={STROKE_WIDTH}
              fill="none"
            />
            <Circle
              cx={CENTER}
              cy={CENTER}
              r={RADIUS - STROKE_WIDTH / 2}
              stroke="#9b5de5"
              strokeWidth={STROKE_WIDTH}
              strokeDasharray={strokeLength}
              strokeDashoffset={
                isRunning
                  ? (1 - secondsLeft / (studyMinutes * 60)) * strokeLength
                  : 0
              }
              strokeLinecap="round"
              fill="none"
              transform={`rotate(-90 ${CENTER} ${CENTER})`} // ✅ THIS ROTATES IT TO START FROM TOP
             />
            {tickMarks}
          </G>
        </Svg>
        <View style={styles.timeOverlay}>
          <Text style={styles.timeText}>
            {isRunning ? formatTime(secondsLeft) : `${studyMinutes} min`}
          </Text>
        </View>
      </View>

      {!isRunning && (
        <TouchableOpacity style={styles.button} onPress={startCountdown}>
          <Text style={styles.buttonText}>Start</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    marginBottom: 30,
    fontWeight: '600',
  },
  timeText: {
    fontSize: 36,
    color: '#333',
    fontWeight: 'bold',
  },
  timeOverlay: {
    position: 'absolute',
    top: CENTER - 18,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#9b5de5',
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 20,
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});