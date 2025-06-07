// LoginScreen/LoginScreen.js
import React, { useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

// Grab screen dimensions once
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

export default function LoginScreen({ navigation }) {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');

  const validateEmail = (e) => /\S+@\S+\.\S+/.test(e);
  const validatePassword = (p) =>
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*\W).{8,}$/.test(p);

  const handleLogin = () => {
    if (!email.trim() || !validateEmail(email)) {
      return Alert.alert('Invalid Email', 'Please enter a valid email address.');
    }
    if (!validatePassword(password)) {
      return Alert.alert(
        'Weak Password',
        'Password must be at least 8 characters and include uppercase, lowercase, a digit & a symbol.'
      );
    }
    // → your Firebase (or API) auth logic here
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Logo */}
        <Image
          source={require('../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        {/* Title */}
        <Text style={styles.title}>Welcome Back</Text>

        {/* Email */}
        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        {/* Password */}
        <TextInput
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={styles.input}
        />

        {/* Log In Button */}
        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Log In</Text>
        </TouchableOpacity>

        {/* Sign Up Link */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Don’t have an account?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
            <Text style={styles.linkText}> Sign Up</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: SCREEN_W * 0.05,   //  5% of screen width
  },
  logo: {
    width: '50%',                         // 50% of container width
    height: SCREEN_H * 0.25,              // 25% of screen height
    alignSelf: 'center',
    marginBottom: SCREEN_H * 0.05,        //  5% of screen height
  },
  title: {
    fontSize: SCREEN_H * 0.04,            //  4% of screen height
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: SCREEN_H * 0.05,        //  5% of screen height
  },
  input: {
    width: '100%',
    paddingVertical: SCREEN_H * 0.02,     //  2% of screen height
    paddingHorizontal: SCREEN_W * 0.03,   //  3% of screen width
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    marginBottom: SCREEN_H * 0.02,        //  2% of screen height
  },
  button: {
    backgroundColor: '#5e17eb',
    paddingVertical: SCREEN_H * 0.025,    //  2.5% of screen height
    borderRadius: 8,
    alignItems: 'center',
    marginTop: SCREEN_H * 0.02,           //  2% of screen height
  },
  buttonText: {
    color: '#fff',
    fontSize: SCREEN_H * 0.022,           //  2.2% of screen height
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SCREEN_H * 0.03,           //  3% of screen height
  },
  footerText: {
    fontSize: SCREEN_H * 0.02,            //  2% of screen height
    color: '#444',
  },
  linkText: {
    fontSize: SCREEN_H * 0.02,            //  2% of screen height
    color: '#007AFF',
    fontWeight: 'bold',
  },
});