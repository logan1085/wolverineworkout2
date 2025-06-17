import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getWorkoutGenerationPrompt, WORKOUT_SYSTEM_PROMPT, type WorkoutGenerationParams } from '@/prompts';

interface GenerateSimpleWorkoutRequest extends WorkoutGenerationParams {}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateSimpleWorkoutRequest = await request.json();
    
    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY is missing');
      return NextResponse.json(
        { error: 'OpenAI API key not configured. Please check your .env.local file.' },
        { status: 500 }
      );
    }

    // Initialize OpenAI client inside the function
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    console.log('Generating simple workout with params:', {
      fitnessLevel: body.fitnessLevel,
      goals: body.goals,
      timeAvailable: body.timeAvailable,
      equipment: body.equipment,
      hasConversation: !!body.conversation
    });

    // Get the prompt from our organized prompts
    const prompt = getWorkoutGenerationPrompt(body);

    console.log('Sending request to OpenAI...');
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: WORKOUT_SYSTEM_PROMPT
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

    // Validate and fix workout data
    workoutData.exercises = workoutData.exercises.map((exercise: any) => ({
      name: exercise.name || 'Unknown Exercise',
      sets: parseInt(exercise.sets) || 3,
      reps: parseInt(exercise.reps) || 10,
      weight: parseFloat(exercise.weight) || 0,
      notes: exercise.notes || ''
    }));

    // Ensure required fields
    workoutData.id = workoutData.id || `workout-${Date.now()}`;
    workoutData.date = workoutData.date || new Date().toISOString().split('T')[0];
    workoutData.duration = parseInt(body.timeAvailable) || 30;
    workoutData.completed = false;

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