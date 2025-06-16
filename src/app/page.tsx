'use client';

import { useState, useEffect } from 'react';
import { Workout } from '@/types/workout';
import { ApiService } from '@/services/api';
import WorkoutForm from '@/components/WorkoutForm';
import WorkoutList from '@/components/WorkoutList';
import WorkoutGenerator from '@/components/WorkoutGenerator';
import WorkoutSession from '@/components/WorkoutSession';
import WorkoutSummary from '@/components/WorkoutSummary';
import LoganChat from '@/components/LoganChat';
import Dashboard from '@/components/Dashboard';

interface WorkoutSessionData {
  workoutId: string;
  completedExercises: {
    exerciseName: string;
    sets: {
      reps: number;
      weight: number;
      completed: boolean;
    }[];
    notes: string;
  }[];
  totalTime: number;
  notes: string;
}

export default function Home() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [showSession, setShowSession] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);
  const [currentWorkout, setCurrentWorkout] = useState<Workout | null>(null);
  const [sessionData, setSessionData] = useState<WorkoutSessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'landing' | 'dashboard'>('landing');

  useEffect(() => {
    loadWorkouts();
  }, []);

  const loadWorkouts = async () => {
    try {
      setLoading(true);
      const data = await ApiService.getWorkouts();
      setWorkouts(data);
      setError(null);
    } catch (err) {
      setError('Failed to load workouts.');
      console.error('Error loading workouts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWorkout = async (workoutData: Omit<Workout, 'id'>) => {
    try {
      const newWorkout = await ApiService.createWorkout(workoutData);
      setWorkouts([...workouts, newWorkout]);
      setShowForm(false);
      setError(null);
    } catch (err) {
      setError('Failed to create workout');
      console.error('Error creating workout:', err);
    }
  };

  const handleUpdateWorkout = async (workoutData: Omit<Workout, 'id'>) => {
    if (!editingWorkout?.id) return;
    
    try {
      const updatedWorkout = await ApiService.updateWorkout(editingWorkout.id, workoutData);
      setWorkouts(workouts.map(w => w.id === editingWorkout.id ? updatedWorkout : w));
      setEditingWorkout(null);
      setError(null);
    } catch (err) {
      setError('Failed to update workout');
      console.error('Error updating workout:', err);
    }
  };

  const handleDeleteWorkout = async (id: string) => {
    if (!confirm('Are you sure you want to delete this workout?')) return;
    
    try {
      await ApiService.deleteWorkout(id);
      setWorkouts(workouts.filter(w => w.id !== id));
      setError(null);
    } catch (err) {
      setError('Failed to delete workout');
      console.error('Error deleting workout:', err);
    }
  };

  const handleEdit = (workout: Workout) => {
    setEditingWorkout(workout);
    setShowForm(true);
  };

  const handleStartWorkout = (workout: Workout) => {
    setCurrentWorkout(workout);
    setShowSession(true);
  };

  const handleWorkoutComplete = (data: WorkoutSessionData) => {
    // Mark the workout as completed
    if (currentWorkout?.id) {
      const updatedWorkout = { ...currentWorkout, completed: true };
      setWorkouts(workouts.map(w => w.id === currentWorkout.id ? updatedWorkout : w));
    }
    
    setSessionData(data);
    setShowSession(false);
    setShowSummary(true);
  };

  const handleSessionCancel = () => {
    setShowSession(false);
    setCurrentWorkout(null);
  };

  const handleSummaryClose = () => {
    setShowSummary(false);
    setSessionData(null);
    setCurrentWorkout(null);
  };

  const handleSummarySave = () => {
    console.log('Session data saved:', sessionData);
    handleSummaryClose();
  };

  const handleCancel = () => {
    setShowForm(false);
    setShowGenerator(false);
    setEditingWorkout(null);
  };

  const handleWorkoutGenerated = (generatedWorkout: Workout) => {
    // The generatedWorkout is just the first one, but we need to reload all workouts
    // since multiple workouts were created
    loadWorkouts();
    setShowGenerator(false);
    setShowChat(false);
    setCurrentView('dashboard');
    setError(null);
  };

  const handleDashboardWorkoutClick = (workout: Workout) => {
    setCurrentWorkout(workout);
    setShowSession(true);
  };

  const handleGenerateNewPlan = () => {
    setShowChat(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto"></div>
          <p className="mt-4 text-gray-300">Loading your fitness journey...</p>
        </div>
      </div>
    );
  }

  // Show workout session
  if (showSession && currentWorkout) {
    return (
      <WorkoutSession
        workout={currentWorkout}
        onComplete={handleWorkoutComplete}
        onCancel={handleSessionCancel}
      />
    );
  }

  // Show workout summary
  if (showSummary && currentWorkout && sessionData) {
    return (
      <WorkoutSummary
        workout={currentWorkout}
        sessionData={sessionData}
        onClose={handleSummaryClose}
        onSave={handleSummarySave}
      />
    );
  }

  // Show Logan Chat
  if (showChat) {
    return (
      <LoganChat
        onWorkoutGenerated={handleWorkoutGenerated}
        onClose={() => setShowChat(false)}
      />
    );
  }

  // Landing Page
  if (currentView === 'landing') {
    return (
      <div className="min-h-screen bg-black text-white">
        {/* Navigation */}
        <nav className="absolute top-0 left-0 right-0 z-50 p-6">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-teal-500 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">L</span>
              </div>
              <span className="text-xl font-bold">Logan Fitness</span>
            </div>
            <button
              onClick={() => setCurrentView('dashboard')}
              className="bg-gradient-to-r from-teal-500 to-blue-600 text-white px-6 py-2 rounded-lg hover:from-teal-600 hover:to-blue-700 transition-all duration-200"
            >
              Dashboard
            </button>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
          {/* Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black"></div>
          
          {/* Subtle Background Elements */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 left-20 w-96 h-96 bg-teal-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
            <div className="absolute top-40 right-20 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse animation-delay-2000"></div>
            <div className="absolute bottom-20 left-1/2 w-96 h-96 bg-teal-400 rounded-full mix-blend-multiply filter blur-3xl animate-pulse animation-delay-4000"></div>
          </div>

          <div className="relative z-10 text-center max-w-5xl mx-auto px-6">
            {/* Main Value Proposition */}
            <div className="mb-12">
              <div className="w-20 h-20 bg-gradient-to-r from-teal-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
                <span className="text-white font-bold text-3xl">L</span>
              </div>
              
              {/* Clear, Bold Headline */}
              <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-teal-400 to-blue-500 bg-clip-text text-transparent leading-tight">
                Your Personal AI Trainer
              </h1>
              
              {/* Simple, Clear Subtitle */}
              <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
                Get personalized workout plans created just for you. 
                No more guessing what to do in the gym.
              </p>
              
              {/* Single Clear CTA */}
              <div className="mb-16">
                <button
                  onClick={() => setShowChat(true)}
                  className="bg-gradient-to-r from-teal-500 to-blue-600 text-white px-12 py-6 rounded-2xl text-xl font-semibold hover:from-teal-600 hover:to-blue-700 transition-all duration-200 transform hover:scale-105 shadow-2xl"
                >
                  Start Your Free Workout Plan
                </button>
              </div>
            </div>

            {/* Simple Benefits Section */}
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-teal-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Personalized Plans</h3>
                <p className="text-gray-400">Tailored to your goals, level, and schedule</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-teal-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Instant Results</h3>
                <p className="text-gray-400">Get your workout plan in seconds, not hours</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-teal-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Track Progress</h3>
                <p className="text-gray-400">See your improvements over time</p>
              </div>
            </div>

            {/* Social Proof */}
            <div className="mt-16 pt-8 border-t border-gray-800">
              <p className="text-gray-400 text-sm">
                Join thousands of users who have transformed their fitness with AI-powered workouts
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard View
  return (
    <Dashboard
      workouts={workouts}
      onWorkoutClick={handleDashboardWorkoutClick}
      onGenerateNewPlan={handleGenerateNewPlan}
      onGoHome={() => setCurrentView('landing')}
    />
  );
}
