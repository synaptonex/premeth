import type { Metadata, Viewport } from 'next';
import { Manrope } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';
import SessionHeartbeat from '@/components/SessionHeartbeat';

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
  weight: ['200', '300', '400', '500', '600', '700', '800'],
});

export const viewport: Viewport = {
  themeColor: '#F7F7F4',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'Premeth — MDCAT practice from past papers',
  description:
    'Practice MDCAT MCQs from 2,500 past papers. Free, no signup, no ads. Premeth+ adds personalised drill, mistake review, and full mock exams.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://premeth.com'),
  openGraph: {
    title: 'Premeth — MDCAT practice from past papers',
    description: 'Practice MDCAT MCQs from 2,500 past papers.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={manrope.variable}>
      <body className="bg-bone text-bone-900 antialiased font-sans">
        {children}
        <SessionHeartbeat />
        <Toaster
          position="bottom-right"
          theme="light"
          toastOptions={{
            style: {
              background: '#FBFBF9',
              color: '#1A1A18',
              border: '1px solid #E0E0D8',
              borderRadius: '4px',
              fontSize: '14px',
            },
          }}
        />
      </body>
    </html>
  );
}
