import { WorkoutPayload } from "../types/workoutTypes";
import { API_BASE } from "./config";

export const getExercises = async (userId: string) => {
  try {
    const response = await fetch(`${API_BASE}/exercises?userid=${userId}`);
    if (!response.ok) throw new Error('Failed to fetch exercises');
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const getPreviousSets = async (userId: string, exerciseId: number) => {
  try {
    const response = await fetch(`${API_BASE}/previous_sets?userid=${userId}&exercise_id=${exerciseId}`);
    if (!response.ok) throw new Error('Failed to fetch exercises');
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const getHistory = async (userId: string) => {
  try {
    console.log('Hey!')
    const response = await fetch(`${API_BASE}/history?userid=${userId}`);
    if (!response.ok) throw new Error('Failed to fetch history data');
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const saveWorkout = async (workoutData: WorkoutPayload, userId: string) => {
  try {
    const response = await fetch(`${API_BASE}/workout?userid=${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(workoutData),
    });
    if (!response.ok) throw new Error('Failed to save workout');
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const getWorkoutsPerWeek = async (userId: string) => {
  try {
    const response = await fetch(`${API_BASE}/workouts_per_week?userid=${userId}`);
    if (!response.ok) throw new Error('Failed to fetch workouts per week data');
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const getOneRepMax = async (userId: string, exerciseId: number) => {
  try {
    const response = await fetch(`${API_BASE}/one_rep_max?userid=${userId}&exercise_id=${exerciseId}`);
    if (!response.ok) throw new Error('Failed to fetch one rep max data');
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const addExercise = async (userId: string, name: string, muscleGroup: string) => {
  try {
    const response = await fetch(`${API_BASE}/add_exercise`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, name, body_part: muscleGroup }),
    });
    
    if (!response.ok) throw new Error('Failed to add exercise');
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const getTemplates = async (userId: string) => {
  try {
    const response = await fetch(`${API_BASE}/templates?userid=${userId}`);
    if (!response.ok) throw new Error('Failed to fetch templates');
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const createTemplate = async (templateData: {
  name: string;
  user_id: string;
  exercises: { exercise_id: number; sets: number }[];
}) => {
  try {
    const response = await fetch(`${API_BASE}/save_template`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(templateData),
    });

    if (!response.ok) {
      throw new Error('Failed to create template');
    }

    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};