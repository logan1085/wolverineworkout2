'use client';

import { useState } from 'react';
import { Exercise, Workout } from '@/types/workout';

interface WorkoutFormProps {
  workout?: Workout;
  onSubmit: (workout: Omit<Workout, 'id'>) => void;
  onCancel: () => void;
}

export default function WorkoutForm({ workout, onSubmit, onCancel }: WorkoutFormProps) {
  const [name, setName] = useState(workout?.name || '');
  const [date, setDate] = useState(workout?.date || new Date().toISOString().split('T')[0]);
  const [duration, setDuration] = useState(workout?.duration?.toString() || '');
  const [notes, setNotes] = useState(workout?.notes || '');
  const [exercises, setExercises] = useState<Exercise[]>(workout?.exercises || []);

  const addExercise = () => {
    setExercises([...exercises, { name: '', sets: 3, reps: 10, weight: 0, notes: '' }]);
  };

  const updateExercise = (index: number, field: keyof Exercise, value: string | number) => {
    const updatedExercises = [...exercises];
    updatedExercises[index] = { ...updatedExercises[index], [field]: value };
    setExercises(updatedExercises);
  };

  const removeExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      date,
      duration: duration ? parseInt(duration) : undefined,
      notes,
      exercises: exercises.filter(ex => ex.name.trim() !== ''),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-gray-900 p-8 rounded-xl border border-gray-800">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-white mb-2">
          Workout Name
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 block w-full rounded-lg border-gray-700 bg-gray-800 text-white shadow-sm focus:border-teal-500 focus:ring-teal-500 px-4 py-3"
          required
        />
      </div>

      <div>
        <label htmlFor="date" className="block text-sm font-medium text-white mb-2">
          Date
        </label>
        <input
          type="date"
          id="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="mt-1 block w-full rounded-lg border-gray-700 bg-gray-800 text-white shadow-sm focus:border-teal-500 focus:ring-teal-500 px-4 py-3"
          required
        />
      </div>

      <div>
        <label htmlFor="duration" className="block text-sm font-medium text-white mb-2">
          Duration (minutes)
        </label>
        <input
          type="number"
          id="duration"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          className="mt-1 block w-full rounded-lg border-gray-700 bg-gray-800 text-white shadow-sm focus:border-teal-500 focus:ring-teal-500 px-4 py-3"
        />
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-white mb-2">
          Notes
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="mt-1 block w-full rounded-lg border-gray-700 bg-gray-800 text-white shadow-sm focus:border-teal-500 focus:ring-teal-500 px-4 py-3"
        />
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-white">Exercises</h3>
          <button
            type="button"
            onClick={addExercise}
            className="bg-gradient-to-r from-teal-500 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-teal-600 hover:to-blue-700 transition-all duration-200"
          >
            Add Exercise
          </button>
        </div>

        <div className="space-y-4">
          {exercises.map((exercise, index) => (
            <div key={index} className="border border-gray-700 rounded-lg p-6 bg-gray-800">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Exercise</label>
                  <input
                    type="text"
                    value={exercise.name}
                    onChange={(e) => updateExercise(index, 'name', e.target.value)}
                    className="mt-1 block w-full rounded-lg border-gray-700 bg-gray-700 text-white shadow-sm focus:border-teal-500 focus:ring-teal-500 px-3 py-2"
                    placeholder="e.g., Bench Press"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Sets</label>
                  <input
                    type="number"
                    value={exercise.sets}
                    onChange={(e) => updateExercise(index, 'sets', parseInt(e.target.value))}
                    className="mt-1 block w-full rounded-lg border-gray-700 bg-gray-700 text-white shadow-sm focus:border-teal-500 focus:ring-teal-500 px-3 py-2"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Reps</label>
                  <input
                    type="number"
                    value={exercise.reps}
                    onChange={(e) => updateExercise(index, 'reps', parseInt(e.target.value))}
                    className="mt-1 block w-full rounded-lg border-gray-700 bg-gray-700 text-white shadow-sm focus:border-teal-500 focus:ring-teal-500 px-3 py-2"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Weight (lbs)</label>
                  <input
                    type="number"
                    value={exercise.weight || ''}
                    onChange={(e) => updateExercise(index, 'weight', parseFloat(e.target.value) || 0)}
                    className="mt-1 block w-full rounded-lg border-gray-700 bg-gray-700 text-white shadow-sm focus:border-teal-500 focus:ring-teal-500 px-3 py-2"
                    min="0"
                    step="0.5"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => removeExercise(index)}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-white mb-2">Notes</label>
                <input
                  type="text"
                  value={exercise.notes}
                  onChange={(e) => updateExercise(index, 'notes', e.target.value)}
                  className="mt-1 block w-full rounded-lg border-gray-700 bg-gray-700 text-white shadow-sm focus:border-teal-500 focus:ring-teal-500 px-3 py-2"
                  placeholder="Form tips, modifications, etc."
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end space-x-4 pt-6">
        <button
          type="button"
          onClick={onCancel}
          className="bg-gray-700 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="bg-gradient-to-r from-teal-500 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-teal-600 hover:to-blue-700 transition-all duration-200"
        >
          {workout ? 'Update Workout' : 'Create Workout'}
        </button>
      </div>
    </form>
  );
} 