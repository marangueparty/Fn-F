// components/WhiteNoisePlayer.js
import { Feather } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import React, { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import WaveformBar from './WaveForm';

export default function WhiteNoisePlayer() {
  const [sound, setSound]       = useState(null);
  const [isPlaying, setPlaying] = useState(false);

  // 1) Configure audio mode once
  useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS:        false,
      staysActiveInBackground:   true,
      interruptionModeIOS:       Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
      playsInSilentModeIOS:      true,
      shouldDuckAndroid:         true,
      interruptionModeAndroid:   Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
      playThroughEarpieceAndroid:false,
    });
  }, []);

  // 2) Preload the sound on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { sound: s } = await Audio.Sound.createAsync(
          require('../assets/sounds/white-noise.mp3'),
          { shouldPlay: false, isLooping: true }
        );
        if (mounted) setSound(s);
      } catch (e) {
        console.error('Failed to load white noise:', e);
      }
    })();
    return () => {
      mounted = false;
      if (sound) sound.unloadAsync();
    };
  }, []);

  // 3) When `isPlaying` flips, call playAsync / pauseAsync
  useEffect(() => {
    if (!sound) return;
    if (isPlaying) {
      sound.playAsync().catch(e => console.error('playAsync error', e));
    } else {
      sound.pauseAsync().catch(e => console.error('pauseAsync error', e));
    }
  }, [isPlaying, sound]);

  const toggle = () => {
    if (!sound) return;
    setPlaying(p => !p);
  };

  return (
    <View style={styles.musicPlayer}>
      {isPlaying && (
        <View style={styles.waveformContainer}>
          {[...Array(8)].map((_, i) => (
            <WaveformBar key={i} delay={i * 100} />
          ))}
        </View>
      )}
      <TouchableOpacity onPress={toggle} style={styles.musicButton}>
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