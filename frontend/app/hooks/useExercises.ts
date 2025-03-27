import { useState, useEffect } from 'react';
import { Exercise } from '../types/workoutTypes';
import { getExercises } from '../services/api';
import { AuthContext } from '../providers/AuthProvider';
import React from 'react';

export const useExercises = () => {
  const { logout, user } = React.useContext(AuthContext);

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  
  const loadExercises = async () => {
    setIsLoading(true); 
    try {
      if (user?.token == undefined) {
        return;
      }
      const data = await getExercises(user?.token); 
      setExercises(data); 
    } catch (error) {
      console.error('Error fetching exercises:', error);
    } finally {
      setIsLoading(false); 
    }
  };

  
  useEffect(() => {
    loadExercises();
  }, []);

  
  const refetchExercises = () => {
    loadExercises(); 
  };

  
  const filteredExercises = exercises.filter((exercise) =>
    exercise.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return {
    exercises: filteredExercises, 
    isLoading, 
    searchQuery, 
    setSearchQuery, 
    refetchExercises, 
  };
};