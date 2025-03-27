import { colors } from '@/app/shared/theme';
import React, { useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import Swipeable from 'react-native-gesture-handler/Swipeable';

interface SetRowProps {
  index: number;
  setData: { id: number; reps: string; weight: string; completed: boolean, previous: string };
  onUpdate: (field: 'reps' | 'weight', value: string) => void;
  onToggleComplete: () => void;
  onDelete: () => void;
}

const SetRow: React.FC<SetRowProps> = ({ index, setData, onUpdate, onToggleComplete, onDelete }) => {
  const swipeRef = useRef<Swipeable>(null);

  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const backgroundColor = dragX.interpolate({
      inputRange: [-150, -75, 0],
      outputRange: ['red', 'red', 'transparent'],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View style={[styles.deleteContainer, { backgroundColor }]}>
        <Text style={styles.deleteText}>Delete</Text>
      </Animated.View>
    );
  };

  return (
    <Swipeable
      ref={swipeRef}
      renderRightActions={renderRightActions}
      onSwipeableWillOpen={() => {
        setTimeout(() => onDelete(), 300);
      }}
      rightThreshold={100}
    >
      <View style={[styles.row, setData.completed && styles.completed]}>
        <View style={[styles.column, { flex: 0.5 }]}>
          <Text style={styles.label}>{index + 1}</Text>
        </View>
        <View style={[styles.column, { flex: 2 }]}>
          <Text style={[styles.label, {color: colors.muted}]}>
            {setData.previous ? setData.previous : '-'}
          </Text>
        </View>
        <View style={[styles.inputContainer, { flex: 1 }]}>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="Kg"
            placeholderTextColor="#888"
            value={setData.weight}
            onChangeText={(text) => onUpdate('weight', text)}
          />
        </View>
        <View style={[styles.inputContainer, { flex: 1 }]}>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="Reps"
            placeholderTextColor="#888"
            value={setData.reps}
            onChangeText={(text) => onUpdate('reps', text)}
          />
        </View>
        <View style={styles.checkContainer}>
          <TouchableOpacity
            style={[styles.checkButton, setData.completed && styles.checkActive]}
            onPress={onToggleComplete}
          >
            <Text style={styles.checkText}>✓</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Swipeable>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#1A1A1A',
    marginVertical: 2,
  },
  completed: {
    backgroundColor: '#2A2A2A',
    opacity: 0.7,
  },
  column: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: '#FFF',
    fontSize: 14,
    textAlign: 'center',
  },
  inputContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  input: {
    backgroundColor: '#2A2A2A',
    color: '#FFF',
    width: '100%',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 4,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  checkContainer: {
    flex: 0.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: 8,
  },
  checkButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#00FF88',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkActive: {
    backgroundColor: '#00FF88',
  },
  checkText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  deleteContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
    borderRadius: 6,
  },
  deleteText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default SetRow;
