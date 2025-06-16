'use client';

import { Workout } from '@/types/workout';

interface WorkoutListProps {
  workouts: Workout[];
  onEdit: (workout: Workout) => void;
  onDelete: (id: string) => void;
  onStartWorkout: (workout: Workout) => void;
}

export default function WorkoutList({ workouts, onEdit, onDelete, onStartWorkout }: WorkoutListProps) {
  if (workouts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gradient-to-r from-teal-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-white mb-2">No workouts yet</h3>
        <p className="text-gray-400">Create your first workout to get started!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {workouts.map((workout) => (
        <div key={workout.id} className="bg-gray-900 rounded-xl border border-gray-800 p-6 hover:border-gray-700 transition-all duration-200">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-semibold text-white">{workout.name}</h3>
              <p className="text-gray-400">{new Date(workout.date).toLocaleDateString()}</p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => onStartWorkout(workout)}
                className="bg-gradient-to-r from-teal-500 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-teal-600 hover:to-blue-700 transition-all duration-200 text-sm font-medium"
              >
                Start Workout
              </button>
              <button
                onClick={() => onEdit(workout)}
                className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium"
              >
                Edit
              </button>
              <button
                onClick={() => workout.id && onDelete(workout.id)}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
              >
                Delete
              </button>
            </div>
          </div>

          {workout.duration && (
            <p className="text-gray-300 mb-2">
              <span className="font-medium">Duration:</span> {workout.duration} minutes
            </p>
          )}

          {workout.notes && (
            <p className="text-gray-300 mb-4">
              <span className="font-medium">Notes:</span> {workout.notes}
            </p>
          )}

          <div>
            <h4 className="font-medium text-white mb-3">Exercises:</h4>
            <div className="space-y-3">
              {workout.exercises.map((exercise, index) => (
                <div key={index} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-white">{exercise.name}</span>
                    <span className="text-gray-300 bg-gray-700 px-3 py-1 rounded-full text-sm">
                      {exercise.sets} sets × {exercise.reps} reps
                      {exercise.weight && exercise.weight > 0 && ` @ ${exercise.weight} lbs`}
                    </span>
                  </div>
                  {exercise.notes && (
                    <p className="text-sm text-gray-400 mt-2">{exercise.notes}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 