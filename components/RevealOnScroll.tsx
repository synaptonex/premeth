'use client';

import { useEffect } from 'react';

/**
 * Mounts once (in the root layout) and animates any element carrying a
 * `data-reveal` attribute when it scrolls into view. Pages stay server
 * components — they only need the attribute, no imports, no client boundary.
 * Honours prefers-reduced-motion (the CSS sets the rest state to visible).
 */
export default function RevealOnScroll() {
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const els = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));

    if (reduce || !('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('is-in'));
      return;
    }

    const io = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const el = e.target as HTMLElement;
            const delay = el.dataset.revealDelay;
            if (delay) el.style.transitionDelay = `${delay}ms`;
            el.classList.add('is-in');
            obs.unobserve(el);
          }
        });
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.05 }
    );

    els.forEach((el) => io.observe(el));

    // Catch elements added after first paint (route changes).
    const mo = new MutationObserver(() => {
      document
        .querySelectorAll<HTMLElement>('[data-reveal]:not(.is-in)')
        .forEach((el) => io.observe(el));
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, []);

  return null;
}
