import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import SetRow from './SetRow';
import { WorkoutExercise } from '@/app/types/workoutTypes';
import { cards, typography } from '@/app/shared/theme';


interface ExerciseCardProps {
  exercise: WorkoutExercise;
  onAddSet: () => void;
  onUpdateSetField: (setId: number, field: 'reps' | 'weight', value: string) => void;
  onToggleSetComplete: (setId: number) => void;
  onDeleteSet: (setId: number) => void;
  onDeleteExercise: () => void; // New prop for deleting the entire exercise
}

const ExerciseCard: React.FC<ExerciseCardProps> = ({
  exercise,
  onAddSet,
  onUpdateSetField,
  onToggleSetComplete,
  onDeleteSet,
  onDeleteExercise, // Destructure the new prop
}) => {
  return (
    <View style={[localStyles.exerciseContainer, cards.exercise]}>
      {/* Red delete button in the top-right corner */}
      <TouchableOpacity
        style={localStyles.deleteExerciseButton}
        onPress={onDeleteExercise}
      >
        <Text style={localStyles.deleteExerciseText}>×</Text>
      </TouchableOpacity>

      <Text style={typography.exerciseName}>{exercise.name}</Text>
      <View style={localStyles.setHeaderRow}>
        <View style={[localStyles.headerColumn, { flex: 0.5 }]}>
          <Text style={localStyles.headerText}>Set</Text>
        </View>
        <View style={[localStyles.headerColumn, { flex: 2 }]}>
          <Text style={localStyles.headerText}>Previous</Text>
        </View>
        <View style={[localStyles.headerColumn, { flex: 1 }]}>
          <Text style={localStyles.headerText}>Kg</Text>
        </View>
        <View style={[localStyles.headerColumn, { flex: 1 }]}>
          <Text style={localStyles.headerText}>Reps</Text>
        </View>
        <View style={[localStyles.headerColumn, { flex: 0.5 }]} />
      </View>
      {exercise.sets.map((set, index) => (
        <SetRow
          key={set.id}
          index={index}
          setData={set}
          onUpdate={(field, value) => onUpdateSetField(set.id, field, value)}
          onToggleComplete={() => onToggleSetComplete(set.id)}
          onDelete={() => onDeleteSet(set.id)}
        />
      ))}
      <TouchableOpacity style={localStyles.addSetButton} onPress={onAddSet}>
        <Text style={localStyles.addSetButtonText}>+ Add Set</Text>
      </TouchableOpacity>
    </View>
  );
};

const localStyles = StyleSheet.create({
  exerciseContainer: {
    width: '100%',
    alignSelf: 'center',
    marginVertical: 10,
    position: 'relative', // Needed for absolute positioning of the delete button
  },
  setHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#3A3A3A',
  },
  headerColumn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  addSetButton: {
    backgroundColor: '#2A2A2A',
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  addSetButtonText: {
    color: '#00FF88',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteExerciseButton: {
    position: 'absolute',
    right: 10,
    top: 10,
    backgroundColor: '#FF3B30',
    width: 48, // Minimum 48x48 for Android touch targets
    height: 48, // Minimum 48x48 for Android touch targets
    borderRadius: 8, // Slightly rounded corners
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1, // Ensure it's above other elements
  },
  deleteExerciseText: {
    color: 'white',
    fontSize: 28, // Larger "×" to match the bigger button
    fontWeight: 'bold',
    lineHeight: 28, // Adjust line height for better alignment
  },
});

export default ExerciseCard;