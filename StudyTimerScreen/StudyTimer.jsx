// StudyTimerScreen.jsx
import { initializeApp } from 'firebase/app';
import { doc, getFirestore, setDoc } from 'firebase/firestore';
import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CircleSlider } from 'react-native-circle-slider'; // You may need a library for circular dials

// Firebase config
const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_AUTH_DOMAIN',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_STORAGE_BUCKET',
  messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
  appId: 'YOUR_APP_ID',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default function StudyTimerScreen() {
  const [studyTime, setStudyTime] = useState(30); // in minutes
  const [isStarted, setIsStarted] = useState(false);

  const handleStart = async () => {
    const breakTime = Math.floor(studyTime / 5);
    setIsStarted(true);

    // Save session to Firestore
    try {
      await setDoc(doc(db, 'sessions', Date.now().toString()), {
        studyDuration: studyTime,
        breakDuration: breakTime,
        startedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error saving session:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.timer}>{isStarted ? `${studyTime}:00` : '00:00'}</Text>

      <CircleSlider
        value={studyTime}
        min={5}
        max={120}
        onValueChange={val => setStudyTime(Math.round(val))}
        dialColor="#9b5de5"
        strokeWidth={20}
        textColor="#000"
      />

      <Text style={styles.subtext}>Break: {Math.floor(studyTime / 5)} mins</Text>

      <TouchableOpacity style={styles.button} onPress={handleStart}>
        <Text style={styles.buttonText}>Start</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f0ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timer: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 20,
  },
  subtext: {
    fontSize: 18,
    color: '#555',
    marginTop: 10,
  },
  button: {
    backgroundColor: '#9b5de5',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginTop: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});
