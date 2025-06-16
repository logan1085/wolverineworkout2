'use client';

import { useState, useEffect } from 'react';
import { Workout } from '@/types/workout';
import { ApiService } from '@/services/api';

interface DashboardProps {
  workouts: Workout[];
  onWorkoutClick: (workout: Workout) => void;
  onGenerateNewPlan: () => void;
  onGoHome?: () => void;
}

export default function Dashboard({ workouts, onWorkoutClick, onGenerateNewPlan, onGoHome }: DashboardProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [monthWorkouts, setMonthWorkouts] = useState<Workout[]>([]);
  const [viewMode, setViewMode] = useState<'calendar' | 'weekly'>('calendar');

  // Get current month's workouts
  useEffect(() => {
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    const filtered = workouts.filter(workout => {
      const workoutDate = new Date(workout.date);
      const workoutMonth = workoutDate.getMonth();
      const workoutYear = workoutDate.getFullYear();
      
      // Show workouts that are scheduled for the displayed month
      return workoutMonth === currentMonth && workoutYear === currentYear;
    });
    
    setMonthWorkouts(filtered);
  }, [workouts, currentDate]);

  // Calendar helpers
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getWorkoutsForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return monthWorkouts.filter(workout => workout.date === dateString);
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return formatDate(date) === formatDate(today);
  };

  const isSelected = (date: Date) => {
    return selectedDate && formatDate(date) === formatDate(selectedDate);
  };

  const getDayName = (dayIndex: number) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[dayIndex];
  };

  const getMonthName = (date: Date) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[date.getMonth()];
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const getWeeklySchedule = () => {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const weeklySchedule: { [key: string]: Workout[] } = {};
    
    dayNames.forEach(day => {
      weeklySchedule[day] = [];
    });

    // Group workouts by day of week
    workouts.forEach(workout => {
      if (workout.dayOfWeek && weeklySchedule[workout.dayOfWeek]) {
        weeklySchedule[workout.dayOfWeek].push(workout);
      }
    });

    return weeklySchedule;
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 bg-gray-800 border border-gray-700"></div>);
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dayWorkouts = getWorkoutsForDate(date);
      const isCurrentDay = isToday(date);
      const isSelectedDay = isSelected(date);

      days.push(
        <div
          key={day}
          onClick={() => setSelectedDate(date)}
          className={`h-24 border border-gray-700 p-2 cursor-pointer transition-all duration-200 ${
            isCurrentDay ? 'bg-gradient-to-br from-teal-600 to-blue-700 border-teal-500' : ''
          } ${isSelectedDay ? 'bg-gradient-to-br from-teal-500 to-blue-600 border-teal-400' : 'bg-gray-800 hover:bg-gray-750'}`}
        >
          <div className="flex justify-between items-start">
            <span className={`text-sm font-bold ${
              isCurrentDay ? 'text-white' : isSelectedDay ? 'text-white' : 'text-gray-300'
            }`}>
              {day}
            </span>
            {dayWorkouts.length > 0 && (
              <div className="flex flex-col gap-1">
                {dayWorkouts.slice(0, 2).map((workout, index) => (
                  <div
                    key={workout.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onWorkoutClick(workout);
                    }}
                    className="text-xs bg-gradient-to-r from-teal-500 to-blue-600 text-white px-2 py-1 rounded-full truncate max-w-full font-semibold shadow-lg hover:from-teal-400 hover:to-blue-500 transition-all duration-200"
                    title={workout.name}
                  >
                    {workout.name}
                  </div>
                ))}
                {dayWorkouts.length > 2 && (
                  <div className="text-xs text-gray-400 text-center font-medium">
                    +{dayWorkouts.length - 2} more
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    return days;
  };

  const renderWeeklyView = () => {
    const weeklySchedule = getWeeklySchedule();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    return (
      <div className="space-y-4">
        {dayNames.map((day) => (
          <div key={day} className="bg-gray-800 rounded-xl border border-gray-700 p-4 hover:border-gray-600 transition-all duration-200">
            <h3 className="font-bold text-gray-200 mb-3 text-lg">{day}</h3>
            {weeklySchedule[day].length > 0 ? (
              <div className="space-y-2">
                {weeklySchedule[day].map((workout) => (
                  <div
                    key={workout.id}
                    onClick={() => onWorkoutClick(workout)}
                    className="p-3 bg-gradient-to-r from-gray-700 to-gray-800 rounded-lg border border-gray-600 cursor-pointer hover:from-gray-600 hover:to-gray-700 hover:border-gray-500 transition-all duration-200 shadow-lg"
                  >
                    <h4 className="font-bold text-white">{workout.name}</h4>
                    {workout.focus && (
                      <p className="text-sm text-teal-400 mt-1 font-medium">Focus: {workout.focus}</p>
                    )}
                    <p className="text-sm text-gray-400 mt-1 font-medium">
                      {workout.exercises.length} exercises • {workout.duration || 45} min
                    </p>
                    {workout.date && (
                      <p className="text-xs text-gray-500 mt-1 font-medium">
                        Next: {new Date(workout.date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm font-medium">Rest day</p>
            )}
          </div>
        ))}
      </div>
    );
  };

  const getSelectedDateWorkouts = () => {
    if (!selectedDate) return [];
    return getWorkoutsForDate(selectedDate);
  };

  const getStats = () => {
    const totalWorkouts = workouts.length;
    const completedWorkouts = workouts.filter(w => w.completed).length;
    const thisMonthWorkouts = monthWorkouts.length;
    const thisMonthCompleted = monthWorkouts.filter(w => w.completed).length;

    return {
      total: totalWorkouts,
      completed: completedWorkouts,
      thisMonth: thisMonthWorkouts,
      thisMonthCompleted: thisMonthCompleted,
      completionRate: totalWorkouts > 0 ? Math.round((completedWorkouts / totalWorkouts) * 100) : 0
    };
  };

  const stats = getStats();

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl shadow-2xl p-8 mb-8 border border-gray-700">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-4xl font-athletic-bold bg-gradient-to-r from-teal-400 to-blue-500 bg-clip-text text-transparent mb-2">
                Your Fitness Dashboard
              </h1>
              <p className="text-gray-400 text-lg font-athletic">
                Track your progress and stay motivated
              </p>
            </div>
            <div className="flex gap-4">
              {onGoHome && (
                <button
                  onClick={onGoHome}
                  className="px-6 py-3 bg-gradient-to-r from-gray-700 to-gray-800 text-white rounded-xl font-athletic-bold hover:from-gray-600 hover:to-gray-700 transition-all duration-200 border border-gray-600"
                >
                  Home
                </button>
              )}
              <button
                onClick={onGenerateNewPlan}
                className="px-6 py-3 bg-gradient-to-r from-teal-600 to-blue-700 text-white rounded-xl font-athletic-bold hover:from-teal-500 hover:to-blue-600 transition-all duration-200 shadow-lg"
              >
                New Plan
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-teal-600 to-blue-700 rounded-xl p-6 text-center">
              <div className="text-3xl font-athletic-bold text-white mb-2">{stats.total}</div>
              <div className="text-teal-200 font-athletic">Total Workouts</div>
            </div>
            <div className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-xl p-6 text-center">
              <div className="text-3xl font-athletic-bold text-white mb-2">{stats.completed}</div>
              <div className="text-green-200 font-athletic">Completed</div>
            </div>
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl p-6 text-center">
              <div className="text-3xl font-athletic-bold text-white mb-2">{stats.thisMonth}</div>
              <div className="text-blue-200 font-athletic">This Month</div>
            </div>
            <div className="bg-gradient-to-br from-purple-600 to-pink-700 rounded-xl p-6 text-center">
              <div className="text-3xl font-athletic-bold text-white mb-2">{stats.completionRate}%</div>
              <div className="text-purple-200 font-athletic">Success Rate</div>
            </div>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex justify-center mb-8">
          <div className="bg-gray-800 rounded-xl p-1 border border-gray-700">
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-6 py-3 rounded-lg font-bold transition-all duration-200 ${
                viewMode === 'calendar'
                  ? 'bg-gradient-to-r from-teal-600 to-blue-700 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Calendar View
            </button>
            <button
              onClick={() => setViewMode('weekly')}
              className={`px-6 py-3 rounded-lg font-bold transition-all duration-200 ${
                viewMode === 'weekly'
                  ? 'bg-gradient-to-r from-teal-600 to-blue-700 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Weekly Schedule
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar/Weekly View */}
          <div className="lg:col-span-2">
            {viewMode === 'calendar' ? (
              <div className="bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 p-6">
                {/* Calendar Header */}
                <div className="flex justify-between items-center mb-6">
                  <button
                    onClick={() => navigateMonth('prev')}
                    className="p-2 text-gray-400 hover:text-white transition-colors"
                  >
                    ←
                  </button>
                  <h2 className="text-2xl font-bold text-white">{getMonthName(currentDate)} {currentDate.getFullYear()}</h2>
                  <button
                    onClick={() => navigateMonth('next')}
                    className="p-2 text-gray-400 hover:text-white transition-colors"
                  >
                    →
                  </button>
                </div>

                {/* Day Headers */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {Array.from({ length: 7 }, (_, i) => (
                    <div key={i} className="text-center py-2">
                      <span className="text-sm font-bold text-gray-400">{getDayName(i)}</span>
                    </div>
                  ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1">
                  {renderCalendar()}
                </div>
              </div>
            ) : (
              <div className="bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 p-6">
                <h2 className="text-2xl font-bold text-white mb-6">Weekly Schedule</h2>
                {renderWeeklyView()}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Selected Date Workouts */}
            {selectedDate && (
              <div className="bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 p-6">
                <h3 className="text-xl font-bold text-white mb-4">
                  {selectedDate.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </h3>
                {getSelectedDateWorkouts().length > 0 ? (
                  <div className="space-y-3">
                    {getSelectedDateWorkouts().map((workout) => (
                      <div
                        key={workout.id}
                        onClick={() => onWorkoutClick(workout)}
                        className="p-4 bg-gradient-to-r from-gray-700 to-gray-800 rounded-lg border border-gray-600 cursor-pointer hover:from-gray-600 hover:to-gray-700 hover:border-gray-500 transition-all duration-200"
                      >
                        <h4 className="font-bold text-white mb-2">{workout.name}</h4>
                        <p className="text-sm text-gray-400 font-medium">
                          {workout.exercises.length} exercises • {workout.duration || 45} min
                        </p>
                        {workout.focus && (
                          <p className="text-sm text-teal-400 font-medium mt-1">Focus: {workout.focus}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 font-medium">No workouts scheduled</p>
                )}
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 p-6">
              <h3 className="text-xl font-bold text-white mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={onGenerateNewPlan}
                  className="w-full p-3 bg-gradient-to-r from-teal-600 to-blue-700 text-white rounded-lg font-bold hover:from-teal-500 hover:to-blue-600 transition-all duration-200"
                >
                  Generate New Plan
                </button>
                <button
                  onClick={() => setSelectedDate(new Date())}
                  className="w-full p-3 bg-gradient-to-r from-gray-700 to-gray-800 text-white rounded-lg font-bold hover:from-gray-600 hover:to-gray-700 transition-all duration-200 border border-gray-600"
                >
                  Today's Workouts
                </button>
              </div>
            </div>

            {/* Recent Workouts */}
            <div className="bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 p-6">
              <h3 className="text-xl font-bold text-white mb-4">Recent Workouts</h3>
              {workouts.slice(0, 3).map((workout) => (
                <div
                  key={workout.id}
                  onClick={() => onWorkoutClick(workout)}
                  className="p-3 bg-gradient-to-r from-gray-700 to-gray-800 rounded-lg border border-gray-600 cursor-pointer hover:from-gray-600 hover:to-gray-700 hover:border-gray-500 transition-all duration-200 mb-3"
                >
                  <h4 className="font-bold text-white text-sm">{workout.name}</h4>
                  <p className="text-xs text-gray-400 font-medium">
                    {new Date(workout.date).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 