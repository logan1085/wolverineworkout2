'use client';

import { useState } from 'react';
import SimpleChat from '@/components/SimpleChat';
import WorkoutProposal from '@/components/WorkoutProposal';
import ActiveWorkout from '@/components/ActiveWorkout';
import WorkoutComplete from '@/components/WorkoutComplete';
import AuthForm from '@/components/AuthForm';
import { Workout } from '@/types/workout';
import { useAuth } from '@/contexts/AuthContext';
import { DatabaseService } from '@/services/database';

type AppState = 'chat' | 'proposal' | 'workout' | 'complete';

function LogoutButton() {
  const { signOut } = useAuth();
  
  return (
    <button
      onClick={signOut}
      className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded-lg text-sm transition-colors"
    >
      Sign Out
    </button>
  );
}

export default function Home() {
  const { user, loading } = useAuth();
  const [appState, setAppState] = useState<AppState>('chat');
  const [proposedWorkout, setProposedWorkout] = useState<Workout | null>(null);
  const [completedWorkout, setCompletedWorkout] = useState<Workout | null>(null);

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  // Show auth form if not logged in
  if (!user) {
    return <AuthForm />;
  }

  const handleWorkoutProposed = (workout: Workout) => {
    setProposedWorkout(workout);
    setAppState('proposal');
  };

  const handleWorkoutConfirmed = async () => {
    if (proposedWorkout) {
      // Update workout status to active when user confirms
      await DatabaseService.updateWorkoutStatus(proposedWorkout.id, 'active');
      setAppState('workout');
    }
  };

  const handleWorkoutCompleted = async (workout: Workout) => {
    // Update workout status to completed in database
    const completedWorkoutFromDB = await DatabaseService.updateWorkoutStatus(workout.id, 'completed');
    
    if (completedWorkoutFromDB) {
      setCompletedWorkout(completedWorkoutFromDB);
    } else {
      setCompletedWorkout(workout);
    }
    
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
        <header className="text-center mb-8 relative">
          <h1 className="text-4xl font-bold text-white mb-2">
          👋 Hi, I&apos;m Logan
          </h1>
          <p className="text-gray-300">Your AI personal trainer</p>
          
          {/* User info and logout */}
          <div className="absolute top-0 right-0 flex items-center space-x-4">
            <span className="text-gray-300 text-sm">
              Welcome, {user.email}
            </span>
            <LogoutButton />
          </div>
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
