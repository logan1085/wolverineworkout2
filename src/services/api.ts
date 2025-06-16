import { Workout, CreateWorkoutRequest } from '@/types/workout';

export class ApiService {
  static async getWorkouts(): Promise<Workout[]> {
    const response = await fetch('/api/workouts');
    if (!response.ok) {
      throw new Error('Failed to fetch workouts');
    }
    return response.json();
  }

  static async getWorkout(id: string): Promise<Workout> {
    const response = await fetch(`/api/workouts/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch workout');
    }
    return response.json();
  }

  static async createWorkout(workout: CreateWorkoutRequest): Promise<Workout> {
    const response = await fetch('/api/workouts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(workout),
    });
    if (!response.ok) {
      throw new Error('Failed to create workout');
    }
    return response.json();
  }

  static async updateWorkout(id: string, workout: CreateWorkoutRequest): Promise<Workout> {
    const response = await fetch(`/api/workouts/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(workout),
    });
    if (!response.ok) {
      throw new Error('Failed to update workout');
    }
    return response.json();
  }

  static async deleteWorkout(id: string): Promise<void> {
    const response = await fetch(`/api/workouts/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete workout');
    }
  }

  static async generateWorkout(params: {
    fitnessLevel: 'beginner' | 'intermediate' | 'advanced';
    workoutType: 'strength' | 'cardio' | 'flexibility' | 'mixed';
    focusArea: string;
    duration: number;
    equipment: string[];
  }): Promise<Workout> {
    const response = await fetch('/api/generate-workout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });
    if (!response.ok) {
      throw new Error('Failed to generate workout');
    }
    return response.json();
  }
} 