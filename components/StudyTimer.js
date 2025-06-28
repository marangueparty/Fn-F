import Slider from '@react-native-community/slider';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import WhiteNoisePlayer from '../components/WhiteNoisePlayer';
import usePickupDetector from '../hooks/DetectPickup';

export default function StudyTimer() {
  const navigation = useNavigation();

  const [duration, setDuration] = useState(25);
  const [rounds, setRounds] = useState(1);
  const [currentRound, setCurrentRound] = useState(1);
  const [isRunning, setIsRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(duration * 60);

  // Use the timer running state for pickup detection
  const { pickupCount } = usePickupDetector(isRunning);

  const timerRef = useRef(null);

  useEffect(() => {
    setSecondsLeft(duration * 60);
  }, [duration]);

  const startTimer = () => {
    setIsRunning(true);
    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setIsRunning(false);

          const breakTime = Math.floor(duration * 60 / 5);
          navigation.navigate('BreakScreen', {
            breakDuration: breakTime,
            onBreakEnd: handleBreakEnd,
          });

          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleBreakEnd = () => {
    if (currentRound < rounds) {
      setCurrentRound((prev) => prev + 1);
      setSecondsLeft(duration * 60);
      startTimer();
    } else {
      navigation.navigate('Home');
    }
  };

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
              onPress={() => {
                const newDuration = duration + 5 > 120 ? 120 : duration + 5;
                setDuration(newDuration);
              }}
              onLongPress={() => {
                const newDuration = duration - 5 < 5 ? 5 : duration - 5;
                setDuration(newDuration);
              }}
            >
              <Text style={styles.durationText}>🕒 {duration} min</Text>
            </TouchableOpacity>
          )}
        </AnimatedCircularProgress>
      </View>

      <Text style={styles.subtleHint}>Tap to +5 | Hold to -5</Text>

      <Text style={styles.label}>Rounds: {rounds}</Text>
      <Slider
        minimumValue={1}
        maximumValue={10}
        step={1}
        value={rounds}
        onValueChange={setRounds}
        style={styles.slider}
      />

      <Text style={styles.timer}>{formatTime(secondsLeft)}</Text>

      <TouchableOpacity style={styles.button} onPress={startTimer} disabled={isRunning}>
        <Text style={styles.buttonText}>{isRunning ? 'Running...' : 'Start'}</Text>
      </TouchableOpacity>

      {/* Display pickup count */}
      <Text style={{ marginTop: 16, fontSize: 16, color: '#5e17eb' }}>
        Pick-ups detected: {pickupCount}
      </Text>

      <WhiteNoisePlayer />
    </View>
  );
}

const formatTime = (secs) => {
  const min = Math.floor(secs / 60);
  const sec = secs % 60;
  return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
};

const styles = StyleSheet.create({
  container: { alignItems: 'center', padding: 20 },
  valueDisplay: {
    fontSize: 18,
    marginTop: 10,
    fontWeight: '600',
  },
  label: { fontSize: 16, marginVertical: 10 },
  slider: { width: '90%' },
  timer: { fontSize: 48, marginVertical: 20 },
  button: {
    backgroundColor: '#5e17eb',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  durationText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#222',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtleHint: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 12,
  },
  circleShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  
});
