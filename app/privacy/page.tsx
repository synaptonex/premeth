import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'What Enid collects, why, and how it is handled.',
};

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main>
        <section className="border-t border-coal-rule">
          <div className="mx-auto max-w-3xl px-6 md:px-10 py-20 md:py-28">
            <span className="text-xs uppercase tracking-widest text-accent">
              Privacy
            </span>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-coal-900 mt-3">
              Privacy Policy
            </h1>
            <p className="mt-3 text-sm text-coal-500">
              Last updated 16 May 2026
            </p>

            <div className="mt-10 space-y-8 text-coal-700 leading-relaxed">
              <p>
                Enid is a study platform run by Syncrasy. This page explains
                what we collect when you use it, why we collect it, and what
                we do with it. We have kept it in plain language on purpose.
              </p>

              <div>
                <h2 className="text-xl text-coal-900 mb-2">
                  What we collect
                </h2>
                <p>
                  You can practice past papers without an account, and in
                  that case we do not collect anything that identifies you.
                  If you create an account, we collect your email address and
                  the username you choose. As you practice, we store your
                  attempts, scores, the topics you are weak in, your study
                  streak, and, if you use Enid+, your Mistake Vault and mock
                  exam history. If you buy Enid+, we store the payment method
                  you used and the transaction ID you submit, so we can
                  confirm the payment.
                </p>
              </div>

              <div>
                <h2 className="text-xl text-coal-900 mb-2">
                  Why we collect it
                </h2>
                <p>
                  Your email is how you sign in and recover your account.
                  Your practice data is what makes the dashboard, the weak
                  topic tracking, the streak and the Mistake Vault work, none
                  of which is possible without storing your results. Payment
                  details are used only to verify a purchase and activate
                  Enid+.
                </p>
              </div>

              <div>
                <h2 className="text-xl text-coal-900 mb-2">
                  Where it is stored
                </h2>
                <p>
                  Accounts and study data are held in Supabase, which
                  provides our database and authentication. Your password is
                  handled by Supabase authentication and is never visible to
                  us. The site is hosted on Vercel. Both are third-party
                  providers with their own security practices.
                </p>
              </div>

              <div>
                <h2 className="text-xl text-coal-900 mb-2">
                  What we do not do
                </h2>
                <p>
                  We do not sell your data. We do not run ads. We do not share
                  your information with advertisers or data brokers. We use no
                  third-party tracking beyond what is needed to run the site.
                </p>
              </div>

              <div>
                <h2 className="text-xl text-coal-900 mb-2">
                  Your control
                </h2>
                <p>
                  You can edit your profile from your account at any time. If
                  you want your account and the data attached to it deleted,
                  email us and we will remove it. Practicing without an
                  account leaves nothing for us to delete.
                </p>
              </div>

              <div>
                <h2 className="text-xl text-coal-900 mb-2">
                  Children
                </h2>
                <p>
                  Enid is built for students preparing for medical entry
                  exams. It is not intended for children under 13, and we do
                  not knowingly collect data from them.
                </p>
              </div>

              <div>
                <h2 className="text-xl text-coal-900 mb-2">
                  Changes
                </h2>
                <p>
                  If this policy changes, the date at the top of this page
                  changes with it. Continuing to use Enid after a change
                  means you accept the updated version.
                </p>
              </div>

              <div>
                <h2 className="text-xl text-coal-900 mb-2">
                  Contact
                </h2>
                <p>
                  Questions about your data, or a deletion request, go to{' '}
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
