'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

// Grouped FAQs. The home-page FAQ component shows a short version; this
// page covers the same ground plus everything we get asked over WhatsApp.
const SECTIONS: { title: string; items: { q: string; a: string }[] }[] = [
  {
    title: 'Getting started',
    items: [
      {
        q: 'Do I need to sign up?',
        a: 'No. Practice is fully open without an account. Sign up only if you want to save attempts, track weak topics, see your streak, or use the Mistake Vault.',
      },
      {
        q: 'How do I use Enid on my phone?',
        a: 'Open it in your browser. There is also an "Add to home screen" prompt that puts an Enid icon on your phone like a normal app. After installing, it opens without the browser bar.',
      },
      {
        q: 'Is there a mobile app on the Play Store or App Store?',
        a: 'Not yet. The website works on phones, and the add-to-home-screen option gives you an app-like experience. A native app is on the roadmap.',
      },
    ],
  },
  {
    title: 'The content',
    items: [
      {
        q: 'How many questions does Enid have?',
        a: 'Around 280,000+ MCQs across 2,500+ papers, mocks, and drills, spread over 31 categories. The catalog covers UHS, NUMS, ETEA, DUHS, SZABMU, KMU, AKU, FMDC, PMC, and FSc board.',
      },
      {
        q: 'Where do the questions come from?',
        a: 'Students compiled them over years: past papers from publicly circulated PDFs and official board releases, plus mocks and topical drills made by senior students and tutors. Everything is transcribed and checked by hand.',
      },
      {
        q: 'Does Enid cover the latest MDCAT syllabus?',
        a: 'Yes. The chapter pages map directly to the PMDC 2026 MDCAT syllabus: Biology 81, Chemistry 45, Physics 36, English 9, Logical Reasoning 9.',
      },
      {
        q: 'A question is wrong. What do I do?',
        a: 'Hit the flag icon on the question. Tell us what the answer should be and why, and paste a source if you have one. We check every report personally. Fixes go live the next time the data updates.',
      },
      {
        q: 'Why are some questions missing diagrams?',
        a: 'Past papers from older years sometimes have diagrams we could not reliably capture. We removed questions that strictly require a missing diagram so you do not waste time on unanswerable ones. If you find one we missed, hit the flag.',
      },
    ],
  },
  {
    title: 'Enid+',
    items: [
      {
        q: 'What does Enid+ add over the free version?',
        a: 'Free covers all practice plus one Daily Drill per day. Enid+ unlocks unlimited Daily Drills, the full Mistake Vault with spaced repetition, full mock exams, the goal tracker, and CSV export of your attempts. Streaks stay free for everyone.',
      },
      {
        q: 'How much does Enid+ cost?',
        a: 'Founders tier is 999 PKR for six months. The regular price will be higher once the founders window closes. One subscription, no auto-renew, no hidden fees.',
      },
      {
        q: 'How do I pay?',
        a: 'JazzCash or EasyPaisa. Send the amount to the number shown on the pricing page, then come back to Enid and enter your transaction ID and the phone you sent from. We verify and activate Enid+ on your account within 24 to 48 hours.',
      },
      {
        q: 'I paid but Enid+ is not activated yet.',
        a: 'Verification takes up to 48 hours. If it has been longer, message us on WhatsApp at +92 334 5121203 with the email you signed up with and the transaction ID. We will sort it.',
      },
      {
        q: 'Can I share my Enid+ with a friend?',
        a: 'Each account allows one active session, and the system flags accounts logging in from many devices. Sharing leads to people getting kicked out mid-study, so it is not worth it. If you want to gift Enid+ to someone, message us.',
      },
    ],
  },
  {
    title: 'About us',
    items: [
      {
        q: 'Who runs Enid?',
        a: 'Dr. Shahbaz Waseem Gul and Dr. Sharjeel Waseem Gul, two brothers who did MBBS in Pakistan and went on to USMLE in the United States. We built Enid because we sat for these exams ourselves and remember exactly what was broken about MDCAT prep.',
      },
      {
        q: 'Are there ads?',
        a: 'None, and there never will be. No tracking pixels, no third-party scripts. Enid runs on a single small Vercel deploy and Supabase storage.',
      },
      {
        q: 'How do I reach you?',
        a: 'Email syncrasy26@gmail.com or message +92 334 5121203 on WhatsApp. Both go straight to us.',
      },
    ],
  },
];

export default function FAQPage() {
  return (
    <>
      <Navbar />
      <main>
        <section className="mx-auto max-w-3xl px-5 py-16 md:py-24">
          <p className="marginalia mb-6">FAQ</p>
          <h1 className="font-display text-4xl md:text-5xl text-coal-900 tracking-tight mb-4">
            Questions we get asked.
          </h1>
          <p className="text-coal-600 mb-10 max-w-xl leading-relaxed">
            If something is not answered here, message us on WhatsApp at{' '}
            <a href="https://wa.me/923345121203" className="link-draw text-coal-900">
              +92 334 5121203
            </a>{' '}
            or email{' '}
            <a href="mailto:syncrasy26@gmail.com" className="link-draw text-coal-900">
              syncrasy26@gmail.com
            </a>
            . Both go to us directly.
          </p>

          {SECTIONS.map((section) => (
            <FAQSection key={section.title} title={section.title} items={section.items} />
          ))}

          <div className="mt-12 pt-8 border-t border-coal-rule">
            <p className="text-coal-600 text-sm">
              Still stuck?{' '}
              <Link href="/exams" className="link-draw text-coal-900">
                Browse papers
              </Link>{' '}
              or{' '}
              <Link href="/pathways" className="link-draw text-coal-900">
                see what comes after MDCAT
              </Link>
              .
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

function FAQSection({
  title,
  items,
}: {
  title: string;
  items: { q: string; a: string }[];
}) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  return (
    <div className="mb-10">
      <h2 className="marginalia mb-3">{title}</h2>
      <div className="divide-y divide-coal-rule border-t border-b border-coal-rule">
        {items.map((item, i) => {
          const isOpen = openIdx === i;
          return (
            <div key={item.q}>
              <button
                onClick={() => setOpenIdx(isOpen ? null : i)}
                className="w-full flex items-center justify-between py-5 text-left group"
                aria-expanded={isOpen}
              >
                <span className="text-lg text-coal-900 group-hover:text-accent tx-color pr-4">
                  {item.q}
                </span>
                <ChevronDown
                  className={`h-5 w-5 text-coal-500 shrink-0 transition-transform ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {isOpen && (
                <p className="pb-5 pr-8 text-coal-700 leading-relaxed">{item.a}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
