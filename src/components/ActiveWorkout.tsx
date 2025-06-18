'use client';

import { useState, useEffect } from 'react';
import { Workout, Exercise } from '@/types/workout';
import { DatabaseService } from '@/services/database';

interface ActiveWorkoutProps {
  workout: Workout;
  onComplete: (completedWorkout: Workout) => void;
}

interface ExerciseState {
  completed: boolean;
  sets: {
    reps: number;
    weight: number;
    completed: boolean;
  }[];
}

export default function ActiveWorkout({ workout, onComplete }: ActiveWorkoutProps) {
  const [exerciseStates, setExerciseStates] = useState<ExerciseState[]>([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [startTime, setStartTime] = useState<Date>(new Date());
  const [elapsedTime, setElapsedTime] = useState(0);

  // Initialize exercise states
  useEffect(() => {
    const initialStates = workout.exercises?.map(exercise => ({
      completed: exercise.completed || false,
      sets: Array.from({ length: exercise.sets }, (_, index) => ({
        reps: exercise.actual_reps?.[index] || exercise.reps,
        weight: exercise.actual_weight_lbs || exercise.weight_lbs || 0,
        completed: false
      }))
    })) || [];
    setExerciseStates(initialStates);
  }, [workout]);

  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((new Date().getTime() - startTime.getTime()) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const updateSet = (exerciseIndex: number, setIndex: number, field: 'reps' | 'weight', value: number) => {
    setExerciseStates(prev => {
      const newStates = [...prev];
      newStates[exerciseIndex].sets[setIndex][field] = value;
      return newStates;
    });
  };

  const completeSet = async (exerciseIndex: number, setIndex: number) => {
    setExerciseStates(prev => {
      const newStates = [...prev];
      newStates[exerciseIndex].sets[setIndex].completed = true;
      
      // Check if all sets are completed for this exercise
      const allSetsCompleted = newStates[exerciseIndex].sets.every(set => set.completed);
      if (allSetsCompleted) {
        newStates[exerciseIndex].completed = true;
        
        // Save exercise progress to database
        const exercise = workout.exercises?.[exerciseIndex];
        if (exercise?.id) {
          const actualReps = newStates[exerciseIndex].sets.map(s => s.reps);
          const actualSets = newStates[exerciseIndex].sets.filter(s => s.completed).length;
          const actualWeight = newStates[exerciseIndex].sets[0]?.weight || 0;
          
          DatabaseService.updateExerciseProgress(exercise.id, {
            completed: true,
            actual_sets: actualSets,
            actual_reps: actualReps,
            actual_weight_lbs: actualWeight
          });
        }
      }
      
      return newStates;
    });
  };

  const handleCompleteWorkout = async () => {
    // Create completed workout with actual results
    const completedWorkout: Workout = {
      ...workout,
      status: 'completed' as const,
      completed_at: new Date().toISOString(),
      exercises: workout.exercises?.map((exercise, index) => {
        const state = exerciseStates[index];
        return {
          ...exercise,
          completed: state?.completed || false,
          actual_sets: state?.sets.filter(s => s.completed).length || 0,
          actual_reps: state?.sets.map(s => s.reps) || [],
          actual_weight_lbs: state?.sets[0]?.weight || exercise.weight_lbs || 0
        };
      }) || []
    };
    
    onComplete(completedWorkout);
  };

  const currentExercise = workout.exercises?.[currentExerciseIndex];
  const currentExerciseState = exerciseStates[currentExerciseIndex];
  const completedExercises = exerciseStates.filter(state => state.completed).length;
  const totalExercises = workout.exercises?.length || 0;

  if (!currentExercise || !currentExerciseState) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white">Loading workout...</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-3xl shadow-2xl p-4 md:p-8 border border-gray-700 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-6 md:mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">💪 {workout.name}</h2>
        <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-8 text-gray-300 text-sm md:text-base">
          <div>⏱️ {formatTime(elapsedTime)}</div>
          <div>📊 {completedExercises}/{totalExercises} exercises</div>
          <div>🎯 {workout.workout_type}</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6 md:mb-8">
        <div className="bg-gray-700 rounded-full h-3 mb-2">
          <div 
            className="bg-gradient-to-r from-teal-600 to-blue-700 h-3 rounded-full transition-all duration-300"
            style={{ width: `${totalExercises > 0 ? (completedExercises / totalExercises) * 100 : 0}%` }}
          ></div>
        </div>
        <p className="text-center text-gray-400 text-xs md:text-sm">
          {completedExercises === totalExercises ? 'All exercises completed!' : `Exercise ${currentExerciseIndex + 1} of ${totalExercises}`}
        </p>
      </div>

      {/* Current Exercise */}
      <div className="bg-gray-900 rounded-2xl p-4 md:p-6 mb-6 md:mb-8 border border-gray-600">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
          <h3 className="text-xl md:text-2xl font-bold text-white">{currentExercise.name}</h3>
          <div className="flex items-center space-x-2">
            {currentExercise.rest_seconds && (
              <div className="bg-orange-600 text-white px-2 md:px-3 py-1 rounded-full text-xs md:text-sm">
                {currentExercise.rest_seconds}s rest
              </div>
            )}
            {currentExerciseState.completed && (
              <div className="bg-green-600 text-white px-2 md:px-3 py-1 rounded-full text-xs md:text-sm">
                ✓ Complete
              </div>
            )}
          </div>
        </div>
        
        {currentExercise.notes && (
          <p className="text-gray-300 mb-4 md:mb-6 bg-gray-800 p-3 md:p-4 rounded-lg text-sm break-words">
            {currentExercise.notes}
          </p>
        )}

        {/* Sets */}
        <div className="space-y-3 md:space-y-4">
          <h4 className="text-base md:text-lg font-semibold text-white">Sets:</h4>
          {currentExerciseState.sets.map((set, setIndex) => (
            <div key={setIndex} className={`p-3 md:p-4 rounded-lg border ${
              set.completed 
                ? 'bg-green-900 border-green-600' 
                : 'bg-gray-800 border-gray-600'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <span className="text-white font-semibold text-sm md:text-base">Set {setIndex + 1}</span>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <div className="flex items-center gap-2">
                    <label className="text-gray-300 text-xs md:text-sm min-w-0">Reps:</label>
                    <input
                      type="number"
                      value={set.reps}
                      onChange={(e) => updateSet(currentExerciseIndex, setIndex, 'reps', parseInt(e.target.value) || 0)}
                      className="w-14 md:w-16 bg-gray-700 text-white rounded px-2 py-1 text-center text-sm"
                      disabled={set.completed}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-gray-300 text-xs md:text-sm">Weight:</label>
                    <input
                      type="number"
                      value={set.weight}
                      onChange={(e) => updateSet(currentExerciseIndex, setIndex, 'weight', parseFloat(e.target.value) || 0)}
                      className="w-16 md:w-20 bg-gray-700 text-white rounded px-2 py-1 text-center text-sm"
                      disabled={set.completed}
                    />
                    <span className="text-gray-400 text-xs md:text-sm">lbs</span>
                  </div>
                  <button
                    onClick={() => completeSet(currentExerciseIndex, setIndex)}
                    disabled={set.completed}
                    className={`px-3 md:px-4 py-2 rounded-lg font-semibold transition-all duration-200 text-xs md:text-sm whitespace-nowrap ${
                      set.completed
                        ? 'bg-green-600 text-white cursor-not-allowed'
                        : 'bg-teal-600 text-white hover:bg-teal-700'
                    }`}
                  >
                    {set.completed ? '✓ Done' : 'Complete Set'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0">
        <button
          onClick={() => setCurrentExerciseIndex(Math.max(0, currentExerciseIndex - 1))}
          disabled={currentExerciseIndex === 0}
          className="w-full sm:w-auto px-4 md:px-6 py-2 md:py-3 bg-gray-700 text-white rounded-xl hover:bg-gray-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
        >
          ← Previous Exercise
        </button>

        {completedExercises === totalExercises ? (
          <button
            onClick={handleCompleteWorkout}
            className="w-full sm:w-auto px-6 md:px-8 py-2 md:py-3 bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-xl hover:from-green-700 hover:to-emerald-800 transition-all duration-200 font-semibold text-sm md:text-base"
          >
            🎉 Complete Workout!
          </button>
        ) : (
          <button
            onClick={() => setCurrentExerciseIndex(Math.min(totalExercises - 1, currentExerciseIndex + 1))}
            disabled={currentExerciseIndex === totalExercises - 1}
            className="w-full sm:w-auto px-4 md:px-6 py-2 md:py-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
          >
            Next Exercise →
          </button>
        )}
      </div>

      {/* Exercise Overview */}
      <div className="mt-6 md:mt-8 bg-gray-900 rounded-2xl p-4 md:p-6 border border-gray-600">
        <h4 className="text-base md:text-lg font-semibold text-white mb-4">All Exercises:</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {workout.exercises?.map((exercise, index) => (
            <div
              key={exercise.id || index}
              className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                index === currentExerciseIndex
                  ? 'bg-teal-900 border-teal-600'
                  : exerciseStates[index]?.completed
                  ? 'bg-green-900 border-green-600'
                  : 'bg-gray-800 border-gray-600 hover:border-gray-500'
              }`}
              onClick={() => setCurrentExerciseIndex(index)}
            >
              <div className="flex items-center justify-between">
                <span className="text-white font-medium text-xs md:text-sm break-words pr-2">{exercise.name}</span>
                <div className="flex items-center space-x-1 flex-shrink-0">
                  {exerciseStates[index]?.completed && (
                    <span className="text-green-400 text-xs">✓</span>
                  )}
                  {index === currentExerciseIndex && (
                    <span className="text-teal-400 text-xs">●</span>
                  )}
                </div>
              </div>
              <div className="text-gray-400 text-xs mt-1">
                {exercise.sets} sets × {exercise.reps} reps
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 