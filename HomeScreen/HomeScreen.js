import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import { auth } from '../firebase';

export default function HomeScreen({ navigation }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        navigation.replace('Login');
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [navigation]);

  const handleSignOut = async () => {
    try {
      await auth.signOut();
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.welcomeText}>
        Welcome,{"\n"}
        <Text style={styles.emailText}>{user?.email}</Text>
      </Text>

      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  container:    {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    paddingHorizontal: 30
  },
  welcomeText:  {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 40
  },
  emailText:    {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF'
  },
  signOutButton:{
    backgroundColor: '#FF3B30',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center'
  },
  signOutText:  {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  }
});