'use client';

/**
 * Aggregate calculator.
 *
 * Two admitting bodies, two weightings:
 *   NUMS / PMDC  - Matric 10, FSc 40, Exam 50
 *   AKU          - FSc 30, Exam 70 (Matric not counted)
 *
 * Each input is marks-obtained / total, turned into a percentage, then
 * weighted. To add another body later, add an entry to BOARDS.
 */

import { useRef, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

type BoardKey = 'nums_pmdc' | 'aku';

interface Board {
  key: BoardKey;
  label: string;
  blurb: string;
  matric: number;
  fsc: number;
  exam: number;
}

const BOARDS: Board[] = [
  {
    key: 'nums_pmdc',
    label: 'NUMS and PMDC',
    blurb: 'Matric 10 percent, FSc 40 percent, entry test 50 percent.',
    matric: 0.1,
    fsc: 0.4,
    exam: 0.5,
  },
  {
    key: 'aku',
    label: 'AKU',
    blurb: 'FSc 30 percent, entry test 70 percent. Matric is not counted.',
    matric: 0,
    fsc: 0.3,
    exam: 0.7,
  },
];

type Field = { marks: string; total: string };

function pct(f: Field): number | null {
  const m = parseFloat(f.marks);
  const t = parseFloat(f.total);
  if (!isFinite(m) || !isFinite(t) || t <= 0) return null;
  if (m < 0 || m > t) return null;
  return (m / t) * 100;
}

export default function AggregatePage() {
  const root = useRef<HTMLDivElement>(null);
  const [boardKey, setBoardKey] = useState<BoardKey>('nums_pmdc');
  const [exam, setExam] = useState<Field>({ marks: '', total: '200' });
  const [fsc, setFsc] = useState<Field>({ marks: '', total: '1100' });
  const [matric, setMatric] = useState<Field>({ marks: '', total: '1100' });

  const board = BOARDS.find((b) => b.key === boardKey)!;
  const usesMatric = board.matric > 0;

  const pExam = pct(exam);
  const pFsc = pct(fsc);
  const pMatric = pct(matric);

  const rows = [
    { key: 'Entry test', pct: pExam, weight: board.exam, used: true },
    { key: 'FSc / HSSC', pct: pFsc, weight: board.fsc, used: true },
    { key: 'Matric / SSC', pct: pMatric, weight: board.matric, used: usesMatric },
  ];

  const needed = usesMatric
    ? pExam !== null && pFsc !== null && pMatric !== null
    : pExam !== null && pFsc !== null;

  const aggregate = needed
    ? pExam! * board.exam +
      pFsc! * board.fsc +
      (usesMatric ? pMatric! * board.matric : 0)
    : null;

  useGSAP(
    () => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.from('.agg-eyebrow', { y: 12, autoAlpha: 0, duration: 0.4 })
        .from('.agg-title', { y: 24, autoAlpha: 0, duration: 0.6 }, '-=0.2')
        .from('.agg-card', { y: 16, autoAlpha: 0, duration: 0.5 }, '-=0.3');
    },
    { scope: root }
  );

  return (
    <>
      <Navbar />
      <main ref={root}>
        <section className="border-t border-coal-rule">
          <div className="mx-auto max-w-6xl px-6 md:px-10 py-20 md:py-28">
            <div className="grid grid-cols-12 gap-6">
              <div className="hidden md:block col-span-1 marginalia pt-2">
                01 / Aggregate
              </div>

              <div className="col-span-12 md:col-span-11">
                <span className="agg-eyebrow text-xs uppercase tracking-widest text-accent">
                  Aggregate calculator
                </span>
                <h1 className="agg-title text-4xl md:text-6xl font-light tracking-tighter text-coal-900 max-w-2xl leading-[1.05] mt-3">
                  Work out your merit
                  <br />
                  <span className="text-coal-500">before results day.</span>
                </h1>
                <p className="mt-6 text-coal-600 leading-relaxed max-w-xl">
                  Pick your admitting body, put in your marks, and you get the
                  aggregate they will. Nothing is saved or sent anywhere. The
                  math runs in your browser.
                </p>

                {/* Board picker */}
                <div className="agg-card mt-10 flex flex-wrap gap-3">
                  {BOARDS.map((b) => {
                    const active = b.key === boardKey;
                    return (
                      <button
                        key={b.key}
                        onClick={() => setBoardKey(b.key)}
                        className={`press text-left rounded-xl border p-4 flex-1 min-w-[240px] tx-color ${
                          active
                            ? 'border-accent/50 bg-accent/10'
                            : 'border-coal-rule bg-coal-50/40 hover:border-coal-400'
                        }`}
                      >
                        <div
                          className={`font-medium ${
                            active ? 'text-coal-900' : 'text-coal-700'
                          }`}
                        >
                          {b.label}
                        </div>
                        <div className="text-sm text-coal-500 mt-1">
                          {b.blurb}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-6 grid lg:grid-cols-5 gap-6">
                  {/* Inputs */}
                  <div className="lg:col-span-3 space-y-4">
                    <ScoreRow
                      label="Entry test score"
                      hint="Marks on the MDCAT or admission test"
                      value={exam}
                      onChange={setExam}
                    />
                    <ScoreRow
                      label="FSc / HSSC"
                      hint="Your intermediate marks, both parts combined"
                      value={fsc}
                      onChange={setFsc}
                    />
                    {usesMatric ? (
                      <ScoreRow
                        label="Matric / SSC"
                        hint="Your matriculation marks"
                        value={matric}
                        onChange={setMatric}
                      />
                    ) : (
                      <div className="rounded-xl border border-coal-rule border-dashed bg-coal-50/20 p-5 text-sm text-coal-500">
                        {board.label} does not count Matric marks, so you can
                        leave it out.
                      </div>
                    )}
                  </div>

                  {/* Result */}
                  <div className="lg:col-span-2">
                    <div className="rounded-xl border border-coal-rule bg-coal-50 p-6 h-full flex flex-col">
                      <div className="marginalia mb-4">
                        Your aggregate · {board.label}
                      </div>

                      <div className="text-5xl md:text-6xl font-light tracking-tighter tabular-nums text-coal-900">
                        {aggregate !== null ? aggregate.toFixed(4) : '0.0000'}
                        <span className="text-2xl text-coal-500">%</span>
                      </div>

                      <div className="mt-6 pt-5 border-t border-coal-rule space-y-2.5 text-sm">
                        {rows
                          .filter((r) => r.used)
                          .map((r) => (
                            <div
                              key={r.key}
                              className="flex items-baseline justify-between gap-3"
                            >
                              <span className="text-coal-600">
                                {r.key}
                                <span className="text-coal-500">
                                  {' '}
                                  · {Math.round(r.weight * 100)}%
                                </span>
                              </span>
                              <span className="tabular-nums text-coal-900">
                                {r.pct !== null
                                  ? (r.pct * r.weight).toFixed(3)
                                  : '0.000'}
                              </span>
                            </div>
                          ))}
                      </div>

                      {!needed && (
                        <p className="mt-5 text-xs text-coal-500 leading-relaxed">
                          Fill in every row to see your weighted total. Marks
                          cannot be higher than the total you set.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <p className="mt-8 text-xs text-coal-500 max-w-xl leading-relaxed">
                  Admitting bodies change their formulas from year to year.
                  Treat this as a close estimate, not an admission decision.
                  Always check the prospectus for the year you are applying.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

function ScoreRow({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: Field;
  onChange: (f: Field) => void;
}) {
  const p = pct(value);
  const invalid = value.marks !== '' && value.total !== '' && p === null;

  return (
    <div className="rounded-xl border border-coal-rule bg-coal-50/40 p-5">
      <div className="flex items-baseline justify-between mb-1">
        <label className="text-coal-900 font-medium">{label}</label>
        <span className="text-sm tabular-nums text-coal-500">
          {p !== null ? `${p.toFixed(2)}%` : ''}
        </span>
      </div>
      <p className="text-xs text-coal-500 mb-3">{hint}</p>
      <div className="flex items-center gap-3">
        <input
          type="number"
          inputMode="numeric"
          placeholder="Marks"
          value={value.marks}
          onChange={(e) => onChange({ ...value, marks: e.target.value })}
          className="w-full px-3 py-2 rounded-md bg-coal-50 border border-coal-rule text-coal-900 placeholder:text-coal-500 focus:border-accent focus:outline-none tx-color"
        />
        <span className="text-coal-500 shrink-0">out of</span>
        <input
          type="number"
          inputMode="numeric"
          placeholder="Total"
          value={value.total}
          onChange={(e) => onChange({ ...value, total: e.target.value })}
          className="w-full px-3 py-2 rounded-md bg-coal-50 border border-coal-rule text-coal-900 placeholder:text-coal-500 focus:border-accent focus:outline-none tx-color"
        />
      </div>
      {invalid && (
        <p className="mt-2 text-xs text-crimson">
          Check these. Marks cannot be more than the total.
        </p>
      )}
    </div>
  );
}
