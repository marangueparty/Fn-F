import React, { useState } from 'react';
import {
  Alert,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { auth } from '../firebase';

const validateEmail = (email) => {
  const re = /\S+@\S+\.\S+/; 
  return re.test(email);
};

const validatePassword = (password) => {
  //ensure that the user uses a strong password, at least 8 characters long,
  // with at least one uppercase letter, one lowercase letter, one digit, and one symbol
  const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d])[A-Za-z\d@$!%*?&]{8,}$/;
  return re.test(password);
};

export default function LoginScreen({ navigation }) {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    // 1. Client-side validation
    if (!email.trim()) {
      Alert.alert('Invalid Input', 'Please enter your email address.');
      return;
    }
    if (!validateEmail(email.trim())) {
      Alert.alert('Invalid Email', 'Please enter a valid email format.');
      return;
    }
    if (!password) {
      Alert.alert('Invalid Input', 'Please enter your password.');
      return;
    }
    if (!validatePassword(password)) {
      Alert.alert(
        'Weak Password',
        'Password must be at least 8 characters and include at least one uppercase letter, one lowercase letter, one digit, and one symbol.'
      );
      return;
    }

    try {
      const userCredential = await auth.signInWithEmailAndPassword(
        email.trim(),
        password
      );
      const user = userCredential.user;

      // make sure that the user is verified
      if (!user.emailVerified) {
        Alert.alert(
          'Email Not Verified',
          'Please check your inbox for the verification link before logging in.'
        );
        await auth.signOut();
        return;
      }

      // User is verified send to home screen
      navigation.replace('Home');
    } catch (err) {
      Alert.alert('Login failed', err.message);
    }
  };

  return (
    <View style={styles.container}>
      {/* Display the logo.png at the top */}
      <Image
       source={require('../assets/logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      
      {/* Title */}
      <Text style={styles.title}>Welcome Back</Text>

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

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Log In</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Don’t have an account?</Text>
        <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
          <Text style={styles.linkText}> Sign Up</Text>
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
    paddingHorizontal: 30
  },

  logo: {
    width: 300,
    height: 300,
    alignSelf: 'center',
    marginBottom: 30,
  },

  title:{
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 40,
    textAlign: 'center'
  },
  input:        {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20
  },
  button:       {
    backgroundColor: '#5e17eb',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10
  },
  buttonText:   {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16
  },
  footer:       {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 25
  },
  footerText:   {
    fontSize: 14,
    color: '#444'
  },
  linkText:     {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: 'bold'
  }
});