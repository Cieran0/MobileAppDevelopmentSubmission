import { View, Text, StyleSheet } from 'react-native';

const ExerciseSkeleton = () => (
  <View style={styles.container}>
    {[...Array(3)].map((_, i) => (
      <View key={i} style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title}>Loading...</Text>
          <View style={styles.button} />
        </View>
        <View style={styles.setRow}>
          <View style={styles.setNumber} />
          <View style={styles.inputs} />
          <View style={styles.check} />
        </View>
      </View>
    ))}
  </View>
);

const styles = StyleSheet.create({
  container: {
    padding: 16,
    alignItems: 'center',
  },
  card: {
    width: '90%',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    color: '#333',
    fontSize: 18,
    fontWeight: '600',
  },
  button: {
    width: 48,
    height: 48,
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
  },
  setRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#3A3A3A',
  },
  setNumber: {
    width: 24,
    height: 24,
    backgroundColor: '#2A2A2A',
    borderRadius: 4,
  },
  inputs: {
    flex: 1,
    height: 40,
    backgroundColor: '#2A2A2A',
    borderRadius: 4,
    marginHorizontal: 4,
  },
  check: {
    width: 28,
    height: 28,
    backgroundColor: '#2A2A2A',
    borderRadius: 14,
  },
});