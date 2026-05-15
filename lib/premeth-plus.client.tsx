// lib/premeth-plus.client.tsx
// ─────────────────────────────────────────────────────────────────────────────
// React hook for checking Premeth+ status from client components. Import this
// in any "use client" component. Internally it uses the browser Supabase client.
// ─────────────────────────────────────────────────────────────────────────────

'use client';

import { useEffect, useState } from 'react';
import { createClient as createBrowserClient } from '@/lib/supabase/client';
import {
  INACTIVE,
  type PremethPlusStatus,
} from './premeth-plus';

export function usePremethPlus(): PremethPlusStatus {
  const [status, setStatus] = useState<PremethPlusStatus>({
    ...INACTIVE,
    loading: true,
  });

  useEffect(() => {
    const supabase = createBrowserClient();
    let cancelled = false;

    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (!cancelled) setStatus({ ...INACTIVE, loading: false });
        return;
      }

      const { data, error } = await supabase
        .from('subscriptions')
        .select('status, current_period_end, flagged_for_review')
        .eq('user_id', user.id)
        .maybeSingle();

      if (cancelled) return;

      if (error || !data) {
        setStatus({ ...INACTIVE, loading: false });
        return;
      }

      const end = new Date(data.current_period_end);
      const now = new Date();
      const isActive = data.status === 'active' && end > now;
      const ms = end.getTime() - now.getTime();
      const days = Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));

      setStatus({
        isActive,
        isPlus: isActive,
        expiresAt: end,
        daysRemaining: isActive ? days : null,
        flaggedForReview: !!data.flagged_for_review,
        loading: false,
      });
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return status;
}
