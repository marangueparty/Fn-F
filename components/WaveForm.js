import { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';

export default function WaveformBar({ delay = 0 }) {
  const height = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(height, {
          toValue: 30,
          duration: 300,
          delay,
          useNativeDriver: false,
        }),
        Animated.timing(height, {
          toValue: 10,
          duration: 300,
          useNativeDriver: false,
        }),
      ])
    );
    loop.start();

    return () => loop.stop();
  }, []);

  return <Animated.View style={[styles.bar, { height }]} />;
}

const styles = StyleSheet.create({
  bar: {
    width: 6,
    marginHorizontal: 2,
    backgroundColor: '#5e17eb',
    borderRadius: 3,
  },
});
