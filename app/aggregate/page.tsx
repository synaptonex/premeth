'use client';

/**
 * MDCAT aggregate calculator.
 *
 * Uses the national MDCAT weighting: MDCAT 50%, FSc/HSSC 40%, Matric 10%.
 * Each input is entered as marks-obtained / total-marks, converted to a
 * percentage, then weighted. Adding another admitting body later is a matter
 * of adding an entry to WEIGHTINGS and a <select> — the math below does not
 * change.
 */

import { useRef, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

const WEIGHTINGS = {
  national: {
    label: 'National MDCAT (50 / 40 / 10)',
    mdcat: 0.5,
    fsc: 0.4,
    matric: 0.1,
  },
} as const;

type Field = { marks: string; total: string };
const blank: Field = { marks: '', total: '' };

function pct(f: Field): number | null {
  const m = parseFloat(f.marks);
  const t = parseFloat(f.total);
  if (!isFinite(m) || !isFinite(t) || t <= 0) return null;
  if (m < 0 || m > t) return null;
  return (m / t) * 100;
}

export default function AggregatePage() {
  const root = useRef<HTMLDivElement>(null);
  const [mdcat, setMdcat] = useState<Field>({ marks: '', total: '200' });
  const [fsc, setFsc] = useState<Field>({ marks: '', total: '1100' });
  const [matric, setMatric] = useState<Field>({ marks: '', total: '1100' });

  const w = WEIGHTINGS.national;
  const pM = pct(mdcat);
  const pF = pct(fsc);
  const pMat = pct(matric);

  const parts = [
    { key: 'MDCAT', pct: pM, weight: w.mdcat },
    { key: 'FSc / HSSC', pct: pF, weight: w.fsc },
    { key: 'Matric / SSC', pct: pMat, weight: w.matric },
  ];

  const allFilled = pM !== null && pF !== null && pMat !== null;
  const aggregate = allFilled
    ? pM! * w.mdcat + pF! * w.fsc + pMat! * w.matric
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
                  Enter your marks. This uses the national MDCAT weighting —
                  half the test, most of the rest from FSc, a tenth from
                  Matric. Nothing is saved or sent anywhere; the math runs in
                  your browser.
                </p>

                <div className="agg-card mt-12 grid lg:grid-cols-5 gap-6">
                  {/* Inputs */}
                  <div className="lg:col-span-3 space-y-4">
                    <ScoreRow
                      label="MDCAT score"
                      hint="Marks out of 200 on the entry test"
                      value={mdcat}
                      onChange={setMdcat}
                    />
                    <ScoreRow
                      label="FSc / HSSC"
                      hint="Your intermediate marks — both parts combined"
                      value={fsc}
                      onChange={setFsc}
                    />
                    <ScoreRow
                      label="Matric / SSC"
                      hint="Your matriculation marks"
                      value={matric}
                      onChange={setMatric}
                    />
                  </div>

                  {/* Result */}
                  <div className="lg:col-span-2">
                    <div className="rounded-xl border border-coal-rule bg-coal-50 p-6 h-full flex flex-col">
                      <div className="marginalia mb-4">Your aggregate</div>

                      <div className="text-5xl md:text-6xl font-light tracking-tighter tabular-nums text-coal-900">
                        {aggregate !== null
                          ? aggregate.toFixed(4)
                          : '—'}
                        {aggregate !== null && (
                          <span className="text-2xl text-coal-500">%</span>
                        )}
                      </div>

                      <div className="mt-6 pt-5 border-t border-coal-rule space-y-2.5 text-sm">
                        {parts.map((p) => (
                          <div
                            key={p.key}
                            className="flex items-baseline justify-between gap-3"
                          >
                            <span className="text-coal-600">
                              {p.key}
                              <span className="text-coal-500">
                                {' '}· {Math.round(p.weight * 100)}%
                              </span>
                            </span>
                            <span className="tabular-nums text-coal-900">
                              {p.pct !== null
                                ? (p.pct * p.weight).toFixed(3)
                                : '—'}
                            </span>
                          </div>
                        ))}
                      </div>

                      {!allFilled && (
                        <p className="mt-5 text-xs text-coal-500 leading-relaxed">
                          Fill in all three rows to see your weighted total.
                          Marks can't be higher than the total you set.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <p className="mt-8 text-xs text-coal-500 max-w-xl leading-relaxed">
                  Universities and admitting boards change their formulas year
                  to year. Treat this as a close estimate, not an admission
                  decision — always check the prospectus for the year you are
                  applying.
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
  const invalid =
    value.marks !== '' && value.total !== '' && p === null;

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
          Check these — marks can't exceed the total.
        </p>
      )}
    </div>
  );
}
