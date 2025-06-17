export interface WorkoutGenerationParams {
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced';
  goals: string;
  timeAvailable: string;
  equipment: string;
  conversation?: string;
}

export const WORKOUT_SYSTEM_PROMPT = "You are Logan, a professional fitness trainer and AI assistant. Create safe, effective, and personalized daily workouts tailored to each user's specific needs and goals. ALWAYS respond with ONLY valid JSON - no additional text, no explanations, just the JSON object. Make workouts engaging, achievable, and motivational.";

export function getWorkoutGenerationPrompt(params: WorkoutGenerationParams): string {
  const currentDate = new Date().toISOString().split('T')[0];
  const workoutId = `workout-${Date.now()}`;

  const basePrompt = `Create a single workout for today for a ${params.fitnessLevel} fitness level.
Goals: ${params.goals}
Time available: ${params.timeAvailable} minutes
Available equipment: ${params.equipment}

IMPORTANT: Respond with ONLY valid JSON. Do not include any text before or after the JSON.

Format the response as JSON with this EXACT structure:
{
  "id": "${workoutId}",
  "name": "Today's Workout",
  "date": "${currentDate}",
  "exercises": [
    {
      "name": "Exercise Name",
      "sets": 3,
      "reps": 10,
      "weight": 0,
      "notes": "Form tips and notes"
    }
  ],
  "duration": ${params.timeAvailable},
  "notes": "Workout-specific notes and encouragement",
  "completed": false
}

Rules:
- Create 4-8 exercises appropriate for the fitness level
- "reps" must be a number (not "30 seconds" or any text)
- "weight" must be a number (0 for bodyweight exercises)
- "sets" must be a number
- All values must be valid JSON (no quotes around numbers)
- Make the workout achievable within ${params.timeAvailable} minutes
- Focus on the user's specific goals: ${params.goals}
- Include motivational notes`;

  if (params.conversation) {
    return `Based on this conversation with a user about their fitness goals:

${params.conversation}

${basePrompt}

Use the conversation context to make the workout more personalized and relevant to their specific goals and preferences.`;
  }

  return basePrompt;
} 