import { useNavigation, useRoute } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function BreakScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { breakMinutes } = route.params;
  const [secondsLeft, setSecondsLeft] = useState(breakMinutes * 60);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setShowPrompt(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <View style={styles.container}>
      {showPrompt ? (
        <>
          <Text style={styles.message}>Ready to start your next session?</Text>
          <TouchableOpacity style={styles.button} onPress={() => navigation.replace('StudyDialScreen')}>
            <Text style={styles.buttonText}>Start Again</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.message}>Take a break 🧘‍♀️</Text>
          <Text style={styles.timer}>{formatTime(secondsLeft)}</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3e9ff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  message: {
    fontSize: 28,
    color: '#7a4cd4',
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  timer: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#9b5de5',
  },
  button: {
    backgroundColor: '#9b5de5',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 20,
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});