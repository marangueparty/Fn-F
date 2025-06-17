import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import SidebarWrapper from '../../components/SidebarWrapper.js';
import AchievementsTab from './Tabs/AchievementsTab.js';
import FocusTab from './Tabs/FocusTab.js';
import HomeTab from './Tabs/HomeTab.js';
import LeaderboardTab from './Tabs/LeaderboardTab.js';

export default function HomeScreen() {
  const [activeTab, setActiveTab] = useState('Home');
  const navigation = useNavigation();

  const renderTab = () => {
    switch (activeTab) {
      case 'Focus':
        return <FocusTab />;
      case 'Leaderboard':
        return <LeaderboardTab />;
      case 'Achievements':
        return <AchievementsTab />;
      default:
        return <HomeTab />;
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Profile icon floating top-right */}
      <TouchableOpacity
        onPress={() => navigation.navigate('Profile')}
        style={styles.profileIcon}
      >
        <Icon name="user" size={24} color="#000" />
      </TouchableOpacity>

      {/* Main app layout */}
      <SidebarWrapper activeTab={activeTab} setActiveTab={setActiveTab}>
        {renderTab()}
      </SidebarWrapper>
    </View>
  );
}

const styles = StyleSheet.create({
  profileIcon: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 20,
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
    elevation: 3, 
    shadowColor: '#000', 
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
});

