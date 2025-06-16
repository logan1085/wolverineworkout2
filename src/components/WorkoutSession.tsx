'use client';

import { useState } from 'react';
import { Workout, Exercise } from '@/types/workout';

interface WorkoutSessionProps {
  workout: Workout;
  onComplete: (sessionData: WorkoutSessionData) => void;
  onCancel: () => void;
}

interface WorkoutSessionData {
  workoutId: string;
  completedExercises: CompletedExercise[];
  totalTime: number;
  notes: string;
}

interface CompletedExercise {
  exerciseName: string;
  sets: CompletedSet[];
  notes: string;
}

interface CompletedSet {
  reps: number;
  weight: number;
  completed: boolean;
}

export default function WorkoutSession({ workout, onComplete, onCancel }: WorkoutSessionProps) {
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [sessionData, setSessionData] = useState<WorkoutSessionData>({
    workoutId: workout.id || '',
    completedExercises: workout.exercises.map(exercise => ({
      exerciseName: exercise.name,
      sets: Array(exercise.sets).fill(null).map(() => ({
        reps: exercise.reps,
        weight: exercise.weight || 0,
        completed: false
      })),
      notes: ''
    })),
    totalTime: 0,
    notes: ''
  });
  const [startTime] = useState(Date.now());
  const [sessionNotes, setSessionNotes] = useState('');

  const currentExercise = workout.exercises[currentExerciseIndex];
  const currentCompletedExercise = sessionData.completedExercises[currentExerciseIndex];

  const updateSet = (exerciseIndex: number, setIndex: number, updates: Partial<CompletedSet>) => {
    setSessionData(prev => ({
      ...prev,
      completedExercises: prev.completedExercises.map((exercise, i) => 
        i === exerciseIndex 
          ? {
              ...exercise,
              sets: exercise.sets.map((set, j) => 
                j === setIndex ? { ...set, ...updates } : set
              )
            }
          : exercise
      )
    }));
  };

  const updateExerciseNotes = (exerciseIndex: number, notes: string) => {
    setSessionData(prev => ({
      ...prev,
      completedExercises: prev.completedExercises.map((exercise, i) => 
        i === exerciseIndex ? { ...exercise, notes } : exercise
      )
    }));
  };

  const nextSet = () => {
    if (currentSetIndex < currentExercise.sets - 1) {
      setCurrentSetIndex(currentSetIndex + 1);
    } else {
      nextExercise();
    }
  };

  const nextExercise = () => {
    if (currentExerciseIndex < workout.exercises.length - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
      setCurrentSetIndex(0);
    } else {
      // Workout complete
      const totalTime = Math.floor((Date.now() - startTime) / 1000 / 60); // minutes
      onComplete({
        ...sessionData,
        totalTime,
        notes: sessionNotes
      });
    }
  };

  const skipExercise = () => {
    nextExercise();
  };

  const getProgress = () => {
    const totalExercises = workout.exercises.length;
    const completedExercises = currentExerciseIndex + (currentSetIndex === 0 ? 0 : 1);
    return Math.round((completedExercises / totalExercises) * 100);
  };

  const getCurrentSet = () => {
    return currentCompletedExercise.sets[currentSetIndex];
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl shadow-2xl p-8 mb-8 border border-gray-700">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-4xl font-athletic-bold bg-gradient-to-r from-teal-400 to-blue-500 bg-clip-text text-transparent">
              {workout.name}
            </h1>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-white text-2xl font-athletic-bold transition-colors"
            >
              ✕
            </button>
          </div>
          
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-lg font-athletic-bold text-gray-300 mb-3">
              <span>Progress</span>
              <span>{getProgress()}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3 shadow-inner">
              <div 
                className="bg-gradient-to-r from-teal-500 to-blue-600 h-3 rounded-full transition-all duration-500 shadow-lg"
                style={{ width: `${getProgress()}%` }}
              ></div>
            </div>
          </div>

          {/* Exercise Counter */}
          <div className="text-center">
            <span className="text-xl font-athletic-bold text-gray-300">
              Exercise {currentExerciseIndex + 1} of {workout.exercises.length}
            </span>
          </div>
        </div>

        {/* Current Exercise */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl shadow-2xl border border-gray-700 p-8 mb-8">
          <h2 className="text-3xl font-athletic-bold text-white mb-6 text-center">
            {currentExercise.name}
          </h2>
          
          {currentExercise.notes && (
            <div className="bg-gradient-to-r from-teal-900 to-blue-900 border border-teal-700 rounded-xl p-4 mb-6">
              <p className="text-teal-200 text-lg font-athletic">{currentExercise.notes}</p>
            </div>
          )}

          {/* Set Counter */}
          <div className="text-center mb-8">
            <span className="text-2xl font-athletic-bold text-gray-300">
              Set {currentSetIndex + 1} of {currentExercise.sets}
            </span>
          </div>

          {/* Set Input */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-lg font-athletic-bold text-gray-300 mb-3">
                Reps Completed
              </label>
              <input
                type="number"
                value={getCurrentSet()?.reps || currentExercise.reps}
                onChange={(e) => updateSet(currentExerciseIndex, currentSetIndex, { 
                  reps: parseInt(e.target.value) || 0 
                })}
                className="w-full rounded-xl border-gray-600 bg-gray-700 text-white text-xl font-athletic-bold p-4 shadow-lg focus:border-teal-500 focus:ring-teal-500 focus:ring-2 transition-all duration-200"
                min="0"
              />
            </div>

            {currentExercise.weight !== undefined && (
              <div>
                <label className="block text-lg font-athletic-bold text-gray-300 mb-3">
                  Weight Used (lbs)
                </label>
                <input
                  type="number"
                  value={getCurrentSet()?.weight || currentExercise.weight || 0}
                  onChange={(e) => updateSet(currentExerciseIndex, currentSetIndex, { 
                    weight: parseFloat(e.target.value) || 0 
                  })}
                  className="w-full rounded-xl border-gray-600 bg-gray-700 text-white text-xl font-athletic-bold p-4 shadow-lg focus:border-teal-500 focus:ring-teal-500 focus:ring-2 transition-all duration-200"
                  min="0"
                  step="0.5"
                />
              </div>
            )}
          </div>

          {/* Exercise Notes */}
          <div className="mb-8">
            <label className="block text-lg font-athletic-bold text-gray-300 mb-3">
              Exercise Notes
            </label>
            <textarea
              value={currentCompletedExercise.notes}
              onChange={(e) => updateExerciseNotes(currentExerciseIndex, e.target.value)}
              className="w-full rounded-xl border-gray-600 bg-gray-700 text-white p-4 shadow-lg focus:border-teal-500 focus:ring-teal-500 focus:ring-2 transition-all duration-200 font-athletic"
              rows={3}
              placeholder="How did this exercise feel? Any modifications?"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center">
            <button
              onClick={skipExercise}
              className="px-8 py-4 bg-gradient-to-r from-gray-700 to-gray-800 text-white rounded-xl font-athletic-bold hover:from-gray-600 hover:to-gray-700 transition-all duration-200 border border-gray-600 shadow-lg"
            >
              Skip Exercise
            </button>
            <button
              onClick={nextSet}
              className="px-8 py-4 bg-gradient-to-r from-teal-600 to-blue-700 text-white rounded-xl font-athletic-bold hover:from-teal-500 hover:to-blue-600 transition-all duration-200 shadow-lg"
            >
              {currentSetIndex < currentExercise.sets - 1 ? 'Next Set' : 'Next Exercise'}
            </button>
          </div>
        </div>

        {/* Session Notes */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl shadow-2xl border border-gray-700 p-8">
          <h3 className="text-2xl font-athletic-bold text-white mb-4">Session Notes</h3>
          <textarea
            value={sessionNotes}
            onChange={(e) => setSessionNotes(e.target.value)}
            className="w-full rounded-xl border-gray-600 bg-gray-700 text-white p-4 shadow-lg focus:border-teal-500 focus:ring-teal-500 focus:ring-2 transition-all duration-200 font-athletic"
            rows={4}
            placeholder="How was your workout today? Any overall notes?"
          />
        </div>
      </div>
    </div>
  );
} 