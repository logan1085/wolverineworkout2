'use client';

import { useState, useEffect, useRef } from 'react';
import { Workout } from '@/types/workout';

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
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hey there! I'm Logan, your AI personal trainer. I'm here to create the perfect workout for you today. Let's start with the basics - what are your main fitness goals?",
      sender: 'logan',
      timestamp: new Date()
    }
  ]);
  
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Refs for auto-scroll and auto-focus
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Track conversation context
  const [conversationContext, setConversationContext] = useState({
    fitnessLevel: '',
    goals: '',
    timeAvailable: '',
    equipment: '',
    focusAreas: '',
    hasEnoughInfo: false
  });

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

  const extractContextFromMessage = (message: string) => {
    const newContext = { ...conversationContext };
    const lowerMessage = message.toLowerCase();
    
    // Extract fitness level - more patterns
    if (lowerMessage.includes('beginner') || lowerMessage.includes('new to') || lowerMessage.includes('just started') || lowerMessage.includes('never worked out')) {
      newContext.fitnessLevel = 'beginner';
    } else if (lowerMessage.includes('intermediate') || lowerMessage.includes('some experience') || lowerMessage.includes('been working out for') || lowerMessage.includes('moderately active')) {
      newContext.fitnessLevel = 'intermediate';
    } else if (lowerMessage.includes('advanced') || lowerMessage.includes('experienced') || lowerMessage.includes('very fit') || lowerMessage.includes('athlete')) {
      newContext.fitnessLevel = 'advanced';
    }
    
    // Extract goals - more comprehensive
    if (lowerMessage.includes('lose weight') || lowerMessage.includes('weight loss') || lowerMessage.includes('fat loss') || lowerMessage.includes('cut') || lowerMessage.includes('get lean')) {
      newContext.goals = 'weight loss';
    } else if (lowerMessage.includes('build muscle') || lowerMessage.includes('muscle gain') || lowerMessage.includes('bulk') || lowerMessage.includes('get bigger') || lowerMessage.includes('mass')) {
      newContext.goals = 'muscle building';
    } else if (lowerMessage.includes('strength') || lowerMessage.includes('get stronger') || lowerMessage.includes('powerlifting') || lowerMessage.includes('lift heavy')) {
      newContext.goals = 'strength training';
    } else if (lowerMessage.includes('cardio') || lowerMessage.includes('endurance') || lowerMessage.includes('conditioning')) {
      newContext.goals = 'cardio fitness';
    } else if (lowerMessage.includes('tone') || lowerMessage.includes('definition') || lowerMessage.includes('get in shape') || lowerMessage.includes('fitness') || lowerMessage.includes('workout') || lowerMessage.includes('exercise')) {
      newContext.goals = 'general fitness';
    }
    
    // Extract time - more patterns
    const timeMatch = message.match(/(\d+)\s*(minutes?|mins?|hours?|hrs?)/i);
    if (timeMatch) {
      let time = parseInt(timeMatch[1]);
      if (timeMatch[2].toLowerCase().includes('hour')) {
        time = time * 60; // Convert hours to minutes
      }
      newContext.timeAvailable = time.toString();
    }
    
    // Quick time mentions
    if (lowerMessage.includes('quick workout') || lowerMessage.includes('short workout')) {
      newContext.timeAvailable = '20';
    } else if (lowerMessage.includes('long workout') || lowerMessage.includes('extended workout')) {
      newContext.timeAvailable = '60';
    }
    
    // Extract equipment - more comprehensive
    if (lowerMessage.includes('no equipment') || lowerMessage.includes('bodyweight') || lowerMessage.includes('at home') || lowerMessage.includes('no gym')) {
      newContext.equipment = 'bodyweight only';
    } else if (lowerMessage.includes('gym') || lowerMessage.includes('full equipment') || lowerMessage.includes('everything available')) {
      newContext.equipment = 'full gym';
    } else if (lowerMessage.includes('dumbbells') || lowerMessage.includes('free weights') || lowerMessage.includes('weights at home')) {
      newContext.equipment = 'dumbbells';
    } else if (lowerMessage.includes('resistance bands') || lowerMessage.includes('bands')) {
      newContext.equipment = 'resistance bands';
    }
    
    // Check if we have enough info - be more flexible
    // We need at least one piece of info from each category, OR if we have goals and some other info
    newContext.hasEnoughInfo = !!(
      (newContext.fitnessLevel || newContext.goals) && 
      (newContext.timeAvailable || newContext.equipment)
    ) || !!(
      newContext.goals && (newContext.fitnessLevel || newContext.timeAvailable || newContext.equipment)
    );
    
    // Debug logging to see what context we're extracting
    console.log('Updated conversation context:', newContext);
    
    setConversationContext(newContext);
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

      const response = await fetch('/api/chat-with-logan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: chatMessages,
          conversationContext: context
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

      const workout = await response.json();
      onWorkoutProposed(workout);
    } catch (error) {
      console.error('Error generating workout:', error);
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm having trouble generating your workout right now. Let me try again!",
        sender: 'logan',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorResponse]);
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

    // Extract context from user message
    const newContext = extractContextFromMessage(userMessage);

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
        
        // Don't automatically generate workout - let user decide when they're ready
        // The "Generate Workout" button will handle this instead
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="bg-gray-800 rounded-3xl shadow-2xl h-[600px] flex flex-col border border-gray-700">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-blue-700 text-white p-6 rounded-t-3xl">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <span className="text-xl font-bold">L</span>
          </div>
          <div>
            <h2 className="text-xl font-bold">Logan</h2>
            <p className="text-sm opacity-90">Your AI Personal Trainer</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                message.sender === 'user'
                  ? 'bg-gradient-to-r from-teal-600 to-blue-700 text-white'
                  : 'bg-gray-700 text-white border border-gray-600'
              }`}
            >
              <p className="text-sm">{message.text}</p>
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
            <div className="bg-gray-700 text-white px-4 py-3 rounded-2xl border border-gray-600">
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
      <div className="p-6 border-t border-gray-700">
        {/* Show Generate Workout button if we have meaningful info */}
        {(conversationContext.goals && (conversationContext.fitnessLevel || conversationContext.timeAvailable || conversationContext.equipment)) && (
          <div className="mb-4">
            <button
              onClick={generateWorkout}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-700 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-emerald-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Generate My Workout</span>
            </button>
          </div>
        )}
        
        <div className="flex space-x-4">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 bg-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 border border-gray-600"
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputText.trim() || isLoading}
            className="bg-gradient-to-r from-teal-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:from-teal-700 hover:to-blue-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
} 