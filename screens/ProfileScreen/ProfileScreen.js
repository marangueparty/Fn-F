// screens/LoginScreen.js

import * as SecureStore from 'expo-secure-store';
import React, { useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Modal,
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
  const [password, setPassword]               = useState('');
  const [showResetModal, setShowResetModal]   = useState(false);
  const [resetEmail,    setResetEmail]        = useState('');
  const host = getApiHost();

  const validateEmail = e => /\S+@\S+\.\S+/.test(e);
  const validatePassword = p =>
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*\W).{8,}$/.test(p);

  const handleLogin = async () => {
    if (!emailOrUsername.trim()) {
      return Alert.alert('Invalid Input','Please enter your email or username.');
    }
    if (!validatePassword(password)) {
      return Alert.alert(
        'Weak Password',
        'Must be 8+ chars with uppercase, lowercase, digit & symbol.'
      );
    }

    // if they entered a username, look up email first
    let email = emailOrUsername.trim();
    if (!validateEmail(emailOrUsername)) {
      try {
        const res = await fetch(`${host}/auth/lookup-email`, {
          method: 'POST',
          headers: { 'Content-Type':'application/json' },
          body: JSON.stringify({ username: emailOrUsername.trim() })
        });
        const json = await res.json();
        if (!json.email) throw new Error(json.error||'Username not found');
        email = json.email;
      } catch (err) {
        return Alert.alert('Login failed', err.message);
      }
    }

    // now attempt login
    try {
      const res = await fetch(`${host}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ email, password })
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error||'Login failed');
      await SecureStore.setItemAsync('userToken', json.token);
      navigation.replace('Home');
    } catch (err) {
      Alert.alert('Login failed', err.message);
    }
  };

  const handleForgotPassword = () => {
    setResetEmail('');
    setShowResetModal(true);
  };

  const submitForgotPassword = async () => {
    if (!validateEmail(resetEmail.trim())) {
      return Alert.alert('Invalid Email','Please enter a valid email address.');
    }
    try {
      const res = await fetch(`${host}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ email: resetEmail.trim() }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error||'Request failed');
      Alert.alert(
        'Email Sent',
        'Check your inbox for a password reset link.'
      );
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setShowResetModal(false);
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

        <TouchableOpacity onPress={handleForgotPassword}>
          <Text style={styles.forgotText}>Forgot password?</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don’t have an account?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
            <Text style={styles.linkText}> Sign Up</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* ——— Forgot Password Modal ——— */}
      <Modal
        visible={showResetModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowResetModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reset Password</Text>
            <Text style={styles.modalSubtitle}>
              Enter your email to receive a reset link
            </Text>
            <TextInput
              placeholder="your@email.com"
              value={resetEmail}
              onChangeText={setResetEmail}
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowResetModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={submitForgotPassword}
              >
                <Text style={styles.saveButtonText}>Send Link</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:      { flex:1, backgroundColor:'#fff' },
  container: { flex:1, justifyContent:'center', paddingHorizontal: SCREEN_W*0.05 },
  logo:      { width:'50%', height: SCREEN_H*0.25, alignSelf:'center', marginBottom: SCREEN_H*0.05 },
  title:     { fontSize: SCREEN_H*0.04, fontWeight:'bold', textAlign:'center', marginBottom: SCREEN_H*0.05 },
  input:     {
    width:'100%',
    paddingVertical: SCREEN_H*0.02,
    paddingHorizontal: SCREEN_W*0.03,
    borderRadius:8,
    backgroundColor:'#f9f9f9',
    marginBottom: SCREEN_H*0.02,
  },
  button:    { backgroundColor:'#5e17eb', paddingVertical: SCREEN_H*0.025, alignItems:'center', marginTop: SCREEN_H*0.01 },
  buttonText:{ color:'#fff', fontSize: SCREEN_H*0.022, fontWeight:'bold' },
  forgotText:{ color:'#007AFF', textAlign:'center', marginTop:8 },
  footer:    { flexDirection:'row', justifyContent:'center', marginTop: SCREEN_H*0.03 },
  footerText:{ fontSize: SCREEN_H*0.02, color:'#444' },
  linkText:  { fontSize: SCREEN_H*0.02, color:'#007AFF', fontWeight:'bold' },

  /* Modal Styles */
  modalOverlay:{
    flex:1,
    backgroundColor:'rgba(0,0,0,0.4)',
    justifyContent:'center',
    alignItems:'center',
  },
  modalContent:{
    width: SCREEN_W*0.8,
    backgroundColor:'#fff',
    borderRadius:12,
    padding:20,
  },
  modalTitle:{ fontSize:18,fontWeight:'600',color:'#333',marginBottom:8,textAlign:'center' },
  modalSubtitle:{ fontSize:14,color:'#666',marginBottom:16, textAlign:'center' },
  modalButtons:{ flexDirection:'row', justifyContent:'space-between' },
  modalButton:{ flex:1, padding:12, borderRadius:6, alignItems:'center' },
  cancelButton:{ backgroundColor:'#eee', marginRight:8 },
  saveButton:{ backgroundColor:'#5e17eb' },
  cancelButtonText:{ color:'#555' },
  saveButtonText:{ color:'#fff' },
});