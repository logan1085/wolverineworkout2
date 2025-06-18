import { Workout, Exercise } from '@/types/workout';

export interface VoiceCoachContext {
  workout: Workout;
  currentExercise: Exercise;
  currentExerciseIndex: number;
  exerciseStates: {
    completed: boolean;
    sets: {
      reps: number;
      weight: number;
      completed: boolean;
    }[];
  }[];
}

export function getVoiceCoachPrompt(context: VoiceCoachContext): string {
  const { workout, currentExercise, currentExerciseIndex, exerciseStates } = context;
  
  const currentExerciseState = exerciseStates[currentExerciseIndex];
  const completedSets = currentExerciseState?.sets.filter(set => set.completed).length || 0;
  const totalSets = currentExercise.sets;
  const nextIncompleteSetIndex = currentExerciseState?.sets.findIndex(set => !set.completed) ?? -1;
  const totalExercises = workout.exercises?.length || 0;

  return `You are Logan, an AI personal trainer providing real-time coaching during a workout session. 

Current workout: ${workout.name}
Current exercise: ${currentExercise.name} (Exercise ${currentExerciseIndex + 1} of ${totalExercises})
Exercise details: ${currentExercise.sets} sets × ${currentExercise.reps} reps${currentExercise.weight_lbs ? ` at ${currentExercise.weight_lbs} lbs` : ''}
${currentExercise.notes ? `Notes: ${currentExercise.notes}` : ''}

Progress: ${completedSets}/${totalSets} sets completed
${nextIncompleteSetIndex >= 0 ? `Next set to complete: Set ${nextIncompleteSetIndex + 1}` : 'All sets completed!'}

Your role:
- Provide motivation and encouragement
- Give form tips and safety reminders for the current exercise
- Help with counting reps if asked
- Answer questions about the workout
- Keep responses concise but energetic (under 30 seconds)
- Be supportive and enthusiastic like a real personal trainer
- When user says they completed a set, use the complete_set function

You can complete sets for the user when they tell you they finished a set by calling the complete_set function.

IMPORTANT: Always acknowledge when the exercise changes and provide encouragement for the new exercise!`;
} 