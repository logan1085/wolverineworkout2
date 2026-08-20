import { NextRequest, NextResponse } from 'next/server';
import { parseJsonBody } from '@/lib/api-validation';
import { getAuthenticatedUser } from '@/lib/supabase-server';
import { log } from '@/lib/logger';

interface RealtimeSessionRequest {
  model?: string;
  voice?: string;
}

const DEFAULT_MODEL = 'gpt-4o-realtime-preview-2024-12-17';
const DEFAULT_VOICE = 'echo';

// The client used to be able to name any model or voice, which this route then
// billed to our key. Both are now allowlisted and anything else falls back to
// the default.
const ALLOWED_MODELS = new Set([DEFAULT_MODEL, 'gpt-4o-mini-realtime-preview-2024-12-17']);
const ALLOWED_VOICES = new Set(['alloy', 'ash', 'ballad', 'coral', 'echo', 'sage', 'shimmer', 'verse']);

export async function POST(request: NextRequest) {
  try {
    // A realtime session is billed per minute, so it requires a session cookie.
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { error: 'You must be signed in to use the voice coach.' },
        { status: 401 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      log.error('OPENAI_API_KEY is missing');
      return NextResponse.json(
        { error: 'The voice coach is not configured. Please contact support.' },
        { status: 503 }
      );
    }

    const parsed = await parseJsonBody<RealtimeSessionRequest>(request);
    if (!parsed.ok) {
      return parsed.response;
    }

    const requestedModel = parsed.data.model;
    const requestedVoice = parsed.data.voice;
    const model =
      typeof requestedModel === 'string' && ALLOWED_MODELS.has(requestedModel)
        ? requestedModel
        : DEFAULT_MODEL;
    const voice =
      typeof requestedVoice === 'string' && ALLOWED_VOICES.has(requestedVoice)
        ? requestedVoice
        : DEFAULT_VOICE;

    const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model, voice }),
    });

    if (!response.ok) {
      // Logged without the body: OpenAI error payloads can echo request detail,
      // and the status alone is enough to diagnose.
      log.error('OpenAI realtime session failed with status', response.status);
      // Reported as a gateway failure - forwarding OpenAI's status would tell
      // the caller *they* were unauthorized when it is our server key that failed.
      return NextResponse.json(
        { error: 'Could not start the voice coach. Please try again.' },
        { status: 502 }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    log.error(
      'Error creating realtime session:',
      error instanceof Error ? error.message : error
    );
    return NextResponse.json(
      { error: 'Could not start the voice coach. Please try again.' },
      { status: 500 }
    );
  }
}
