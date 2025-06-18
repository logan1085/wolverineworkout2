import { createClient } from '@/lib/supabase';
import { 
  UserProfile, 
  Chat, 
  Message, 
  Workout, 
  Exercise,
  CreateChatRequest,
  CreateMessageRequest,
  CreateWorkoutDBRequest,
  UpdateUserProfileRequest
} from '@/types/workout';

const supabase = createClient();

export class DatabaseService {
  // ===== USER PROFILE OPERATIONS =====
  
  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        // If user profile doesn't exist, create one
        if (error.code === 'PGRST116') { // No rows returned
          console.log('User profile not found, creating new profile for user:', userId);
          return this.createUserProfile(userId);
        }
        
        console.error('Error fetching user profile:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Unexpected error fetching user profile:', error);
      return null;
    }
  }

  static async createUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .insert({
          id: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error creating user profile:', error);
        return null;
      }
      
      console.log('Successfully created user profile for:', userId);
      return data;
    } catch (error) {
      console.error('Unexpected error creating user profile:', error);
      return null;
    }
  }

  static async updateUserProfile(userId: string, updates: UpdateUserProfileRequest): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating user profile:', error);
      return null;
    }
    
    return data;
  }

  static async resetUserProfile(userId: string): Promise<UserProfile | null> {
    // Reset user profile to initial state by setting optional fields to null
    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        fitness_level: null,
        primary_goals: null,
        preferred_duration_minutes: null,
        available_equipment: null,
        workout_frequency_per_week: null,
        injuries_or_limitations: null,
        preferred_workout_types: null,
        ai_notes: null,
        last_chat_at: null,
        total_workouts_completed: 0,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();
    
    if (error) {
      console.error('Error resetting user profile:', error);
      return null;
    }
    
    console.log('Successfully reset user profile for:', userId);
    return data;
  }

  static async upsertUserProfileFromContext(userId: string, context: {
    fitnessLevel?: string;
    goals?: string;
    timeAvailable?: string;
    equipment?: string;
    focusAreas?: string;
    workoutFrequency?: string;
  }): Promise<UserProfile | null> {
    const updates: UpdateUserProfileRequest = {};
    
    // Map context to database fields
    if (context.fitnessLevel) {
      updates.fitness_level = context.fitnessLevel as 'beginner' | 'intermediate' | 'advanced';
    }
    
    if (context.goals) {
      // Convert single goal to array format
      const goalMappings: { [key: string]: string } = {
        'weight loss': 'weight_loss',
        'muscle building': 'muscle_building',
        'strength training': 'strength',
        'cardio fitness': 'endurance',
        'general fitness': 'general_fitness'
      };
      const mappedGoal = goalMappings[context.goals] || context.goals;
      updates.primary_goals = [mappedGoal];
    }
    
    if (context.timeAvailable) {
      updates.preferred_duration_minutes = parseInt(context.timeAvailable) || 30;
    }
    
    if (context.equipment) {
      const equipmentMappings: { [key: string]: string } = {
        'bodyweight only': 'bodyweight',
        'full gym': 'gym',
        'dumbbells': 'dumbbells',
        'resistance bands': 'resistance_bands'
      };
      const mappedEquipment = equipmentMappings[context.equipment] || context.equipment;
      updates.available_equipment = [mappedEquipment];
    }
    
    if (context.workoutFrequency) {
      updates.workout_frequency_per_week = parseInt(context.workoutFrequency) || 3;
    }

    return this.updateUserProfile(userId, updates);
  }

  // ===== CHAT OPERATIONS =====
  
  static async createChat(request: CreateChatRequest): Promise<Chat | null> {
    const { data, error } = await supabase
      .from('chats')
      .insert(request)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating chat:', error);
      return null;
    }
    
    return data;
  }

  static async getChatById(chatId: string): Promise<Chat | null> {
    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .eq('id', chatId)
      .single();
    
    if (error) {
      console.error('Error fetching chat:', error);
      return null;
    }
    
    return data;
  }

  static async getUserChats(userId: string): Promise<Chat[]> {
    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching user chats:', error);
      return [];
    }
    
    return data || [];
  }

  static async getActiveChat(userId: string): Promise<Chat | null> {
    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error) {
      // No active chat found is not an error
      return null;
    }
    
    return data;
  }

  static async updateChat(chatId: string, updates: Partial<Chat>): Promise<Chat | null> {
    const { data, error } = await supabase
      .from('chats')
      .update(updates)
      .eq('id', chatId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating chat:', error);
      return null;
    }
    
    return data;
  }

  // ===== MESSAGE OPERATIONS =====
  
  static async createMessage(request: CreateMessageRequest): Promise<Message | null> {
    const { data, error } = await supabase
      .from('messages')
      .insert(request)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating message:', error);
      return null;
    }
    
    return data;
  }

  static async getChatMessages(chatId: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error fetching chat messages:', error);
      return [];
    }
    
    return data || [];
  }

  // ===== WORKOUT OPERATIONS =====
  
  static async createWorkout(request: CreateWorkoutDBRequest): Promise<Workout | null> {
    // Start a transaction to create workout and exercises
    const { data: workoutData, error: workoutError } = await supabase
      .from('workouts')
      .insert({
        user_id: request.user_id,
        chat_id: request.chat_id,
        name: request.name,
        description: request.description,
        scheduled_date: request.scheduled_date,
        duration_minutes: request.duration_minutes,
        difficulty_level: request.difficulty_level,
        workout_type: request.workout_type,
        focus_areas: request.focus_areas,
        equipment_used: request.equipment_used,
        generated_from_goals: request.generated_from_goals,
        ai_notes: request.ai_notes
      })
      .select()
      .single();
    
    if (workoutError) {
      console.error('Error creating workout:', workoutError);
      return null;
    }

    // Create exercises if provided
    if (request.exercises.length > 0) {
      const exercisesToInsert = request.exercises.map((exercise, index) => ({
        workout_id: workoutData.id,
        name: exercise.name,
        sets: exercise.sets,
        reps: exercise.reps,
        weight_lbs: exercise.weight_lbs || 0,
        rest_seconds: exercise.rest_seconds || 60,
        notes: exercise.notes,
        order_in_workout: exercise.order_in_workout || index + 1
      }));

      const { error: exercisesError } = await supabase
        .from('exercises')
        .insert(exercisesToInsert);

      if (exercisesError) {
        console.error('Error creating exercises:', exercisesError);
        // Consider rolling back the workout creation here
      }
    }

    return this.getWorkoutById(workoutData.id);
  }

  static async getWorkoutById(workoutId: string): Promise<Workout | null> {
    const { data, error } = await supabase
      .from('workouts')
      .select(`
        *,
        exercises (*)
      `)
      .eq('id', workoutId)
      .single();
    
    if (error) {
      console.error('Error fetching workout:', error);
      return null;
    }

    // Sort exercises by order
    if (data.exercises) {
      data.exercises.sort((a: any, b: any) => a.order_in_workout - b.order_in_workout);
    }
    
    return data;
  }

  static async getUserWorkouts(userId: string): Promise<Workout[]> {
    const { data, error } = await supabase
      .from('workouts')
      .select(`
        *,
        exercises (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching user workouts:', error);
      return [];
    }

    // Sort exercises within each workout
    return (data || []).map(workout => ({
      ...workout,
      exercises: workout.exercises?.sort((a: any, b: any) => a.order_in_workout - b.order_in_workout) || []
    }));
  }

  static async updateWorkoutStatus(workoutId: string, status: 'proposed' | 'active' | 'completed' | 'skipped'): Promise<Workout | null> {
    const updates: any = { status };
    
    if (status === 'active') {
      updates.started_at = new Date().toISOString();
    } else if (status === 'completed') {
      updates.completed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('workouts')
      .update(updates)
      .eq('id', workoutId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating workout status:', error);
      return null;
    }
    
    return data;
  }

  // ===== EXERCISE OPERATIONS =====
  
  static async updateExerciseProgress(exerciseId: string, progress: {
    completed?: boolean;
    actual_sets?: number;
    actual_reps?: number[];
    actual_weight_lbs?: number;
  }): Promise<Exercise | null> {
    const { data, error } = await supabase
      .from('exercises')
      .update(progress)
      .eq('id', exerciseId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating exercise progress:', error);
      return null;
    }
    
    return data;
  }

  // ===== UTILITY FUNCTIONS =====
  
  static async linkWorkoutToChat(chatId: string, workoutId: string): Promise<boolean> {
    const { error } = await supabase
      .from('chats')
      .update({ 
        workout_generated: true, 
        workout_id: workoutId 
      })
      .eq('id', chatId);
    
    if (error) {
      console.error('Error linking workout to chat:', error);
      return false;
    }
    
    return true;
  }

  static async getOrCreateActiveChat(userId: string): Promise<Chat | null> {
    // Try to get existing active chat
    let chat = await this.getActiveChat(userId);
    
    // If no active chat, create one
    if (!chat) {
      chat = await this.createChat({
        user_id: userId,
        title: `Chat ${new Date().toLocaleDateString()}`
      });
    }
    
    return chat;
  }
} 