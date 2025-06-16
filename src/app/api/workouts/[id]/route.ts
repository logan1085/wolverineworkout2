import { NextRequest, NextResponse } from 'next/server';
import { Workout } from '@/types/workout';

// In-memory storage (replace with database later)
let workouts: Workout[] = [];

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workout = workouts.find(w => w.id === params.id);
    
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

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    
    const workoutIndex = workouts.findIndex(w => w.id === params.id);
    
    if (workoutIndex === -1) {
      return NextResponse.json(
        { error: 'Workout not found' },
        { status: 404 }
      );
    }

    const updatedWorkout: Workout = {
      ...workouts[workoutIndex],
      ...body,
      id: params.id, // Ensure ID doesn't change
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workoutIndex = workouts.findIndex(w => w.id === params.id);
    
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