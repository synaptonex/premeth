'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { createClient } from '@/lib/supabase/client';
import { displayName, initials } from '@/lib/format';
import type { LeaderboardRow } from '@/lib/types';
import { Loader2, Trophy } from 'lucide-react';

export default function LeaderboardPage() {
  const supabase = createClient();
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [meId, setMeId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [{ data: { user } }, { data, error }] = await Promise.all([
        supabase.auth.getUser(),
        supabase.rpc('get_leaderboard', { limit_n: 100 }),
      ]);
      setMeId(user?.id ?? null);
      if (!error) setRows((data as LeaderboardRow[]) ?? []);
      setLoading(false);
    })();
  }, [supabase]);

  const myRank = meId ? rows.findIndex((r) => r.user_id === meId) : -1;

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 md:px-6 py-16 md:py-20">
        <p className="marginalia mb-3">Practice ranking</p>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-coal-900">
          The <span className="text-aurora">leaderboard.</span>
        </h1>
        <p className="mt-3 text-coal-600 max-w-xl leading-relaxed">
          Ranked by total correct answers across every paper, mock and drill. No adding people,
          no messaging — just a number to chase. Set a username in your profile to appear here.
        </p>

        {myRank >= 0 && (
          <div className="mt-6 inline-flex items-center gap-2 rounded-full glass px-4 py-2 text-sm text-coal-700">
            <Trophy className="h-4 w-4 text-accent-bright" />
            You&apos;re ranked <span className="text-aurora font-semibold">#{myRank + 1}</span>. Keep practicing to climb.
          </div>
        )}

        <div className="mt-10">
          {loading ? (
            <div className="flex items-center gap-2 text-coal-500 py-16 justify-center">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading rankings…
            </div>
          ) : rows.length === 0 ? (
            <div className="glass rounded-2xl p-10 text-center">
              <Trophy className="h-6 w-6 text-accent-bright mx-auto" />
              <p className="mt-3 text-coal-900 font-medium">No one&apos;s on the board yet.</p>
              <p className="mt-1 text-coal-600 text-sm">
                Practice a paper and set a username — you could be first.
              </p>
              <Link
                href="/exams"
                className="press mt-5 inline-flex items-center rounded-full bg-aurora-line px-5 py-2.5 text-sm font-semibold text-white shadow-glow hover:shadow-glow-lg tx-color"
              >
                Start practicing
              </Link>
            </div>
          ) : (
            <ol className="space-y-2">
              {rows.map((r, i) => {
                const isMe = r.user_id === meId;
                const top = i < 3;
                return (
                  <li
                    key={r.user_id}
                    className={`flex items-center gap-4 rounded-2xl p-4 tx-color ${
                      isMe
                        ? 'glass border border-accent/40 shadow-glow'
                        : top
                        ? 'glass'
                        : 'border border-coal-rule bg-coal-50'
                    }`}
                  >
                    <span
                      className={`w-8 shrink-0 text-center font-bold tabular-nums ${
                        top ? 'text-aurora text-xl' : 'text-coal-500'
                      }`}
                    >
                      {i + 1}
                    </span>
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-coal-200 text-coal-700 text-xs font-semibold">
                      {initials(r.username)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-coal-900 truncate">
                        {displayName(r.username)}
                        {isMe && <span className="ml-2 text-xs text-accent-bright">you</span>}
                      </p>
                      <p className="text-xs text-coal-500">
                        {r.questions_practiced.toLocaleString()} practiced · {r.accuracy}% accuracy
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-lg font-bold tabular-nums text-coal-900">
                        {r.correct_answers.toLocaleString()}
                      </div>
                      <div className="marginalia">correct</div>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
