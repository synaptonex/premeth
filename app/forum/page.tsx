'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { createClient } from '@/lib/supabase/client';
import { timeAgo, displayName, initials } from '@/lib/format';
import type { ForumThread } from '@/lib/types';
import { MessageSquare, Plus, Loader2 } from 'lucide-react';

export default function ForumPage() {
  const router = useRouter();
  const supabase = createClient();

  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    (async () => {
      const [{ data: { user } }, { data }] = await Promise.all([
        supabase.auth.getUser(),
        supabase
          .from('forum_threads_with_author')
          .select('*')
          .order('last_activity_at', { ascending: false })
          .limit(100),
      ]);
      setSignedIn(!!user);
      setThreads((data as ForumThread[]) ?? []);
      setLoading(false);
    })();
  }, [supabase]);

  function startThread() {
    router.push(signedIn ? '/forum/new' : '/login?next=/forum/new');
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 md:px-6 py-16 md:py-20">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <p className="marginalia mb-3">Community</p>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-coal-900">
              The <span className="text-aurora">forum.</span>
            </h1>
            <p className="mt-3 text-coal-600 max-w-xl leading-relaxed">
              Stuck on a concept or a question? Ask here. Other students answer. Reading is open
              to everyone; posting needs a free account.
            </p>
          </div>
          <button
            onClick={startThread}
            className="press inline-flex items-center gap-2 rounded-full bg-aurora-line px-5 py-2.5 text-sm font-semibold text-white shadow-glow hover:shadow-glow-lg tx-color shrink-0"
          >
            <Plus className="h-4 w-4" />
            New thread
          </button>
        </div>

        <div className="mt-10">
          {loading ? (
            <div className="flex items-center gap-2 text-coal-500 py-16 justify-center">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading threads…
            </div>
          ) : threads.length === 0 ? (
            <div className="glass rounded-2xl p-10 text-center">
              <MessageSquare className="h-6 w-6 text-accent-bright mx-auto" />
              <p className="mt-3 text-coal-900 font-medium">No threads yet.</p>
              <p className="mt-1 text-coal-600 text-sm">Be the first to ask something.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {threads.map((t) => (
                <li key={t.id}>
                  <Link
                    href={`/forum/${t.id}`}
                    className="group block rounded-2xl glass p-5 tx-transform hover:-translate-y-0.5 hover:shadow-card-hover"
                  >
                    <div className="flex items-start gap-4">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-coal-200 text-coal-700 text-xs font-semibold">
                        {initials(t.author_username)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <h2 className="text-lg font-semibold text-coal-900 leading-snug group-hover:text-accent-bright tx-color truncate">
                          {t.title}
                        </h2>
                        <p className="mt-1 text-sm text-coal-600 line-clamp-2 leading-relaxed">{t.body}</p>
                        <div className="mt-3 flex items-center gap-4 text-xs text-coal-500">
                          <span>{displayName(t.author_username)}</span>
                          <span aria-hidden>·</span>
                          <span className="inline-flex items-center gap-1">
                            <MessageSquare className="h-3.5 w-3.5" />
                            {t.reply_count} {t.reply_count === 1 ? 'reply' : 'replies'}
                          </span>
                          <span aria-hidden>·</span>
                          <span>{timeAgo(t.last_activity_at)}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
