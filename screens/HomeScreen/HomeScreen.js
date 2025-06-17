import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Sidebar from '../components/Sidebar';
import AchievementsTab from './Tabs/AchievementsTab.js';
import FocusTab from './Tabs/FocusTab.js';
import HomeTab from './Tabs/HomeTab.js';
import LeaderboardTab from './Tabs/LeaderboardTab.js';

export default function HomeScreen() {
  const [activeTab, setActiveTab] = useState('Home');

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
    <View style={styles.container}>
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <View style={styles.mainContent}>
        {renderTab()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', flex: 1 },
  mainContent: { flex: 1, padding: 16, backgroundColor: '#fff' },
});
