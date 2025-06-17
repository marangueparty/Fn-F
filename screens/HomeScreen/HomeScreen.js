import { useState } from 'react';
import SidebarWrapper from '../../components/SidebarWrapper.js';
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
    <SidebarWrapper activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderTab()}
    </SidebarWrapper>
  );
}

