import type { Metadata, Viewport } from 'next';
import { Manrope } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';
import SessionHeartbeat from '@/components/SessionHeartbeat';
import ReferralCapture from '@/components/ReferralCapture';

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
  weight: ['200', '300', '400', '500', '600', '700', '800'],
});

export const viewport: Viewport = {
  themeColor: '#14130F',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: 'Enid: MDCAT practice from past papers, mocks, and drills',
    template: '%s | Enid',
  },
  description:
    'Practice MDCAT MCQs from 2,500+ papers, mocks, and drills. Free, no signup, no ads. Enid+ adds personalised drill, mistake review, and full mock exams.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://enid.app'),
  applicationName: 'Enid',
  keywords: ['MDCAT', 'past papers', 'medical entry test', 'MCQ practice', 'Pakistan'],
  openGraph: {
    title: 'Enid: MDCAT practice from past papers, mocks, and drills',
    description: 'Practice MDCAT MCQs from 2,500+ papers, mocks, and drills. Free, no signup, no ads.',
    type: 'website',
    siteName: 'Enid',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Enid: MDCAT practice from past papers, mocks, and drills',
    description: 'Practice MDCAT MCQs from 2,500+ papers, mocks, and drills. Free, no signup, no ads.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={manrope.variable}>
      <body className="bg-coal text-coal-900 antialiased font-sans">
        {children}
        <SessionHeartbeat />
        <ReferralCapture />
        <Toaster
          position="bottom-right"
          theme="dark"
          toastOptions={{
            style: {
              background: '#1E1C17',
              color: '#F0EBDD',
              border: '1px solid #322F2A',
              borderRadius: '4px',
              fontSize: '14px',
            },
          }}
        />
      </body>
    </html>
  );
}
