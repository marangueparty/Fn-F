import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function BreakScreen({ route, navigation }) {
  const { breakDuration, onBreakEnd } = route.params;

  const [secondsLeft, setSecondsLeft] = useState(breakDuration);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Call the callback to resume the next study round
          if (onBreakEnd) onBreakEnd();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (secs) => {
    const min = Math.floor(secs / 60);
    const sec = secs % 60;
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Take a break!</Text>
      <Text style={styles.timer}>{formatTime(secondsLeft)}</Text>
      <Text style={styles.subtitle}>You'll return to your next round automatically.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  timer: { fontSize: 48, color: '#5e17eb', marginBottom: 10 },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center' },
});
