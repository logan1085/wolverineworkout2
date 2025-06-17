'use client';

import { useState } from 'react';
import SimpleChat from '@/components/SimpleChat';
import WorkoutProposal from '@/components/WorkoutProposal';
import ActiveWorkout from '@/components/ActiveWorkout';
import WorkoutComplete from '@/components/WorkoutComplete';
import { Workout } from '@/types/workout';

type AppState = 'chat' | 'proposal' | 'workout' | 'complete';

export default function Home() {
  const [appState, setAppState] = useState<AppState>('chat');
  const [proposedWorkout, setProposedWorkout] = useState<Workout | null>(null);
  const [completedWorkout, setCompletedWorkout] = useState<Workout | null>(null);

  const handleWorkoutProposed = (workout: Workout) => {
    setProposedWorkout(workout);
    setAppState('proposal');
  };

  const handleWorkoutConfirmed = () => {
    setAppState('workout');
  };

  const handleWorkoutCompleted = (workout: Workout) => {
    setCompletedWorkout(workout);
    setAppState('complete');
  };

  const handleStartOver = () => {
    setProposedWorkout(null);
    setCompletedWorkout(null);
    setAppState('chat');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            🏋️‍♂️ Wolverine Workout
          </h1>
          <p className="text-gray-300">Your AI Personal Trainer</p>
        </header>

        <div className="max-w-4xl mx-auto">
          {appState === 'chat' && (
            <SimpleChat onWorkoutProposed={handleWorkoutProposed} />
          )}
          
          {appState === 'proposal' && proposedWorkout && (
            <WorkoutProposal 
              workout={proposedWorkout}
              onConfirm={handleWorkoutConfirmed}
              onBack={() => setAppState('chat')}
            />
          )}
          
          {appState === 'workout' && proposedWorkout && (
            <ActiveWorkout 
              workout={proposedWorkout}
              onComplete={handleWorkoutCompleted}
            />
          )}
          
          {appState === 'complete' && completedWorkout && (
            <WorkoutComplete 
              workout={completedWorkout}
              onStartOver={handleStartOver}
            />
          )}
        </div>
      </div>
    </div>
  );
}
