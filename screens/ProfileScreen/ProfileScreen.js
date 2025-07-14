// screens/ProfileScreen/ProfileScreen.js

import { useFocusEffect, useNavigation } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import React, { useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { auth } from '../../firebase';
import { getApiHost } from '../../utils/getApiHost';

const HOST = getApiHost();

export default function ProfileScreen() {
  const [friendEmail, setFriendEmail] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [showUsernamePrompt, setShowUsernamePrompt] = useState(false);

  const navigation = useNavigation();

  // Replace useEffect with useFocusEffect for profile fetch
  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;
      (async () => {
        try {
          const token = await SecureStore.getItemAsync('userToken');
          if (!token) {
            setLoading(false);
            Alert.alert('Error', 'User not authenticated. Please log in again.');
            return;
          }
          // Fetch user profile from backend
          const res = await fetch(`${HOST}/auth/profile`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const json = await res.json();
          console.log('Profile response:', json);
          if (!res.ok || !json.email) {
            setLoading(false);
            Alert.alert('Could not load profile');
            return;
          }
          setEmail(json.email);
          setUsername(json.username || ''); // Set username if present, else empty string
          setLoading(false);
          // If username is missing, show prompt
          if (!json.username) setShowUsernamePrompt(true);
        } catch (e) {
          setLoading(false);
          Alert.alert('Error', 'Could not load profile.');
        }
      })();
      return () => { isActive = false; };
    }, [])
  );

  const handleUsernameChange = async () => {
    const trimmed = newUsername.trim();
    if (!trimmed) return Alert.alert('Enter a username');
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(trimmed))
      return Alert.alert('Invalid Username', '3-20 chars, letters, numbers, underscores only.');
    try {
      const token = await SecureStore.getItemAsync('userToken');
      if (!token) {
        Alert.alert('Error', 'User not authenticated. Please log in again.');
        return;
      }
      // Check username availability
      const checkRes = await fetch(`${HOST}/auth/check-username`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ username: trimmed })
      });
      const checkJson = await checkRes.json();
      if (!checkJson.available) return Alert.alert('Username Taken', 'Please choose another username.');
      // Update username (backend gets UID from token, not from body)
      const updateRes = await fetch(`${HOST}/auth/update-username`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ newUsername: trimmed })
      });
      const updateJson = await updateRes.json();
      if (!updateJson.success) throw new Error(updateJson.error || 'Update failed');
      setUsername(trimmed);
      setNewUsername('');
      setShowUsernamePrompt(false);
      setEditing(false);
      Alert.alert('Success', 'Username updated!');
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

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
      let json;
      try {
        json = await res.json();
      } catch (e) {
        // If response is not JSON (e.g., HTML error page), show user-friendly error
        Alert.alert('Error', 'User not found');
        return;
      }
      if (!json.success) throw new Error(json.error || 'Failed');
      Alert.alert('Friend added!');
      setFriendEmail('');
    } catch (e) {
      console.warn(e);
      Alert.alert('Error', e.message);
    }
  };

  // Add this function inside ProfileScreen
  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert('Error', 'No email found for this account.');
      return;
    }
    try {
      await auth.sendPasswordResetEmail(email);
      Alert.alert('Password Reset', 'A password reset email has been sent to your email address.');
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed to send password reset email.');
    }
  };

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      await SecureStore.deleteItemAsync('userToken');
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed to sign out.');
    }
  };

  if (loading) return <View style={styles.container}><Text>Loading...</Text></View>;

  return (
    <View style={styles.container}>
      {showUsernamePrompt && (
        <View style={styles.usernamePromptBox}>
          <Text style={styles.usernamePromptText}>
            Set a username to appear on the leaderboard and for social features!
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Enter username"
            autoCapitalize="none"
            value={newUsername}
            onChangeText={setNewUsername}
          />
          <TouchableOpacity style={styles.button} onPress={handleUsernameChange}>
            <Text style={styles.buttonText}>Set Username</Text>
          </TouchableOpacity>
        </View>
      )}
      <Text style={styles.header}>Profile</Text>
      <Text style={styles.infoText}>Email: {email}</Text>
      <Text style={styles.infoText}>Username: {username || '(not set)'}</Text>
      {!showUsernamePrompt && (editing ? (
        <View style={{ marginBottom: 16 }}>
          <TextInput
            style={styles.input}
            placeholder="Enter username"
            autoCapitalize="none"
            value={newUsername}
            onChangeText={setNewUsername}
          />
          <TouchableOpacity style={styles.button} onPress={handleUsernameChange}>
            <Text style={styles.buttonText}>Set Username</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.button} onPress={() => setEditing(true)}>
          <Text style={styles.buttonText}>Change Username</Text>
        </TouchableOpacity>
      ))}
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
      {/* Reset Password button moved below Add Friend */}
      {email ? (
        <TouchableOpacity style={[styles.button, { marginTop: 24 }]} onPress={handleResetPassword}>
          <Text style={styles.buttonText}>Reset Password</Text>
        </TouchableOpacity>
      ) : null}
      {/* Sign Out button below Reset Password */}
      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutButtonText}>Sign Out</Text>
      </TouchableOpacity>
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
    backgroundColor: '#7B2FF2',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  infoText: {
    marginBottom: 8,
    fontSize: 16,
  },
  usernamePromptBox: {
    backgroundColor:'#FFF3CD',
    borderRadius:8,
    padding:12,
    marginBottom:16,
    borderWidth:1,
    borderColor:'#FFECB3',
  },
  usernamePromptText: {
    color:'#856404',
    fontWeight:'600',
    marginBottom:8,
    fontSize: 15,
  },
  signOutButton: {
    backgroundColor: '#e53935',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 12,
  },
  signOutButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});