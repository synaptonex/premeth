import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-ink-800 mt-24">
      <div className="mx-auto max-w-6xl px-5 py-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
        <div className="col-span-2 md:col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-7 w-7 grid place-items-center rounded-md bg-meth/15 border border-meth/30">
              <span className="text-meth font-display font-bold text-sm leading-none">P</span>
            </div>
            <span className="font-display font-semibold text-paper">Premeth</span>
          </div>
          <p className="text-ink-400 max-w-sm leading-relaxed">
            Ensuring premed students stay premeth. Free, no ads, no signup needed
            for practice. Built by students, for students.
          </p>
        </div>

        <div>
          <div className="font-medium text-paper mb-3">Practice</div>
          <ul className="space-y-2 text-ink-400">
            <li><Link href="/papers/subject_biology"   className="hover:text-meth tx-color">Biology</Link></li>
            <li><Link href="/papers/subject_chemistry" className="hover:text-meth tx-color">Chemistry</Link></li>
            <li><Link href="/papers/subject_physics"   className="hover:text-meth tx-color">Physics</Link></li>
            <li><Link href="/papers/subject_english"   className="hover:text-meth tx-color">English</Link></li>
          </ul>
        </div>

        <div>
          <div className="font-medium text-paper mb-3">Resources</div>
          <ul className="space-y-2 text-ink-400">
            <li><Link href="/exams"  className="hover:text-meth tx-color">All Papers</Link></li>
            <li><Link href="/draw"   className="hover:text-meth tx-color">Scratchpad</Link></li>
            <li><Link href="/about"  className="hover:text-meth tx-color">About</Link></li>
            <li><Link href="/signup" className="hover:text-meth tx-color">Create account</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-ink-900 py-6 text-center text-xs text-ink-500">
        © {new Date().getFullYear()} Premeth. Educational purposes only. (hopefully)
      </div>
    </footer>
  );
}
