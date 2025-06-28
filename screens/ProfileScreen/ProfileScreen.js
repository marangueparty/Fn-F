// screens/ProfileScreen/ProfileScreen.js

import {
  SERVER_HOST_ANDROID,
  SERVER_HOST_DEVICE,
  SERVER_HOST_IOS,
} from '@env';
import * as SecureStore from 'expo-secure-store';
import React, { useState } from 'react';
import {
  Alert,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const HOST =
  Platform.OS === 'android'
    ? SERVER_HOST_ANDROID
    : Platform.OS === 'ios'
    ? SERVER_HOST_IOS
    : SERVER_HOST_DEVICE;

export default function ProfileScreen() {
  const [friendEmail, setFriendEmail] = useState('');

  const handleAddFriend = async () => {
    if (!friendEmail.trim()) {
      return Alert.alert('Enter an email');
    }
    try {
      const token = await SecureStore.getItemAsync('userToken');
      const res = await fetch(`${HOST}/friends`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: friendEmail.trim() }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed');
      Alert.alert('Friend added!');
      setFriendEmail('');
    } catch (e) {
      console.warn(e);
      Alert.alert('Error', e.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Add a Friend</Text>
      <TextInput
        style={styles.input}
        placeholder="friend@example.com"
        autoCapitalize="none"
        keyboardType="email-address"
        value={friendEmail}
        onChangeText={setFriendEmail}
      />
      <TouchableOpacity style={styles.button} onPress={handleAddFriend}>
        <Text style={styles.buttonText}>Add Friend</Text>
      </TouchableOpacity>
      {/* …you can also add “Change Password” UI here… */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, padding:16, backgroundColor:'#fff' },
  header:    { fontSize:20, fontWeight:'600', marginBottom:12 },
  input: {
    borderWidth:1,
    borderColor:'#ccc',
    borderRadius:8,
    padding:12,
    marginBottom:12,
  },
  button: {
    backgroundColor:'#5e17eb',
    padding:12,
    borderRadius:8,
    alignItems:'center',
  },
  buttonText: { color:'#fff', fontWeight:'600' },
});