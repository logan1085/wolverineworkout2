// Export all prompts from this central index
export { getLoganChatPrompt } from './logan-chat';
export { getWorkoutGenerationPrompt, WORKOUT_SYSTEM_PROMPT } from './workout-generation';

// Re-export types for convenience
export type { ConversationContext } from './logan-chat';
export type { WorkoutGenerationParams } from './workout-generation'; 