// SignUpScreen/SignUpScreen.js
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

export default function SignUpScreen({ navigation }) {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');

  const validateEmail = e => /\S+@\S+\.\S+/.test(e);
  const validatePassword = p =>
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*\W).{8,}$/.test(p);

  const handleSignUp = async () => {
    if (!email.trim()) {
      return Alert.alert('Invalid Input', 'Please enter your email address.');
    }
    if (!validateEmail(email.trim())) {
      return Alert.alert('Invalid Email', 'Please enter a valid email format.');
    }
    if (!validatePassword(password)) {
      return Alert.alert(
        'Weak Password',
        'Password must be at least 8 characters and include uppercase, lowercase, a digit, and a symbol.'
      );
    }

    try {
      // exactly the same host logic as LoginScreen:
      const host = Platform.OS === 'android'
        ? 'http://10.0.2.2:3000'
        : 'http://192.168.1.161:3000'; // ← replace with your Mac’s LAN IP

      const res = await fetch(`${host}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || 'Sign up failed');
      }

      Alert.alert(
        'Verify Your Email',
        'A verification link has been sent to your inbox. Please check your email before logging in.'
      );
      navigation.replace('Login');
    } catch (err) {
      Alert.alert('Sign up failed', err.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={styles.input}
      />

      <TouchableOpacity style={styles.button} onPress={handleSignUp}>
        <Text style={styles.buttonText}>Sign Up</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Already have an account?</Text>
        <TouchableOpacity onPress={() => navigation.replace('Login')}>
          <Text style={styles.linkText}> Log In</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:    {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  title:        {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 40,
    textAlign: 'center',
  },
  input:        {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  button:       {
    backgroundColor: '#5e17eb',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText:   {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  footer:       {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 25,
  },
  footerText:   {
    fontSize: 14,
    color: '#444',
  },
  linkText:     {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: 'bold',
  },
});