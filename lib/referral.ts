'use client';

/**
 * Referral tag capture.
 *
 * An ambassador shares a link like  /signup?ref=their_tag  or  /?ref=their_tag.
 * A visitor might land on any page first, browse, and only sign up later, by
 * which point the ?ref= is long gone from the URL. So the moment any page
 * loads with a ?ref=, we stash the tag for the rest of the browser session.
 * The signup page then reads it back, whether the user came straight there
 * or wandered in.
 *
 * sessionStorage, not localStorage, on purpose: a referral belongs to this
 * visit, not forever.
 */

import { useEffect } from 'react';

const KEY = 'enid_ref';

// Same shape the database trigger will accept: plain tag, capped length.
function clean(tag: string | null): string | null {
  if (!tag) return null;
  const t = tag.trim().toLowerCase();
  return /^[a-z0-9_-]{1,40}$/.test(t) ? t : null;
}

/** Call once, high in the tree. Captures ?ref= into sessionStorage. */
export function useCaptureReferral() {
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const ref = clean(params.get('ref'));
      if (ref && !sessionStorage.getItem(KEY)) {
        sessionStorage.setItem(KEY, ref);
      }
    } catch {
      // sessionStorage can be unavailable (private mode, etc.). A missed
      // referral is not worth throwing over.
    }
  }, []);
}

/** Read the stored referral tag, if any. Safe to call anywhere client-side. */
export function getStoredReferral(): string | null {
  try {
    return clean(sessionStorage.getItem(KEY));
  } catch {
    return null;
  }
}
