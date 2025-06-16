import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Check if API key is available
if (!process.env.OPENAI_API_KEY) {
  console.error('OPENAI_API_KEY is not set in environment variables');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface GenerateWorkoutPlanRequest {
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced';
  goals: string;
  workoutFrequency: string;
  timeAvailable: string;
  equipment: string;
  focusAreas: string;
  conversation?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateWorkoutPlanRequest = await request.json();
    
    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY is missing');
      return NextResponse.json(
        { error: 'OpenAI API key not configured. Please check your .env.local file.' },
        { status: 500 }
      );
    }

    console.log('Generating weekly workout plan with params:', {
      fitnessLevel: body.fitnessLevel,
      goals: body.goals,
      workoutFrequency: body.workoutFrequency,
      timeAvailable: body.timeAvailable,
      equipment: body.equipment,
      focusAreas: body.focusAreas,
      hasConversation: !!body.conversation
    });

    // Create a comprehensive prompt for weekly workout plan
    let prompt;
    if (body.conversation) {
      prompt = `Based on this conversation with a user about their fitness goals:

${body.conversation}

Create a comprehensive ${body.workoutFrequency}-day weekly workout plan for a ${body.fitnessLevel} fitness level.
Goals: ${body.goals}
Time per session: ${body.timeAvailable} minutes
Available equipment: ${body.equipment}
Focus areas: ${body.focusAreas}

Use the conversation context to make the plan more personalized and relevant to their specific goals and preferences.

IMPORTANT: Respond with ONLY valid JSON. Do not include any text before or after the JSON.

Format the response as JSON with this EXACT structure:
{
  "name": "Personalized Weekly Workout Plan",
  "description": "Brief description of the plan",
  "weeklyPlan": [
    {
      "day": "Monday",
      "focus": "Upper Body",
      "workout": {
        "name": "Upper Body Strength",
        "exercises": [
          {
            "name": "Exercise Name",
            "sets": 3,
            "reps": 10,
            "weight": 0,
            "notes": "Form tips and notes"
          }
        ],
        "notes": "Workout-specific notes"
      }
    }
  ],
  "notes": "Overall plan notes and tips"
}

Rules:
- Create exactly ${body.workoutFrequency} workout days
- "reps" must be a number (not "30 seconds" or any text)
- "weight" must be a number (0 for bodyweight exercises)
- "sets" must be a number
- All values must be valid JSON (no quotes around numbers)
- Make each day's workout appropriate for the fitness level and can be completed within ${body.timeAvailable} minutes
- Include rest days appropriately
- Make the plan progressive and balanced
- Focus on the user's specific goals: ${body.goals}`;
    } else {
      prompt = `Create a comprehensive ${body.workoutFrequency}-day weekly workout plan for a ${body.fitnessLevel} fitness level.
Goals: ${body.goals}
Time per session: ${body.timeAvailable} minutes
Available equipment: ${body.equipment}
Focus areas: ${body.focusAreas}

IMPORTANT: Respond with ONLY valid JSON. Do not include any text before or after the JSON.

Format the response as JSON with this EXACT structure:
{
  "name": "Weekly Workout Plan",
  "description": "Brief description of the plan",
  "weeklyPlan": [
    {
      "day": "Monday",
      "focus": "Upper Body",
      "workout": {
        "name": "Upper Body Strength",
        "exercises": [
          {
            "name": "Exercise Name",
            "sets": 3,
            "reps": 10,
            "weight": 0,
            "notes": "Form tips and notes"
          }
        ],
        "notes": "Workout-specific notes"
      }
    }
  ],
  "notes": "Overall plan notes and tips"
}

Rules:
- Create exactly ${body.workoutFrequency} workout days
- "reps" must be a number (not "30 seconds" or any text)
- "weight" must be a number (0 for bodyweight exercises)
- "sets" must be a number
- All values must be valid JSON (no quotes around numbers)
- Make each day's workout appropriate for the fitness level and can be completed within ${body.timeAvailable} minutes
- Include rest days appropriately
- Make the plan progressive and balanced
- Focus on the user's specific goals: ${body.goals}`;
    }

    console.log('Sending request to OpenAI...');
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are Logan, a professional fitness trainer and AI assistant. Create safe, effective, and personalized weekly workout plans tailored to each user's specific needs and goals. ALWAYS respond with ONLY valid JSON - no additional text, no explanations, just the JSON object. Make plans engaging, progressive, and motivational."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    console.log('OpenAI response received');

    const response = completion.choices[0]?.message?.content;
    
    if (!response) {
      console.error('No response content from OpenAI');
      return NextResponse.json(
        { error: 'Failed to generate workout plan - no response from AI' },
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
    let planData;
    try {
      planData = JSON.parse(cleanedResponse);
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
        
        planData = JSON.parse(fixedResponse);
        console.log('Successfully parsed after fixing common issues');
      } catch (secondParseError) {
        return NextResponse.json(
          { error: 'Invalid response format from AI. Please try again.' },
          { status: 500 }
        );
      }
    }

    // Validate the structure
    if (!planData.name || !planData.weeklyPlan || !Array.isArray(planData.weeklyPlan)) {
      console.error('Invalid plan structure from AI:', planData);
      return NextResponse.json(
        { error: 'Invalid plan structure from AI. Please try again.' },
        { status: 500 }
      );
    }

    // Validate and fix workout data
    planData.weeklyPlan = planData.weeklyPlan.map((dayPlan: any) => {
      if (dayPlan.workout && dayPlan.workout.exercises) {
        dayPlan.workout.exercises = dayPlan.workout.exercises.map((exercise: any) => ({
          name: exercise.name || 'Unknown Exercise',
          sets: parseInt(exercise.sets) || 3,
          reps: parseInt(exercise.reps) || 10,
          weight: parseFloat(exercise.weight) || 0,
          notes: exercise.notes || ''
        }));
      }
      return dayPlan;
    });

    // Add metadata
    planData.date = new Date().toISOString().split('T')[0];
    planData.fitnessLevel = body.fitnessLevel;
    planData.goals = body.goals;
    planData.workoutFrequency = body.workoutFrequency;
    planData.timeAvailable = body.timeAvailable;
    planData.equipment = body.equipment;
    planData.focusAreas = body.focusAreas;

    console.log('Successfully generated workout plan:', planData);

    return NextResponse.json(planData);
  } catch (error) {
    console.error('Error generating workout plan:', error);
    
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
      { error: 'Failed to generate workout plan. Please try again.' },
      { status: 500 }
    );
  }
} 