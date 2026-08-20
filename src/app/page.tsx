'use client';

import { useEffect, useRef, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import SimpleChat from '@/components/SimpleChat';
import LoganAvatar from '@/components/LoganAvatar';
import WorkoutProposal from '@/components/WorkoutProposal';
import ActiveWorkout from '@/components/ActiveWorkout';
import WorkoutComplete from '@/components/WorkoutComplete';
import AuthForm from '@/components/AuthForm';
import MemoryTestChat from '@/components/MemoryTestChat';
import { Workout } from '@/types/workout';
import { useAuth } from '@/contexts/AuthContext';
import { DatabaseService } from '@/services/database';
import { DEV_TOOLS_ENABLED } from '@/lib/dev-tools';

type AppState = 'chat' | 'proposal' | 'workout' | 'complete';

function LogoutButton() {
  const { signOut } = useAuth();
  
  return (
    <button
      onClick={signOut}
      className="shrink-0 bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded-lg text-sm transition-colors"
    >
      Sign Out
    </button>
  );
}

function MobileHeader({ user, onMenuToggle, isMenuOpen }: {
  user: User;
  onMenuToggle: () => void;
  isMenuOpen: boolean;
}) {
  const { signOut } = useAuth();
  const menuRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const wasOpenRef = useRef(false);

  // Escape closes the slide-out menu, so keyboard users aren't trapped behind
  // an overlay that previously only responded to a click on the backdrop.
  useEffect(() => {
    if (!isMenuOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onMenuToggle();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMenuOpen, onMenuToggle]);

  // Move focus into the panel when it opens and hand it back to the hamburger
  // when it closes. Without this the panel announced itself as a modal while
  // focus stayed on the page behind it, so a keyboard or screen-reader user
  // opened the menu and then tabbed through content they could not see.
  useEffect(() => {
    if (isMenuOpen) {
      wasOpenRef.current = true;
      menuRef.current?.focus();
    } else if (wasOpenRef.current) {
      wasOpenRef.current = false;
      toggleRef.current?.focus();
    }
  }, [isMenuOpen]);

  return (
    <div className="md:hidden">
      {/* Mobile header. The height is pinned to --header-h rather than derived
          from padding: below 640px globals.css gives every button a 44px
          minimum, which made this bar 4px taller than the offset the content
          area subtracts, so the top of the chat sat under it. */}
      <div className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 h-[calc(var(--header-h)-1px)] bg-gray-900 border-b border-gray-700">
        {/* Hamburger menu */}
        <button
          ref={toggleRef}
          onClick={onMenuToggle}
          aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isMenuOpen}
          className="p-2 text-gray-300 hover:text-white transition-colors"
        >
          <svg aria-hidden="true" className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Center title with Logan. The chevron that used to sit after the name
            was decorative but read as a "tap for more" affordance on a label
            that goes nowhere, so it is gone. */}
        <div className="flex items-center space-x-2">
          <LoganAvatar className="w-8 h-8 border border-gray-600" fallbackClassName="bg-gray-600 text-sm" />
          <span className="text-white font-medium">Logan</span>
        </div>

        {/* Right side spacer for balance */}
        <div className="w-10"></div>
      </div>

      {/* Slide-out menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/50" onClick={onMenuToggle}>
          <div
            ref={menuRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label="Account menu"
            className="w-64 h-full bg-gray-800 shadow-lg focus:outline-none"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center space-x-3">
                <LoganAvatar className="w-10 h-10 border border-gray-600" />
                <div>
                  <h3 className="text-white font-medium">Logan</h3>
                  <p className="text-gray-400 text-sm">AI Personal Trainer</p>
                </div>
              </div>
            </div>
            
            <div className="p-4">
              <div className="text-gray-400 text-sm mb-2">Signed in as:</div>
              {/* break-all: the panel is only 16rem wide and a long address
                  otherwise ran off the edge of it. */}
              <div className="text-white text-sm mb-4 break-all">{user.email}</div>

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
  const [showMemoryTest, setShowMemoryTest] = useState(false);
  // Guards the async status writes so a double-tap cannot fire two transitions.
  const [isTransitioning, setIsTransitioning] = useState(false);

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
    if (!proposedWorkout || isTransitioning) return;

    setIsTransitioning(true);
    try {
      // Marking the workout active is bookkeeping. If it fails there is no
      // reason to block someone from exercising, so the session starts either
      // way and the status is reconciled when the workout is completed.
      await DatabaseService.updateWorkoutStatus(proposedWorkout.id, 'active');
    } catch {
      // Deliberately ignored - see above.
    } finally {
      // In a `finally` so a thrown network error cannot leave the flag stuck on
      // and permanently disable the button.
      setIsTransitioning(false);
    }
    setAppState('workout');
  };

  const handleWorkoutCompleted = async (workout: Workout) => {
    if (isTransitioning) return;
    setIsTransitioning(true);

    let completedWorkoutFromDB: Workout | null = null;
    try {
      // Save what was actually performed before flipping the status, so the
      // per-exercise detail survives the session rather than living only in
      // component state.
      if (workout.exercises?.length) {
        await DatabaseService.saveExerciseProgress(workout.exercises);
      }

      completedWorkoutFromDB = await DatabaseService.updateWorkoutStatus(
        workout.id,
        'completed'
      );
    } catch {
      // Never block the summary on a failed write - the user finished the
      // workout either way, and the in-memory copy below has everything the
      // summary needs.
    } finally {
      setIsTransitioning(false);
    }

    // Row-level fields (completed_at, status) come from the database, but the
    // exercises come from this session. The in-memory copy is authoritative for
    // what was just done, and it stays correct even if the writes above failed.
    setCompletedWorkout({
      ...workout,
      ...(completedWorkoutFromDB ?? {}),
      exercises: workout.exercises,
    });

    setAppState('complete');
  };

  const handleStartOver = () => {
    setProposedWorkout(null);
    setCompletedWorkout(null);
    setAppState('chat');
  };

  const handleExitWorkout = () => {
    setAppState('proposal');
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
        {/* The account controls used to be `absolute top-0 right-0` over a
            full-width centred title. At the md breakpoint the two overlapped:
            the greeting ran underneath "Welcome, <email>" and the Sign Out
            button. Equal flex-1 rails on either side keep the title optically
            centred while reserving real space for the controls. The responsive
            variants that were on that block are gone too - this whole header is
            already md-and-up, so they never applied. */}
        <header className="mb-8 flex items-center justify-between gap-4">
          <div className="flex-1" aria-hidden="true" />

          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              👋 Hi, I&apos;m Logan
            </h1>
            <p className="text-gray-300">Your AI personal trainer</p>
          </div>

          {/* User info and logout */}
          <div className="flex-1 min-w-0 flex items-center justify-end gap-4">
            <span
              className="text-gray-300 text-sm truncate"
              title={user.email}
            >
              Welcome, {user.email}
            </span>
            {DEV_TOOLS_ENABLED && (
              <button
                onClick={() => setShowMemoryTest(!showMemoryTest)}
                className="shrink-0 bg-teal-600 hover:bg-teal-700 text-white px-3 py-1 rounded-lg text-sm transition-colors"
              >
                🧠 {showMemoryTest ? 'Hide Memory Test' : 'Test Memory'}
              </button>
            )}
            <LogoutButton />
          </div>
        </header>
      </div>

      {/* Content area. dvh, not vh: on mobile browsers 100vh is the height with
          the address bar retracted, so the chat's send button and input sat
          below the fold behind the browser chrome until you scrolled. The
          header offset is a shared token instead of a magic 73 in three
          places. */}
      <div className="pt-[var(--header-h)] md:pt-0 h-dvh md:h-auto md:container md:mx-auto md:px-4">
        <div className="h-[calc(100dvh-var(--header-h))] md:h-auto md:max-w-4xl md:mx-auto">
          {/* Memory Test Component - developer tool, never in production */}
          {DEV_TOOLS_ENABLED && showMemoryTest && (
            <div className="mb-6">
              <MemoryTestChat />
            </div>
          )}
          
          {appState === 'chat' && (
            <SimpleChat onWorkoutProposed={handleWorkoutProposed} />
          )}
          
          {appState === 'proposal' && proposedWorkout && (
            <WorkoutProposal
              workout={proposedWorkout}
              onConfirm={handleWorkoutConfirmed}
              onBack={() => setAppState('chat')}
              isConfirming={isTransitioning}
            />
          )}

          {appState === 'workout' && proposedWorkout && (
            <ActiveWorkout
              workout={proposedWorkout}
              onComplete={handleWorkoutCompleted}
              onExit={handleExitWorkout}
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
