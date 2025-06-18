'use client';

import { useState, useEffect, useRef } from 'react';
import { Workout, Chat, UserProfile } from '@/types/workout';
import { DatabaseService } from '@/services/database';
import { useAuth } from '@/contexts/AuthContext';

interface SimpleChatProps {
  onWorkoutProposed: (workout: Workout) => void;
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'logan';
  timestamp: Date;
}

export default function SimpleChat({ onWorkoutProposed }: SimpleChatProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingWorkout, setIsGeneratingWorkout] = useState(false);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [, setUserProfile] = useState<UserProfile | null>(null);
  
  // Refs for auto-scroll and auto-focus
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Track conversation context (now backed by database)
  const [conversationContext, setConversationContext] = useState({
    fitnessLevel: '',
    goals: '',
    timeAvailable: '',
    equipment: '',
    focusAreas: '',
    hasEnoughInfo: false
  });

  // Initialize chat and load data
  useEffect(() => {
    if (user) {
      initializeChat();
      loadUserProfile();
    }
  }, [user]);

  const initializeChat = async () => {
    if (!user) return;

    try {
      // Get or create active chat
      const chat = await DatabaseService.getOrCreateActiveChat(user.id);
      if (chat) {
        setCurrentChat(chat);
        
        // Load existing messages
        const chatMessages = await DatabaseService.getChatMessages(chat.id);
        
        // Convert DB messages to component format
        const formattedMessages: Message[] = chatMessages.map(msg => ({
          id: msg.id,
          text: msg.content,
          sender: msg.sender,
          timestamp: new Date(msg.created_at)
        }));

        // If no messages exist, add the initial Logan greeting
        if (formattedMessages.length === 0) {
          const initialMessage = {
            id: '1',
            text: "Hey there! I'm Logan, your AI personal trainer. I'm here to create the perfect workout for you today. Let's start with the basics - what are your main fitness goals?",
            sender: 'logan' as const,
            timestamp: new Date()
          };
          setMessages([initialMessage]);
          
          // Save initial message to database
          try {
            await DatabaseService.createMessage({
              chat_id: chat.id,
              user_id: user.id,
              sender: 'logan',
              content: initialMessage.text,
              message_type: 'text'
            });
          } catch (msgError) {
            console.warn('Could not save initial message to database:', msgError);
          }
        } else {
          setMessages(formattedMessages);
        }
      }
    } catch (error) {
      console.error('Error initializing chat:', error);
      // Fallback to local state with helpful message
      setMessages([{
        id: '1',
        text: "Hey there! I'm Logan, your AI personal trainer. I'm here to create the perfect workout for you today. I'm having a small issue connecting to our servers, but I can still help you! Let's start with the basics - what are your main fitness goals?",
        sender: 'logan',
        timestamp: new Date()
      }]);
    }
  };

  const loadUserProfile = async () => {
    if (!user) return;

    try {
      const profile = await DatabaseService.getUserProfile(user.id);
      if (profile) {
        setUserProfile(profile);
        
        // Update conversation context from profile
        setConversationContext({
          fitnessLevel: profile.fitness_level || '',
          goals: profile.primary_goals?.[0] || '',
          timeAvailable: profile.preferred_duration_minutes?.toString() || '',
          equipment: profile.available_equipment?.[0] || '',
          focusAreas: '', // This could be derived from workout history
          hasEnoughInfo: !!(profile.fitness_level || profile.primary_goals?.length || profile.preferred_duration_minutes || profile.available_equipment?.length)
        });
      }
    } catch (error) {
      console.warn('Could not load user profile, continuing with fresh context:', error);
      // Continue with empty context - not a critical error
    }
  };

  // Auto-scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-focus input on component mount and after sending messages
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      inputRef.current?.focus();
    }
  }, [isLoading]);

  const extractContextFromMessage = async (message: string) => {
    const newContext = { ...conversationContext };
    const lowerMessage = message.toLowerCase();
    
    // Extract fitness level - much more comprehensive patterns
    if (lowerMessage.includes('beginner') || lowerMessage.includes('new to') || 
        lowerMessage.includes('just started') || lowerMessage.includes('never worked out') ||
        lowerMessage.includes('first time') || lowerMessage.includes('starting out') ||
        lowerMessage.includes('haven\'t exercised') || lowerMessage.includes('not exercised') ||
        lowerMessage.includes('long time since') || lowerMessage.includes('out of shape') ||
        lowerMessage.includes('getting back into') || lowerMessage.includes('been a while')) {
      newContext.fitnessLevel = 'beginner';
    } else if (lowerMessage.includes('intermediate') || lowerMessage.includes('some experience') || 
               lowerMessage.includes('been working out for') || lowerMessage.includes('moderately active') ||
               lowerMessage.includes('few months') || lowerMessage.includes('couple years') ||
               lowerMessage.includes('work out regularly') || lowerMessage.includes('exercise sometimes') ||
               lowerMessage.includes('decent shape') || lowerMessage.includes('average fitness')) {
      newContext.fitnessLevel = 'intermediate';
    } else if (lowerMessage.includes('advanced') || lowerMessage.includes('experienced') || 
               lowerMessage.includes('very fit') || lowerMessage.includes('athlete') ||
               lowerMessage.includes('years of') || lowerMessage.includes('serious training') ||
               lowerMessage.includes('compete') || lowerMessage.includes('competitive') ||
               lowerMessage.includes('powerlifter') || lowerMessage.includes('bodybuilder')) {
      newContext.fitnessLevel = 'advanced';
    }
    
    // Extract goals - much more comprehensive with context clues
    if (lowerMessage.includes('lose weight') || lowerMessage.includes('weight loss') || 
        lowerMessage.includes('fat loss') || lowerMessage.includes('cut') || 
        lowerMessage.includes('get lean') || lowerMessage.includes('slim down') ||
        lowerMessage.includes('drop pounds') || lowerMessage.includes('shed') ||
        lowerMessage.includes('burn fat') || lowerMessage.includes('lose') ||
        lowerMessage.includes('lighter') || lowerMessage.includes('trim') ||
        lowerMessage.includes('diet') || lowerMessage.includes('cardio')) {
      newContext.goals = 'weight loss';
    } else if (lowerMessage.includes('build muscle') || lowerMessage.includes('muscle gain') || 
               lowerMessage.includes('bulk') || lowerMessage.includes('get bigger') || 
               lowerMessage.includes('mass') || lowerMessage.includes('gain weight') ||
               lowerMessage.includes('muscle building') || lowerMessage.includes('hypertrophy') ||
               lowerMessage.includes('size') || lowerMessage.includes('bigger arms') ||
               lowerMessage.includes('chest') || lowerMessage.includes('biceps')) {
      newContext.goals = 'muscle building';
    } else if (lowerMessage.includes('strength') || lowerMessage.includes('get stronger') || 
               lowerMessage.includes('powerlifting') || lowerMessage.includes('lift heavy') ||
               lowerMessage.includes('strong') || lowerMessage.includes('power') ||
               lowerMessage.includes('deadlift') || lowerMessage.includes('squat') ||
               lowerMessage.includes('bench press') || lowerMessage.includes('pr')) {
      newContext.goals = 'strength training';
    } else if (lowerMessage.includes('cardio') || lowerMessage.includes('endurance') || 
               lowerMessage.includes('conditioning') || lowerMessage.includes('stamina') ||
               lowerMessage.includes('running') || lowerMessage.includes('marathon') ||
               lowerMessage.includes('heart health') || lowerMessage.includes('aerobic')) {
      newContext.goals = 'cardio fitness';
    } else if (lowerMessage.includes('tone') || lowerMessage.includes('definition') || 
               lowerMessage.includes('get in shape') || lowerMessage.includes('fitness') || 
               lowerMessage.includes('workout') || lowerMessage.includes('exercise') ||
               lowerMessage.includes('healthy') || lowerMessage.includes('active') ||
               lowerMessage.includes('feel better') || lowerMessage.includes('energy') ||
               lowerMessage.includes('stronger') || lowerMessage.includes('fitter')) {
      newContext.goals = 'general fitness';
    }
    
    // Extract time - much more flexible patterns including common phrases
    const timeMatch = message.match(/(\d+)\s*(minutes?|mins?|hours?|hrs?)/i);
    if (timeMatch) {
      let time = parseInt(timeMatch[1]);
      if (timeMatch[2].toLowerCase().includes('hour')) {
        time = time * 60; // Convert hours to minutes
      }
      newContext.timeAvailable = time.toString();
    }
    
    // Common time expressions
    if (lowerMessage.includes('quick workout') || lowerMessage.includes('short workout') ||
        lowerMessage.includes('don\'t have much time') || lowerMessage.includes('15 min') ||
        lowerMessage.includes('twenty min')) {
      newContext.timeAvailable = '20';
    } else if (lowerMessage.includes('half hour') || lowerMessage.includes('thirty min') ||
               lowerMessage.includes('30 min') || lowerMessage.includes('moderate time')) {
      newContext.timeAvailable = '30';
    } else if (lowerMessage.includes('45 min') || lowerMessage.includes('forty') ||
               lowerMessage.includes('decent amount') || lowerMessage.includes('good amount')) {
      newContext.timeAvailable = '45';
    } else if (lowerMessage.includes('hour') || lowerMessage.includes('60 min') ||
               lowerMessage.includes('long workout') || lowerMessage.includes('extended')) {
      newContext.timeAvailable = '60';
    }
    
    // Extract equipment - much more comprehensive with context
    if (lowerMessage.includes('no equipment') || lowerMessage.includes('bodyweight') || 
        lowerMessage.includes('at home') || lowerMessage.includes('no gym') ||
        lowerMessage.includes('apartment') || lowerMessage.includes('living room') ||
        lowerMessage.includes('bedroom') || lowerMessage.includes('anywhere') ||
        lowerMessage.includes('no weights') || lowerMessage.includes('just myself') ||
        lowerMessage.includes('push ups') || lowerMessage.includes('squats') ||
        lowerMessage.includes('home workout')) {
      newContext.equipment = 'bodyweight only';
    } else if (lowerMessage.includes('gym') || lowerMessage.includes('full equipment') || 
               lowerMessage.includes('everything available') || lowerMessage.includes('membership') ||
               lowerMessage.includes('fitness center') || lowerMessage.includes('machines') ||
               lowerMessage.includes('barbells') || lowerMessage.includes('complete gym') ||
               lowerMessage.includes('all equipment') || lowerMessage.includes('weight room')) {
      newContext.equipment = 'full gym';
    } else if (lowerMessage.includes('dumbbells') || lowerMessage.includes('free weights') || 
               lowerMessage.includes('weights at home') || lowerMessage.includes('some weights') ||
               lowerMessage.includes('pair of') || lowerMessage.includes('adjustable') ||
               lowerMessage.includes('10 lb') || lowerMessage.includes('20 lb') ||
               lowerMessage.includes('weight set')) {
      newContext.equipment = 'dumbbells';
    } else if (lowerMessage.includes('resistance bands') || lowerMessage.includes('bands') ||
               lowerMessage.includes('elastic') || lowerMessage.includes('portable') ||
               lowerMessage.includes('travel')) {
      newContext.equipment = 'resistance bands';
    }
    
    // Check if we have enough info - be more flexible
    // We need at least one piece of meaningful info, OR any mention of wanting a workout
    newContext.hasEnoughInfo = !!(
      newContext.fitnessLevel || 
      newContext.goals || 
      newContext.timeAvailable || 
      newContext.equipment ||
      lowerMessage.includes('workout') ||
      lowerMessage.includes('exercise') ||
      lowerMessage.includes('train') ||
      lowerMessage.includes('fitness') ||
      lowerMessage.includes('ready') ||
      lowerMessage.includes('let\'s go') ||
      lowerMessage.includes('start')
    );
    
    // Debug logging to see what context we're extracting
    console.log('Updated conversation context:', newContext);
    
    setConversationContext(newContext);
    
    // Update user profile in database with new context
    if (user && (newContext.fitnessLevel !== conversationContext.fitnessLevel ||
                 newContext.goals !== conversationContext.goals ||
                 newContext.timeAvailable !== conversationContext.timeAvailable ||
                 newContext.equipment !== conversationContext.equipment)) {
      try {
        await DatabaseService.upsertUserProfileFromContext(user.id, newContext);
      } catch (error) {
        console.warn('Could not update user profile:', error);
        // Continue without blocking the user experience
      }
    }
    
    return newContext;
  };

  const generateLoganResponse = async (userMessage: string, context: any) => {
    try {
      const chatMessages = messages.map(msg => ({
        role: msg.sender === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.text
      }));

      // Add the current user message
      chatMessages.push({
        role: 'user' as const,
        content: userMessage
      });

      // Ensure conversationContext has all required fields
      const conversationContext = {
        fitnessLevel: context.fitnessLevel || '',
        goals: context.goals || '',
        timeAvailable: context.timeAvailable || '',
        equipment: context.equipment || '',
        focusAreas: context.focusAreas || '',
        hasEnoughInfo: context.hasEnoughInfo || false
      };

      const response = await fetch('/api/chat-with-logan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: chatMessages,
          conversationContext
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get Logan response');
      }

      const data = await response.json();
      return {
        message: data.message,
        readyForWorkout: data.readyForWorkout
      };
    } catch (error) {
      console.error('Error getting Logan response:', error);
      return {
        message: "I'm having trouble responding right now, but I'm here to help! Can you tell me a bit more about what you're looking for in today's workout?",
        readyForWorkout: false
      };
    }
  };

  const generateWorkout = async () => {
    if (!user || !currentChat) return;

    console.log('🏋️ Generating workout with context:', conversationContext);
    setIsGeneratingWorkout(true);
    
    try {
      const response = await fetch('/api/generate-simple-workout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fitnessLevel: conversationContext.fitnessLevel || 'beginner',
          goals: conversationContext.goals || 'general fitness',
          timeAvailable: conversationContext.timeAvailable || '30',
          equipment: conversationContext.equipment || 'bodyweight only',
          conversation: messages.map(m => `${m.sender}: ${m.text}`).join('\n')
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate workout');
      }

      const generatedWorkout = await response.json();
      
      // Convert to database format and save
      const workoutToSave = {
        user_id: user.id,
        chat_id: currentChat.id,
        name: generatedWorkout.name,
        description: generatedWorkout.notes,
        scheduled_date: new Date().toISOString().split('T')[0], // Today
        duration_minutes: parseInt(conversationContext.timeAvailable) || generatedWorkout.duration || 30,
        difficulty_level: conversationContext.fitnessLevel as 'beginner' | 'intermediate' | 'advanced' || 'beginner',
        workout_type: conversationContext.goals || 'general fitness',
        equipment_used: conversationContext.equipment ? [conversationContext.equipment] : ['bodyweight only'],
        generated_from_goals: conversationContext.goals ? [conversationContext.goals] : [],
        exercises: generatedWorkout.exercises.map((exercise: any, index: number) => ({
          name: exercise.name,
          sets: exercise.sets,
          reps: exercise.reps,
          weight_lbs: exercise.weight || 0,
          rest_seconds: 60,
          notes: exercise.notes,
          order_in_workout: index + 1
        }))
      };

      const savedWorkout = await DatabaseService.createWorkout(workoutToSave);
      
      if (savedWorkout) {
        // Link workout to chat
        await DatabaseService.linkWorkoutToChat(currentChat.id, savedWorkout.id);
        
        console.log('✅ Workout generated and saved:', savedWorkout);
        onWorkoutProposed(savedWorkout);
      }
    } catch (error) {
      console.error('Error generating workout:', error);
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm having trouble generating your workout right now. Let me try again!",
        sender: 'logan',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorResponse]);
      
      if (currentChat) {
        try {
          await DatabaseService.createMessage({
            chat_id: currentChat.id,
            user_id: user.id,
            sender: 'logan',
            content: errorResponse.text,
            message_type: 'system'
          });
        } catch (error) {
          console.warn('Could not save error message to database:', error);
        }
      }
    } finally {
      setIsGeneratingWorkout(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading || isGeneratingWorkout || !user || !currentChat) return;

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

    // Save user message to database
    try {
      await DatabaseService.createMessage({
        chat_id: currentChat.id,
        user_id: user.id,
        sender: 'user',
        content: userMessage,
        message_type: 'text'
      });
    } catch (error) {
      console.warn('Could not save user message to database:', error);
      // Continue without blocking the conversation
    }

    // Extract context from user message
    const newContext = await extractContextFromMessage(userMessage);

    setTimeout(async () => {
      try {
        // Get Logan's response
        const loganResponseData = await generateLoganResponse(userMessage, newContext);
        
        const loganResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: loganResponseData.message,
          sender: 'logan',
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, loganResponse]);
        
        // Save Logan's response to database
        try {
          await DatabaseService.createMessage({
            chat_id: currentChat.id,
            user_id: user.id,
            sender: 'logan',
            content: loganResponse.text,
            message_type: 'text'
          });
        } catch (error) {
          console.warn('Could not save Logan response to database:', error);
          // Continue without blocking the conversation
        }
        
      } catch (error) {
        const errorResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: "I apologize, but I'm having trouble responding right now. Let's continue our conversation!",
          sender: 'logan',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorResponse]);
        
        if (currentChat) {
          try {
            await DatabaseService.createMessage({
              chat_id: currentChat.id,
              user_id: user.id,
              sender: 'logan',
              content: errorResponse.text,
              message_type: 'system'
            });
          } catch (error) {
            console.warn('Could not save error message to database:', error);
          }
        }
      } finally {
        setIsLoading(false);
      }
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleReset = async () => {
    if (!user || !currentChat) return;
    
    const confirmReset = window.confirm('This will clear all your chat data and user profile to test the onboarding flow. Are you sure?');
    if (!confirmReset) return;

    try {
      // Clear conversation context
      setConversationContext({
        fitnessLevel: '',
        goals: '',
        timeAvailable: '',
        equipment: '',
        focusAreas: '',
        hasEnoughInfo: false
      });

      // Reset messages to initial state
      const initialMessage = {
        id: '1',
        text: "Hey there! I'm Logan, your AI personal trainer. I'm here to create the perfect workout for you today. Let's start with the basics - what are your main fitness goals?",
        sender: 'logan' as const,
        timestamp: new Date()
      };
      setMessages([initialMessage]);

      // Reset user profile to initial state
      await DatabaseService.resetUserProfile(user.id);

      // Clear any existing chat messages by marking chat as archived and creating a new one
      if (currentChat) {
        await DatabaseService.updateChat(currentChat.id, { status: 'archived' });
      }
      
      // Create a new active chat
      const newChat = await DatabaseService.getOrCreateActiveChat(user.id);
      if (newChat) {
        setCurrentChat(newChat);
        
        // Save the initial message to the new chat
        await DatabaseService.createMessage({
          chat_id: newChat.id,
          user_id: user.id,
          sender: 'logan',
          content: initialMessage.text,
          message_type: 'text'
        });
      }

      console.log('Dev reset completed - user data cleared for onboarding flow testing');
    } catch (error) {
      console.error('Error during dev reset:', error);
      alert('Reset failed. Check console for details.');
    }
  };

  if (!user) {
    return <div>Please log in to start chatting with Logan.</div>;
  }

  return (
    <div className="bg-gray-800 md:rounded-3xl shadow-2xl h-full md:h-[600px] md:max-h-[600px] flex flex-col border-0 md:border md:border-gray-700">
      {/* Header - only show on desktop since mobile has main header */}
      <div className="hidden md:block bg-gradient-to-r from-teal-600 to-blue-700 text-white p-4 md:p-6 rounded-t-3xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 md:space-x-4">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden border-2 border-white border-opacity-30">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src="/logan-profile.jpg" 
                alt="Logan - AI Personal Trainer"
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to letter avatar if image fails to load
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <div className="hidden w-full h-full bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <span className="text-lg md:text-xl font-bold">L</span>
              </div>
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold">Logan</h2>
              <p className="text-xs md:text-sm opacity-90">Your AI Personal Trainer</p>
            </div>
          </div>
          
          {/* Dev Tools - Reset Button */}
          <button
            onClick={handleReset}
            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors duration-200 opacity-75 hover:opacity-100"
            title="Dev Tool: Reset user data to test onboarding"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-gray-900 md:bg-transparent">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] sm:max-w-xs lg:max-w-md px-3 md:px-4 py-2 md:py-3 rounded-2xl ${
                message.sender === 'user'
                  ? 'bg-gradient-to-r from-teal-600 to-blue-700 text-white'
                  : 'bg-gray-700 text-white border border-gray-600'
              }`}
            >
              <p className="text-sm break-words">{message.text}</p>
              <p className={`text-xs mt-1 ${
                message.sender === 'user' ? 'text-blue-100' : 'text-gray-400'
              }`}>
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-700 text-white px-3 md:px-4 py-2 md:py-3 rounded-2xl border border-gray-600">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        {/* Invisible div to scroll to */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 md:p-6 border-t border-gray-700 bg-gray-800">
        {/* Show Generate Workout button if we have any meaningful info or user seems ready */}
        {conversationContext.hasEnoughInfo && (
          <div className="mb-4">
            <button
              onClick={generateWorkout}
              disabled={isLoading || isGeneratingWorkout}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-700 text-white px-4 md:px-6 py-3 rounded-xl hover:from-green-700 hover:to-emerald-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm md:text-base"
            >
              {isGeneratingWorkout ? (
                <>
                  <svg className="w-4 h-4 md:w-5 md:h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Generating preview...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>Preview workout</span>
                </>
              )}
            </button>
          </div>
        )}
        
        <div className="flex space-x-2 md:space-x-4">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={isGeneratingWorkout ? "Generating workout..." : "Type your message..."}
            className="flex-1 bg-gray-700 text-white rounded-xl px-3 md:px-4 py-2 md:py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 border border-gray-600 text-sm md:text-base"
            disabled={isLoading || isGeneratingWorkout}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputText.trim() || isLoading || isGeneratingWorkout}
            className="bg-gradient-to-r from-teal-600 to-blue-700 text-white px-4 md:px-6 py-2 md:py-3 rounded-xl hover:from-teal-700 hover:to-blue-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
} 