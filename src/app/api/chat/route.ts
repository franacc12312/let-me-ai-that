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
// Input validation & origin check
// ---------------------------------------------------------------------------
const MAX_MESSAGE_LENGTH = 500;

// ---------------------------------------------------------------------------
// Content filter — reject obviously harmful queries before they hit the API
// ---------------------------------------------------------------------------
const BLOCKED_PATTERNS = [
  // Violence / harm
  /how to (make|build|create|construct|assemble) .*(bomb|explosive|weapon|poison|drug|meth)/i,
  /how to (kill|murder|assassinate|hurt|harm|attack|torture)/i,
  /how to (hack|ddos|dos|exploit|breach|crack) /i,
  // CSAM / exploitation
  /child\s*(porn|sex|abuse|exploit)/i,
  /\b(csam|cp)\b/i,
  /underage/i,
  // Self-harm
  /how to (commit suicide|kill myself|end my life)/i,
  // Illegal activity
  /how to (rob|steal from|break into|smuggle)/i,
  /how to (forge|counterfeit|launder)/i,
  // Doxxing / harassment
  /find.*(address|phone|ssn|social security)/i,
];

function isBlockedContent(message: string): boolean {
  return BLOCKED_PATTERNS.some((pattern) => pattern.test(message));
}

const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : null; // null = allow all (dev mode)

function isOriginAllowed(req: NextRequest): boolean {
  if (!ALLOWED_ORIGINS) return true; // not configured = allow all
  const origin = req.headers.get('origin') ?? '';
  const referer = req.headers.get('referer') ?? '';
  return ALLOWED_ORIGINS.some(
    (allowed) => origin.includes(allowed) || referer.includes(allowed),
  );
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  // Origin check — block external API calls in prod
  if (!isOriginAllowed(req)) {
    return NextResponse.json(
      { error: 'Forbidden' },
      { status: 403 },
    );
  }

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

    // Content filter — block before it reaches Anthropic
    if (isBlockedContent(message)) {
      return NextResponse.json(
        { error: 'This question cannot be answered.' },
        { status: 400 },
      );
    }

    // Get Anthropic client (will throw if key missing)
    let client: Anthropic;
    try {
      client = getClient();
    } catch {
      return NextResponse.json(
        { error: 'AI service is not configured.' },
        { status: 503 },
      );
    }

    // Stream response
    const stream = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1000,
      messages: [{ role: 'user', content: message.trim() }],
      system: 'You are a helpful AI assistant on a public website. Answer questions concisely and helpfully. Refuse to answer questions about: making weapons/explosives/drugs, harming people or animals, illegal activities, hacking/exploiting systems, finding personal information about real people, or any content involving minors in harmful contexts. For refused queries, respond with a single short sentence declining.',
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

    if (error instanceof Anthropic.APIError) {
      if (error.status === 429) {
        return NextResponse.json(
          { error: 'AI service is temporarily overloaded. Please try again in a moment.' },
          { status: 429 },
        );
      }
      if (error.status === 401) {
        return NextResponse.json(
          { error: 'AI service authentication failed.' },
          { status: 503 },
        );
      }
      if (error.status === 400 || error.status === 404) {
        return NextResponse.json(
          { error: 'AI service request failed' },
          { status: 502 },
        );
      }
    }

    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 },
    );
  }
}
