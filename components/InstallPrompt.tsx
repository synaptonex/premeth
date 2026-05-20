'use client';

/**
 * A quiet "add to home screen" prompt.
 *
 * On Chrome and other Chromium browsers the browser fires a
 * `beforeinstallprompt` event when the app is installable. We catch it,
 * hold it, and show our own small bar so the prompt fits the Enid theme
 * instead of relying on the browser's default mini-infobar.
 *
 * It shows once, sits at the bottom, and is dismissable. If the user
 * dismisses it or installs, it does not nag again this session. iOS Safari
 * does not support this event at all, so on iOS nothing shows. That is fine,
 * iOS users add to home screen through the Share menu.
 */

import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'enid_install_dismissed';

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(DISMISS_KEY)) return;
    } catch {
      // sessionStorage unavailable, just proceed.
    }

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setShow(true);
    };

    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  function dismiss() {
    setShow(false);
    try {
      sessionStorage.setItem(DISMISS_KEY, '1');
    } catch {
      // ignore
    }
  }

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    // Whatever they chose, we are done with this prompt.
    setShow(false);
    setDeferred(null);
  }

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-40 mx-auto max-w-sm">
      <div className="rounded-xl border border-coal-rule bg-coal-50 shadow-2xl p-4 flex items-center gap-3">
        <div className="inline-grid place-items-center h-10 w-10 rounded-lg bg-accent/10 border border-accent/20 text-accent shrink-0">
          <Download className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-coal-900 text-sm font-medium">
            Add Enid to your home screen
          </p>
          <p className="text-coal-600 text-xs mt-0.5">
            Opens like an app, no browser bar.
          </p>
        </div>
        <button
          onClick={install}
          className="press shrink-0 bg-accent text-coal text-sm font-medium px-3 py-1.5 rounded-md hover:opacity-90 tx-color"
        >
          Add
        </button>
        <button
          onClick={dismiss}
          className="press shrink-0 p-1.5 text-coal-500 hover:text-coal-900 tx-color"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
