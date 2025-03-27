import { useState, useEffect, useCallback, useMemo } from 'react';
import { WorkoutExercise, Exercise, WorkoutPayload, WorkoutSet } from '../types/workoutTypes';
import { saveWorkout as apiSaveWorkout, getExercises as apiGetExercises, getPreviousSets } from '../services/api';
import { AuthContext } from '../providers/AuthProvider';
import React from 'react';

export const useWorkout = () => {
  const [seconds, setSeconds] = useState(0);
  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBodyPart, setSelectedBodyPart] = useState('All');
  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([]);
  const [isLoadingExercises, setIsLoadingExercises] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [startTime, setStartTime] = useState<string>();
  const { logout, user } = React.useContext(AuthContext);
  

  
  useEffect(() => {
    const loadExercises = async () => {
      setIsLoadingExercises(true);
      try {
        if(user?.token == undefined) {
          return;
        }
        const data = await apiGetExercises(user?.token); 
        setAvailableExercises(data);
      } catch (error) {
        console.error('Error fetching exercises:', error);
      } finally {
        setIsLoadingExercises(false);
      }
    };
    loadExercises();
  }, []);

  
  useEffect(() => {
    const timer = setInterval(() => setSeconds((prev) => prev + 1), 1000);
    setStartTime(getCurrentTimeFormatted());
    return () => clearInterval(timer);
  }, []);

  
  const bodyParts = useMemo(() => {
    return ['All', ...new Set(availableExercises.map((ex) => ex.body_part))];
  }, [availableExercises]);

  
  const addSetToExercise = useCallback((exerciseId: number) => {
    setExercises((prev) =>
      prev.map((ex) =>
        ex.id === exerciseId
          ? {
              ...ex,
              sets: [
                ...ex.sets,
                {
                  id: Date.now() + Math.random(),
                  reps: '',
                  weight: '',
                  completed: false,
                  previous: '',
                },
              ],
            }
          : ex
      )
    );
  }, []);

  
  const updateSetField = useCallback(
    (exerciseId: number, setId: number, field: 'reps' | 'weight', value: string) => {
      setExercises((prev) =>
        prev.map((ex) =>
          ex.id === exerciseId
            ? {
                ...ex,
                sets: ex.sets.map((set) =>
                  set.id === setId ? { ...set, [field]: value } : set
                ),
              }
            : ex
        )
      );
    },
    []
  );

  
  const toggleSetComplete = useCallback((exerciseId: number, setId: number) => {
    setExercises((prev) =>
      prev.map((ex) =>
        ex.id === exerciseId
          ? {
              ...ex,
              sets: ex.sets.map((set) =>
                set.id === setId ? { ...set, completed: !set.completed } : set
              ),
            }
          : ex
      )
    );
  }, []);

  
  const deleteSetFromExercise = useCallback((exerciseId: number, setId: number) => {
    setExercises((prev) =>
      prev.map((ex) =>
        ex.id === exerciseId
          ? {
              ...ex,
              sets: ex.sets.filter((set) => set.id !== setId),
            }
          : ex
      )
    );
  }, []);

  
  const deleteExercise = useCallback((exerciseId: number) => {
    setExercises((prev) => prev.filter((ex) => ex.id !== exerciseId));
  }, []);

  
  const handleAddExercise = useCallback(
    async (user_id: string, exercise: Exercise, isTemplate: boolean) => {
      try {

        let previous_sets = null;

        if(!isTemplate) {
          previous_sets = await getPreviousSets(user_id, exercise.id);
        }
        let formattedPreviousSets: WorkoutSet[] = [];

        
        if(previous_sets) {
          formattedPreviousSets = previous_sets.map(
            ({ reps, weight }: { reps: number; weight: number }) => ({
              id: Date.now() + Math.random(), 
              reps: `${reps}`,
              weight: `${weight}`,
              completed: false,
              previous: `${reps} x ${weight}kg`,
            })
          );
        }



        
        const newExercise: WorkoutExercise = {
          ...exercise,
          sets: [
            ...formattedPreviousSets,
            {
              id: Date.now() + Math.random(),
              reps: '',
              weight: '',
              completed: false,
              previous: '',
            },
          ],
        };

        
        setExercises((prev) => [...prev, newExercise]);
        setShowExerciseModal(false);
      } catch (error) {
        console.error('Failed to fetch previous sets:', error);
      }
    },
    []
  );

  
  const initializeFromTemplate = useCallback((templateExercises: any[]) => {
    templateExercises.forEach((exercise) => {
      const newExercise: WorkoutExercise = {
        id: exercise.exercise_id,
        name: exercise.name,
        body_part: exercise.muscle_group,
        sets: Array.from({ length: exercise.sets }).map(() => ({
          id: Date.now() + Math.random(),
          reps: '',
          weight: '',
          completed: false,
          previous: '',
        })),
      };

      setExercises((prev) => [...prev, newExercise]);
    });
  }, []);

  
  const getCurrentTimeFormatted = (): string => {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); 
    const day = String(now.getDate()).padStart(2, '0');

    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  
  const saveWorkout = useCallback(async (): Promise<boolean> => {
    setIsSaving(true);

    let start_time = startTime;
    if (!start_time) {
      start_time = getCurrentTimeFormatted();
    }

    if(user?.token == undefined) {
      return false;
    }

    const workoutData: WorkoutPayload = {
      user_id: user?.token,
      exercises: exercises.map((ex) => ({
        exercise_id: ex.id,
        sets: ex.sets
          .filter((set) => set.completed)
          .map((set) => ({
            reps: parseInt(set.reps) || 0,
            weight: parseFloat(set.weight) || 0,
          })),
      })),
      start_time: start_time,
      end_time: getCurrentTimeFormatted(),
    };

    try {

      await apiSaveWorkout(workoutData, user?.token);
      return true;
    } catch (error) {
      console.error('Save failed:', error);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [exercises, startTime]);

  
  const hasIncompleteSets = useMemo(() => {
    return exercises.some((ex) => ex.sets.some((set) => !set.completed));
  }, [exercises]);

  
  const resetWorkout = useCallback(() => {
    setExercises([]);
  }, []);

  return {
    seconds,
    exercises,
    showExerciseModal,
    searchQuery,
    selectedBodyPart,
    availableExercises,
    bodyParts,
    addSetToExercise,
    updateSetField,
    toggleSetComplete,
    deleteSetFromExercise,
    deleteExercise,
    handleAddExercise,
    initializeFromTemplate, 
    saveWorkout,
    hasIncompleteSets,
    isLoadingExercises,
    isSaving,
    resetWorkout,
    setShowExerciseModal,
    setSearchQuery,
    setSelectedBodyPart,
  };
};