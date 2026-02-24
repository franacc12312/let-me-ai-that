import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const question = req.nextUrl.searchParams.get('q') ?? '';

  // Truncate very long questions for the image
  const displayQuestion =
    question.length > 120 ? question.slice(0, 117) + '...' : question;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#111827',
          padding: '60px',
        }}
      >
        {/* Title */}
        <div
          style={{
            display: 'flex',
            fontSize: 52,
            fontWeight: 700,
            background: 'linear-gradient(90deg, #60a5fa, #a78bfa)',
            backgroundClip: 'text',
            color: 'transparent',
            marginBottom: 40,
          }}
        >
          Let Me ChatGPT That For You
        </div>

        {/* Question bubble */}
        {displayQuestion && (
          <div
            style={{
              display: 'flex',
              backgroundColor: '#1f2937',
              borderRadius: 20,
              padding: '28px 40px',
              maxWidth: '90%',
              border: '2px solid #374151',
              marginBottom: 40,
            }}
          >
            <div
              style={{
                fontSize: 32,
                color: '#e5e7eb',
                textAlign: 'center',
                display: 'flex',
              }}
            >
              &ldquo;{displayQuestion}&rdquo;
            </div>
          </div>
        )}

        {/* Tagline */}
        <div
          style={{
            display: 'flex',
            fontSize: 24,
            color: '#9ca3af',
          }}
        >
          Because some questions deserve a little passive aggression
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
