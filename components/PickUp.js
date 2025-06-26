import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Accelerometer } from 'expo-sensors';
import { useEffect, useRef, useState } from 'react';

export default function usePickupDetector(isActive) {
  const [pickupCount, setPickupCount] = useState(0);
  const lastAccel = useRef({ x: 0, y: 0, z: 0 });
  const detectionThreshold = 1.5;
  const cooldownRef = useRef(false);

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
      const event = { timestamp };

      AsyncStorage.getItem('pickupEvents')
        .then(existingEventsJSON => {
          const existingEvents = existingEventsJSON ? JSON.parse(existingEventsJSON) : [];
          AsyncStorage.setItem('pickupEvents', JSON.stringify([...existingEvents, event]));
        })
        .catch(console.error);

      return newCount;
    });
  };

  useEffect(() => {
    let subscription;

    if (isActive) {
      subscription = Accelerometer.addListener(accelerometerData => {
        if (cooldownRef.current) return;

        const { x, y, z } = accelerometerData;
        const deltaX = Math.abs(x - lastAccel.current.x);
        const deltaY = Math.abs(y - lastAccel.current.y);
        const deltaZ = Math.abs(z - lastAccel.current.z);
        const totalMovement = deltaX + deltaY + deltaZ;

        if (totalMovement > detectionThreshold) {
          cooldownRef.current = true;
          handlePickupDetected();
          setTimeout(() => (cooldownRef.current = false), 3000);
        }

        lastAccel.current = { x, y, z };
      });

      Accelerometer.setUpdateInterval(300);
    }

    return () => subscription && subscription.remove();
  }, [isActive]);

  return { pickupCount };
}

