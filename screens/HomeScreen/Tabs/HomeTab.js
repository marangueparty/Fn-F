import { StyleSheet, Text, View } from 'react-native';
import StudyTimer from '../../../components/StudyTimer';

export default function HomeTab() {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Timer</Text>
      <StudyTimer />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  heading: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 12,
  },
});
