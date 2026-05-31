'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { timeAgo, displayName, initials } from '@/lib/format';
import type { ForumThread, ForumReply } from '@/lib/types';
import { ArrowLeft, Loader2, MessageSquare } from 'lucide-react';

export default function ThreadPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();
  const id = params?.id;

  const [thread, setThread] = useState<ForumThread | null>(null);
  const [replies, setReplies] = useState<ForumReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState(false);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);

  const loadReplies = useCallback(async () => {
    const { data } = await supabase
      .from('forum_replies_with_author')
      .select('*')
      .eq('thread_id', id)
      .order('created_at', { ascending: true });
    setReplies((data as ForumReply[]) ?? []);
  }, [supabase, id]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const [{ data: { user } }, { data: t }] = await Promise.all([
        supabase.auth.getUser(),
        supabase.from('forum_threads_with_author').select('*').eq('id', id).single(),
      ]);
      setSignedIn(!!user);
      setThread((t as ForumThread) ?? null);
      await loadReplies();
      setLoading(false);
    })();
  }, [id, supabase, loadReplies]);

  async function sendReply(e: React.FormEvent) {
    e.preventDefault();
    if (reply.trim().length < 1) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push(`/login?next=/forum/${id}`);
      return;
    }

    setSending(true);
    const { error } = await supabase
      .from('forum_replies')
      .insert({ thread_id: id, user_id: user.id, body: reply.trim() });
    setSending(false);

    if (error) {
      toast.error('Could not post your reply', { description: error.message });
      return;
    }
    setReply('');
    await loadReplies();
    setThread((prev) => (prev ? { ...prev, reply_count: prev.reply_count + 1 } : prev));
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="mx-auto max-w-2xl px-5 py-24 flex justify-center text-coal-500">
          <Loader2 className="h-5 w-5 animate-spin" />
        </main>
      </>
    );
  }

  if (!thread) {
    return (
      <>
        <Navbar />
        <main className="mx-auto max-w-2xl px-5 py-24 text-center">
          <p className="text-coal-900 font-medium">This thread could not be found.</p>
          <Link href="/forum" className="link-draw mt-3 inline-block text-accent-bright">Back to the forum</Link>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-2xl px-5 md:px-6 py-12 md:py-16">
        <Link href="/forum" className="link-draw inline-flex items-center gap-1.5 text-sm text-coal-500 hover:text-coal-900 tx-color">
          <ArrowLeft className="h-4 w-4" /> Back to forum
        </Link>

        {/* Original post */}
        <article className="mt-6 rounded-2xl glass p-6">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-coal-900 leading-snug">
            {thread.title}
          </h1>
          <div className="mt-3 flex items-center gap-3 text-xs text-coal-500">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-coal-200 text-coal-700 text-[10px] font-semibold">
              {initials(thread.author_username)}
            </span>
            <span>{displayName(thread.author_username)}</span>
            <span aria-hidden>·</span>
            <span>{timeAgo(thread.created_at)}</span>
          </div>
          <p className="mt-5 text-coal-700 leading-relaxed whitespace-pre-wrap">{thread.body}</p>
        </article>

        <h2 className="mt-10 mb-4 inline-flex items-center gap-2 text-sm font-semibold text-coal-700">
          <MessageSquare className="h-4 w-4 text-accent-bright" />
          {thread.reply_count} {thread.reply_count === 1 ? 'reply' : 'replies'}
        </h2>

        <ul className="space-y-3">
          {replies.map((r) => (
            <li key={r.id} className="rounded-2xl border border-coal-rule bg-coal-50 p-5">
              <div className="flex items-center gap-3 text-xs text-coal-500">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-coal-200 text-coal-700 text-[10px] font-semibold">
                  {initials(r.author_username)}
                </span>
                <span className="text-coal-700">{displayName(r.author_username)}</span>
                <span aria-hidden>·</span>
                <span>{timeAgo(r.created_at)}</span>
              </div>
              <p className="mt-3 text-coal-700 leading-relaxed whitespace-pre-wrap">{r.body}</p>
            </li>
          ))}
        </ul>

        {/* Reply box */}
        <div className="mt-8">
          {signedIn ? (
            <form onSubmit={sendReply}>
              <label htmlFor="reply-body" className="block text-xs uppercase tracking-wider text-coal-500 mb-2">
                Your reply
              </label>
              <textarea
                id="reply-body"
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                rows={4}
                maxLength={8000}
                placeholder="Answer the question, or add what you know."
                className="w-full px-4 py-3 rounded-xl bg-coal-100 border border-coal-rule text-coal-900 placeholder:text-coal-500 focus:border-accent focus:outline-none tx-color resize-y leading-relaxed"
              />
              <div className="mt-3">
                <button
                  type="submit"
                  disabled={sending || reply.trim().length < 1}
                  className="press inline-flex items-center gap-2 rounded-full bg-aurora-line px-6 py-2.5 text-sm font-semibold text-white shadow-glow hover:shadow-glow-lg disabled:opacity-50 tx-color"
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {sending ? 'Posting…' : 'Post reply'}
                </button>
              </div>
            </form>
          ) : (
            <div className="rounded-2xl glass p-5 text-center">
              <p className="text-coal-700 text-sm">
                <Link href={`/login?next=/forum/${id}`} className="text-accent-bright hover:underline">Sign in</Link>{' '}
                to reply. Reading is open to everyone.
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
