import type { Metadata } from 'next';
import ChatApp from './ChatApp';

interface PageProps {
  searchParams: { q?: string };
}

export async function generateMetadata({
  searchParams,
}: PageProps): Promise<Metadata> {
  const question = searchParams.q;

  if (!question) {
    // Static fallback (layout.tsx also has defaults)
    return {};
  }

  const decoded = decodeURIComponent(question);
  const title = `"${decoded}" — Let Me ChatGPT That For You`;
  const description = `Someone thought this needed ChatGPT: "${decoded}"`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      images: [
        {
          url: `/api/og?q=${encodeURIComponent(decoded)}`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`/api/og?q=${encodeURIComponent(decoded)}`],
    },
  };
}

export default function Home() {
  return <ChatApp />;
}
