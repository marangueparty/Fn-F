// screens/HomeScreen/HomeScreen.js

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

// your four tabs:
import AchievementsTab from './Tabs/AchievementsTab'; // achievements/levels
import FocusTab from './Tabs/FocusTab'; // focus analytics
import HomeTab from './Tabs/HomeTab'; // the Timer screen
import LeaderboardTab from './Tabs/LeaderboardTab'; // new leaderboard

const Tab = createBottomTabNavigator();

export default function HomeScreen() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      {/* floating profile/settings button */}
      <TouchableOpacity
        onPress={() => navigation.navigate('Profile')}
        style={styles.profileIcon}
      >
        <Icon name="user" size={24} color="#000" />
      </TouchableOpacity>

      {/* bottom tabs */}
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ color, size }) => {
            let name;
            switch (route.name) {
              case 'Timer':        name = 'home';          break;
              case 'Focus':        name = 'clock';         break;
              case 'Achievements': name = 'award';         break;
              case 'Leaderboard':  name = 'bar-chart-2';   break;
            }
            return <Icon name={name} size={size} color={color} />;
          },
          tabBarActiveTintColor:   '#5e17eb',
          tabBarInactiveTintColor: 'gray',
        })}
      >
        <Tab.Screen name="Timer"        component={HomeTab} />
        <Tab.Screen name="Focus"        component={FocusTab} />
        <Tab.Screen name="Achievements" component={AchievementsTab} />
        <Tab.Screen name="Leaderboard"  component={LeaderboardTab} />
      </Tab.Navigator>
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1 },
  profileIcon: {
    position:        'absolute',
    top:             20,
    right:           20,
    zIndex:          20,
    padding:         8,
    backgroundColor: '#fff',
    borderRadius:    20,
    elevation:       3,
    shadowColor:     '#000',
    shadowOpacity:   0.1,
    shadowOffset:    { width: 0, height: 2 },
    shadowRadius:    4,
  },
});