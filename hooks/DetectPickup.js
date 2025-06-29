import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

export default function usePickupDetector(isActive) {
  const appState = useRef(AppState.currentState);
  const [pickupCount, setPickupCount] = useState(0);
  const cooldownRef = useRef(false);

  // Define handlePickupDetected inside the hook
  const handlePickupDetected = () => {
    setPickupCount(prevCount => {
      const newCount = prevCount + 1;

      Notifications.scheduleNotificationAsync({
        content: {
          title: 'Phone Pick-up Detected',
          body: `Count: ${newCount}`,
        },
        trigger: null,
      });

      const timestamp = new Date().toISOString();
      AsyncStorage.getItem('pickupEvents')
        .then(json => {
          const events = json ? JSON.parse(json) : [];
          AsyncStorage.setItem('pickupEvents', JSON.stringify([...events, { timestamp }]));
        })
        .catch(console.error);

      return newCount;
    });
  };

  useEffect(() => {
    if (!isActive) return;

    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active' &&
        !cooldownRef.current
      ) {
        cooldownRef.current = true;
        handlePickupDetected();  // Call the function here

        setTimeout(() => {
          cooldownRef.current = false;
        }, 3000);
      }
      appState.current = nextAppState;
    });

    return () => subscription.remove();
  }, [isActive]);

  return { pickupCount };
}
