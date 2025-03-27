import { View, ActivityIndicator, StyleSheet } from 'react-native';

interface Props {
  visible: boolean;
}

export default function LoadingOverlay({ visible }: Props) {
  if (!visible) return null;
  
  return (
    <View style={styles.overlay}>
      <ActivityIndicator size="large" color="#00FF88" />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(17,17,17,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
});