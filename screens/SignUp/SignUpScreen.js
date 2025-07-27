// screens/SignUp/SignUpScreen.js
import React, { useState } from 'react';
import {
    Alert,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { getApiHost } from '../../utils/getApiHost';

export default function SignUpScreen({ navigation }) {
  const [email, setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [checking, setChecking] = useState(false);
  const host = getApiHost();

  const validateEmail = e => /\S+@\S+\.\S+/.test(e);
  const validatePassword = p =>
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*\W).{8,}$/.test(p);
  const validateUsername = u => /^[a-zA-Z0-9_]{3,20}$/.test(u);

  const checkUsername = async (u) => {
    if (!validateUsername(u)) return false;
    try {
      const res = await fetch(`${host}/auth/check-username`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: u })
      });
      const json = await res.json();
      return json.available;
    } catch {
      return false;
    }
  };

  const handleSignUp = async () => {
    if (!email.trim())
      return Alert.alert('Invalid Input', 'Please enter your email.');
    if (!validateEmail(email.trim()))
      return Alert.alert('Invalid Email', 'Please enter a valid email.');
    if (!validatePassword(password))
      return Alert.alert(
        'Weak Password',
        '8+ chars including uppercase, lowercase, digit & symbol.'
      );
    if (!validateUsername(username))
      return Alert.alert('Invalid Username', '3-20 chars, letters, numbers, underscores only.');
    setChecking(true);
    const available = await checkUsername(username);
    setChecking(false);
    if (!available)
      return Alert.alert('Username Taken', 'Please choose another username.');
    try {
      const res = await fetch(`${host}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password, username })
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Sign up failed');
      Alert.alert(
        'Verify Your Email',
        'A link has been sent to your inbox. Please check before logging in.'
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
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        style={styles.input}
        autoCapitalize="none"
      />
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
      <TouchableOpacity style={styles.button} onPress={handleSignUp} disabled={checking}>
        <Text style={styles.buttonText}>{checking ? 'Checking...' : 'Sign Up'}</Text>
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
  container:  { flex:1, backgroundColor:'#fff', justifyContent:'center', paddingHorizontal:30 },
  title:      { fontSize:28, fontWeight:'bold', marginBottom:40, textAlign:'center' },
  input:      {
    width:'100%', borderWidth:1, borderColor:'#ccc',
    backgroundColor:'#f9f9f9', padding:12, borderRadius:8, marginBottom:20
  },
  button:     { backgroundColor:'#5e17eb', paddingVertical:15, borderRadius:8, alignItems:'center', marginTop:10 },
  buttonText: { color:'#fff', fontWeight:'bold', fontSize:16 },
  footer:     { flexDirection:'row', justifyContent:'center', marginTop:25 },
  footerText: { fontSize:14, color:'#444' },
  linkText:   { fontSize:14, color:'#007AFF', fontWeight:'bold' },
});
