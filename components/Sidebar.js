import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

const tabs = ['Home', 'Focus', 'Leaderboard', 'Achievements'];

export default function Sidebar({ expanded, setExpanded, activeTab, setActiveTab }) {
  return (
    <View style={styles.sidebar}>
      <TouchableOpacity onPress={() => setExpanded(false)} style={styles.closeIcon}>
        <Icon name="x" size={26} color="#fff" />
      </TouchableOpacity>

      {tabs.map(tab => (
        <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)}>
          <Text style={[styles.tab, activeTab === tab && styles.active]}>{tab}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: 140,
    backgroundColor: '#a884ef',
    paddingTop: 40,
    paddingHorizontal: 10,
    height: '100%',
  },
  closeIcon: {
    marginBottom: 20,
  },
  tab: {
    paddingVertical: 12,
    fontSize: 16,
    color: '#fff',
  },
  active: {
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
});

