import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getLoganChatPrompt, type ConversationContext } from '@/prompts';
import { memoryService } from '@/lib/memory';
import { parseJsonBody } from '@/lib/api-validation';
import { getAuthenticatedUser } from '@/lib/supabase-server';
import { log, redact } from '@/lib/logger';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  conversationContext: ConversationContext;
}

/**
 * Cap on history sent upstream. Chat history grows without bound as a
 * conversation goes on, and the whole array is re-sent every turn, so a long
 * session would eventually overflow the model's context window and start
 * failing. Keeping only recent turns bounds both that failure and the cost.
 */
const MAX_HISTORY_MESSAGES = 20;

/** Guard against a client posting a huge string to run up the token bill. */
const MAX_MESSAGE_CHARS = 4000;

/** Resolve to `fallback` if the lookup has not finished in time. */
function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>(resolve => setTimeout(() => resolve(fallback), ms)),
  ]);
}

export async function POST(request: NextRequest) {
  try {
    // Identity comes from the session cookie, never from the request body. This
    // route used to read `body.userId` and fall back to a shared 'default_user',
    // so the signed-in app funnelled every user's memories into one namespace
    // and any caller could read someone else's by passing their id.
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { error: 'You must be signed in to chat with Logan.' },
        { status: 401 }
      );
    }
    const userId = user.id;

    const parsed = await parseJsonBody<ChatRequest>(request);
    if (!parsed.ok) {
      return parsed.response;
    }
    const body = parsed.data;

    if (!Array.isArray(body.messages) || body.messages.length === 0) {
      return NextResponse.json(
        { error: 'Field "messages" must be a non-empty array' },
        { status: 400 }
      );
    }

    const messages = body.messages
      .filter(
        (message): message is ChatMessage =>
          !!message &&
          typeof message.content === 'string' &&
          (message.role === 'user' || message.role === 'assistant')
      )
      .slice(-MAX_HISTORY_MESSAGES)
      .map(message => ({
        role: message.role,
        content: message.content.slice(0, MAX_MESSAGE_CHARS),
      }));

    if (messages.length === 0) {
      return NextResponse.json(
        { error: 'Field "messages" contained no valid messages' },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      log.error('OPENAI_API_KEY is missing');
      return NextResponse.json(
        { error: 'The AI service is not configured. Please contact support.' },
        { status: 503 }
      );
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const conversationContext = body.conversationContext ?? ({} as ConversationContext);

    // Store user preferences in memory (non-blocking)
    const latestMessage = messages[messages.length - 1];
    if (latestMessage?.role === 'user') {
      memoryService.storeUserPreferences(
        userId,
        conversationContext,
        latestMessage.content
      );
    }

    // Retrieve user memories to enhance the conversation context (with timeout)
    const [userMemories, userProfile] = await Promise.all([
      withTimeout(memoryService.getUserMemories(userId), 2000, []),
      withTimeout(memoryService.getUserProfile(userId), 2000, {}),
    ]);

    const enhancedContext = {
      ...conversationContext,
      userMemories: userMemories.slice(0, 5), // Limit to 5 most relevant memories
      userProfile,
    };

    const systemPrompt = getLoganChatPrompt(enhancedContext);

    log.debug('Sending chat request to OpenAI for user', redact(userId));

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        ...messages,
      ],
      temperature: 0.8,
      max_tokens: 200,
    });

    const response = completion.choices[0]?.message?.content;

    if (!response) {
      log.error('No response content from OpenAI');
      return NextResponse.json(
        { error: 'Failed to generate response' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      message: response,
      readyForWorkout: conversationContext.hasEnoughInfo,
    });
  } catch (error) {
    log.error('Error in chat with Logan:', error instanceof Error ? error.message : error);

    if (error instanceof Error) {
      // The caller is not the one who is unauthorized - our server key is - so
      // these surface as dependency failures rather than a 401/429 that would
      // tell the user to go fix their own credentials.
      if (error.message.includes('401')) {
        return NextResponse.json(
          { error: 'The AI service rejected our credentials. Please contact support.' },
          { status: 502 }
        );
      }
      if (error.message.includes('429')) {
        return NextResponse.json(
          { error: 'Logan is a bit busy right now. Please wait a moment and try again.' },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to generate response. Please try again.' },
      { status: 500 }
    );
  }
}
