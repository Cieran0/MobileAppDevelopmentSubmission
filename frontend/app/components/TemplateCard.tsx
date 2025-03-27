import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';

interface TemplateCardProps {
  name: string;
  exercises: { name: string; sets: number }[];
  date: string;
  style?: any;
  onPress?: () => void; 
}

const TemplateCard: React.FC<TemplateCardProps> = ({ 
  name, 
  exercises, 
  date,
  style,
  onPress 
}) => {
  const visibleExercises = exercises.slice(0, 3);
  const hasMore = exercises.length > 3;

  return (
    <TouchableOpacity 
      onPress={onPress} 
      activeOpacity={0.8} 
      style={[styles.card, style, styles.innerBorder]}
    >
      <Text style={styles.name}>{name}</Text>
      
      {visibleExercises.map((exercise, index) => (
        <View key={index} style={styles.exerciseContainer}>
          <Text style={styles.exerciseName}>{exercise.name}</Text>
          <Text style={styles.setsText}>{exercise.sets} sets</Text>
        </View>
      ))}
      
      {hasMore && (
        <Text style={styles.more}>
          +{exercises.length - 3} more...
        </Text>
      )}
      
      <View style={styles.dateContainer}>
        <Text style={styles.date}>{date}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
    padding: 4,
  },
  innerBorder: {
    borderWidth: 1.5,
    borderColor: '#393939',
    borderRadius: 8,
    padding: 8,
  },
  name: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  exerciseContainer: {
    marginBottom: 8,
  },
  exerciseName: {
    color: '#888888',
    fontSize: 14,
    fontWeight: '500',
  },
  setsText: {
    color: '#666666',
    fontSize: 12,
    marginTop: 2,
  },
  more: {
    color: '#888888',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  dateContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  date: {
    color: '#888888',
    fontSize: 14,
  },
});

export default TemplateCard;