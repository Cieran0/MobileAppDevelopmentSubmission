import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { cards, typography, colors } from '../shared/theme';

interface HistoryCardProps {
  session: {
    date: string;
    duration: string;
    prs: string;
    total_volume: number;
    exercises: Array<{
      name: string;
      sets: Array<{
        reps: string;
        weight: string;
      }>;
    }>;
  };
}

const HistoryCard: React.FC<HistoryCardProps> = ({ session }) => {
  const getBestSet = (sets: any[]) => {
    return sets.reduce((best, set) => {
      const volume = parseInt(set.reps) * parseInt(set.weight);
      return volume > (best.volume || 0) ? { ...set, volume } : best;
    }, {} as any);
  };

  const calculateTotalVolume = () => {
    return session.exercises.reduce((total, exercise) => {
      return total + exercise.sets.reduce((exTotal, set) => {
        return exTotal + (parseInt(set.reps) * parseInt(set.weight));
      }, 0);
    }, 0);
  };

  return (
    <View style={[cards.exercise, styles.card]}>
      <View style={styles.header}>
        <Text style={styles.date}>{session.date}</Text>
        <TouchableOpacity style={styles.editButton}>
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.statsRow}>
        <View style={styles.statContainer}>
          <Ionicons name="time-outline" size={20} color={colors.muted} />
          <Text style={styles.statText}>{session.duration}</Text>
        </View>
        <View style={styles.statContainer}>
          <Ionicons name="trophy-outline" size={20} color={colors.muted} />
          <Text style={styles.statText}>{session.prs}</Text>
        </View>
        <View style={styles.statContainer}>
          <Ionicons name="barbell-outline" size={20} color={colors.muted} />
          <Text style={styles.statText}>{calculateTotalVolume()}kg</Text>
        </View>
      </View>
      
      <View style={styles.headersRow}>
        <Text style={[styles.headerText, styles.flex1]}>Exercise</Text>
        <Text style={[styles.headerText, styles.flex1, styles.textRight]}>Best Set</Text>
      </View>

      {session.exercises.map((exercise, index) => {
        const bestSet = getBestSet(exercise.sets);
        return (
          <View key={index} style={styles.exerciseRow}>
            <Text style={[styles.exerciseName, styles.flex1]}>
              {exercise.sets.length}x {exercise.name}
            </Text>
            <Text style={[styles.bestSet, styles.flex1, styles.textRight]}>
              {bestSet.reps} x {bestSet.weight}kg
            </Text>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5, 
    borderColor: '#393939', 
    marginBottom: 15, 
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  date: {
    ...typography.subtitle,
    color: colors.text,
  },
  editButton: {
    display: 'none',
    backgroundColor: colors.primary,
    padding: 6,
    borderRadius: 4,
  },
  editButtonText: {
      ...typography.buttonText,
    color: colors.background,
    fontSize: 14,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 16,
  },
  statContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  statText: {
    ...typography.headerText,
    color: colors.muted,
  },
  headersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2, 
    paddingHorizontal: 4,
  },
  headerText: {
    ...typography.subtitle,
    color: colors.muted,
    fontWeight: '600',
    fontSize: 14,
    paddingHorizontal: 0, 
  },
  exerciseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2, 
    paddingHorizontal: 4,
  },
  flex1: {
    flex: 1,
  },
  textRight: {
    textAlign: 'right',
  },
  exerciseName: {
    ...typography.exerciseName,
    fontSize: 16,
    color: colors.muted,
    paddingRight: 4, 
  },
  bestSet: {
    ...typography.headerText,
    color: colors.primary,
    fontWeight: '600',
    fontSize: 16,
    paddingLeft: 4, 
  },
});

export default HistoryCard;