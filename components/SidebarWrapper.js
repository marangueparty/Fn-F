import { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Feather'; // using Feather icons
import Sidebar from './Sidebar';

export default function SidebarWrapper({ children, activeTab, setActiveTab }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <View style={styles.container}>
      {/* Always render the hamburger button */}
      {!expanded && (
        <TouchableOpacity style={styles.hamburgerButton} onPress={() => setExpanded(true)}>
          <Icon name="menu" size={26} color="#000" />
        </TouchableOpacity>
      )}

      {/* Conditionally render the sidebar */}
      {expanded && (
        <Sidebar
          expanded={expanded}
          setExpanded={setExpanded}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      )}

      {/* Main content */}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flex: 1,
  },
  hamburgerButton: {
    position: 'absolute',
    top: 45,
    left: 15,
    zIndex: 10,
  },
  content: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
});
