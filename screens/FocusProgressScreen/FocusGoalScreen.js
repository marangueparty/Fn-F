import {
    SERVER_HOST_ANDROID,
    SERVER_HOST_DEVICE,
    SERVER_HOST_IOS,
} from '@env';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';
import {
    Alert,
    Button,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

const HOST =
  Platform.OS === 'android'
    ? SERVER_HOST_ANDROID
    : Platform.OS === 'ios'
      ? SERVER_HOST_IOS
      : SERVER_HOST_DEVICE;

export default function FocusGoalScreen() {
  const [goal, setGoal] = useState('');
  const [loading, setLoading] = useState(true);

  async function fetchGoal() {
    try {
      const token = await SecureStore.getItemAsync('userToken');
      const resp = await fetch(`${HOST}/focus-goal`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const json = await resp.json();
      if (json.success && json.goalMinutes) {
        setGoal(String(json.goalMinutes));
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to load focus goal.');
    } finally {
      setLoading(false);
    }
  }

  async function saveGoal() {
    const numGoal = Number(goal);
    if (isNaN(numGoal) || numGoal <= 0) {
      Alert.alert('Invalid Input', 'Please enter a positive number');
      return;
    }

    try {
      const token = await SecureStore.getItemAsync('userToken');
      const resp = await fetch(`${HOST}/focus-goal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ goalMinutes: numGoal }),
      });
      const json = await resp.json();
      if (json.success) {
        Alert.alert('Success', 'Focus goal updated');
      } else {
        Alert.alert('Error', 'Failed to update focus goal');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to update focus goal');
    }
  }

  useEffect(() => {
    fetchGoal();
  }, []);

  if (loading) return <Text style={{ padding: 20, textAlign: 'center' }}>Loading...</Text>;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : null} style={styles.container}>
      <View style={styles.inner}>
        <Text style={styles.label}>Set your daily focus goal (minutes)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={goal}
          onChangeText={setGoal}
          placeholder="Enter minutes"
        />
        <Button title="Save Goal" onPress={saveGoal} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inner: {
    padding: 24,
    flex: 1,
    justifyContent: 'center',
  },
  label: {
    fontSize: 18,
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 6,
    padding: 12,
    marginBottom: 20,
    fontSize: 18,
  },
});
