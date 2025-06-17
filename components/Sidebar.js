import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const tabs = ['Home', 'Focus', 'Leaderboard', 'Achievements'];

export default function Sidebar({ activeTab, setActiveTab }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <View style={[styles.sidebar, expanded ? styles.expanded : styles.collapsed]}>
      <TouchableOpacity onPress={() => setExpanded(!expanded)}>
        <Text style={styles.toggle}>{expanded ? '←' : '→'}</Text>
      </TouchableOpacity>

      {expanded && tabs.map(tab => (
        <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)}>
          <Text style={[styles.tab, activeTab === tab && styles.active]}>{tab}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: { backgroundColor: '#eee', paddingTop: 20 },
  expanded: { width: 120 },
  collapsed: { width: 40 },
  toggle: { fontSize: 18, textAlign: 'center', marginBottom: 10 },
  tab: { paddingVertical: 10, paddingLeft: 10 },
  active: { fontWeight: 'bold', color: '#5e17eb' },
});

