'use client';

import { Workout } from '@/types/workout';

interface WorkoutCompleteProps {
  workout: Workout;
  onStartOver: () => void;
}

export default function WorkoutComplete({ workout, onStartOver }: WorkoutCompleteProps) {
  // Add safety checks for exercises array
  const exercises = workout.exercises || [];
  const completedExercises = exercises.length;
  const totalSets = exercises.reduce((total, exercise) => total + exercise.sets, 0);

  return (
    <div className="bg-gray-800 rounded-3xl shadow-2xl p-8 border border-gray-700 text-center">
      <div className="mb-8">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-4xl font-bold text-white mb-2">Workout Complete!</h2>
        <p className="text-xl text-gray-300">Amazing job! You crushed it today! 💪</p>
      </div>

      <div className="bg-gray-900 rounded-2xl p-6 mb-8 border border-gray-600">
        <h3 className="text-2xl font-bold text-white mb-4">{workout.name}</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-gradient-to-r from-teal-600 to-blue-700 p-4 rounded-lg">
            <div className="text-2xl font-bold text-white">{completedExercises}</div>
            <div className="text-sm text-blue-100">Exercises Completed</div>
          </div>
          <div className="bg-gradient-to-r from-green-600 to-teal-700 p-4 rounded-lg">
            <div className="text-2xl font-bold text-white">{totalSets}</div>
            <div className="text-sm text-green-100">Total Sets</div>
          </div>
          <div className="bg-gradient-to-r from-purple-600 to-pink-700 p-4 rounded-lg">
            <div className="text-2xl font-bold text-white">{workout.duration_minutes}</div>
            <div className="text-sm text-purple-100">Minutes Planned</div>
          </div>
        </div>

        <div className="text-left">
          <h4 className="text-lg font-semibold text-white mb-4">Exercises Completed:</h4>
          <div className="space-y-2">
            {exercises.length > 0 ? (
              exercises.map((exercise, index) => (
                <div key={index} className="bg-gray-800 p-3 rounded-lg border border-gray-600 flex items-center justify-between">
                  <div>
                    <span className="text-white font-medium">{exercise.name}</span>
                  </div>
                  <div className="text-green-400 text-sm">
                    ✓ {exercise.sets} sets × {exercise.reps} reps
                    {exercise.weight_lbs && exercise.weight_lbs > 0 && ` @ ${exercise.weight_lbs} lbs`}
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-gray-800 p-3 rounded-lg border border-gray-600 text-gray-400 text-center">
                No exercise details available
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-teal-900 to-blue-900 p-6 rounded-2xl border border-teal-600 mb-8">
        <h4 className="text-lg font-semibold text-white mb-2">🌟 Logan's Message</h4>
        <p className="text-gray-200">
          Outstanding work today! You showed up, put in the effort, and completed every exercise. 
          This is how progress is made - one workout at a time. Your commitment to your fitness 
          journey is inspiring. Remember, consistency is key, and you're building stronger habits 
          with each session. Keep this momentum going!
        </p>
      </div>

      <div className="space-y-4">
        <button
          onClick={onStartOver}
          className="w-full bg-gradient-to-r from-teal-600 to-blue-700 text-white py-4 px-8 rounded-2xl hover:from-teal-700 hover:to-blue-800 transition-all duration-200 font-semibold text-lg"
        >
          Plan Tomorrow's Workout 🚀
        </button>
        
        <div className="text-gray-400 text-sm">
          Ready for another great workout? Let's chat with Logan again!
        </div>
      </div>
    </div>
  );
} 