'use client';

import { Workout } from '@/types/workout';

interface WorkoutProposalProps {
  workout: Workout;
  onConfirm: () => void;
  onBack: () => void;
}

export default function WorkoutProposal({ workout, onConfirm, onBack }: WorkoutProposalProps) {
  return (
    <div className="bg-gray-800 rounded-3xl shadow-2xl p-4 md:p-8 border border-gray-700">
      <div className="text-center mb-6 md:mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">🏋️‍♂️ Your Workout is Ready!</h2>
        <p className="text-gray-300 text-sm md:text-base">Logan has created a personalized workout just for you</p>
      </div>

      <div className="bg-gray-900 rounded-2xl p-4 md:p-6 mb-6 md:mb-8 border border-gray-600">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
          <h3 className="text-xl md:text-2xl font-bold text-white">{workout.name}</h3>
          <div className="bg-teal-600 text-white px-3 py-1 rounded-full text-sm self-start sm:self-auto">
            {workout.duration_minutes} min
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {workout.difficulty_level && (
            <span className="bg-blue-600 text-white px-2 py-1 rounded-full text-xs">
              {workout.difficulty_level}
            </span>
          )}
          {workout.workout_type && (
            <span className="bg-purple-600 text-white px-2 py-1 rounded-full text-xs">
              {workout.workout_type}
            </span>
          )}
          {workout.equipment_used && workout.equipment_used.length > 0 && (
            <span className="bg-orange-600 text-white px-2 py-1 rounded-full text-xs">
              {workout.equipment_used.join(', ')}
            </span>
          )}
        </div>
        
        {workout.description && (
          <p className="text-gray-300 mb-6 bg-gray-800 p-4 rounded-lg border border-gray-600">
            {workout.description}
          </p>
        )}

        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-white mb-4">Exercises:</h4>
          {workout.exercises && workout.exercises.map((exercise, index) => (
            <div key={exercise.id || index} className="bg-gray-800 p-3 md:p-4 rounded-lg border border-gray-600">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 gap-2">
                <h5 className="font-semibold text-white text-sm md:text-base">{exercise.name}</h5>
                <div className="flex flex-wrap gap-2 sm:gap-4 text-xs md:text-sm text-gray-300">
                  <span>{exercise.sets} sets</span>
                  <span>{exercise.reps} reps</span>
                  {exercise.weight_lbs && exercise.weight_lbs > 0 && (
                    <span>{exercise.weight_lbs} lbs</span>
                  )}
                  {exercise.rest_seconds && (
                    <span>{exercise.rest_seconds}s rest</span>
                  )}
                </div>
              </div>
              {exercise.notes && (
                <p className="text-gray-400 text-xs md:text-sm break-words">{exercise.notes}</p>
              )}
            </div>
          ))}
        </div>
        
        {workout.ai_notes && (
          <div className="mt-6 bg-teal-900 bg-opacity-30 p-3 md:p-4 rounded-lg border border-teal-600">
            <h5 className="text-teal-300 font-semibold mb-2 text-sm md:text-base">💡 Logan&apos;s Notes:</h5>
            <p className="text-gray-300 text-xs md:text-sm break-words">{workout.ai_notes}</p>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
        <button
          onClick={onBack}
          className="flex-1 bg-gray-700 text-white py-3 md:py-4 px-4 md:px-6 rounded-2xl hover:bg-gray-600 transition-all duration-200 font-semibold text-sm md:text-base"
        >
          ← Back to chat
        </button>
        <button
          onClick={onConfirm}
          className="flex-1 bg-gradient-to-r from-teal-600 to-blue-700 text-white py-3 md:py-4 px-4 md:px-6 rounded-2xl hover:from-teal-700 hover:to-blue-800 transition-all duration-200 font-semibold text-sm md:text-base"
        >
          Start workout! 💪
        </button>
      </div>
    </div>
  );
} 