'use client';

import { Workout } from '@/types/workout';

interface WorkoutCompleteProps {
  workout: Workout;
  onStartOver: () => void;
}

export default function WorkoutComplete({ workout, onStartOver }: WorkoutCompleteProps) {
  const exercises = workout.exercises || [];

  // These now count what was actually done. The screen used to report
  // `exercises.length` as "Exercises Completed" and the sum of *planned* sets
  // as "Total Sets", so a session where nothing was ticked off still showed a
  // full workout.
  const completedExercises = exercises.filter(exercise => exercise.completed).length;
  const completedSets = exercises.reduce(
    (total, exercise) => total + (exercise.actual_sets ?? 0),
    0
  );
  const plannedSets = exercises.reduce((total, exercise) => total + exercise.sets, 0);
  const finishedEverything = exercises.length > 0 && completedExercises === exercises.length;

  // The message is chosen from what actually happened. It previously always
  // read "you completed every exercise", which was plainly wrong for anyone who
  // stopped early - and undercuts the encouragement when it is wrong.
  // The banner is chosen the same way as Logan's message below it. It was
  // fixed at "🎉 Workout Complete! / Amazing job! You crushed it today!", which
  // contradicted the message directly underneath it when someone had logged
  // half the session or none of it - the screen congratulated you on a workout
  // and then, two panels down, acknowledged you had not done it.
  const banner = finishedEverything
    ? { emoji: '🎉', heading: 'Workout complete!', subheading: 'Amazing job! You crushed it today! 💪' }
    : completedSets > 0
    ? {
        emoji: '💪',
        heading: 'Session logged',
        subheading: `You got through ${completedSets} of ${plannedSets} sets.`,
      }
    : { emoji: '📋', heading: 'Session ended', subheading: 'Nothing logged this time - the plan is saved.' };

  const loganMessage = finishedEverything
    ? 'Outstanding work today. You showed up, put in the effort, and finished every ' +
      'exercise on the list. That is how progress gets made - one session at a time. ' +
      'Keep this momentum going!'
    : completedSets > 0
    ? `Nice work getting ${completedSets} set${completedSets === 1 ? '' : 's'} in today. ` +
      'Showing up beats a perfect session you never started, and every set counts. ' +
      "Come back when you're ready and we'll pick it up from here."
    : 'No sets logged this time - that happens. The plan is saved, so whenever ' +
      "you're ready we can run it back from the top.";

  return (
    <div className="bg-gray-800 rounded-3xl shadow-2xl p-4 md:p-8 border border-gray-700 text-center">
      <div className="mb-6 md:mb-8">
        <div className="text-4xl md:text-6xl mb-4" aria-hidden="true">{banner.emoji}</div>
        <h2 className="text-2xl md:text-4xl font-bold text-white mb-2">{banner.heading}</h2>
        <p className="text-lg md:text-xl text-gray-300">{banner.subheading}</p>
      </div>

      <div className="bg-gray-900 rounded-2xl p-4 md:p-6 mb-6 md:mb-8 border border-gray-600">
        <h3 className="text-xl md:text-2xl font-bold text-white mb-4">{workout.name}</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-6">
          <div className="bg-gradient-to-r from-teal-600 to-blue-700 p-3 md:p-4 rounded-lg">
            <div className="text-xl md:text-2xl font-bold text-white">
              {completedExercises}/{exercises.length}
            </div>
            <div className="text-xs md:text-sm text-blue-100">Exercises Completed</div>
          </div>
          <div className="bg-gradient-to-r from-green-600 to-teal-700 p-3 md:p-4 rounded-lg">
            <div className="text-xl md:text-2xl font-bold text-white">
              {completedSets}/{plannedSets}
            </div>
            <div className="text-xs md:text-sm text-green-100">Sets Completed</div>
          </div>
          <div className="bg-gradient-to-r from-purple-600 to-pink-700 p-3 md:p-4 rounded-lg">
            <div className="text-xl md:text-2xl font-bold text-white">{workout.duration_minutes}</div>
            <div className="text-xs md:text-sm text-purple-100">Minutes Planned</div>
          </div>
        </div>

        <div className="text-left">
          <h4 className="text-base md:text-lg font-semibold text-white mb-4">What you did:</h4>
          <div className="space-y-2">
            {exercises.length > 0 ? (
              exercises.map((exercise, index) => {
                const done = exercise.completed;
                const setsDone = exercise.actual_sets ?? 0;

                return (
                  <div
                    key={exercise.id || index}
                    className="bg-gray-800 p-3 rounded-lg border border-gray-600 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                  >
                    <div>
                      <span className="text-white font-medium text-sm md:text-base break-words">
                        {exercise.name}
                      </span>
                    </div>
                    <div className={`text-xs md:text-sm ${done ? 'text-green-400' : 'text-gray-400'}`}>
                      {done ? '✓' : '○'} {setsDone}/{exercise.sets} sets × {exercise.reps} reps
                      {exercise.weight_lbs && exercise.weight_lbs > 0
                        ? ` @ ${exercise.weight_lbs} lbs`
                        : ''}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="bg-gray-800 p-3 rounded-lg border border-gray-600 text-gray-400 text-center text-sm">
                No exercise details available
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-teal-900 to-blue-900 p-4 md:p-6 rounded-2xl border border-teal-600 mb-6 md:mb-8">
        <h4 className="text-base md:text-lg font-semibold text-white mb-2">🌟 Logan&apos;s Message</h4>
        <p className="text-gray-200 text-sm md:text-base">{loganMessage}</p>
      </div>

      <div className="space-y-4">
        <button
          onClick={onStartOver}
          className="w-full bg-gradient-to-r from-teal-600 to-blue-700 text-white py-3 md:py-4 px-6 md:px-8 rounded-2xl hover:from-teal-700 hover:to-blue-800 transition-all duration-200 font-semibold text-base md:text-lg"
        >
          Plan another workout 🚀
        </button>
        
        <div className="text-gray-400 text-xs md:text-sm">
          Ready for another great workout? Let&apos;s chat with Logan again!
        </div>
      </div>
    </div>
  );
} 