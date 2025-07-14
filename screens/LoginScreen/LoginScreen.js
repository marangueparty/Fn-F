import * as SecureStore from 'expo-secure-store';
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
import { getApiHost } from '../../utils/getApiHost';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

export default function LoginScreen({ navigation }) {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const host = getApiHost();

  const validateEmail = e => /\S+@\S+\.\S+/.test(e);
  const validatePassword = p =>
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*\W).{8,}$/.test(p);

  const handleLogin = async () => {
    if (!emailOrUsername.trim())
      return Alert.alert('Invalid Input','Please enter your email or username.');
    if (!validatePassword(password))
      return Alert.alert(
        'Weak Password',
        'Must be 8+ chars with uppercase, lowercase, digit & symbol.'
      );
    let email = emailOrUsername.trim();
    if (!validateEmail(emailOrUsername)) {
      // Not an email, treat as username
      try {
        const res = await fetch(`${host}/auth/lookup-email`, {
          method: 'POST',
          headers: { 'Content-Type':'application/json' },
          body: JSON.stringify({ username: emailOrUsername.trim() })
        });
        const json = await res.json();
        if (!json.email) throw new Error(json.error || 'Username not found');
        email = json.email;
      } catch (err) {
        return Alert.alert('Login failed', err.message);
      }
    }
    try {
      const res = await fetch(`${host}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ email, password })
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Login failed');
      await SecureStore.setItemAsync('userToken', json.token);
      navigation.replace('Home');
    } catch (err) {
      Alert.alert('Login failed', err.message);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS==='ios'?'padding':undefined}
      >
        <Image
          source={require('../../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>Welcome Back</Text>
        <TextInput
          placeholder="Email or Username"
          value={emailOrUsername}
          onChangeText={setEmailOrUsername}
          style={styles.input}
          autoCapitalize="none"
        />
        <TextInput
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={styles.input}
        />
        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Log In</Text>
        </TouchableOpacity>
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
  safe:      { flex:1, backgroundColor:'#fff' },
  container: { flex:1, justifyContent:'center', paddingHorizontal: SCREEN_W*0.05 },
  logo:      { width:'50%', height: SCREEN_H*0.25, alignSelf:'center', marginBottom: SCREEN_H*0.05 },
  title:     { fontSize: SCREEN_H*0.04, fontWeight:'bold', textAlign:'center', marginBottom: SCREEN_H*0.05 },
  input:     {
    width:'100%', paddingVertical: SCREEN_H*0.02, paddingHorizontal: SCREEN_W*0.03,
    borderRadius:8, backgroundColor:'#f9f9f9', marginBottom: SCREEN_H*0.02
  },
  button:    { backgroundColor:'#5e17eb', paddingVertical: SCREEN_H*0.025, alignItems:'center', marginTop: SCREEN_H*0.02 },
  buttonText:{ color:'#fff', fontSize: SCREEN_H*0.022, fontWeight:'bold' },
  footer:    { flexDirection:'row', justifyContent:'center', marginTop: SCREEN_H*0.03 },
  footerText:{ fontSize: SCREEN_H*0.02, color:'#444' },
  linkText:  { fontSize: SCREEN_H*0.02, color:'#007AFF', fontWeight:'bold' },
});