import { NextRequest, NextResponse } from 'next/server';
import { Workout, Exercise } from '@/types/workout';

// In-memory storage (replace with database later)
let workouts: Workout[] = [];

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
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.date || !body.exercises) {
      return NextResponse.json(
        { error: 'Missing required fields: name, date, exercises' },
        { status: 400 }
      );
    }

    // Generate unique ID
    const id = crypto.randomUUID();
    
    const newWorkout: Workout = {
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