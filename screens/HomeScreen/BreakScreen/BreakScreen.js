// screens/HomeScreen/BreakScreen/BreakScreen.js

import { useNavigation, useRoute } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function BreakScreen() {
  const navigation = useNavigation();
  const route      = useRoute();
  const { breakDuration, onBreakEnd, sessionData } = route.params;

  const initialSeconds = breakDuration * 60;
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);

  // countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft(prev => Math.max(prev - 1, 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // when timer hits zero
  useEffect(() => {
    if (secondsLeft === 0) {
      if (typeof onBreakEnd === 'function') {
        onBreakEnd();
        navigation.goBack();
      } else {
        navigation.navigate('Home', {
          screen: 'Focus',
          params: { breakJustEnded: true, sessionData },
        });
      }
    }
  }, [secondsLeft, navigation, onBreakEnd, sessionData]);

  const formatTime = secs => {
    const m = String(Math.floor(secs / 60)).padStart(2, '0');
    const s = String(secs % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Take a break!</Text>
      <Text style={styles.timer}>{formatTime(secondsLeft)}</Text>
      <Text style={styles.subtitle}>You’ll be taken to Focus when time’s up.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 20 
  },
  title:    { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  timer:    { fontSize: 48, color: '#5e17eb', marginBottom: 10 },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center' },
});