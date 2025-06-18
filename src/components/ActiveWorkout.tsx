'use client';

import { useState, useEffect, useRef } from 'react';
import { Workout, Exercise } from '@/types/workout';
import VoiceChat from './VoiceChat';

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
  const voiceChatRef = useRef<{ restartVoiceChat: () => void } | null>(null);

  // Initialize exercise states
  useEffect(() => {
    const initialStates = workout.exercises.map(exercise => ({
      completed: false,
      sets: Array.from({ length: exercise.sets }, () => ({
        reps: exercise.reps,
        weight: exercise.weight || 0,
        completed: false
      }))
    }));
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

  const completeSet = (exerciseIndex: number, setIndex: number) => {
    setExerciseStates(prev => {
      const newStates = [...prev];
      newStates[exerciseIndex].sets[setIndex].completed = true;
      
      // Check if all sets are completed for this exercise
      const allSetsCompleted = newStates[exerciseIndex].sets.every(set => set.completed);
      if (allSetsCompleted) {
        newStates[exerciseIndex].completed = true;
      }
      
      return newStates;
    });
  };

  const handleCompleteWorkout = () => {
    const completedWorkout: Workout = {
      ...workout,
      status: 'completed',
      exercises: workout.exercises?.map((exercise, index) => ({
        ...exercise,
        sets: exerciseStates[index]?.sets.reduce((acc, set) => acc + (set.completed ? 1 : 0), 0) || exercise.sets,
        reps: exerciseStates[index]?.sets[0]?.reps || exercise.reps,
        weight_lbs: exerciseStates[index]?.sets[0]?.weight || exercise.weight_lbs
      }))
    };
    
    onComplete(completedWorkout);
  };

  const handleExerciseChange = (newIndex: number) => {
    // Restart voice chat when changing exercises
    if (voiceChatRef.current) {
      voiceChatRef.current.restartVoiceChat();
    }
    setCurrentExerciseIndex(newIndex);
  };

  const currentExercise = workout.exercises[currentExerciseIndex];
  const currentExerciseState = exerciseStates[currentExerciseIndex];
  const completedExercises = exerciseStates.filter(state => state.completed).length;
  const totalExercises = workout.exercises.length;

  if (!currentExercise || !currentExerciseState) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white">Loading workout...</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-3xl shadow-2xl p-8 border border-gray-700 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">💪 Workout in Progress</h2>
        <div className="flex justify-center space-x-8 text-gray-300">
          <div>⏱️ {formatTime(elapsedTime)}</div>
          <div>📊 {completedExercises}/{totalExercises} exercises</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="bg-gray-700 rounded-full h-3 mb-2">
          <div 
            className="bg-gradient-to-r from-teal-600 to-blue-700 h-3 rounded-full transition-all duration-300"
            style={{ width: `${(completedExercises / totalExercises) * 100}%` }}
          ></div>
        </div>
        <p className="text-center text-gray-400 text-sm">
          {completedExercises === totalExercises ? 'All exercises completed!' : `Exercise ${currentExerciseIndex + 1} of ${totalExercises}`}
        </p>
      </div>

      {/* Voice Chat */}
      <div className="mb-8">
        <VoiceChat 
          ref={voiceChatRef}
          workout={workout}
          currentExercise={currentExercise}
          currentExerciseIndex={currentExerciseIndex}
          exerciseStates={exerciseStates}
          onCompleteSet={completeSet}
          onUpdateSet={updateSet}
        />
      </div>

      {/* Current Exercise */}
      <div className="bg-gray-900 rounded-2xl p-6 mb-8 border border-gray-600">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl font-bold text-white">{currentExercise.name}</h3>
          {currentExerciseState.completed && (
            <div className="bg-green-600 text-white px-3 py-1 rounded-full text-sm">
              ✓ Complete
            </div>
          )}
        </div>
        
        {currentExercise.notes && (
          <p className="text-gray-300 mb-6 bg-gray-800 p-4 rounded-lg">
            {currentExercise.notes}
          </p>
        )}

        {/* Sets */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-white">Sets:</h4>
          {currentExerciseState.sets.map((set, setIndex) => (
            <div key={setIndex} className={`p-4 rounded-lg border ${
              set.completed 
                ? 'bg-green-900 border-green-600' 
                : 'bg-gray-800 border-gray-600'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-white font-semibold">Set {setIndex + 1}</span>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <label className="text-gray-300 text-sm">Reps:</label>
                    <input
                      type="number"
                      value={set.reps}
                      onChange={(e) => updateSet(currentExerciseIndex, setIndex, 'reps', parseInt(e.target.value) || 0)}
                      className="w-16 bg-gray-700 text-white rounded px-2 py-1 text-center"
                      disabled={set.completed}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <label className="text-gray-300 text-sm">Weight:</label>
                    <input
                      type="number"
                      value={set.weight}
                      onChange={(e) => updateSet(currentExerciseIndex, setIndex, 'weight', parseFloat(e.target.value) || 0)}
                      className="w-20 bg-gray-700 text-white rounded px-2 py-1 text-center"
                      disabled={set.completed}
                    />
                    <span className="text-gray-400 text-sm">lbs</span>
                  </div>
                  <button
                    onClick={() => completeSet(currentExerciseIndex, setIndex)}
                    disabled={set.completed}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
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
      <div className="flex justify-between items-center">
        <button
          onClick={() => handleExerciseChange(Math.max(0, currentExerciseIndex - 1))}
          disabled={currentExerciseIndex === 0}
          className="bg-gray-700 text-white px-6 py-3 rounded-2xl hover:bg-gray-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ← Previous
        </button>

        <div className="flex space-x-4">
          {currentExerciseIndex < totalExercises - 1 ? (
            <button
              onClick={() => handleExerciseChange(currentExerciseIndex + 1)}
              className="bg-teal-600 text-white px-6 py-3 rounded-2xl hover:bg-teal-700 transition-all duration-200"
            >
              Next Exercise →
            </button>
          ) : (
            <button
              onClick={handleCompleteWorkout}
              className="bg-gradient-to-r from-green-600 to-teal-700 text-white px-8 py-3 rounded-2xl hover:from-green-700 hover:to-teal-800 transition-all duration-200 font-semibold"
            >
              🎉 Complete Workout!
            </button>
          )}
        </div>
      </div>

      {/* Exercise List */}
      <div className="mt-8 bg-gray-900 rounded-2xl p-4 border border-gray-600">
        <h4 className="text-white font-semibold mb-4">All Exercises:</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {workout.exercises?.map((exercise, index) => (
            <button
              key={index}
              onClick={() => handleExerciseChange(index)}
              className={`p-3 rounded-lg text-left transition-all duration-200 ${
                index === currentExerciseIndex
                  ? 'bg-teal-600 text-white'
                  : exerciseStates[index]?.completed
                  ? 'bg-green-700 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <div className="font-semibold text-sm">{exercise.name}</div>
              <div className="text-xs opacity-75">
                {exerciseStates[index]?.completed ? '✓ Complete' : `${exercise.sets} sets × ${exercise.reps} reps`}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
} 