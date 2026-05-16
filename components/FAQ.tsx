'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const FAQS: { q: string; a: string }[] = [
  {
    q: 'Do I need to sign up?',
    a: 'No. Practice is fully open without an account. Sign up only if you want to save attempts, track weak topics, or upload an avatar.',
  },
  {
    q: 'Are there ads?',
    a: 'None. There never have been. Enid runs on a single small Vercel deploy and free-tier Supabase storage. No tracking pixels, no third-party scripts.',
  },
  {
    q: 'How many questions does Enid have?',
    a: 'Around 400,000 MCQs across 2,500+ papers, spread over 31 categories. The catalog covers UHS, NUMS, ETEA, DUHS, SZABMU, KMU, AKU, FMDC, PMC, and FSc board.',
  },
  {
    q: 'A question is wrong. What do I do?',
    a: 'Hit the flag icon on the question. Tell us what the answer should be and why. Paste a source if you have one. We check every report, and the fix shows up the next time the data updates.',
  },
  {
    q: 'How do I reach the team?',
    a: 'Email syncrasy26@gmail.com or message +92 334 5121203 on WhatsApp. Both go straight to us.',
  },
  {
    q: 'Where do the past papers come from?',
    a: 'Students compiled them: 2,500+ papers from publicly circulated PDFs and official board releases, transcribed and checked by hand.',
  },
  {
    q: 'Does it cover the 2026 syllabus?',
    a: 'Yes. The 64 chapter pages map 1:1 to the PMDC 2026 MDCAT syllabus: Biology 81, Chemistry 45, Physics 36, English 9, Logical Reasoning 9.',
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="relative mx-auto max-w-3xl px-5 py-24">
      <h2 className="font-display text-4xl md:text-5xl text-coal-900 tracking-tight mb-8">
        Frequently asked questions.
      </h2>

      <div className="divide-y divide-coal-rule border-t border-b border-coal-rule">
        {FAQS.map((item, i) => {
          const isOpen = open === i;
          return (
            <div key={item.q}>
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                className="w-full flex items-center justify-between py-5 text-left group"
                aria-expanded={isOpen}
              >
                <span className="font-medium text-coal-900 pr-6 group-hover:text-accent tx-color">
                  {item.q}
                </span>
                <ChevronDown
                  className={`h-4 w-4 text-coal-600 shrink-0`}
                  style={{
                    transition: 'transform 200ms var(--ease-out)',
                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  }}
                />
              </button>
              <div
                style={{
                  display: 'grid',
                  gridTemplateRows: isOpen ? '1fr' : '0fr',
                  transition: 'grid-template-rows 280ms var(--ease-out)',
                }}
              >
                <div className="overflow-hidden">
                  <p className="pb-5 pr-8 text-coal-600 leading-relaxed">{item.a}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
