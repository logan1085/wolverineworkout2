import { NextRequest, NextResponse } from 'next/server';

type ParseResult<T> =
  | { ok: true; data: T }
  | { ok: false; response: NextResponse };

/**
 * Read and JSON-parse a request body.
 *
 * A malformed or absent body is a client error, so it comes back as a 400
 * instead of falling through to the route's catch block as a 500.
 */
export async function parseJsonBody<T>(request: NextRequest): Promise<ParseResult<T>> {
  let data: unknown;

  try {
    data = await request.json();
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      ),
    };
  }

  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Request body must be a JSON object' },
        { status: 400 }
      ),
    };
  }

  return { ok: true, data: data as T };
}

/**
 * Names of the given fields that are absent from the body. An empty array is
 * left alone - `equipment: []` legitimately means "bodyweight only".
 */
export function missingFields(
  body: Record<string, unknown>,
  fields: string[]
): string[] {
  return fields.filter((field) => {
    const value = body[field];
    return value === undefined || value === null || value === '';
  });
}

/** 400 response naming the fields a request left out. */
export function missingFieldsResponse(missing: string[]): NextResponse {
  return NextResponse.json(
    { error: `Missing required fields: ${missing.join(', ')}` },
    { status: 400 }
  );
}
