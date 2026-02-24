import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

// ---------------------------------------------------------------------------
// Rate limiting – sliding window per IP (in-memory, best-effort on serverless)
// ---------------------------------------------------------------------------
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 5;

const requestLog = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = requestLog.get(ip) ?? [];
  // Keep only timestamps within the window
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= RATE_LIMIT_MAX) {
    requestLog.set(ip, recent);
    return true;
  }
  recent.push(now);
  requestLog.set(ip, recent);
  return false;
}

// Periodic cleanup so the Map doesn't grow forever
setInterval(() => {
  const now = Date.now();
  for (const [ip, timestamps] of requestLog) {
    const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
    if (recent.length === 0) requestLog.delete(ip);
    else requestLog.set(ip, recent);
  }
}, RATE_LIMIT_WINDOW_MS);

// ---------------------------------------------------------------------------
// Anthropic client – lazy init so missing key gives a clear error
// ---------------------------------------------------------------------------
let _anthropic: Anthropic | null = null;

function getClient(): Anthropic {
  if (!_anthropic) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not configured');
    }
    _anthropic = new Anthropic({ apiKey });
  }
  return _anthropic;
}

// ---------------------------------------------------------------------------
// Input validation
// ---------------------------------------------------------------------------
const MAX_MESSAGE_LENGTH = 500;

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  // Rate limiting
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown';

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a minute before trying again.' },
      { status: 429 },
    );
  }

  try {
    // Parse & validate body
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const message =
      typeof body === 'object' && body !== null && 'message' in body
        ? (body as { message: unknown }).message
        : undefined;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message is required and must be a non-empty string' },
        { status: 400 },
      );
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        { error: `Message must be ${MAX_MESSAGE_LENGTH} characters or fewer` },
        { status: 400 },
      );
    }

    // Get Anthropic client (will throw if key missing)
    let client: Anthropic;
    try {
      client = getClient();
    } catch {
      return NextResponse.json(
        { error: 'AI service is not configured. Please set ANTHROPIC_API_KEY.' },
        { status: 503 },
      );
    }

    // Stream response
    const stream = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1000,
      messages: [{ role: 'user', content: message.trim() }],
      system: 'You are a helpful AI assistant. Answer questions concisely and helpfully.',
      stream: true,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (
              chunk.type === 'content_block_delta' &&
              chunk.delta.type === 'text_delta'
            ) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`),
              );
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        } catch (err) {
          // Send error event so the client knows something went wrong mid-stream
          const errorMsg =
            err instanceof Error ? err.message : 'Stream interrupted';
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: errorMsg })}\n\n`),
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error: unknown) {
    console.error('Chat API error:', error);

    // Handle Anthropic SDK errors
    if (error instanceof Anthropic.APIError) {
      if (error.status === 429) {
        return NextResponse.json(
          { error: 'AI service is temporarily overloaded. Please try again in a moment.' },
          { status: 429 },
        );
      }
      if (error.status === 401) {
        return NextResponse.json(
          { error: 'AI service authentication failed. Please check the API key.' },
          { status: 503 },
        );
      }
      // Billing / credit errors come as 400, deprecated models as 404
      if (error.status === 400 || error.status === 404) {
        const msg =
          (error.error as { error?: { message?: string } })?.error?.message ??
          'AI service request failed';
        return NextResponse.json({ error: msg }, { status: 502 });
      }
    }

    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 },
    );
  }
}
