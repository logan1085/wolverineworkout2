import { NextRequest, NextResponse } from 'next/server';
import { parseJsonBody } from '@/lib/api-validation';

interface RealtimeSessionRequest {
  model?: string;
  voice?: string;
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const parsed = await parseJsonBody<RealtimeSessionRequest>(request);
    if (!parsed.ok) {
      return parsed.response;
    }
    const { model = 'gpt-4o-realtime-preview-2024-12-17', voice = 'echo' } = parsed.data;

    const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        voice
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      // Report as a gateway failure - forwarding OpenAI's status would tell the
      // caller *they* were unauthorized when it is our server key that failed.
      return NextResponse.json(
        { error: 'Failed to create realtime session', upstreamStatus: response.status },
        { status: 502 }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error creating realtime session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 