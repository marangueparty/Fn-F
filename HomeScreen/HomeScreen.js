import { useNavigation } from '@react-navigation/native';
import { Audio } from 'expo-av';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AnimatedCircularProgress } from 'react-native-circular-progress';

export default function StudyDialScreen() {
  const [studyMinutes, setStudyMinutes] = useState(25);
  const [secondsLeft, setSecondsLeft] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const navigation = useNavigation();
  const timerRef = useRef(null);

  const startCountdown = () => {
    setSecondsLeft(studyMinutes * 60);
    setIsRunning(true);
  };

  const playSound = async () => {
  const { sound } = await Audio.Sound.createAsync(
    require('./assets/chime.mp3') // path to your chime file
  );
  await sound.playAsync();
};

  useEffect(() => {
    if (secondsLeft === 0) {
      clearInterval(timerRef.current);
      setIsRunning(false);
      navigation.replace('BreakScreen', { breakMinutes: Math.floor(studyMinutes / 5) });
    }
    if (secondsLeft !== null && secondsLeft > 0) {
      timerRef.current = setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timerRef.current);
    }
  }, [secondsLeft]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isRunning ? 'Focus Time' : 'Set Study Duration'}</Text>

      <AnimatedCircularProgress
        size={250}
        width={20}
        fill={isRunning ? ((1 - secondsLeft / (studyMinutes * 60)) * 100) : 0}
        tintColor="#9b5de5"
        backgroundColor="#eee"
        rotation={0}
      >
        {() => (
          <Text style={styles.timeText}>
            {isRunning ? formatTime(secondsLeft) : `${studyMinutes} min`}
          </Text>
        )}
      </AnimatedCircularProgress>

      {!isRunning && (
        <View style={styles.controls}>
          <TouchableOpacity onPress={() => setStudyMinutes((m) => Math.max(5, m - 5))}>
            <Text style={styles.adjustText}>-5</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setStudyMinutes((m) => m + 5)}>
            <Text style={styles.adjustText}>+5</Text>
          </TouchableOpacity>
        </View>
      )}

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
    paddingHorizontal: 20,
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
  controls: {
    flexDirection: 'row',
    gap: 40,
    marginVertical: 20,
  },
  adjustText: {
    fontSize: 24,
    color: '#9b5de5',
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