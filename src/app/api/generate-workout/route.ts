import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { Exercise } from '@/types/workout';

// Check if API key is available
if (!process.env.OPENAI_API_KEY) {
  console.error('OPENAI_API_KEY is not set in environment variables');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface GenerateWorkoutRequest {
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced';
  workoutType: 'strength' | 'cardio' | 'flexibility' | 'mixed';
  focusArea: string;
  duration: number; // in minutes
  equipment: string[];
  conversation?: string; // New field for chat context
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateWorkoutRequest = await request.json();
    
    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY is missing');
      return NextResponse.json(
        { error: 'OpenAI API key not configured. Please check your .env.local file.' },
        { status: 500 }
      );
    }

    console.log('Generating workout with params:', {
      fitnessLevel: body.fitnessLevel,
      workoutType: body.workoutType,
      focusArea: body.focusArea,
      duration: body.duration,
      equipment: body.equipment,
      hasConversation: !!body.conversation
    });

    // Create a more personalized prompt if conversation context is available
    let prompt;
    if (body.conversation) {
      prompt = `Based on this conversation with a user about their fitness goals:

${body.conversation}

Create a personalized ${body.workoutType} workout for a ${body.fitnessLevel} fitness level.
Focus area: ${body.focusArea}
Duration: ${body.duration} minutes
Available equipment: ${body.equipment.join(', ') || 'bodyweight only'}

Use the conversation context to make the workout more personalized and relevant to their specific goals and preferences.

IMPORTANT: Respond with ONLY valid JSON. Do not include any text before or after the JSON.

Format the response as JSON with this EXACT structure:
{
  "name": "Personalized Workout Name",
  "exercises": [
    {
      "name": "Exercise Name",
      "sets": 3,
      "reps": 10,
      "weight": 0,
      "notes": "Form tips and notes"
    }
  ],
  "notes": "Overall workout notes and tips"
}

Rules:
- "reps" must be a number (not "30 seconds" or any text)
- "weight" must be a number (0 for bodyweight exercises)
- "sets" must be a number
- All values must be valid JSON (no quotes around numbers)
- Make the workout name and notes reflect the user's specific goals from the conversation
- Make sure the workout is appropriate for the fitness level and can be completed within the specified duration.`;
    } else {
      prompt = `Create a ${body.workoutType} workout for a ${body.fitnessLevel} fitness level.
Focus area: ${body.focusArea}
Duration: ${body.duration} minutes
Available equipment: ${body.equipment.join(', ') || 'bodyweight only'}

IMPORTANT: Respond with ONLY valid JSON. Do not include any text before or after the JSON.

Format the response as JSON with this EXACT structure:
{
  "name": "Workout Name",
  "exercises": [
    {
      "name": "Exercise Name",
      "sets": 3,
      "reps": 10,
      "weight": 0,
      "notes": "Form tips and notes"
    }
  ],
  "notes": "Overall workout notes and tips"
}

Rules:
- "reps" must be a number (not "30 seconds" or any text)
- "weight" must be a number (0 for bodyweight exercises)
- "sets" must be a number
- All values must be valid JSON (no quotes around numbers)
- Make sure the workout is appropriate for the fitness level and can be completed within the specified duration.`;
    }

    console.log('Sending request to OpenAI...');
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are Logan, a professional fitness trainer and AI assistant. Create safe, effective, and personalized workouts tailored to each user's specific needs and goals. ALWAYS respond with ONLY valid JSON - no additional text, no explanations, just the JSON object. Make workouts engaging and motivational."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    console.log('OpenAI response received');

    const response = completion.choices[0]?.message?.content;
    
    if (!response) {
      console.error('No response content from OpenAI');
      return NextResponse.json(
        { error: 'Failed to generate workout - no response from AI' },
        { status: 500 }
      );
    }

    console.log('Raw AI response:', response);

    // Clean the response - remove any non-JSON text
    let cleanedResponse = response.trim();
    
    // Find the first { and last } to extract just the JSON
    const firstBrace = cleanedResponse.indexOf('{');
    const lastBrace = cleanedResponse.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1) {
      cleanedResponse = cleanedResponse.substring(firstBrace, lastBrace + 1);
    }

    // Parse the JSON response
    let workoutData;
    try {
      workoutData = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      console.error('Raw response was:', response);
      console.error('Cleaned response was:', cleanedResponse);
      
      // Try to fix common JSON issues
      try {
        // Replace "30 seconds" with "30", "45 seconds" with "45", etc.
        let fixedResponse = cleanedResponse.replace(/"(\d+)\s*seconds?"/g, '$1');
        // Replace "10 reps" with "10", "15 reps" with "15", etc.
        fixedResponse = fixedResponse.replace(/"(\d+)\s*reps?"/g, '$1');
        
        workoutData = JSON.parse(fixedResponse);
        console.log('Successfully parsed after fixing common issues');
      } catch (secondParseError) {
        return NextResponse.json(
          { error: 'Invalid response format from AI. Please try again.' },
          { status: 500 }
        );
      }
    }

    // Validate the structure
    if (!workoutData.name || !workoutData.exercises || !Array.isArray(workoutData.exercises)) {
      console.error('Invalid workout structure from AI:', workoutData);
      return NextResponse.json(
        { error: 'Invalid workout structure from AI. Please try again.' },
        { status: 500 }
      );
    }

    // Validate and fix exercise data
    workoutData.exercises = workoutData.exercises.map((exercise: any) => ({
      name: exercise.name || 'Unknown Exercise',
      sets: parseInt(exercise.sets) || 3,
      reps: parseInt(exercise.reps) || 10,
      weight: parseFloat(exercise.weight) || 0,
      notes: exercise.notes || ''
    }));

    // Add the current date
    workoutData.date = new Date().toISOString().split('T')[0];
    workoutData.duration = body.duration;

    console.log('Successfully generated workout:', workoutData);

    return NextResponse.json(workoutData);
  } catch (error) {
    console.error('Error generating workout:', error);
    
    // Check for specific OpenAI errors
    if (error instanceof Error) {
      if (error.message.includes('401')) {
        return NextResponse.json(
          { error: 'Invalid OpenAI API key. Please check your API key.' },
          { status: 500 }
        );
      }
      if (error.message.includes('429')) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please wait a moment and try again.' },
          { status: 500 }
        );
      }
      if (error.message.includes('500')) {
        return NextResponse.json(
          { error: 'OpenAI service error. Please try again later.' },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to generate workout. Please try again.' },
      { status: 500 }
    );
  }
} 