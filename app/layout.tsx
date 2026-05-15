import type { Metadata, Viewport } from 'next';
import { Inter, Fraunces } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';
import SessionHeartbeat from '@/components/SessionHeartbeat';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

// Fraunces is a literary, slightly playful serif — picked because the original
// Premeth brand voice is warm and a bit irreverent ("Ensuring premed students
// stay premeth"). A grotesque sans would have flattened that voice.
const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  axes: ['SOFT', 'WONK', 'opsz'],
});

export const viewport: Viewport = {
  themeColor: '#0a0a0a',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'Premeth — Free MDCAT Prep, Past Papers & Practice MCQs',
  description:
    "Pakistan's free MDCAT preparation platform. 400,000+ MCQs from 2,500+ past papers across 31 categories. Free aggregate calculator, syllabus guide, study plans.",
  keywords: [
    'MDCAT', 'MDCAT 2026', 'MDCAT preparation', 'free MDCAT', 'past papers',
    'NUMS', 'AKU', 'ETEA', 'PMC', 'medical entrance exam Pakistan',
  ],
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://premeth.com'),
  openGraph: {
    title: 'Premeth — Free MDCAT Prep',
    description: 'Practice 400,000+ MCQs from 2,500+ past papers. Now with diagrams, accounts, and question reporting.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`}>
      <body className="bg-ink-950 text-paper antialiased font-sans">
        {children}
        {/* SessionHeartbeat enforces single-session-per-account for paid users
            and logs login fingerprints. It's a no-op for signed-out users. */}
        <SessionHeartbeat />
        <Toaster
          position="bottom-right"
          theme="dark"
          toastOptions={{
            style: {
              background: '#18181b',
              color: '#f7f3ec',
              border: '1px solid #27272a',
            },
          }}
        />
      </body>
    </html>
  );
}
