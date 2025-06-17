// Database types matching our Supabase schema

export interface UserProfile {
  id: string;
  created_at: string;
  updated_at: string;
  fitness_level?: 'beginner' | 'intermediate' | 'advanced';
  primary_goals?: string[];
  available_equipment?: string[];
  preferred_duration_minutes?: number;
  workout_frequency_per_week?: number;
  injuries_or_limitations?: string;
  preferred_workout_types?: string[];
  ai_notes?: string;
  last_chat_at?: string;
  total_workouts_completed?: number;
}

export interface Chat {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  title?: string;
  status: 'active' | 'completed' | 'archived';
  workout_generated: boolean;
  workout_id?: string;
}

export interface Message {
  id: string;
  chat_id: string;
  user_id: string;
  created_at: string;
  sender: 'user' | 'logan';
  content: string;
  message_type: 'text' | 'workout_generated' | 'system';
}

export interface Exercise {
  id?: string;
  workout_id?: string;
  name: string;
  sets: number;
  reps: number;
  weight_lbs?: number;
  rest_seconds?: number;
  notes?: string;
  order_in_workout: number;
  completed?: boolean;
  actual_sets?: number;
  actual_reps?: number[];
  actual_weight_lbs?: number;
}

export interface Workout {
  id: string;
  user_id: string;
  chat_id?: string;
  created_at: string;
  updated_at: string;
  name: string;
  description?: string;
  scheduled_date?: string;
  duration_minutes: number;
  difficulty_level?: 'beginner' | 'intermediate' | 'advanced';
  workout_type?: string;
  focus_areas?: string[];
  equipment_used?: string[];
  status: 'proposed' | 'active' | 'completed' | 'skipped';
  started_at?: string;
  completed_at?: string;
  generated_from_goals?: string[];
  ai_notes?: string;
  exercises?: Exercise[];
}

// Legacy types for backward compatibility (will be phased out)
export interface CreateWorkoutRequest {
  name: string;
  date: string;
  exercises: Exercise[];
  duration?: number;
  notes?: string;
  dayOfWeek?: string;
  focus?: string;
}

// New database insert types
export interface CreateChatRequest {
  user_id: string;
  title?: string;
}

export interface CreateMessageRequest {
  chat_id: string;
  user_id: string;
  sender: 'user' | 'logan';
  content: string;
  message_type?: 'text' | 'workout_generated' | 'system';
}

export interface CreateWorkoutDBRequest {
  user_id: string;
  chat_id?: string;
  name: string;
  description?: string;
  scheduled_date?: string;
  duration_minutes: number;
  difficulty_level?: 'beginner' | 'intermediate' | 'advanced';
  workout_type?: string;
  focus_areas?: string[];
  equipment_used?: string[];
  generated_from_goals?: string[];
  ai_notes?: string;
  exercises: Omit<Exercise, 'id' | 'workout_id'>[];
}

export interface UpdateUserProfileRequest {
  fitness_level?: 'beginner' | 'intermediate' | 'advanced';
  primary_goals?: string[];
  available_equipment?: string[];
  preferred_duration_minutes?: number;
  workout_frequency_per_week?: number;
  injuries_or_limitations?: string;
  preferred_workout_types?: string[];
  ai_notes?: string;
} 