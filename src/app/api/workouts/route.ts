import { NextRequest, NextResponse } from 'next/server';
import { CreateWorkoutRequest } from '@/types/workout';
import { StoredWorkout, workouts } from '@/lib/workout-store';
import { missingFields, missingFieldsResponse, parseJsonBody } from '@/lib/api-validation';

export async function GET() {
  try {
    return NextResponse.json(workouts);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch workouts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const parsed = await parseJsonBody<CreateWorkoutRequest>(request);
    if (!parsed.ok) {
      return parsed.response;
    }
    const body = parsed.data;

    // Validate required fields
    const missing = missingFields(body as unknown as Record<string, unknown>, [
      'name',
      'date',
      'exercises',
    ]);
    if (missing.length > 0) {
      return missingFieldsResponse(missing);
    }

    if (!Array.isArray(body.exercises)) {
      return NextResponse.json(
        { error: 'Field "exercises" must be an array' },
        { status: 400 }
      );
    }

    // Generate unique ID
    const id = crypto.randomUUID();

    const newWorkout: StoredWorkout = {
      id,
      name: body.name,
      date: body.date,
      exercises: body.exercises,
      duration: body.duration,
      notes: body.notes,
    };

    workouts.push(newWorkout);

    return NextResponse.json(newWorkout, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create workout' },
      { status: 500 }
    );
  }
}
