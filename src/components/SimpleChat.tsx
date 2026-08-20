'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Workout, Chat } from '@/types/workout';
import { DatabaseService } from '@/services/database';
import { useAuth } from '@/contexts/AuthContext';
import {
  extractContext,
  EMPTY_CONTEXT,
  type ConversationContext,
} from '@/lib/conversation-context';
import { DEV_TOOLS_ENABLED } from '@/lib/dev-tools';

interface SimpleChatProps {
  onWorkoutProposed: (workout: Workout) => void;
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'logan';
  timestamp: Date;
}

const GREETING =
  "Hey there! I'm Logan, your AI personal trainer. Tell me what you're after today " +
  "- how much time you've got, what you want to work on, and what equipment is around " +
  '- and I\'ll build you a workout.';

/** One-tap openers, shown only before the user has said anything. */
const CONVERSATION_STARTERS = [
  'Quick 20-minute session',
  'Build muscle, full gym',
  'Bodyweight workout at home',
  'Something for cardio',
] as const;

/** Read the `error` field out of a failed API response, with a usable default. */
async function readApiError(response: Response, fallback: string): Promise<string> {
  try {
    const data = await response.json();
    return typeof data?.error === 'string' ? data.error : fallback;
  } catch {
    return fallback;
  }
}

export default function SimpleChat({ onWorkoutProposed }: SimpleChatProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingWorkout, setIsGeneratingWorkout] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [conversationContext, setConversationContext] =
    useState<ConversationContext>(EMPTY_CONTEXT);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // StrictMode invokes effects twice in development. Without this guard the
  // second pass raced the first through getOrCreateActiveChat and could insert
  // the greeting into the chat a second time.
  const initializedForUserRef = useRef<string | null>(null);

  const userId = user?.id;

  useEffect(() => {
    if (!userId) return;
    if (initializedForUserRef.current === userId) return;
    initializedForUserRef.current = userId;

    let cancelled = false;

    const initialize = async () => {
      setIsInitializing(true);

      // Seed the context from the saved profile first, so a returning user's
      // answers are already in place before their first message.
      try {
        const profile = await DatabaseService.getUserProfile(userId);
        if (!cancelled && profile) {
          setConversationContext({
            fitnessLevel: profile.fitness_level || '',
            goals: profile.primary_goals?.[0] || '',
            timeAvailable: profile.preferred_duration_minutes?.toString() || '',
            equipment: profile.available_equipment?.[0] || '',
            focusAreas: '',
            hasEnoughInfo: Boolean(
              profile.fitness_level ||
                profile.primary_goals?.length ||
                profile.preferred_duration_minutes ||
                profile.available_equipment?.length
            ),
          });
        }
      } catch {
        // A missing profile is not fatal - the conversation just starts blank.
      }

      try {
        const chat = await DatabaseService.getOrCreateActiveChat(userId);
        if (cancelled) return;

        if (!chat) {
          // No chat means nothing can be persisted, so say so rather than
          // letting the user type into a dead input.
          setMessages([{ id: 'greeting', text: GREETING, sender: 'logan', timestamp: new Date() }]);
          setError("We couldn't reach your saved chats, so this session won't be remembered.");
          return;
        }

        setCurrentChat(chat);

        const chatMessages = await DatabaseService.getChatMessages(chat.id);
        if (cancelled) return;

        if (chatMessages.length > 0) {
          setMessages(
            chatMessages.map(msg => ({
              id: msg.id,
              text: msg.content,
              sender: msg.sender,
              timestamp: new Date(msg.created_at),
            }))
          );
          return;
        }

        setMessages([{ id: 'greeting', text: GREETING, sender: 'logan', timestamp: new Date() }]);
        await DatabaseService.createMessage({
          chat_id: chat.id,
          user_id: userId,
          sender: 'logan',
          content: GREETING,
          message_type: 'text',
        });
      } catch {
        if (cancelled) return;
        setMessages([{ id: 'greeting', text: GREETING, sender: 'logan', timestamp: new Date() }]);
        setError("We couldn't load your chat history. You can still talk to Logan.");
      } finally {
        if (!cancelled) setIsInitializing(false);
      }
    };

    initialize();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Auto-scroll to the latest message.
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Return focus to the input once Logan has replied.
  useEffect(() => {
    if (!isLoading && !isInitializing) {
      inputRef.current?.focus();
    }
  }, [isLoading, isInitializing]);

  const persistMessage = useCallback(
    async (chatId: string, sender: 'user' | 'logan', content: string, type: 'text' | 'system') => {
      if (!userId) return;
      try {
        await DatabaseService.createMessage({
          chat_id: chatId,
          user_id: userId,
          sender,
          content,
          message_type: type,
        });
      } catch {
        // A failed write should not interrupt the conversation; the message is
        // already on screen.
      }
    },
    [userId]
  );

  const sendMessage = useCallback(
    async (rawText: string) => {
      const text = rawText.trim();
      if (!text || isLoading || isGeneratingWorkout || !userId || !currentChat) return;

      setError(null);
      setInputText('');
      setIsLoading(true);

      const userMsg: Message = {
        id: `user-${Date.now()}`,
        text,
        sender: 'user',
        timestamp: new Date(),
      };

      // Snapshot the history that Logan should see: state updates are async, so
      // reading `messages` after setState would miss this turn.
      const history = [...messages, userMsg];
      setMessages(history);

      const nextContext = extractContext(text, conversationContext);
      setConversationContext(nextContext);

      await persistMessage(currentChat.id, 'user', text, 'text');

      // Persist the derived profile, but never let that failure surface as a
      // chat error - it is bookkeeping the user did not ask for.
      const contextChanged =
        nextContext.fitnessLevel !== conversationContext.fitnessLevel ||
        nextContext.goals !== conversationContext.goals ||
        nextContext.timeAvailable !== conversationContext.timeAvailable ||
        nextContext.equipment !== conversationContext.equipment;
      if (contextChanged) {
        DatabaseService.upsertUserProfileFromContext(userId, nextContext).catch(() => {});
      }

      try {
        const response = await fetch('/api/chat-with-logan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            // No userId here: the server reads it from the session cookie.
            messages: history.map(msg => ({
              role: msg.sender === 'user' ? 'user' : 'assistant',
              content: msg.text,
            })),
            conversationContext: nextContext,
          }),
        });

        if (!response.ok) {
          throw new Error(
            await readApiError(response, "Logan couldn't respond just now. Please try again.")
          );
        }

        const data = await response.json();
        const reply: Message = {
          id: `logan-${Date.now()}`,
          text: data.message,
          sender: 'logan',
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, reply]);
        await persistMessage(currentChat.id, 'logan', reply.text, 'text');
      } catch (err) {
        // Surfaced as a banner rather than a fake message from Logan: a failure
        // pretending to be part of the conversation is both confusing and
        // permanently stored in the transcript.
        setError(
          err instanceof Error ? err.message : "Logan couldn't respond just now. Please try again."
        );
      } finally {
        setIsLoading(false);
      }
    },
    [messages, conversationContext, currentChat, isGeneratingWorkout, isLoading, persistMessage, userId]
  );

  const generateWorkout = async () => {
    if (!userId || !currentChat || isGeneratingWorkout) return;

    setError(null);
    setIsGeneratingWorkout(true);

    try {
      const response = await fetch('/api/generate-simple-workout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fitnessLevel: conversationContext.fitnessLevel || 'beginner',
          goals: conversationContext.goals || 'general fitness',
          timeAvailable: conversationContext.timeAvailable || '30',
          equipment: conversationContext.equipment || 'bodyweight only',
          conversation: messages.map(m => `${m.sender}: ${m.text}`).join('\n'),
        }),
      });

      if (!response.ok) {
        throw new Error(
          await readApiError(response, "Logan couldn't build that workout. Please try again.")
        );
      }

      const generated = await response.json();

      const savedWorkout = await DatabaseService.createWorkout({
        user_id: userId,
        chat_id: currentChat.id,
        name: generated.name,
        description: generated.notes,
        // Populates the "Logan's Notes" panel on the preview screen. It read
        // `ai_notes`, which nothing ever set, so that panel never appeared.
        ai_notes: generated.notes,
        scheduled_date: new Date().toISOString().split('T')[0],
        duration_minutes:
          parseInt(conversationContext.timeAvailable, 10) || generated.duration || 30,
        difficulty_level:
          (conversationContext.fitnessLevel as 'beginner' | 'intermediate' | 'advanced') ||
          'beginner',
        workout_type: conversationContext.goals || 'general fitness',
        equipment_used: conversationContext.equipment
          ? [conversationContext.equipment]
          : ['bodyweight only'],
        generated_from_goals: conversationContext.goals ? [conversationContext.goals] : [],
        exercises: generated.exercises.map(
          (exercise: { name: string; sets: number; reps: number; weight: number; notes: string }, index: number) => ({
            name: exercise.name,
            sets: exercise.sets,
            reps: exercise.reps,
            weight_lbs: exercise.weight || 0,
            rest_seconds: 60,
            notes: exercise.notes,
            order_in_workout: index + 1,
          })
        ),
      });

      // A null here means the insert failed. Previously this branch did nothing
      // at all: the spinner stopped and the user was left on the chat screen
      // with no workout and no explanation.
      if (!savedWorkout) {
        throw new Error("We built your workout but couldn't save it. Please try again.");
      }

      await DatabaseService.linkWorkoutToChat(currentChat.id, savedWorkout.id);
      onWorkoutProposed(savedWorkout);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Logan couldn't build that workout. Please try again."
      );
    } finally {
      setIsGeneratingWorkout(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputText);
    }
  };

  const handleReset = async () => {
    if (!userId || !currentChat) return;

    const confirmReset = window.confirm(
      'This clears your chat history and saved profile so you can retest onboarding. Continue?'
    );
    if (!confirmReset) return;

    try {
      setError(null);
      setConversationContext(EMPTY_CONTEXT);
      setMessages([{ id: 'greeting', text: GREETING, sender: 'logan', timestamp: new Date() }]);

      await DatabaseService.resetUserProfile(userId);
      await DatabaseService.updateChat(currentChat.id, { status: 'archived' });

      const newChat = await DatabaseService.getOrCreateActiveChat(userId);
      if (newChat) {
        setCurrentChat(newChat);
        await DatabaseService.createMessage({
          chat_id: newChat.id,
          user_id: userId,
          sender: 'logan',
          content: GREETING,
          message_type: 'text',
        });
      }
    } catch {
      setError('Reset failed. Please try again.');
    }
  };

  if (!user) {
    return <div className="text-gray-300 p-4">Please sign in to start chatting with Logan.</div>;
  }

  const inputDisabled = isLoading || isGeneratingWorkout || isInitializing || !currentChat;
  const showStarters = !isInitializing && messages.length <= 1 && !isLoading;

  return (
    <div className="bg-gray-800 md:rounded-3xl shadow-2xl h-full md:h-[600px] md:max-h-[600px] flex flex-col border-0 md:border md:border-gray-700">
      {/* Header - mobile has its own in the page shell */}
      <div className="hidden md:block bg-gradient-to-r from-teal-600 to-blue-700 text-white p-4 md:p-6 rounded-t-3xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 md:space-x-4">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden border-2 border-white/30">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logan-profile.jpg"
                alt="Logan - AI Personal Trainer"
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <div className="hidden w-full h-full bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-lg md:text-xl font-bold">L</span>
              </div>
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold">Logan</h2>
              <p className="text-xs md:text-sm opacity-90">Your AI Personal Trainer</p>
            </div>
          </div>

          {/* Destructive, so it ships only when dev tools are switched on. */}
          {DEV_TOOLS_ENABLED && (
            <button
              onClick={handleReset}
              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors duration-200 opacity-75 hover:opacity-100"
              title="Dev tool: reset profile and chat to retest onboarding"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-gray-900 md:bg-transparent">
        {isInitializing && (
          <div className="flex justify-center py-8">
            <span className="text-gray-400 text-sm">Loading your conversation…</span>
          </div>
        )}

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
              <p className="text-sm break-words whitespace-pre-wrap">{message.text}</p>
              <p
                className={`text-xs mt-1 ${
                  message.sender === 'user' ? 'text-blue-100' : 'text-gray-400'
                }`}
              >
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-700 text-white px-3 md:px-4 py-2 md:py-3 rounded-2xl border border-gray-600">
              <span className="sr-only">Logan is typing</span>
              <div className="flex space-x-1" aria-hidden="true">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 md:p-6 border-t border-gray-700 bg-gray-800">
        {error && (
          <div
            role="alert"
            className="mb-3 flex items-start justify-between gap-3 rounded-xl border border-red-500/50 bg-red-950/50 px-3 py-2"
          >
            <p className="text-sm text-red-200">{error}</p>
            <button
              onClick={() => setError(null)}
              aria-label="Dismiss error"
              className="text-red-300 hover:text-white text-sm leading-none"
            >
              ✕
            </button>
          </div>
        )}

        {showStarters && (
          <div className="mb-3 flex flex-wrap gap-2">
            {CONVERSATION_STARTERS.map(starter => (
              <button
                key={starter}
                onClick={() => sendMessage(starter)}
                disabled={inputDisabled}
                className="rounded-full border border-gray-600 bg-gray-700/60 px-3 py-1.5 text-xs text-gray-200 transition-colors hover:bg-gray-600 disabled:opacity-50"
              >
                {starter}
              </button>
            ))}
          </div>
        )}

        {conversationContext.hasEnoughInfo && (
          <div className="mb-4">
            <button
              onClick={generateWorkout}
              disabled={isLoading || isGeneratingWorkout || !currentChat}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-700 text-white px-4 md:px-6 py-3 rounded-xl hover:from-green-700 hover:to-emerald-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm md:text-base"
            >
              {isGeneratingWorkout ? (
                <>
                  <svg className="w-4 h-4 md:w-5 md:h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Building your workout…</span>
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
          <label htmlFor="chat-input" className="sr-only">
            Message Logan
          </label>
          <input
            id="chat-input"
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isGeneratingWorkout ? 'Building your workout…' : 'Type your message…'}
            className="flex-1 bg-gray-700 text-white rounded-xl px-3 md:px-4 py-2 md:py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 border border-gray-600 text-sm md:text-base"
            disabled={inputDisabled}
          />
          <button
            onClick={() => sendMessage(inputText)}
            disabled={!inputText.trim() || inputDisabled}
            aria-label="Send message"
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
