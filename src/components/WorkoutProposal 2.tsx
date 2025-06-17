'use client';

import { Workout } from '@/types/workout';

interface WorkoutProposalProps {
  workout: Workout;
  onConfirm: () => void;
  onBack: () => void;
}

export default function WorkoutProposal({ workout, onConfirm, onBack }: WorkoutProposalProps) {
  return (
    <div className="bg-gray-800 rounded-3xl shadow-2xl p-8 border border-gray-700">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">🏋️‍♂️ Your Workout is Ready!</h2>
        <p className="text-gray-300">Logan has created a personalized workout just for you</p>
      </div>

      <div className="bg-gray-900 rounded-2xl p-6 mb-8 border border-gray-600">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl font-bold text-white">{workout.name}</h3>
          <div className="bg-teal-600 text-white px-3 py-1 rounded-full text-sm">
            {workout.duration} min
          </div>
        </div>
        
        {workout.notes && (
          <p className="text-gray-300 mb-6 bg-gray-800 p-4 rounded-lg border border-gray-600">
            {workout.notes}
          </p>
        )}

        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-white mb-4">Exercises:</h4>
          {workout.exercises.map((exercise, index) => (
            <div key={index} className="bg-gray-800 p-4 rounded-lg border border-gray-600">
              <div className="flex items-center justify-between mb-2">
                <h5 className="font-semibold text-white">{exercise.name}</h5>
                <div className="flex space-x-4 text-sm text-gray-300">
                  <span>{exercise.sets} sets</span>
                  <span>{exercise.reps} reps</span>
                  {exercise.weight > 0 && <span>{exercise.weight} lbs</span>}
                </div>
              </div>
              {exercise.notes && (
                <p className="text-gray-400 text-sm">{exercise.notes}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex space-x-4">
        <button
          onClick={onBack}
          className="flex-1 bg-gray-700 text-white py-4 px-6 rounded-2xl hover:bg-gray-600 transition-all duration-200 font-semibold"
        >
          ← Back to Chat
        </button>
        <button
          onClick={onConfirm}
          className="flex-1 bg-gradient-to-r from-teal-600 to-blue-700 text-white py-4 px-6 rounded-2xl hover:from-teal-700 hover:to-blue-800 transition-all duration-200 font-semibold"
        >
          Start Workout! 💪
        </button>
      </div>
    </div>
  );
} 