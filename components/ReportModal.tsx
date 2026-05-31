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

// The structured correction fields only make sense when the complaint is
// about correctness. For a typo or a missing image, asking for "the correct
// answer and proof" would just be noise.
const NEEDS_CORRECTION = new Set(['wrong_answer', 'wrong_explanation']);

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
  const [correctedAnswer, setCorrectedAnswer] = useState('');
  const [correctionReason, setCorrectionReason] = useState('');
  const [proofSource, setProofSource] = useState('');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [authedEmail, setAuthedEmail] = useState<string | null>(null);

  const showCorrection = NEEDS_CORRECTION.has(reason);

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

  function resetFields() {
    setDetails('');
    setCorrectedAnswer('');
    setCorrectionReason('');
    setProofSource('');
    setReason(REASONS[0].value);
  }

  async function submit() {
    // When the report is about correctness, ask for the why before sending.
    // The corrected answer and proof stay optional - a student may know an
    // answer is wrong without having the citation to hand.
    if (showCorrection && !correctionReason.trim()) {
      toast.error('Tell us why the answer is wrong', {
        description: 'A line on what makes it incorrect helps us verify the fix.',
      });
      return;
    }

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
      corrected_answer: showCorrection ? correctedAnswer.trim() || null : null,
      correction_reason: showCorrection ? correctionReason.trim() || null : null,
      proof_source: showCorrection ? proofSource.trim() || null : null,
    });

    setSubmitting(false);

    if (error) {
      toast.error('Could not submit report', { description: error.message });
      return;
    }

    toast.success('Report submitted', {
      description: 'Thanks. The next person to open this question may see it fixed.',
    });
    resetFields();
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
        className="relative w-full max-w-md rounded-2xl border border-coal-rule bg-coal-50 p-6 shadow-card animate-modal-in max-h-[90vh] overflow-y-auto"
      >

        <button
          onClick={onClose}
          className="press absolute top-4 right-4 p-1.5 rounded-md text-coal-600 hover:text-coal-900 tx-color"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2 mb-1">
          <Flag className="h-4 w-4 text-crimson-bright" />
          <h2 className="font-display text-xl text-coal-900">Report this question</h2>
        </div>
        <p className="text-xs text-coal-500 mb-5">
          Q{questionIndex + 1} of {paperId}
        </p>

        <div className="text-sm text-coal-600 bg-coal-50 border border-coal-rule rounded-md p-3 mb-5 max-h-24 overflow-auto">
          {questionText.length > 200
            ? questionText.slice(0, 200) + '…'
            : questionText}
        </div>

        {!authedEmail && (
          <div className="text-xs text-accent bg-accent/10 border border-accent/20 rounded-md p-2.5 mb-4">
            You need an account to submit reports.{' '}
            <a href="/login" className="underline">Sign in</a>.
          </div>
        )}

        <label className="block text-xs uppercase tracking-wider text-coal-500 mb-2">
          What&apos;s wrong?
        </label>
        <div className="space-y-1.5 mb-5">
          {REASONS.map((r) => (
            <label
              key={r.value}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-md border cursor-pointer tx-color ${
                reason === r.value
                  ? 'border-accent/40 bg-accent/10 text-coal-900'
                  : 'border-coal-rule bg-coal-50/40 text-coal-700 hover:border-coal-400'
              }`}
            >
              <input
                type="radio"
                name="reason"
                value={r.value}
                checked={reason === r.value}
                onChange={() => setReason(r.value)}
                className="accent-accent"
              />
              <span className="text-sm">{r.label}</span>
            </label>
          ))}
        </div>

        {/* Structured correction, shown only for correctness complaints. */}
        {showCorrection && (
          <div className="space-y-4 mb-5 border-l-2 border-accent/40 pl-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-coal-500 mb-2">
                What should the answer be?{' '}
                <span className="normal-case text-coal-500">(optional)</span>
              </label>
              <input
                value={correctedAnswer}
                onChange={(e) => setCorrectedAnswer(e.target.value)}
                placeholder="e.g. B, or the full option text"
                className="w-full px-3 py-2 rounded-md bg-coal-50 border border-coal-rule text-coal-900 text-sm placeholder:text-coal-500 focus:border-accent focus:outline-none tx-color"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-coal-500 mb-2">
                Why is the marked answer wrong?
              </label>
              <textarea
                rows={3}
                value={correctionReason}
                onChange={(e) => setCorrectionReason(e.target.value)}
                placeholder="Explain what makes it incorrect."
                className="w-full px-3 py-2 rounded-md bg-coal-50 border border-coal-rule text-coal-900 text-sm placeholder:text-coal-500 focus:border-accent focus:outline-none tx-color resize-none"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-coal-500 mb-2">
                Proof to back it up{' '}
                <span className="normal-case text-coal-500">(optional)</span>
              </label>
              <input
                value={proofSource}
                onChange={(e) => setProofSource(e.target.value)}
                placeholder="Textbook page, board key, or a link"
                className="w-full px-3 py-2 rounded-md bg-coal-50 border border-coal-rule text-coal-900 text-sm placeholder:text-coal-500 focus:border-accent focus:outline-none tx-color"
              />
            </div>
          </div>
        )}

        <label className="block text-xs uppercase tracking-wider text-coal-500 mb-2">
          {showCorrection ? 'Anything else' : 'More detail'}{' '}
          <span className="normal-case text-coal-500">(optional)</span>
        </label>
        <textarea
          rows={2}
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder={
            showCorrection
              ? 'Optional. Anything that did not fit above.'
              : 'e.g. the diagram does not load on mobile.'
          }
          className="w-full px-3 py-2 rounded-md bg-coal-50 border border-coal-rule text-coal-900 text-sm placeholder:text-coal-500 focus:border-accent focus:outline-none tx-color resize-none"
        />

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="press text-sm px-4 py-2 rounded-md text-coal-700 hover:text-coal-900 tx-color"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={submitting || !authedEmail}
            className="press text-sm px-4 py-2 rounded-md bg-crimson text-white font-semibold rounded-full disabled:opacity-50 disabled:cursor-not-allowed shadow-crimson hover:brightness-110 tx-color"
          >
            {submitting ? 'Submitting…' : 'Submit report'}
          </button>
        </div>
      </div>
    </div>
  );
}
