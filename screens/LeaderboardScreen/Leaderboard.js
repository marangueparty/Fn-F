// screens/LeaderboardScreen/LeaderboardScreen.js

import {
    SERVER_HOST_ANDROID,
    SERVER_HOST_DEVICE,
    SERVER_HOST_IOS,
} from '@env';
import { useIsFocused } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Platform,
    StyleSheet,
    Text,
    View,
} from 'react-native';
  
  const HOST =
    Platform.OS === 'android'
      ? SERVER_HOST_ANDROID
      : Platform.OS === 'ios'
      ? SERVER_HOST_IOS
      : SERVER_HOST_DEVICE;
  
  export default function LeaderboardScreen() {
    const isFocused = useIsFocused();          // ← track focus
    const [loading, setLoading] = useState(false);
    const [data,    setData]    = useState([]);
    const [error,   setError]   = useState(null);
  
    useEffect(() => {
      if (!isFocused) return;                  // ← only when focused
      (async () => {
        setLoading(true);
        try {
          const token = await SecureStore.getItemAsync('userToken');
          const res   = await fetch(`${HOST}/leaderboard`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const json = await res.json();
          if (!json.success) throw new Error(json.error || 'Unknown error');
          setData(json.leaderboard);
        } catch (e) {
          console.warn(e);
          setError(e.message);
        } finally {
          setLoading(false);
        }
      })();
    }, [HOST, isFocused]);                      // ← re-run on focus
  
    if (loading) return <ActivityIndicator style={{ flex: 1 }} />;
    if (error)
      return (
        <View style={styles.center}>
          <Text style={styles.error}>Error: {error}</Text>
        </View>
      );
  
    return (
      <FlatList
        data={data}
        keyExtractor={(item) => item.uid}
        contentContainerStyle={styles.container}
        renderItem={({ item, index }) => (
          <View style={styles.row}>
            <Text style={styles.rank}>{index + 1}.</Text>
            <View style={styles.info}>
              <Text style={styles.email}>{item.email}</Text>
              <Text style={styles.score}>{item.totalFocus} min</Text>
            </View>
          </View>
        )}
      />
    );
  }
  
  const styles = StyleSheet.create({
    container: { padding: 16 },
    row:       { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    rank:      { width: 24, fontSize: 18, textAlign: 'right', marginRight: 8 },
    info:      { flex: 1, flexDirection: 'row', justifyContent: 'space-between' },
    email:     { fontSize: 16 },
    score:     { fontSize: 16, fontWeight: '600' },
    center:    { flex: 1, justifyContent: 'center', alignItems: 'center' },
    error:     { color: 'red' },
  });