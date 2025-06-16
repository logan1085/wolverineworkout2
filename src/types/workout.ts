export interface Exercise {
  name: string;
  sets: number;
  reps: number;
  weight?: number;
  notes?: string;
}

export interface Workout {
  id?: string;
  name: string;
  date: string;
  exercises: Exercise[];
  duration?: number; // in minutes
  notes?: string;
  dayOfWeek?: string; // For weekly plans (e.g., "Monday", "Tuesday")
  focus?: string; // For weekly plans (e.g., "Upper Body", "Lower Body")
  completed?: boolean; // Track if workout is completed
}

export interface CreateWorkoutRequest {
  name: string;
  date: string;
  exercises: Exercise[];
  duration?: number;
  notes?: string;
  dayOfWeek?: string; // For weekly plans (e.g., "Monday", "Tuesday")
  focus?: string; // For weekly plans (e.g., "Upper Body", "Lower Body")
} 