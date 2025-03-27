export interface Exercise {
    id: number;
    name: string;
    body_part: string;
  }
  
  export interface WorkoutSet {
    id: number;
    reps: string;
    weight: string;
    completed: boolean;
    previous: string,
  }
  
  export interface WorkoutExercise extends Exercise {
    sets: WorkoutSet[];
  }
  
  export interface APIResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
  }
  
  export interface WorkoutPayload {
    user_id: string;
    start_time: string,
    end_time: string,
    exercises: Array<{
      exercise_id: number;
      sets: Array<{
        reps: number;
        weight: number;
      }>;
    }>;
  }