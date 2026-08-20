import { NextRequest, NextResponse } from 'next/server';
import { CreateWorkoutRequest } from '@/types/workout';
import { StoredWorkout, workouts } from '@/lib/workout-store';
import { parseJsonBody } from '@/lib/api-validation';

// Next.js 15 hands route handlers their params as a promise.
type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const workout = workouts.find(w => w.id === id);

    if (!workout) {
      return NextResponse.json(
        { error: 'Workout not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(workout);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch workout' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;

    const parsed = await parseJsonBody<Partial<CreateWorkoutRequest>>(request);
    if (!parsed.ok) {
      return parsed.response;
    }
    const body = parsed.data;

    const workoutIndex = workouts.findIndex(w => w.id === id);

    if (workoutIndex === -1) {
      return NextResponse.json(
        { error: 'Workout not found' },
        { status: 404 }
      );
    }

    if (body.exercises !== undefined && !Array.isArray(body.exercises)) {
      return NextResponse.json(
        { error: 'Field "exercises" must be an array' },
        { status: 400 }
      );
    }

    const updatedWorkout: StoredWorkout = {
      ...workouts[workoutIndex],
      ...body,
      id, // Ensure ID doesn't change
    };

    workouts[workoutIndex] = updatedWorkout;

    return NextResponse.json(updatedWorkout);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update workout' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const workoutIndex = workouts.findIndex(w => w.id === id);

    if (workoutIndex === -1) {
      return NextResponse.json(
        { error: 'Workout not found' },
        { status: 404 }
      );
    }

    const deletedWorkout = workouts.splice(workoutIndex, 1)[0];

    return NextResponse.json({
      message: `Workout ${deletedWorkout.name} deleted successfully`
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete workout' },
      { status: 500 }
    );
  }
}
