'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function NewThreadPage() {
  const router = useRouter();
  const supabase = createClient();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.replace('/login?next=/forum/new');
        return;
      }
      setChecked(true);
    });
  }, [supabase, router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (title.trim().length < 3) {
      toast.error('Give your question a clearer title');
      return;
    }
    if (body.trim().length < 1) {
      toast.error('Add some detail to your question');
      return;
    }
    setSubmitting(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.replace('/login?next=/forum/new');
      return;
    }

    const { data, error } = await supabase
      .from('forum_threads')
      .insert({ user_id: user.id, title: title.trim(), body: body.trim() })
      .select('id')
      .single();

    setSubmitting(false);

    if (error) {
      toast.error('Could not post your thread', { description: error.message });
      return;
    }
    toast.success('Thread posted');
    router.push(`/forum/${data.id}`);
  }

  if (!checked) {
    return (
      <>
        <Navbar />
        <main className="mx-auto max-w-2xl px-5 py-24 flex justify-center text-coal-500">
          <Loader2 className="h-5 w-5 animate-spin" />
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-2xl px-5 md:px-6 py-16 md:py-20">
        <Link href="/forum" className="link-draw inline-flex items-center gap-1.5 text-sm text-coal-500 hover:text-coal-900 tx-color">
          <ArrowLeft className="h-4 w-4" /> Back to forum
        </Link>

        <h1 className="mt-6 text-3xl md:text-4xl font-bold tracking-tight text-coal-900">
          Ask the <span className="text-aurora">community.</span>
        </h1>

        <form onSubmit={submit} className="mt-8 space-y-5">
          <div>
            <label htmlFor="thread-title" className="block text-xs uppercase tracking-wider text-coal-500 mb-2">
              Title
            </label>
            <input
              id="thread-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={160}
              placeholder="e.g. Why is the answer to this kinematics question B and not C?"
              className="w-full px-4 py-3 rounded-xl bg-coal-100 border border-coal-rule text-coal-900 placeholder:text-coal-500 focus:border-accent focus:outline-none tx-color"
            />
          </div>

          <div>
            <label htmlFor="thread-body" className="block text-xs uppercase tracking-wider text-coal-500 mb-2">
              Details
            </label>
            <textarea
              id="thread-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={8}
              maxLength={8000}
              placeholder="Lay out the question and where you're getting stuck. The more specific, the better the answers."
              className="w-full px-4 py-3 rounded-xl bg-coal-100 border border-coal-rule text-coal-900 placeholder:text-coal-500 focus:border-accent focus:outline-none tx-color resize-y leading-relaxed"
            />
            <p className="mt-1.5 text-xs text-coal-500">{body.length} / 8000</p>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={submitting}
              className="press inline-flex items-center gap-2 rounded-full bg-aurora-line px-6 py-2.5 text-sm font-semibold text-white shadow-glow hover:shadow-glow-lg disabled:opacity-50 tx-color"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {submitting ? 'Posting…' : 'Post thread'}
            </button>
            <Link href="/forum" className="text-sm text-coal-500 hover:text-coal-900 tx-color">
              Cancel
            </Link>
          </div>
        </form>
      </main>
      <Footer />
    </>
  );
}
