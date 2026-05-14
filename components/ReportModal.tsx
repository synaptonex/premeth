'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Flag, X } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  category: string;
  paperId: string;
  questionIndex: number;
  questionText: string;
}

const REASONS = [
  { value: 'wrong_answer',      label: 'Wrong answer marked correct' },
  { value: 'wrong_explanation', label: 'Explanation is wrong or misleading' },
  { value: 'typo',              label: 'Typo / formatting error' },
  { value: 'image_missing',     label: 'Diagram missing or broken' },
  { value: 'duplicate',         label: 'Duplicate question' },
  { value: 'other',             label: 'Something else' },
];

export default function ReportModal({
  open,
  onClose,
  category,
  paperId,
  questionIndex,
  questionText,
}: Props) {
  const supabase = createClient();
  const [reason, setReason] = useState(REASONS[0].value);
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [authedEmail, setAuthedEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    supabase.auth.getUser().then(({ data }) => setAuthedEmail(data.user?.email ?? null));
  }, [open, supabase]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  async function submit() {
    setSubmitting(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Sign in to report questions', {
        description: 'Reports are tied to accounts so we can credit fixes.',
      });
      setSubmitting(false);
      return;
    }

    const { error } = await supabase.from('question_reports').insert({
      user_id: user.id,
      category,
      paper_id: paperId,
      question_index: questionIndex,
      reason,
      details: details.trim() || null,
    });

    setSubmitting(false);

    if (error) {
      toast.error('Could not submit report', { description: error.message });
      return;
    }

    toast.success('Report submitted', {
      description: 'Thanks. The next person to open this question may see it fixed.',
    });
    setDetails('');
    setReason(REASONS[0].value);
    onClose();
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center p-4"
      style={{
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Report question"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md rounded-xl border border-ink-800 bg-ink-950 p-6 shadow-2xl animate-modal-in"
      >

        <button
          onClick={onClose}
          className="press absolute top-4 right-4 p-1.5 rounded-md text-ink-400 hover:text-paper tx-color"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2 mb-1">
          <Flag className="h-4 w-4 text-crimson" />
          <h2 className="font-display text-xl text-paper">Report this question</h2>
        </div>
        <p className="text-xs text-ink-500 mb-5">
          Q{questionIndex + 1} of {paperId}
        </p>

        <div className="text-sm text-ink-400 bg-ink-900 border border-ink-800 rounded-md p-3 mb-5 max-h-24 overflow-auto">
          {questionText.length > 200
            ? questionText.slice(0, 200) + '…'
            : questionText}
        </div>

        {!authedEmail && (
          <div className="text-xs text-amber-300/90 bg-amber-500/10 border border-amber-500/20 rounded-md p-2.5 mb-4">
            You need an account to submit reports. <a href="/login" className="underline">Sign in</a>.
          </div>
        )}

        <label className="block text-xs uppercase tracking-wider text-ink-500 mb-2">
          What's wrong?
        </label>
        <div className="space-y-1.5 mb-5">
          {REASONS.map((r) => (
            <label
              key={r.value}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-md border cursor-pointer tx-color ${
                reason === r.value
                  ? 'border-meth/40 bg-meth/10 text-paper'
                  : 'border-ink-800 bg-ink-900/40 text-ink-300 hover:border-ink-700'
              }`}
            >
              <input
                type="radio"
                name="reason"
                value={r.value}
                checked={reason === r.value}
                onChange={() => setReason(r.value)}
                className="accent-meth"
              />
              <span className="text-sm">{r.label}</span>
            </label>
          ))}
        </div>

        <label className="block text-xs uppercase tracking-wider text-ink-500 mb-2">
          More detail <span className="normal-case text-ink-600">(optional)</span>
        </label>
        <textarea
          rows={3}
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="e.g., The answer should be B, not C, because…"
          className="w-full px-3 py-2 rounded-md bg-ink-900 border border-ink-800 text-paper text-sm placeholder:text-ink-600 focus:border-meth focus:outline-none tx-color resize-none"
        />

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="press text-sm px-4 py-2 rounded-md text-ink-300 hover:text-paper tx-color"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={submitting || !authedEmail}
            className="press text-sm px-4 py-2 rounded-md bg-crimson text-paper font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-crimson/90 tx-color"
          >
            {submitting ? 'Submitting…' : 'Submit report'}
          </button>
        </div>
      </div>
    </div>
  );
}
