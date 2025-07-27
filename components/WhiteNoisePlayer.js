// components/WhiteNoisePlayer.js

import { Feather } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import React, { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import WaveformBar from './WaveForm';

export default function WhiteNoisePlayer() {
  const [sound, setSound]       = useState(null);
  const [isPlaying, setPlaying] = useState(false);

  // configure audio mode once
  useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS:        false,
      staysActiveInBackground:   true,
      playsInSilentModeIOS:      true,
      shouldDuckAndroid:         true,
      playThroughEarpieceAndroid: false,
    }).catch(e => console.warn('Audio mode error', e));
  }, []);

  // load & loop your heavy rain noise
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { sound: s } = await Audio.Sound.createAsync(
          require('../assets/heavy-rain-white-noise-159772.mp3'),
          { shouldPlay: false, isLooping: true }
        );
        if (mounted) setSound(s);
      } catch (e) {
        console.error('🔈 load error', e);
      }
    })();
    return () => {
      mounted = false;
      if (sound) sound.unloadAsync().catch(() => {});
    };
  }, []);

  // play / pause when toggled
  useEffect(() => {
    if (!sound) return;
    if (isPlaying) {
      sound.playAsync().catch(e => console.error('▶️ play error', e));
    } else {
      sound.pauseAsync().catch(e => console.error('⏸ pause error', e));
    }
  }, [isPlaying, sound]);

  return (
    <View style={styles.musicPlayer}>
      {isPlaying && (
        <View style={styles.waveformContainer}>
          {[...Array(8)].map((_, i) => (
            <WaveformBar key={i} delay={i * 100} />
          ))}
        </View>
      )}
      <TouchableOpacity
        style={styles.musicButton}
        onPress={() => setPlaying(p => !p)}
      >
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
    alignItems: 'center',
    marginTop: 12,
  },
  musicButton: {
    padding: 8,
    borderRadius: 30,
    backgroundColor: '#f2f2f2',
  },
  waveformContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    height: 40,
    marginBottom: 8,
  },
});