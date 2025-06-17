import { StyleSheet, Text, View } from 'react-native';

export default function PlaceholderBox({ label }) {
  return (
    <View style={styles.box}>
      <Text>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    height: 150,
    backgroundColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginBottom: 16,
  },
});
