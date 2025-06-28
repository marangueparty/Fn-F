// screens/NotificationsScreen.js
import { StyleSheet, Text, View } from 'react-native';

export default function NotificationsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Notifications Settings Placeholder</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex:1, justifyContent:'center', alignItems:'center'},
  text: {fontSize:18, color:'#333'}
});
