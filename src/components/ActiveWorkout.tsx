'use client';

import { useState, useEffect, useRef } from 'react';
import { Workout } from '@/types/workout';
import VoiceChat from './VoiceChat';

interface ActiveWorkoutProps {
  workout: Workout;
  onComplete: (completedWorkout: Workout) => void;
  onExit: () => void;
}

interface ExerciseState {
  completed: boolean;
  sets: {
    reps: number;
    weight: number;
    completed: boolean;
  }[];
}

export default function ActiveWorkout({ workout, onComplete, onExit }: ActiveWorkoutProps) {
  const [exerciseStates, setExerciseStates] = useState<ExerciseState[]>([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  // A ref, not state: the start of the session never changes, and holding it in
  // state re-ran `new Date()` on every render while `setStartTime` went unused.
  const startTimeRef = useRef<number>(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);

  // Initialize exercise states
  useEffect(() => {
    if (!workout.exercises) return;
    
    const initialStates = workout.exercises.map(exercise => ({
      completed: false,
      sets: Array.from({ length: exercise.sets }, () => ({
        reps: exercise.reps,
        weight: exercise.weight_lbs || 0,
        completed: false
      }))
    }));
    setExerciseStates(initialStates);
  }, [workout]);

  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Both updaters rebuild the exercise and set objects they touch instead of
  // assigning through the shallow copy. The previous version mutated the
  // objects held by the previous state, so React saw no change in the nested
  // values, and under StrictMode's double-invoked updaters the same edit could
  // be applied twice to shared objects.
  const updateSet = (exerciseIndex: number, setIndex: number, field: 'reps' | 'weight', value: number) => {
    setExerciseStates(prev =>
      prev.map((exerciseState, i) =>
        i !== exerciseIndex
          ? exerciseState
          : {
              ...exerciseState,
              sets: exerciseState.sets.map((set, j) =>
                j !== setIndex ? set : { ...set, [field]: value }
              ),
            }
      )
    );
  };

  // Takes the target state rather than always completing, so a set can be
  // un-ticked. There was no way back before: a mis-tap, or the voice coach
  // mishearing a "set done", permanently locked that set's reps and weight and
  // counted it toward the summary.
  const setSetCompletion = (exerciseIndex: number, setIndex: number, completed: boolean) => {
    setExerciseStates(prev =>
      prev.map((exerciseState, i) => {
        if (i !== exerciseIndex) return exerciseState;

        const sets = exerciseState.sets.map((set, j) =>
          j !== setIndex ? set : { ...set, completed }
        );

        return {
          ...exerciseState,
          sets,
          // `every` is vacuously true on an empty array, which marked an
          // exercise the model gave zero sets as done before it was touched.
          completed: sets.length > 0 && sets.every(set => set.completed),
        };
      })
    );
  };

  // The voice coach only ever completes a set, never reopens one.
  const completeSet = (exerciseIndex: number, setIndex: number) => {
    setSetCompletion(exerciseIndex, setIndex, true);
  };

  const currentExercise = workout.exercises?.[currentExerciseIndex];
  const currentExerciseState = exerciseStates[currentExerciseIndex];
  const completedExercises = exerciseStates.filter(state => state.completed).length;
  const totalExercises = workout.exercises?.length || 0;
  const progressPercent = totalExercises > 0 ? (completedExercises / totalExercises) * 100 : 0;

  const handleCompleteWorkout = () => {
    // What was planned stays on `sets`/`reps`/`weight_lbs`; what was actually
    // performed goes to the `actual_*` fields. Overwriting the planned numbers
    // with completed counts (as this used to) lost both: a skipped exercise
    // reported its planned sets back, because `0 || exercise.sets` falls
    // through to the plan.
    const completedWorkout: Workout = {
      ...workout,
      status: 'completed',
      exercises: workout.exercises?.map((exercise, index) => {
        const state = exerciseStates[index];
        const completedSets = state?.sets.filter(set => set.completed) ?? [];

        return {
          ...exercise,
          completed: state?.completed ?? false,
          actual_sets: completedSets.length,
          actual_reps: completedSets.map(set => set.reps),
          actual_weight_lbs: completedSets[0]?.weight ?? exercise.weight_lbs,
        };
      }),
    };

    onComplete(completedWorkout);
  };

  const handleFinishEarly = () => {
    const remaining = totalExercises - completedExercises;
    if (remaining > 0) {
      const confirmed = window.confirm(
        `You have ${remaining} exercise${remaining === 1 ? '' : 's'} left. ` +
          `Finish the workout here anyway?`
      );
      if (!confirmed) return;
    }
    handleCompleteWorkout();
  };

  // Moving between exercises no longer tears down the voice session. The method
  // this called was named `restartVoiceChat` but only ever stopped the call, so
  // tapping "Next Exercise" hung up on the coach and you had to press "Start
  // Voice" again for every exercise. It also made VoiceChat's announce-the-new-
  // exercise effect unreachable, since that effect only runs while connected.
  // VoiceChat already re-sends its session instructions when the index changes.
  const handleExerciseChange = (newIndex: number) => {
    setCurrentExerciseIndex(newIndex);
  };

  const handleExit = () => {
    // This returns to the workout preview, not the chat, and the previous
    // wording said otherwise.
    const confirmed = window.confirm(
      'Leave this workout and go back to the preview? Nothing you logged in this session will be saved.'
    );
    if (confirmed) onExit();
  };

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
      <div className="relative text-center mb-6 md:mb-8">
        <button
          onClick={handleExit}
          className="absolute left-0 top-0 text-gray-400 hover:text-white text-sm transition-colors"
        >
          ← Exit
        </button>
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">💪 Workout in Progress</h2>
        <div className="flex flex-col sm:flex-row justify-center sm:space-x-8 space-y-2 sm:space-y-0 text-gray-300">
          <div>⏱️ {formatTime(elapsedTime)}</div>
          <div>📊 {completedExercises}/{totalExercises} exercises</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6 md:mb-8">
        <div
          className="bg-gray-700 rounded-full h-3 mb-2"
          role="progressbar"
          aria-valuenow={completedExercises}
          aria-valuemin={0}
          aria-valuemax={totalExercises}
          aria-label="Exercises completed"
        >
          <div
            className="bg-gradient-to-r from-teal-600 to-blue-700 h-3 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
        <p className="text-center text-gray-400 text-sm">
          {completedExercises === totalExercises ? 'All exercises completed!' : `Exercise ${currentExerciseIndex + 1} of ${totalExercises}`}
        </p>
      </div>

      {/* Voice Chat */}
      <div className="mb-6 md:mb-8">
        <VoiceChat
          workout={workout}
          currentExercise={currentExercise}
          currentExerciseIndex={currentExerciseIndex}
          exerciseStates={exerciseStates}
          onCompleteSet={completeSet}
        />
      </div>

      {/* Current Exercise */}
      <div className="bg-gray-900 rounded-2xl p-4 md:p-6 mb-6 md:mb-8 border border-gray-600">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-2 sm:space-y-0">
          <h3 className="text-xl md:text-2xl font-bold text-white">{currentExercise.name}</h3>
          {currentExerciseState.completed && (
            <div className="bg-green-600 text-white px-3 py-1 rounded-full text-sm self-start sm:self-auto">
              ✓ Complete
            </div>
          )}
        </div>
        
        {currentExercise.notes && (
          <p className="text-gray-300 mb-6 bg-gray-800 p-4 rounded-lg text-sm md:text-base">
            {currentExercise.notes}
          </p>
        )}

        {/* Sets */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-white">Sets:</h4>
          {currentExerciseState.sets.map((set, setIndex) => (
            <div key={setIndex} className={`p-3 md:p-4 rounded-lg border ${
              set.completed 
                ? 'bg-green-900 border-green-600' 
                : 'bg-gray-800 border-gray-600'
            }`}>
              <div className="flex flex-col space-y-3 md:flex-row md:items-center md:justify-between md:space-y-0">
                <span className="text-white font-semibold">Set {setIndex + 1}</span>
                <div className="flex flex-col space-y-3 md:flex-row md:items-center md:space-y-0 md:space-x-4">
                  <div className="flex items-center space-x-2">
                    <label className="text-gray-300 text-sm min-w-[40px]" htmlFor={`reps-${currentExerciseIndex}-${setIndex}`}>
                      Reps:
                    </label>
                    <input
                      id={`reps-${currentExerciseIndex}-${setIndex}`}
                      type="number"
                      // min/inputMode: nothing stopped a negative rep count
                      // being typed or spun into the log, and the plain numeric
                      // keypad is the right one for whole reps.
                      min={0}
                      inputMode="numeric"
                      value={set.reps}
                      onChange={(e) => updateSet(currentExerciseIndex, setIndex, 'reps', parseInt(e.target.value) || 0)}
                      className="w-16 bg-gray-700 text-white rounded px-2 py-1 text-center text-base disabled:opacity-60"
                      disabled={set.completed}
                      style={{ fontSize: '16px' }}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <label className="text-gray-300 text-sm min-w-[50px]" htmlFor={`weight-${currentExerciseIndex}-${setIndex}`}>
                      Weight:
                    </label>
                    <input
                      id={`weight-${currentExerciseIndex}-${setIndex}`}
                      type="number"
                      min={0}
                      step="any"
                      inputMode="decimal"
                      value={set.weight}
                      onChange={(e) => updateSet(currentExerciseIndex, setIndex, 'weight', parseFloat(e.target.value) || 0)}
                      className="w-20 bg-gray-700 text-white rounded px-2 py-1 text-center text-base disabled:opacity-60"
                      disabled={set.completed}
                      style={{ fontSize: '16px' }}
                    />
                    <span className="text-gray-400 text-sm">lbs</span>
                  </div>
                  {set.completed ? (
                    <div className="flex items-center gap-2 w-full md:w-auto">
                      <span className="flex-1 md:flex-none px-4 py-2 rounded-lg font-semibold bg-green-600 text-white text-center text-sm md:text-base">
                        ✓ Done
                      </span>
                      <button
                        onClick={() => setSetCompletion(currentExerciseIndex, setIndex, false)}
                        className="px-3 py-2 rounded-lg text-sm text-gray-300 border border-gray-600 hover:bg-gray-700 hover:text-white transition-colors"
                      >
                        Undo
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => completeSet(currentExerciseIndex, setIndex)}
                      className="px-4 py-2 rounded-lg font-semibold transition-all duration-200 w-full md:w-auto text-sm md:text-base bg-teal-600 text-white hover:bg-teal-700"
                    >
                      Complete Set
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:items-center md:space-y-0">
        <button
          onClick={() => handleExerciseChange(Math.max(0, currentExerciseIndex - 1))}
          disabled={currentExerciseIndex === 0}
          className="bg-gray-700 text-white px-6 py-3 rounded-2xl hover:bg-gray-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto"
        >
          ← Previous
        </button>

        {/* "Finish" is always reachable. It used to appear only on the last
            exercise, so anyone who had done enough for the day had to click
            through every remaining exercise to record the session. */}
        <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
          {currentExerciseIndex < totalExercises - 1 && (
            <button
              onClick={() => handleExerciseChange(currentExerciseIndex + 1)}
              className="bg-teal-600 text-white px-6 py-3 rounded-2xl hover:bg-teal-700 transition-all duration-200 w-full md:w-auto"
            >
              Next Exercise →
            </button>
          )}
          <button
            onClick={handleFinishEarly}
            className="bg-gradient-to-r from-green-600 to-teal-700 text-white px-6 md:px-8 py-3 rounded-2xl hover:from-green-700 hover:to-teal-800 transition-all duration-200 font-semibold w-full md:w-auto"
          >
            {completedExercises === totalExercises ? '🎉 Complete Workout!' : 'Finish workout'}
          </button>
        </div>
      </div>

      {/* Exercise List */}
      <div className="mt-6 md:mt-8 bg-gray-900 rounded-2xl p-4 border border-gray-600">
        <h4 className="text-white font-semibold mb-4">All Exercises:</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
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