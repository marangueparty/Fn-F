import CircularSlider from '@fseehawer/react-circular-slider';
import { addDoc, collection, getFirestore, serverTimestamp } from 'firebase/firestore';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  Vibration,
  View,
} from 'react-native';
import { auth } from '../firebase';

const db = getFirestore();

export default function HomeScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [studyTime, setStudyTime] = useState(30); // in minutes
  const [breakTime, setBreakTime] = useState(6);
  const [timeLeft, setTimeLeft] = useState(null); // in seconds
  const [phase, setPhase] = useState('idle'); // idle, studying, break
  const timerRef = useRef(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        navigation.replace('Login');
      }
      setLoading(false);
    });
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    if (timeLeft === 0) {
      Vibration.vibrate(1000);
      clearInterval(timerRef.current);
      if (phase === 'studying') {
        setPhase('break');
        setTimeLeft(breakTime * 60);
      } else if (phase === 'break') {
        setPhase('idle');
        setTimeLeft(null);
      }
    }
  }, [timeLeft, phase, breakTime]);

  const startStudySession = async () => {
    const calculatedBreak = Math.floor(studyTime / 5);
    setBreakTime(calculatedBreak);
    setTimeLeft(studyTime * 60);
    setPhase('studying');

    try {
      await addDoc(collection(db, 'sessions'), {
        email: user?.email,
        studyDuration: studyTime,
        breakDuration: calculatedBreak,
        startedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error('Failed to save session:', err);
    }
  };

  useEffect(() => {
    if (timeLeft !== null) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timerRef.current);
    }
  }, [timeLeft]);

  const handleSignOut = async () => {
    try {
      await auth.signOut();
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#9b5de5" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.headerText}>Hello 👋</Text>
      <Text style={styles.emailText}>{user?.email}</Text>

      <View style={styles.timerContainer}>
        <Text style={styles.timerLabel}>
          {phase === 'idle' ? 'Set Study Time' : phase === 'studying' ? 'Studying...' : 'Break Time!'}
        </Text>

        {phase === 'idle' && (
          <CircularSlider
            width={250}
            label="minutes"
            min={5}
            max={120}
            data={[...Array(116)].map((_, i) => i + 5)}
            onChange={setStudyTime}
            knobColor="#9b5de5"
            progressColorFrom="#9b5de5"
            progressColorTo="#9b5de5"
            trackColor="#f2e8ff"
            value={studyTime}
          />
        )}

        {phase !== 'idle' && (
          <Text style={styles.timeRemaining}>{formatTime(timeLeft)}</Text>
        )}

        {phase === 'idle' && <Text style={styles.breakText}>Break: {Math.floor(studyTime / 5)} min</Text>}
      </View>

      {phase === 'idle' && (
        <TouchableOpacity style={styles.button} onPress={startStudySession}>
          <Text style={styles.buttonText}>Start</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#fefbff',
    alignItems: 'center',
    paddingTop: 80,
  },
  headerText: {
    fontSize: 24,
    fontWeight: '500',
    color: '#333',
  },
  emailText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#9b5de5',
    marginBottom: 30,
  },
  timerContainer: {
    marginVertical: 20,
    alignItems: 'center',
  },
  timerLabel: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 10,
    color: '#444',
  },
  breakText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
  timeRemaining: {
    fontSize: 48,
    fontWeight: '700',
    color: '#9b5de5',
    marginVertical: 20,
  },
  button: {
    backgroundColor: '#9b5de5',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  signOutButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 20,
    marginTop: 30,
  },
  signOutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});