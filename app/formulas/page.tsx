'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

// MDCAT formula sheet, grouped by subject. These are the equations students
// reach for most often during practice. Not exhaustive, deliberately. If you
// find one missing that you wanted, hit the flag on any question and tell
// us. We add the most-requested ones each update.
//
// Formulas are rendered as plain text with sub/sup tags rather than KaTeX
// because every dependency you add slows the app on the cheap Android phones
// our students use. Plain text loads instantly.

interface Formula {
  name: string;
  expr: React.ReactNode;
  // Optional short usage hint, kept brief on purpose.
  note?: string;
}

interface Section {
  title: string;
  formulas: Formula[];
}

const PHYSICS: Section[] = [
  {
    title: 'Kinematics',
    formulas: [
      { name: 'Velocity', expr: <>v = u + at</> },
      { name: 'Displacement', expr: <>s = ut + ½at²</> },
      { name: 'Velocity squared', expr: <>v² = u² + 2as</> },
      { name: 'Average velocity', expr: <>v<sub>avg</sub> = (u + v) / 2</> },
      { name: 'Projectile range', expr: <>R = (u² sin 2θ) / g</>, note: 'Max range at θ = 45°.' },
      { name: 'Max height (projectile)', expr: <>H = (u² sin²θ) / 2g</> },
      { name: 'Time of flight', expr: <>T = (2u sinθ) / g</> },
    ],
  },
  {
    title: 'Dynamics',
    formulas: [
      { name: 'Newton II', expr: <>F = ma</> },
      { name: 'Weight', expr: <>W = mg</> },
      { name: 'Friction', expr: <>f = μN</> },
      { name: 'Momentum', expr: <>p = mv</> },
      { name: 'Impulse', expr: <>J = FΔt = Δp</> },
      { name: 'Centripetal force', expr: <>F<sub>c</sub> = mv² / r = mω²r</> },
    ],
  },
  {
    title: 'Work, energy, power',
    formulas: [
      { name: 'Work', expr: <>W = Fs cosθ</> },
      { name: 'Kinetic energy', expr: <>KE = ½mv²</> },
      { name: 'Gravitational PE', expr: <>PE = mgh</> },
      { name: 'Elastic PE', expr: <>PE = ½kx²</> },
      { name: 'Power', expr: <>P = W / t = Fv</> },
      { name: 'Efficiency', expr: <>η = (useful output / total input) × 100%</> },
    ],
  },
  {
    title: 'Circular motion & gravitation',
    formulas: [
      { name: 'Angular velocity', expr: <>ω = 2π / T = 2πf</> },
      { name: 'Linear ↔ angular', expr: <>v = rω</> },
      { name: 'Centripetal accel', expr: <>a<sub>c</sub> = v² / r = ω²r</> },
      { name: 'Newton gravity', expr: <>F = Gm₁m₂ / r²</>, note: 'G = 6.674 × 10⁻¹¹ N·m²/kg²' },
      { name: 'Orbital velocity', expr: <>v = √(GM / r)</> },
      { name: 'Escape velocity', expr: <>v<sub>e</sub> = √(2GM / R)</> },
    ],
  },
  {
    title: 'Waves & sound',
    formulas: [
      { name: 'Wave speed', expr: <>v = fλ</> },
      { name: 'Period & frequency', expr: <>T = 1 / f</> },
      { name: 'SHM displacement', expr: <>x = A sin(ωt)</> },
      { name: 'SHM period (spring)', expr: <>T = 2π√(m/k)</> },
      { name: 'SHM period (pendulum)', expr: <>T = 2π√(L/g)</> },
      { name: 'Doppler effect', expr: <>f' = f (v ± v<sub>o</sub>) / (v ∓ v<sub>s</sub>)</> },
    ],
  },
  {
    title: 'Heat & thermodynamics',
    formulas: [
      { name: 'Heat capacity', expr: <>Q = mcΔT</> },
      { name: 'Latent heat', expr: <>Q = mL</> },
      { name: 'Ideal gas', expr: <>PV = nRT</>, note: 'R = 8.314 J/mol·K' },
      { name: 'First law', expr: <>ΔU = Q − W</> },
      { name: 'Linear expansion', expr: <>ΔL = αL₀ΔT</> },
    ],
  },
  {
    title: 'Electricity & magnetism',
    formulas: [
      { name: "Coulomb's law", expr: <>F = kq₁q₂ / r²</>, note: 'k = 8.99 × 10⁹ N·m²/C²' },
      { name: 'Electric field', expr: <>E = F / q = kQ / r²</> },
      { name: "Ohm's law", expr: <>V = IR</> },
      { name: 'Electric power', expr: <>P = VI = I²R = V² / R</> },
      { name: 'Resistors in series', expr: <>R = R₁ + R₂ + …</> },
      { name: 'Resistors in parallel', expr: <>1/R = 1/R₁ + 1/R₂ + …</> },
      { name: 'Capacitance', expr: <>C = Q / V</> },
      { name: 'Magnetic force (wire)', expr: <>F = BIL sinθ</> },
      { name: 'Magnetic force (charge)', expr: <>F = qvB sinθ</> },
      { name: 'Induced EMF', expr: <>ε = −N dΦ/dt</> },
    ],
  },
  {
    title: 'Optics & modern physics',
    formulas: [
      { name: 'Snell', expr: <>n₁ sinθ₁ = n₂ sinθ₂</> },
      { name: 'Critical angle', expr: <>sinθ<sub>c</sub> = n₂ / n₁</> },
      { name: 'Lens equation', expr: <>1/f = 1/v − 1/u</> },
      { name: 'Magnification', expr: <>m = v / u = h<sub>i</sub> / h<sub>o</sub></> },
      { name: 'Photon energy', expr: <>E = hf = hc / λ</>, note: 'h = 6.63 × 10⁻³⁴ J·s' },
      { name: 'Mass-energy', expr: <>E = mc²</> },
      { name: 'Radioactive decay', expr: <>N = N₀ e<sup>−λt</sup></> },
      { name: 'Half-life', expr: <>t<sub>½</sub> = ln 2 / λ</> },
    ],
  },
];

const CHEMISTRY: Section[] = [
  {
    title: 'Atoms & moles',
    formulas: [
      { name: 'Moles', expr: <>n = mass / molar mass</> },
      { name: 'Avogadro', expr: <>N = n × N<sub>A</sub></>, note: 'N<sub>A</sub> = 6.022 × 10²³' },
      { name: 'Molar volume (STP)', expr: <>22.4 L/mol</>, note: 'For ideal gas at STP' },
      { name: 'Concentration', expr: <>M = n / V (L)</> },
      { name: '% yield', expr: <>(actual / theoretical) × 100%</> },
    ],
  },
  {
    title: 'Gas laws',
    formulas: [
      { name: 'Ideal gas', expr: <>PV = nRT</> },
      { name: "Boyle's", expr: <>P₁V₁ = P₂V₂</>, note: 'Constant T' },
      { name: "Charles's", expr: <>V₁/T₁ = V₂/T₂</>, note: 'Constant P' },
      { name: 'Combined', expr: <>P₁V₁/T₁ = P₂V₂/T₂</> },
      { name: "Graham's diffusion", expr: <>r₁/r₂ = √(M₂/M₁)</> },
    ],
  },
  {
    title: 'Solutions & colligative',
    formulas: [
      { name: 'Molarity', expr: <>M = mol solute / L solution</> },
      { name: 'Molality', expr: <>m = mol solute / kg solvent</> },
      { name: 'Mole fraction', expr: <>X<sub>A</sub> = n<sub>A</sub> / n<sub>total</sub></> },
      { name: 'Boiling point elev', expr: <>ΔT<sub>b</sub> = K<sub>b</sub> × m</> },
      { name: 'Freezing point dep', expr: <>ΔT<sub>f</sub> = K<sub>f</sub> × m</> },
    ],
  },
  {
    title: 'Thermochemistry',
    formulas: [
      { name: 'Heat (calorimetry)', expr: <>q = mcΔT</> },
      { name: 'Enthalpy', expr: <>ΔH = H<sub>products</sub> − H<sub>reactants</sub></> },
      { name: "Hess's law", expr: <>ΔH<sub>net</sub> = Σ ΔH<sub>steps</sub></> },
    ],
  },
  {
    title: 'Equilibrium & acids',
    formulas: [
      { name: 'Equilibrium const', expr: <>K<sub>c</sub> = [products] / [reactants]</> },
      { name: 'pH', expr: <>pH = −log[H⁺]</> },
      { name: 'pOH', expr: <>pOH = −log[OH⁻]</> },
      { name: 'pH + pOH', expr: <>pH + pOH = 14</> },
      { name: 'K<sub>w</sub>', expr: <>K<sub>w</sub> = [H⁺][OH⁻] = 10⁻¹⁴</> },
      { name: 'Weak acid', expr: <>pH = ½(pK<sub>a</sub> − log C)</> },
      { name: 'Henderson-Hasselbalch', expr: <>pH = pK<sub>a</sub> + log([A⁻]/[HA])</> },
    ],
  },
  {
    title: 'Kinetics & electrochemistry',
    formulas: [
      { name: 'Rate law', expr: <>rate = k[A]<sup>m</sup>[B]<sup>n</sup></> },
      { name: 'Arrhenius', expr: <>k = Ae<sup>−Ea/RT</sup></> },
      { name: 'Half-life (1st order)', expr: <>t<sub>½</sub> = 0.693 / k</> },
      { name: 'Nernst', expr: <>E = E° − (0.0592/n) log Q</>, note: 'At 25°C' },
      { name: 'Cell EMF', expr: <>E°<sub>cell</sub> = E°<sub>cathode</sub> − E°<sub>anode</sub></> },
    ],
  },
];

const BIOLOGY: Section[] = [
  {
    title: 'Cardiovascular',
    formulas: [
      { name: 'Cardiac output', expr: <>CO = HR × SV</> },
      { name: 'Stroke volume', expr: <>SV = EDV − ESV</> },
      { name: 'Ejection fraction', expr: <>EF = (SV / EDV) × 100%</> },
      { name: 'Mean arterial pressure', expr: <>MAP ≈ DBP + ⅓(SBP − DBP)</> },
      { name: 'Pulse pressure', expr: <>PP = SBP − DBP</> },
    ],
  },
  {
    title: 'Respiration',
    formulas: [
      { name: 'Tidal volume', expr: <>~500 mL at rest</> },
      { name: 'Vital capacity', expr: <>VC = TV + IRV + ERV</> },
      { name: 'Total lung capacity', expr: <>TLC = VC + RV</> },
      { name: 'Minute ventilation', expr: <>V<sub>E</sub> = TV × RR</> },
    ],
  },
  {
    title: 'Renal',
    formulas: [
      { name: 'GFR', expr: <>GFR = (U × V) / P</> },
      { name: 'Renal clearance', expr: <>C = (U × V) / P</> },
      { name: 'Filtration fraction', expr: <>FF = GFR / RPF</> },
    ],
  },
  {
    title: 'Genetics',
    formulas: [
      { name: 'Hardy-Weinberg', expr: <>p² + 2pq + q² = 1</> },
      { name: 'Allele freq sum', expr: <>p + q = 1</> },
      { name: 'Punnett ratios', expr: <>Monohybrid 3:1, Dihybrid 9:3:3:1</> },
    ],
  },
  {
    title: 'Population & ecology',
    formulas: [
      { name: 'Population growth', expr: <>dN/dt = rN ((K − N)/K)</> },
      { name: 'BMI', expr: <>BMI = weight (kg) / height² (m²)</> },
    ],
  },
];

export default function FormulasPage() {
  const [tab, setTab] = useState<'physics' | 'chemistry' | 'biology'>('physics');
  const data = tab === 'physics' ? PHYSICS : tab === 'chemistry' ? CHEMISTRY : BIOLOGY;

  return (
    <>
      <Navbar />
      <main>
        <section className="mx-auto max-w-5xl px-5 py-16 md:py-24">
          <p className="marginalia mb-6">Reference</p>
          <h1 className="font-display text-4xl md:text-5xl text-coal-900 tracking-tight mb-4">
            MDCAT formula sheet.
          </h1>
          <p className="text-coal-600 mb-10 max-w-2xl leading-relaxed">
            The formulas that come up most in MDCAT practice, organised by
            subject. Built to glance at while you are working through a paper.
            If something is missing that you wanted, flag a question and tell
            us. We add the most-requested ones each update.
          </p>

          <div className="flex gap-1 mb-10 border-b border-coal-rule">
            {(['physics', 'chemistry', 'biology'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`press px-5 py-2.5 text-sm font-medium capitalize tx-color border-b-2 -mb-px ${
                  tab === t
                    ? 'border-accent text-coal-900'
                    : 'border-transparent text-coal-500 hover:text-coal-800'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="space-y-10">
            {data.map((section) => (
              <div key={section.title}>
                <h2 className="marginalia mb-3">{section.title}</h2>
                <div className="border-t border-b border-coal-rule divide-y divide-coal-rule">
                  {section.formulas.map((f, i) => (
                    <div
                      key={i}
                      className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-6 py-3"
                    >
                      <div className="text-sm text-coal-600">{f.name}</div>
                      <div className="md:col-span-2 text-coal-900 font-mono text-base">
                        {f.expr}
                        {f.note && (
                          <span className="ml-3 text-xs text-coal-500 font-sans">
                            {f.note}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 pt-8 border-t border-coal-rule">
            <p className="text-coal-600 text-sm">
              This is reference material, not a substitute for working through
              questions. Hit{' '}
              <a href="/exams" className="link-draw text-coal-900">
                the question bank
              </a>{' '}
              and come back here when you get stuck.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
