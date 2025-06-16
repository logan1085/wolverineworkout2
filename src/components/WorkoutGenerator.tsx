'use client';

import { useState } from 'react';
import { Workout } from '@/types/workout';
import { ApiService } from '@/services/api';

interface WorkoutGeneratorProps {
  onWorkoutGenerated: (workout: Workout) => void;
  onCancel: () => void;
}

export default function WorkoutGenerator({ onWorkoutGenerated, onCancel }: WorkoutGeneratorProps) {
  const [fitnessLevel, setFitnessLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [workoutType, setWorkoutType] = useState<'strength' | 'cardio' | 'flexibility' | 'mixed'>('strength');
  const [focusArea, setFocusArea] = useState('');
  const [duration, setDuration] = useState(45);
  const [equipment, setEquipment] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const equipmentOptions = [
    'Dumbbells', 'Barbell', 'Resistance Bands', 'Pull-up Bar', 
    'Bench', 'Kettlebell', 'Treadmill', 'Bicycle', 'Yoga Mat'
  ];

  const toggleEquipment = (item: string) => {
    setEquipment(prev => 
      prev.includes(item) 
        ? prev.filter(e => e !== item)
        : [...prev, item]
    );
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!focusArea.trim()) {
      setError('Please specify a focus area');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const generatedWorkout = await ApiService.generateWorkout({
        fitnessLevel,
        workoutType,
        focusArea,
        duration,
        equipment,
      });

      onWorkoutGenerated(generatedWorkout);
    } catch (err) {
      setError('Failed to generate workout. Please try again.');
      console.error('Error generating workout:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-900 p-8 rounded-xl border border-gray-800">
      <div className="flex items-center mb-6">
        <div className="w-10 h-10 bg-gradient-to-r from-teal-500 to-blue-600 rounded-lg flex items-center justify-center mr-3">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <h2 className="text-2xl font-semibold text-white">Generate AI Workout</h2>
      </div>
      
      {error && (
        <div className="bg-red-900 border border-red-700 rounded-lg p-4 mb-6">
          <p className="text-red-200">{error}</p>
        </div>
      )}

      <form onSubmit={handleGenerate} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Fitness Level
          </label>
          <select
            value={fitnessLevel}
            onChange={(e) => setFitnessLevel(e.target.value as any)}
            className="w-full rounded-lg border-gray-700 bg-gray-800 text-white shadow-sm focus:border-teal-500 focus:ring-teal-500 px-4 py-3"
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Workout Type
          </label>
          <select
            value={workoutType}
            onChange={(e) => setWorkoutType(e.target.value as any)}
            className="w-full rounded-lg border-gray-700 bg-gray-800 text-white shadow-sm focus:border-teal-500 focus:ring-teal-500 px-4 py-3"
          >
            <option value="strength">Strength Training</option>
            <option value="cardio">Cardio</option>
            <option value="flexibility">Flexibility/Yoga</option>
            <option value="mixed">Mixed</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Focus Area
          </label>
          <input
            type="text"
            value={focusArea}
            onChange={(e) => setFocusArea(e.target.value)}
            placeholder="e.g., Upper body, Core, Legs, Full body"
            className="w-full rounded-lg border-gray-700 bg-gray-800 text-white shadow-sm focus:border-teal-500 focus:ring-teal-500 px-4 py-3"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Duration (minutes)
          </label>
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(parseInt(e.target.value))}
            min="15"
            max="120"
            className="w-full rounded-lg border-gray-700 bg-gray-800 text-white shadow-sm focus:border-teal-500 focus:ring-teal-500 px-4 py-3"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-3">
            Available Equipment
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {equipmentOptions.map((item) => (
              <label key={item} className="flex items-center p-3 bg-gray-800 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={equipment.includes(item)}
                  onChange={() => toggleEquipment(item)}
                  className="rounded border-gray-600 text-teal-500 focus:ring-teal-500 bg-gray-700"
                />
                <span className="ml-3 text-sm text-white">{item}</span>
              </label>
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
            disabled={loading}
            className="bg-gradient-to-r from-teal-500 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-teal-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {loading ? (
              <span className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Generating...
              </span>
            ) : (
              'Generate Workout'
            )}
          </button>
        </div>
      </form>
    </div>
  );
} 