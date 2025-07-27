// screens/LeaderboardScreen/LeaderboardScreen.js

import { useIsFocused } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { getApiHost } from '../../utils/getApiHost';
  
  const HOST = getApiHost();
  
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
      <View style={{ flex: 1, width: '100%' }}>
        <View style={styles.tableHeader}>
          <Text style={[styles.headerCell, styles.rankCell]}>Rank</Text>
          <Text style={[styles.headerCell, styles.nameCell]}>Name</Text>
          <Text style={[styles.headerCell, styles.minutesCell]}>Minutes</Text>
        </View>
        <FlatList
          data={data}
          keyExtractor={(item) => item.uid}
          contentContainerStyle={styles.container}
          renderItem={({ item, index }) => {
            let rankDisplay = `${index + 1}`;
            let rankStyle = styles.rank;
            let nameStyle = styles.email;
            let scoreStyle = styles.score;
            if (index === 0) {
              rankDisplay = '🥇';
              rankStyle = [styles.rank, styles.gold];
              nameStyle = [styles.email, styles.gold];
              scoreStyle = [styles.score, styles.gold];
            } else if (index === 1) {
              rankDisplay = '🥈';
              rankStyle = [styles.rank, styles.silver];
              nameStyle = [styles.email, styles.silver];
              scoreStyle = [styles.score, styles.silver];
            } else if (index === 2) {
              rankDisplay = '🥉';
              rankStyle = [styles.rank, styles.bronze];
              nameStyle = [styles.email, styles.bronze];
              scoreStyle = [styles.score, styles.bronze];
            }
            return (
              <View style={styles.tableRow}>
                <Text style={[rankStyle, styles.rankCell]} numberOfLines={1} ellipsizeMode="tail">{rankDisplay}</Text>
                <Text style={[nameStyle, styles.nameCell]} numberOfLines={1} ellipsizeMode="tail">{item.username ? item.username : item.email}</Text>
                <Text style={[scoreStyle, styles.minutesCell]} numberOfLines={1} ellipsizeMode="tail">{item.totalFocus} min</Text>
              </View>
            );
          }}
        />
      </View>
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
    tableHeader: {
      flexDirection: 'row',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderColor: '#e0e0e0',
      backgroundColor: '#f8f8f8',
      marginBottom: 8,
      width: '100%',
    },
    headerCell: {
      fontWeight: 'bold',
      fontSize: 16,
      color: '#333',
      paddingHorizontal: 2,
    },
    tableRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderColor: '#f0f0f0',
      backgroundColor: '#fff',
      width: '100%',
    },
    gold: { color: '#FFD700', fontWeight: 'bold' },
    silver: { color: '#C0C0C0', fontWeight: 'bold' },
    bronze: { color: '#CD7F32', fontWeight: 'bold' },
    rankCell: {
      flex: 1,
      textAlign: 'center',
      minWidth: 40,
      maxWidth: 60,
    },
    nameCell: {
      flex: 3,
      textAlign: 'left',
      paddingLeft: 4,
      minWidth: 80,
    },
    minutesCell: {
      flex: 2,
      textAlign: 'right',
      paddingRight: 4,
      minWidth: 60,
      maxWidth: 80,
      width: 80,
      // fontFamily and fontVariant removed for default font
    },
  });