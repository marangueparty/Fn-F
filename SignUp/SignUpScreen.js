import React, { useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

import { auth } from '../firebase';

const validateEmail = (email) => {
  const re = /\S+@\S+\.\S+/;
  return re.test(email);
};

const validatePassword = (password) => {
  const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d])[A-Za-z\d@$!%*?&]{8,}$/;
  return re.test(password);
};

export default function SignUpScreen({ navigation }) {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');

  const handleSignUp = async () => {
    if (!email.trim()) {
      Alert.alert('Invalid Input', 'Please enter your email address.');
      return;
    }
    if (!validateEmail(email.trim())) {
      Alert.alert('Invalid Email', 'Please enter a valid email format.');
      return;
    }
    if (!password) {
      Alert.alert('Invalid Input', 'Please enter a password.');
      return;
    }
    if (!validatePassword(password)) {
      Alert.alert(
        'Weak Password',
        'Password must be at least 8 characters and include at least one uppercase letter, one lowercase letter, one digit, and one symbol.'
      );
      return;
    }

    // Create user account in the Firebase Auth system
    try {
      const userCredential = await auth.createUserWithEmailAndPassword(
        email.trim(),
        password
      );
      const user = userCredential.user;

      // Send verification email thru firebase
      await user.sendEmailVerification();

      Alert.alert(
        'Verify Your Email',
        'A verification link has been sent to your inbox. Please check your email before logging in.'
      );

      await auth.signOut();
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
    paddingHorizontal: 30
  },
  title:        {
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