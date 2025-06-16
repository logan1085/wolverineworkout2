'use client';

import { Workout } from '@/types/workout';

interface WorkoutSummaryProps {
  workout: Workout;
  sessionData: {
    totalTime: number;
    notes: string;
    completedExercises: {
      exerciseName: string;
      sets: {
        reps: number;
        weight: number;
        completed: boolean;
      }[];
      notes: string;
    }[];
  };
  onClose: () => void;
  onSave: () => void;
}

export default function WorkoutSummary({ workout, sessionData, onClose, onSave }: WorkoutSummaryProps) {
  const completedSets = sessionData.completedExercises.reduce(
    (total, exercise) => total + exercise.sets.filter(set => set.completed).length,
    0
  );
  
  const totalSets = sessionData.completedExercises.reduce(
    (total, exercise) => total + exercise.sets.length,
    0
  );

  const completionRate = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        {/* Header */}
        <div className="bg-green-500 text-white rounded-t-lg p-6 text-center">
          <h1 className="text-3xl font-bold mb-2">🎉 Workout Complete!</h1>
          <p className="text-green-100">Great job finishing your workout!</p>
        </div>

        <div className="p-6">
          {/* Workout Info */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{workout.name}</h2>
            <p className="text-gray-600">{new Date(workout.date).toLocaleDateString()}</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{sessionData.totalTime}</div>
              <div className="text-sm text-blue-800">Minutes</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{workout.exercises.length}</div>
              <div className="text-sm text-green-800">Exercises</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{completedSets}</div>
              <div className="text-sm text-purple-800">Sets Done</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{completionRate}%</div>
              <div className="text-sm text-orange-800">Completion</div>
            </div>
          </div>

          {/* Exercise Summary */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Exercise Summary</h3>
            <div className="space-y-4">
              {sessionData.completedExercises.map((completedExercise, index) => {
                const originalExercise = workout.exercises[index];
                const completedSetsCount = completedExercise.sets.filter(set => set.completed).length;
                
                return (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-gray-900">{completedExercise.exerciseName}</h4>
                      <span className="text-sm text-gray-600">
                        {completedSetsCount}/{completedExercise.sets.length} sets
                      </span>
                    </div>
                    
                    {completedExercise.notes && (
                      <p className="text-sm text-gray-600 mb-2">{completedExercise.notes}</p>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Target:</span>
                        <span className="ml-1 text-gray-900">
                          {originalExercise.sets} × {originalExercise.reps}
                          {originalExercise.weight && ` @ ${originalExercise.weight} lbs`}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Completed:</span>
                        <span className="ml-1 text-gray-900">
                          {completedSetsCount} sets
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Session Notes */}
          {sessionData.notes && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Session Notes</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700">{sessionData.notes}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
            >
              Close
            </button>
            <button
              onClick={onSave}
              className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
            >
              Save Session
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 