'use client';

import { useState, useRef, useEffect } from 'react';
import { Workout } from '@/types/workout';
import { ApiService } from '@/services/api';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'logan';
  timestamp: Date;
  type?: 'text' | 'workout-generated';
}

interface LoganChatProps {
  onWorkoutGenerated: (workout: Workout) => void;
  onClose: () => void;
}

export default function LoganChat({ onWorkoutGenerated, onClose }: LoganChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hey there! I'm Logan, your personal trainer. I'm here to help you create the perfect workout plan. To get started, I need to understand a few things about you: What are your main fitness goals? Are you looking to lose weight, build muscle, improve endurance, or something else?",
      sender: 'logan',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationContext, setConversationContext] = useState({
    fitnessLevel: '',
    goals: '',
    experience: '',
    timeAvailable: '',
    equipment: '',
    focusAreas: '',
    workoutFrequency: ''
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const extractContextFromMessage = (message: string) => {
    const context = { ...conversationContext };
    const lowerMessage = message.toLowerCase();
    
    // Extract fitness level
    if (lowerMessage.includes('beginner') || lowerMessage.includes('just starting') || lowerMessage.includes('new') || lowerMessage.includes('never worked out')) {
      context.fitnessLevel = 'beginner';
    } else if (lowerMessage.includes('intermediate') || lowerMessage.includes('some experience') || lowerMessage.includes('been working out')) {
      context.fitnessLevel = 'intermediate';
    } else if (lowerMessage.includes('advanced') || lowerMessage.includes('experienced') || lowerMessage.includes('regular training')) {
      context.fitnessLevel = 'advanced';
    }

    // Extract goals
    if (lowerMessage.includes('lose weight') || lowerMessage.includes('weight loss') || lowerMessage.includes('slim down')) {
      context.goals = 'weight loss';
    } else if (lowerMessage.includes('build muscle') || lowerMessage.includes('strength') || lowerMessage.includes('get stronger')) {
      context.goals = 'muscle building';
    } else if (lowerMessage.includes('endurance') || lowerMessage.includes('cardio') || lowerMessage.includes('stamina')) {
      context.goals = 'endurance';
    } else if (lowerMessage.includes('tone') || lowerMessage.includes('definition') || lowerMessage.includes('lean')) {
      context.goals = 'toning';
    } else if (lowerMessage.includes('general fitness') || lowerMessage.includes('stay healthy') || lowerMessage.includes('overall health')) {
      context.goals = 'general fitness';
    }

    // Extract time availability
    if (lowerMessage.includes('30 minutes') || lowerMessage.includes('half hour') || lowerMessage.includes('30 min')) {
      context.timeAvailable = '30';
    } else if (lowerMessage.includes('45 minutes') || lowerMessage.includes('45 min')) {
      context.timeAvailable = '45';
    } else if (lowerMessage.includes('60 minutes') || lowerMessage.includes('hour') || lowerMessage.includes('60 min') || lowerMessage.includes('1 hour')) {
      context.timeAvailable = '60';
    } else if (lowerMessage.includes('20 minutes') || lowerMessage.includes('20 min')) {
      context.timeAvailable = '20';
    }

    // Extract equipment
    if (lowerMessage.includes('dumbbell') || lowerMessage.includes('weights') || lowerMessage.includes('free weights')) {
      context.equipment = 'dumbbells';
    } else if (lowerMessage.includes('gym') || lowerMessage.includes('equipment') || lowerMessage.includes('machine')) {
      context.equipment = 'full gym';
    } else if (lowerMessage.includes('bodyweight') || lowerMessage.includes('no equipment') || lowerMessage.includes('home workout')) {
      context.equipment = 'bodyweight only';
    } else if (lowerMessage.includes('resistance band') || lowerMessage.includes('bands')) {
      context.equipment = 'resistance bands';
    }

    // Extract focus areas
    if (lowerMessage.includes('upper body') || lowerMessage.includes('arms') || lowerMessage.includes('chest') || lowerMessage.includes('shoulders')) {
      context.focusAreas = 'upper body';
    } else if (lowerMessage.includes('lower body') || lowerMessage.includes('legs') || lowerMessage.includes('glutes')) {
      context.focusAreas = 'lower body';
    } else if (lowerMessage.includes('core') || lowerMessage.includes('abs') || lowerMessage.includes('stomach')) {
      context.focusAreas = 'core';
    } else if (lowerMessage.includes('full body') || lowerMessage.includes('everything') || lowerMessage.includes('overall')) {
      context.focusAreas = 'full body';
    }

    // Extract workout frequency
    if (lowerMessage.includes('3 days') || lowerMessage.includes('three days') || lowerMessage.includes('3 times')) {
      context.workoutFrequency = '3';
    } else if (lowerMessage.includes('4 days') || lowerMessage.includes('four days') || lowerMessage.includes('4 times')) {
      context.workoutFrequency = '4';
    } else if (lowerMessage.includes('5 days') || lowerMessage.includes('five days') || lowerMessage.includes('5 times')) {
      context.workoutFrequency = '5';
    } else if (lowerMessage.includes('6 days') || lowerMessage.includes('six days') || lowerMessage.includes('6 times')) {
      context.workoutFrequency = '6';
    } else if (lowerMessage.includes('every day') || lowerMessage.includes('daily') || lowerMessage.includes('7 days')) {
      context.workoutFrequency = '7';
    } else if (lowerMessage.includes('2 days') || lowerMessage.includes('two days') || lowerMessage.includes('twice')) {
      context.workoutFrequency = '2';
    }

    setConversationContext(context);
    return context;
  };

  const generateLoganResponse = (userMessage: string, context: any) => {
    const missingInfo = [];
    if (!context.fitnessLevel) missingInfo.push('fitness level');
    if (!context.goals) missingInfo.push('fitness goals');
    if (!context.timeAvailable) missingInfo.push('time availability');
    if (!context.equipment) missingInfo.push('equipment access');
    if (!context.focusAreas) missingInfo.push('focus areas');
    if (!context.workoutFrequency) missingInfo.push('workout frequency');

    // Check if user wants to create a workout now
    const lowerMessage = userMessage.toLowerCase();
    if (lowerMessage.includes('create') || lowerMessage.includes('make') || lowerMessage.includes('generate') || 
        lowerMessage.includes('ready') || lowerMessage.includes('now') || lowerMessage.includes('start')) {
      return "Great! I can create a workout plan for you right now with the information I have. I'll use reasonable defaults for any missing details. Click the 'Create Workout Plan' button below to generate your personalized workout schedule!";
    }

    // If we have most of the info, ask for the remaining pieces
    if (missingInfo.length <= 2 && missingInfo.length > 0) {
      if (missingInfo.length === 1) {
        const info = missingInfo[0];
        if (info === 'fitness level') {
          return "Great! I'm getting a good picture of your needs. Just one more thing - how would you describe your current fitness level? Are you a beginner, intermediate, or advanced? You can also just say 'create workout now' and I'll use reasonable defaults!";
        } else if (info === 'goals') {
          return "Perfect! I can see your experience level. What are your main fitness goals? Are you looking to lose weight, build muscle, improve endurance, or something else? Or just say 'create workout now' and I'll design something great for you!";
        } else if (info === 'time available') {
          return "Excellent! I understand your goals. How much time can you realistically dedicate to working out? I can create plans for 20, 30, 45, or 60-minute sessions. Or just say 'create workout now' and I'll make a 45-minute plan!";
        } else if (info === 'equipment') {
          return "Got it! What equipment do you have access to? Do you have dumbbells, a full gym, or are you working with just bodyweight exercises? Or just say 'create workout now' and I'll design a bodyweight plan!";
        } else if (info === 'focus areas') {
          return "Almost there! What areas would you like to focus on? Upper body, lower body, core, or a full-body workout? Or just say 'create workout now' and I'll make a full-body plan!";
        } else if (info === 'workout frequency') {
          return "Perfect! How many days per week would you like to work out? I can create plans for 2, 3, 4, 5, or 6 days per week. Or just say 'create workout now' and I'll make a 3-day plan!";
        }
      } else {
        return `Thanks for sharing that! I just need a couple more details: ${missingInfo.join(' and ')}. Can you tell me about those? Or just say 'create workout now' and I'll use reasonable defaults!`;
      }
    }

    // If we have all the info, show the create workout option
    if (missingInfo.length === 0) {
      return `Perfect! I have all the information I need to create your personalized weekly workout plan. I'll design a ${context.workoutFrequency}-day split that fits your ${context.fitnessLevel} level and ${context.goals} goals. When you're ready, click the 'Create Workout Plan' button below and I'll generate a complete weekly schedule tailored specifically for you!`;
    }

    // If we're missing a lot of info, ask for the most important ones first
    if (!context.fitnessLevel) {
      return "Great to meet you! I'd love to understand your fitness level better. Are you new to working out, or do you have some experience under your belt? Or just say 'create workout now' and I'll design a beginner-friendly plan!";
    }

    if (!context.goals) {
      return "What are your main fitness goals? Are you looking to lose weight, build muscle, improve endurance, or just get more toned? Or just say 'create workout now' and I'll make a general fitness plan!";
    }

    if (!context.timeAvailable) {
      return "How much time can you realistically dedicate to working out? I can create plans for 20, 30, 45, or 60-minute sessions. Or just say 'create workout now' and I'll make a 45-minute plan!";
    }

    if (!context.equipment) {
      return "What equipment do you have access to? Do you have dumbbells, a full gym, or are you working with just bodyweight exercises? Or just say 'create workout now' and I'll design a bodyweight plan!";
    }

    if (!context.focusAreas) {
      return "Which part of your body would you like to focus on, or would you prefer a full-body workout? Or just say 'create workout now' and I'll make a full-body plan!";
    }

    if (!context.workoutFrequency) {
      return "How many days per week would you like to work out? I can create plans for 2, 3, 4, 5, or 6 days per week. Or just say 'create workout now' and I'll make a 3-day plan!";
    }

    // Fallback response
    return "That's helpful information! Tell me more about your fitness journey and what you're hoping to achieve. Or just say 'create workout now' and I'll design something great for you!";
  };

  const generateWorkoutFromChat = async (userMessage: string) => {
    try {
      setIsLoading(true);
      
      const conversation = messages.map(m => `${m.sender}: ${m.text}`).join('\n') + `\nuser: ${userMessage}`;
      
      const response = await fetch('/api/generate-workout-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversation,
          fitnessLevel: conversationContext.fitnessLevel || 'beginner',
          goals: conversationContext.goals || 'general fitness',
          workoutFrequency: conversationContext.workoutFrequency || '3',
          timeAvailable: conversationContext.timeAvailable || '45',
          equipment: conversationContext.equipment || 'bodyweight only',
          focusAreas: conversationContext.focusAreas || 'full body'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate workout plan');
      }

      const workoutPlan = await response.json();
      return workoutPlan;
    } catch (error) {
      console.error('Error generating workout plan:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage = inputText.trim();
    const userMsg: Message = {
      id: Date.now().toString(),
      text: userMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    // Extract context from user message and update state
    const newContext = extractContextFromMessage(userMessage);

    setTimeout(async () => {
      try {
        // Use the new context directly instead of the state
        const loganResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: generateLoganResponse(userMessage, newContext),
          sender: 'logan',
          timestamp: new Date()
        };

        setMessages(prev => [...prev, loganResponse]);
      } catch (error) {
        const errorResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: "I apologize, but I'm having trouble responding right now. Let's continue our conversation!",
          sender: 'logan',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorResponse]);
      } finally {
        setIsLoading(false);
      }
    }, 1000);
  };

  const handleCreateWorkout = async () => {
    if (isLoading) return;

    setIsLoading(true);

    try {
      const workoutPlan = await generateWorkoutFromChat("User is ready for workout plan generation");
      
      // Save each day's workout to the workout library with proper future dates
      const savedWorkouts = [];
      const today = new Date();
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      
      for (let weekOffset = 0; weekOffset < 4; weekOffset++) { // Create 4 weeks of workouts
        for (const dayPlan of workoutPlan.weeklyPlan) {
          if (dayPlan.workout) {
            // Find the next occurrence of this day of the week
            const targetDayIndex = dayNames.indexOf(dayPlan.day);
            const currentDayIndex = today.getDay();
            let daysToAdd = targetDayIndex - currentDayIndex;
            
            // If the target day has passed this week, move to next week
            if (daysToAdd <= 0) {
              daysToAdd += 7;
            }
            
            // Add weeks offset
            daysToAdd += (weekOffset * 7);
            
            const workoutDate = new Date(today);
            workoutDate.setDate(today.getDate() + daysToAdd);
            
            const workoutToSave = {
              ...dayPlan.workout,
              date: workoutDate.toISOString().split('T')[0],
              duration: parseInt(conversationContext.timeAvailable) || 45,
              dayOfWeek: dayPlan.day,
              focus: dayPlan.focus
            };
            
            const savedWorkout = await ApiService.createWorkout(workoutToSave);
            savedWorkouts.push(savedWorkout);
          }
        }
      }
      
      const loganResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: `Perfect! I've created your personalized ${conversationContext.workoutFrequency}-day weekly workout plan: "${workoutPlan.name}". Here's what I've designed for you:

${workoutPlan.weeklyPlan.map((day: any) => `• ${day.day}: ${day.focus} - ${day.workout.name}`).join('\n')}

Each workout is tailored to your ${conversationContext.fitnessLevel} level and ${conversationContext.goals} goals, taking about ${conversationContext.timeAvailable} minutes per session. I've scheduled all ${savedWorkouts.length} workouts for the next 4 weeks so you can start your fitness journey today!

${workoutPlan.notes}`,
        sender: 'logan',
        timestamp: new Date(),
        type: 'workout-generated'
      };

      setMessages(prev => [...prev, loganResponse]);
      
      // Call the callback with the first workout for immediate display
      if (savedWorkouts.length > 0) {
        onWorkoutGenerated(savedWorkouts[0]);
      }
      
    } catch (error) {
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: "I apologize, but I'm having trouble generating a workout plan right now. Let's try again in a moment!",
        sender: 'logan',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  // Check if we have enough context to show the create workout button
  const hasEnoughContext = true; // Always show the button - we'll use defaults for missing info

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-3xl shadow-2xl w-full max-w-4xl h-[700px] flex flex-col border border-gray-800">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-600 to-blue-700 text-white p-6 rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold">L</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold">Logan</h2>
                <p className="text-sm opacity-90">Your AI Personal Trainer</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors p-2 rounded-full hover:bg-white hover:bg-opacity-10"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-6 py-4 rounded-2xl ${
                  message.sender === 'user'
                    ? 'bg-gradient-to-r from-teal-600 to-blue-700 text-white'
                    : 'bg-gray-800 text-white border border-gray-700'
                }`}
              >
                <p className="text-sm leading-relaxed">{message.text}</p>
                <p className={`text-xs mt-2 ${
                  message.sender === 'user' ? 'text-blue-100' : 'text-gray-400'
                }`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-800 text-white px-6 py-4 rounded-2xl border border-gray-700">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-6 border-t border-gray-800">
          {hasEnoughContext && (
            <div className="mb-4 text-center">
              <button
                onClick={handleCreateWorkout}
                disabled={isLoading}
                className="bg-gradient-to-r from-teal-600 to-blue-700 text-white px-8 py-4 rounded-2xl hover:from-teal-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium text-lg"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Creating Workout Plan...
                  </span>
                ) : (
                  'Create My Workout Plan'
                )}
              </button>
            </div>
          )}
          
          <div className="flex space-x-4">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Tell Logan about your fitness goals, experience, and preferences..."
              className="flex-1 px-6 py-4 border border-gray-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-gray-800 text-white placeholder-gray-400"
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputText.trim() || isLoading}
              className="bg-gradient-to-r from-teal-600 to-blue-700 text-white px-8 py-4 rounded-2xl hover:from-teal-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}