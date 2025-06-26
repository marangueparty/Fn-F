import { Feather } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import WaveformBar from './WaveForm';

export default function WhiteNoisePlayer() {
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleToggleSound = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        interruptionModeIOS: 1,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        interruptionModeAndroid: 1,
        playThroughEarpieceAndroid: false,
      });

      if (!sound) {
        const { sound: newSound } = await Audio.Sound.createAsync(
          require('../assets/sounds/white-noise.mp3'),
          { shouldPlay: true, isLooping: true }
        );
        setSound(newSound);
        setIsPlaying(true);
      } else {
        if (isPlaying) {
          await sound.pauseAsync();
          setIsPlaying(false);
        } else {
          await sound.playAsync();
          setIsPlaying(true);
        }
      }
    } catch (e) {
      console.log('Audio error:', e);
    }
  };

  useEffect(() => {
    return () => {
      if (sound) sound.unloadAsync();
    };
  }, [sound]);

  return (
    <View style={styles.musicPlayer}>
      {/* Animated waveform */}
      {isPlaying && (
        <View style={styles.waveformContainer}>
          {[0, 100, 200, 300, 400, 500, 600, 700].map((delay, i) => (
            <WaveformBar key={i} delay={delay} />
          ))}
        </View>
      )}

      {/* Play/Pause Button */}
      <TouchableOpacity onPress={handleToggleSound} style={styles.musicButton}>
        <Feather
          name={isPlaying ? 'pause-circle' : 'play-circle'}
          size={42}
          color="#5e17eb"
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  musicPlayer: {
    marginTop: 20,
    alignItems: 'center',
  },
  musicButton: {
    marginTop: 12,
    padding: 8,
    borderRadius: 30,
    backgroundColor: '#f2f2f2',
  },
  waveformContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    height: 40,
  },
});