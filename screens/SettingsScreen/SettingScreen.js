// screens/SettingsScreen.js

import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function SettingsScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.item}
        onPress={() => navigation.navigate('Account')}
      >
        <Text style={styles.text}>👤 Account</Text>
        <Text style={styles.arrow}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.item}
        onPress={() => navigation.navigate('Notifications')}
      >
        <Text style={styles.text}>🔔 Notifications</Text>
        <Text style={styles.arrow}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.item}
        onPress={() => navigation.navigate('SmartWatch')}
      >
        <Text style={styles.text}>⌚ Smart Watch</Text>
        <Text style={styles.arrow}>›</Text>
      </TouchableOpacity>

      <View style={styles.addFriendContainer}>
        <Text style={styles.addFriendLabel}>Add Friends</Text>
        <View style={styles.inputPlaceholder}>
          <Text style={styles.placeholderText}>@username</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, flex: 1, backgroundColor: '#fff' },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomColor: '#ccc',
    borderBottomWidth: 1,
  },
  text: { fontSize: 18 },
  arrow: { fontSize: 18, color: '#888' },
  addFriendContainer: { marginTop: 40 },
  addFriendLabel: { fontSize: 16, marginBottom: 10, fontWeight: '600' },
  inputPlaceholder: {
    height: 40,
    borderColor: '#999',
    borderWidth: 1,
    borderRadius: 6,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  placeholderText: { color: '#999', fontSize: 16 },
});
