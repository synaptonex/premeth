import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-coal-rule mt-12">
      <div className="mx-auto max-w-6xl px-6 md:px-10 py-16">
        <div className="grid grid-cols-12 gap-6">
          <div className="hidden md:block col-span-1 marginalia pt-1">
            End / Notes
          </div>
          <div className="col-span-12 md:col-span-5">
            <div className="text-coal-900 text-base font-medium mb-3">
              Enid
            </div>
            <p className="text-coal-600 text-sm leading-relaxed max-w-sm">
              MDCAT practice from 2,500 past papers. Built by students who
              took the test, for the ones taking it next.
            </p>
          </div>

          <div className="col-span-6 md:col-span-3">
            <p className="marginalia mb-4">Practice</p>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/papers/subject_biology" className="text-coal-600 hover:text-coal-900 tx-color">Biology</Link></li>
              <li><Link href="/papers/subject_chemistry" className="text-coal-600 hover:text-coal-900 tx-color">Chemistry</Link></li>
              <li><Link href="/papers/subject_physics" className="text-coal-600 hover:text-coal-900 tx-color">Physics</Link></li>
              <li><Link href="/papers/subject_english" className="text-coal-600 hover:text-coal-900 tx-color">English</Link></li>
              <li><Link href="/exams" className="text-coal-600 hover:text-coal-900 tx-color">All papers</Link></li>
            </ul>
          </div>

          <div className="col-span-6 md:col-span-3">
            <p className="marginalia mb-4">More</p>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/draw" className="text-coal-600 hover:text-coal-900 tx-color">Scratchpad</Link></li>
              <li><Link href="/about" className="text-coal-600 hover:text-coal-900 tx-color">About</Link></li>
              <li>
                <Link href="/pricing" className="text-coal-600 hover:text-coal-900 tx-color">
                  Enid<span className="text-accent">+</span>
                </Link>
              </li>
              <li><Link href="/aggregate" className="text-coal-600 hover:text-coal-900 tx-color">Aggregate Calculator</Link></li>
              <li><Link href="/pathways" className="text-coal-600 hover:text-coal-900 tx-color">After MDCAT</Link></li>
              <li><Link href="/signup" className="text-coal-600 hover:text-coal-900 tx-color">Create account</Link></li>
            </ul>

            <p className="marginalia mt-8 mb-3">Contact</p>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a href="mailto:syncrasy26@gmail.com" className="text-coal-600 hover:text-coal-900 tx-color">
                  syncrasy26@gmail.com
                </a>
              </li>
              <li>
                <a
                  href="https://wa.me/923345121203"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-coal-600 hover:text-coal-900 tx-color"
                >
                  WhatsApp: +92 334 5121203
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-coal-rule flex items-baseline justify-between">
          <span className="marginalia italic">
            Enid, by Syncrasy
          </span>
          <span className="marginalia">
            © {new Date().getFullYear()}
          </span>
        </div>
      </div>
    </footer>
  );
}
