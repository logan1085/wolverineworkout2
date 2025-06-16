import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function GET() {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Simple test call
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: "Say 'Hello, API is working!'"
        }
      ],
      max_tokens: 10,
    });

    const response = completion.choices[0]?.message?.content;

    return NextResponse.json({
      success: true,
      message: 'OpenAI API is working!',
      response: response
    });
  } catch (error) {
    console.error('OpenAI test error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('401')) {
        return NextResponse.json(
          { error: 'Invalid API key - 401 Unauthorized' },
          { status: 500 }
        );
      }
      if (error.message.includes('429')) {
        return NextResponse.json(
          { error: 'Rate limit exceeded - 429' },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'OpenAI API test failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 