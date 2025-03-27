
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

const AddTemplateButton: React.FC<{ onPress: () => void }> = ({ onPress }) => {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Text style={styles.text}>+ Template</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#00FF88',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 5,
  },
  text: {
    color: '#0A0A0A',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default AddTemplateButton;