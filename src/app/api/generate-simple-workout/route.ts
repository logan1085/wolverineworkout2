import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getWorkoutGenerationPrompt, WORKOUT_SYSTEM_PROMPT, type WorkoutGenerationParams } from '@/prompts';
import { missingFields, missingFieldsResponse, parseJsonBody } from '@/lib/api-validation';
import { getAuthenticatedUser } from '@/lib/supabase-server';
import { log } from '@/lib/logger';

type GenerateSimpleWorkoutRequest = WorkoutGenerationParams;

/** Bound the conversation excerpt so a client cannot run up the token bill. */
const MAX_CONVERSATION_CHARS = 8000;

/** A workout longer than this is almost certainly a typo or an abuse attempt. */
const MAX_DURATION_MINUTES = 240;

interface GeneratedExercise {
  name: string;
  sets: number;
  reps: number;
  weight: number;
  notes: string;
}

/**
 * Coerce one AI-supplied exercise into the shape the app renders.
 *
 * The model returns things like `"reps": "30 seconds"` or omits fields, and
 * `parseInt` on those yields NaN, which React renders as an empty cell and the
 * database rejects. Every numeric field is clamped to a sane floor so a bad
 * generation degrades to a usable workout rather than a broken screen.
 */
function normalizeExercise(exercise: Record<string, unknown>): GeneratedExercise {
  const toNumber = (value: unknown, fallback: number, min: number, max: number) => {
    const parsed =
      typeof value === 'number' ? value : parseFloat(String(value ?? '').trim());
    if (!Number.isFinite(parsed)) return fallback;
    return Math.min(Math.max(parsed, min), max);
  };

  return {
    name: String(exercise.name ?? '').trim() || 'Unnamed exercise',
    sets: Math.round(toNumber(exercise.sets, 3, 1, 20)),
    reps: Math.round(toNumber(exercise.reps, 10, 1, 500)),
    weight: toNumber(exercise.weight, 0, 0, 2000),
    notes: typeof exercise.notes === 'string' ? exercise.notes : '',
  };
}

export async function POST(request: NextRequest) {
  try {
    // Generating a workout spends OpenAI credits, so it requires a session.
    // Previously this endpoint was reachable by anyone who knew the URL.
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { error: 'You must be signed in to generate a workout.' },
        { status: 401 }
      );
    }

    const parsed = await parseJsonBody<GenerateSimpleWorkoutRequest>(request);
    if (!parsed.ok) {
      return parsed.response;
    }
    const body = parsed.data;

    const missing = missingFields(body as unknown as Record<string, unknown>, [
      'fitnessLevel',
      'goals',
      'timeAvailable',
      'equipment',
    ]);
    if (missing.length > 0) {
      return missingFieldsResponse(missing);
    }

    const requestedMinutes = parseInt(String(body.timeAvailable), 10);
    const durationMinutes =
      Number.isFinite(requestedMinutes) && requestedMinutes > 0
        ? Math.min(requestedMinutes, MAX_DURATION_MINUTES)
        : 30;

    if (!process.env.OPENAI_API_KEY) {
      log.error('OPENAI_API_KEY is missing');
      return NextResponse.json(
        { error: 'The AI service is not configured. Please contact support.' },
        { status: 503 }
      );
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const prompt = getWorkoutGenerationPrompt({
      ...body,
      timeAvailable: String(durationMinutes),
      conversation: body.conversation?.slice(-MAX_CONVERSATION_CHARS),
    });

    log.debug('Generating workout', {
      fitnessLevel: body.fitnessLevel,
      durationMinutes,
    });

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: WORKOUT_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 1000,
      // Ask the API to guarantee valid JSON rather than relying on the prompt
      // and then repairing the string by hand.
      response_format: { type: 'json_object' },
    });

    const response = completion.choices[0]?.message?.content;

    if (!response) {
      log.error('No response content from OpenAI');
      return NextResponse.json(
        { error: 'Logan could not put a workout together. Please try again.' },
        { status: 502 }
      );
    }

    // Trim to the outermost braces before parsing: json_object mode makes stray
    // prose unlikely, but this stays cheap insurance against a stray fence.
    let cleanedResponse = response.trim();
    const firstBrace = cleanedResponse.indexOf('{');
    const lastBrace = cleanedResponse.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      cleanedResponse = cleanedResponse.substring(firstBrace, lastBrace + 1);
    }

    let workoutData: Record<string, unknown>;
    try {
      workoutData = JSON.parse(cleanedResponse);
    } catch {
      log.error('Failed to parse AI workout response as JSON');
      return NextResponse.json(
        { error: 'Logan sent back something unreadable. Please try again.' },
        { status: 502 }
      );
    }

    const rawExercises = workoutData.exercises;
    if (!Array.isArray(rawExercises) || rawExercises.length === 0) {
      log.error('AI workout response had no exercises');
      return NextResponse.json(
        { error: 'Logan could not put a workout together. Please try again.' },
        { status: 502 }
      );
    }

    const exercises = rawExercises
      .filter((exercise): exercise is Record<string, unknown> =>
        Boolean(exercise) && typeof exercise === 'object'
      )
      .map(normalizeExercise);

    if (exercises.length === 0) {
      return NextResponse.json(
        { error: 'Logan could not put a workout together. Please try again.' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      id: `workout-${Date.now()}`,
      name: String(workoutData.name ?? '').trim() || "Today's Workout",
      date: new Date().toISOString().split('T')[0],
      exercises,
      duration: durationMinutes,
      notes: typeof workoutData.notes === 'string' ? workoutData.notes : '',
      completed: false,
    });
  } catch (error) {
    log.error('Error generating workout:', error instanceof Error ? error.message : error);

    if (error instanceof Error) {
      if (error.message.includes('401')) {
        return NextResponse.json(
          { error: 'The AI service rejected our credentials. Please contact support.' },
          { status: 502 }
        );
      }
      if (error.message.includes('429')) {
        return NextResponse.json(
          { error: 'Logan is a bit busy right now. Please wait a moment and try again.' },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to generate workout. Please try again.' },
      { status: 500 }
    );
  }
}
