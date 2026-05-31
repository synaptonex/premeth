import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'The terms you agree to when you use Enid.',
};

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main>
        <section className="border-t border-coal-rule">
          <div className="mx-auto max-w-3xl px-6 md:px-10 py-20 md:py-28">
            <span className="text-xs uppercase tracking-widest text-accent">
              Terms
            </span>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-coal-900 mt-3">
              Terms of Service
            </h1>
            <p className="mt-3 text-sm text-coal-500">
              Last updated 16 May 2026
            </p>

            <div className="mt-10 space-y-8 text-coal-700 leading-relaxed">
              <p>
                These terms cover your use of Enid, a study platform run by
                Syncrasy. Using the site means you accept them.
              </p>

              <div>
                <h2 className="text-xl text-coal-900 mb-2">
                  What Enid is
                </h2>
                <p>
                  Enid is a practice tool. It gives you past-paper questions,
                  explanations, drills and mock exams to study with. It will
                  not teach you the syllabus for you, and it cannot promise
                  you a score on any exam.
                </p>
              </div>

              <div>
                <h2 className="text-xl text-coal-900 mb-2">
                  About the questions and answers
                </h2>
                <p>
                  The question bank is compiled from past papers. We check it
                  and correct it continuously, but past papers are messy and
                  some answer keys or explanations may be wrong. Do not treat
                  Enid as a final authority. If you find a mistake, use the
                  report button on the question so we can fix it. Nothing on
                  Enid is medical advice, and the guidance pages on licensing
                  routes are general orientation, not professional or legal
                  advice.
                </p>
              </div>

              <div>
                <h2 className="text-xl text-coal-900 mb-2">
                  Your account
                </h2>
                <p>
                  You are responsible for what happens under your account and
                  for keeping your login details to yourself. Accounts are for
                  one person. Sharing an account or a paid subscription with
                  others is not allowed, and we may suspend accounts that are
                  clearly being shared.
                </p>
              </div>

              <div>
                <h2 className="text-xl text-coal-900 mb-2">
                  Enid+ and payments
                </h2>
                <p>
                  Enid+ is a paid subscription. You pay through JazzCash or
                  EasyPaisa and submit the transaction ID, and we activate
                  Enid+ once we have confirmed the payment. Activation is
                  manual, so there can be a short delay. The price and what
                  Enid+ includes are shown on the pricing page and may change
                  for future purchases. A subscription covers a fixed period
                  and does not renew automatically.
                </p>
              </div>

              <div>
                <h2 className="text-xl text-coal-900 mb-2">
                  Refunds
                </h2>
                <p>
                  If a payment was taken but Enid+ was not activated, or was
                  activated in error, contact us and we will sort it out.
                  Beyond that, because Enid+ unlocks digital content
                  immediately, we handle refund requests case by case. Reach
                  us before disputing a payment elsewhere and we will work it
                  through with you.
                </p>
              </div>

              <div>
                <h2 className="text-xl text-coal-900 mb-2">
                  Fair use
                </h2>
                <p>
                  Use Enid to study. Do not scrape the question bank, resell
                  it, or republish it as your own. Do not try to break,
                  overload, or interfere with the site.
                </p>
              </div>

              <div>
                <h2 className="text-xl text-coal-900 mb-2">
                  Availability
                </h2>
                <p>
                  We work to keep Enid running, but we cannot promise it will
                  always be available or error-free. We may change, pause, or
                  remove features as the product develops.
                </p>
              </div>

              <div>
                <h2 className="text-xl text-coal-900 mb-2">
                  Limits
                </h2>
                <p>
                  Enid is provided as is. We are not liable for exam outcomes,
                  admission decisions, or choices you make based on the
                  content or guidance here. Study widely and confirm anything
                  important with official sources.
                </p>
              </div>

              <div>
                <h2 className="text-xl text-coal-900 mb-2">
                  Contact
                </h2>
                <p>
                  Questions about these terms go to{' '}
                  <a
                    href="mailto:syncrasy26@gmail.com"
                    className="text-accent hover:underline"
                  >
                    syncrasy26@gmail.com
                  </a>{' '}
                  or WhatsApp{' '}
                  <a
                    href="https://wa.me/923345121203"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent hover:underline"
                  >
                    +92 334 5121203
                  </a>
                  .
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
