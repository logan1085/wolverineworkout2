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

function MobileHeader({ user, onMenuToggle, isMenuOpen }: { 
  user: any; 
  onMenuToggle: () => void; 
  isMenuOpen: boolean;
}) {
  const { signOut } = useAuth();

  return (
    <div className="md:hidden">
      {/* Mobile header */}
      <div className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between p-4 bg-gray-900 border-b border-gray-700">
        {/* Hamburger menu */}
        <button
          onClick={onMenuToggle}
          className="p-2 text-gray-300 hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Center title with Logan */}
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-600">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src="/logan-profile.jpg" 
              alt="Logan"
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <div className="hidden w-full h-full bg-gray-600 rounded-full flex items-center justify-center">
              <span className="text-sm font-bold text-white">L</span>
            </div>
          </div>
          <span className="text-white font-medium">Logan</span>
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>

        {/* Right side spacer for balance */}
        <div className="w-10"></div>
      </div>

      {/* Slide-out menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50" onClick={onMenuToggle}>
          <div className="w-64 h-full bg-gray-800 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-600">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src="/logan-profile.jpg" 
                    alt="Logan"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                  <div className="hidden w-full h-full bg-gray-600 rounded-full flex items-center justify-center">
                    <span className="text-lg font-bold text-white">L</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-white font-medium">Logan</h3>
                  <p className="text-gray-400 text-sm">AI Personal Trainer</p>
                </div>
              </div>
            </div>
            
            <div className="p-4">
              <div className="text-gray-400 text-sm mb-2">Signed in as:</div>
              <div className="text-white text-sm mb-4">{user.email}</div>
              
              <button
                onClick={() => {
                  onMenuToggle();
                  signOut();
                }}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const { user, loading } = useAuth();
  const [appState, setAppState] = useState<AppState>('chat');
  const [proposedWorkout, setProposedWorkout] = useState<Workout | null>(null);
  const [completedWorkout, setCompletedWorkout] = useState<Workout | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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

  const handleMenuToggle = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Mobile header */}
      <MobileHeader 
        user={user} 
        onMenuToggle={handleMenuToggle} 
        isMenuOpen={isMenuOpen}
      />

      {/* Desktop header - hidden on mobile */}
      <div className="hidden md:block container mx-auto px-4 py-4 md:py-8">
        <header className="text-center mb-8 relative">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
          👋 Hi, I&apos;m Logan
          </h1>
          <p className="text-gray-300">Your AI personal trainer</p>
          
          {/* User info and logout */}
          <div className="absolute top-0 right-0 flex flex-col md:flex-row items-end md:items-center space-y-2 md:space-y-0 md:space-x-4">
            <span className="hidden md:block text-gray-300 text-sm">
              Welcome, {user.email}
            </span>
            <LogoutButton />
          </div>
        </header>
      </div>

      {/* Content area */}
      <div className="pt-[73px] md:pt-0 h-screen md:h-auto md:container md:mx-auto md:px-4">
        <div className="h-[calc(100vh-73px)] md:h-auto md:max-w-4xl md:mx-auto">
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
