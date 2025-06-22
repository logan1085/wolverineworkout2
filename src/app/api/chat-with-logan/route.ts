import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getLoganChatPrompt, type ConversationContext } from '@/prompts';
import { memoryService } from '@/lib/memory';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  conversationContext: ConversationContext;
  userId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    
    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY is missing');
      return NextResponse.json(
        { error: 'OpenAI API key not configured. Please check your .env.local file.' },
        { status: 500 }
      );
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Get user ID (use a default for now, in real app this would come from auth)
    const userId = body.userId || 'default_user';
    
    // Get the latest user message for memory processing
    const latestMessage = body.messages[body.messages.length - 1];
    
    // Store user preferences in memory (non-blocking)
    if (latestMessage?.role === 'user') {
      memoryService.storeUserPreferences(
        userId, 
        body.conversationContext, 
        latestMessage.content
      );
    }
    
    // Retrieve user memories to enhance the conversation context (with timeout)
    const [userMemories, userProfile] = await Promise.all([
      Promise.race([
        memoryService.getUserMemories(userId),
        new Promise(resolve => setTimeout(() => resolve([]), 2000)) // 2s timeout
      ]),
      Promise.race([
        memoryService.getUserProfile(userId),
        new Promise(resolve => setTimeout(() => resolve({}), 2000)) // 2s timeout
      ])
    ]);
    
    // Enhance conversation context with memories
    const enhancedContext = {
      ...body.conversationContext,
      userMemories: userMemories.slice(0, 5), // Limit to 5 most relevant memories
      userProfile
    };

    // Get the system prompt from our organized prompts
    const systemPrompt = getLoganChatPrompt(enhancedContext);

    console.log('Sending chat request to OpenAI...');
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        ...body.messages
      ],
      temperature: 0.8,
      max_tokens: 200,
    });

    const response = completion.choices[0]?.message?.content;
    
    if (!response) {
      console.error('No response content from OpenAI');
      return NextResponse.json(
        { error: 'Failed to generate response' },
        { status: 500 }
      );
    }

    console.log('Logan response generated:', response);

    return NextResponse.json({ 
      message: response,
      readyForWorkout: body.conversationContext.hasEnoughInfo 
    });

  } catch (error) {
    console.error('Error in chat with Logan:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('401')) {
        return NextResponse.json(
          { error: 'Invalid OpenAI API key. Please check your API key.' },
          { status: 500 }
        );
      }
      if (error.message.includes('429')) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please wait a moment and try again.' },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to generate response. Please try again.' },
      { status: 500 }
    );
  }
} 