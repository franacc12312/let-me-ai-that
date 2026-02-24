import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Suspense } from 'react';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Let Me ChatGPT That For You',
  description: 'For all those questions that could have been asked to ChatGPT directly',
  keywords: ['ChatGPT', 'AI', 'assistant', 'questions', 'search', 'LMGPTTFY'],
  openGraph: {
    title: 'Let Me ChatGPT That For You',
    description: 'For all those questions that could have been asked to ChatGPT directly',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Let Me ChatGPT That For You',
    description: 'For all those questions that could have been asked to ChatGPT directly',
  },
};

function SearchParamsWrapper({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-white">Loading...</div>
    </div>}>
      {children}
    </Suspense>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} antialiased bg-gray-900 text-white`}>
        <SearchParamsWrapper>
          {children}
        </SearchParamsWrapper>
      </body>
    </html>
  );
}