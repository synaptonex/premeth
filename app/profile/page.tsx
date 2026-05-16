'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Camera, Eye, EyeOff, User as UserIcon, Trash2 } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();
  const root = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState('');
  const [savedUsername, setSavedUsername] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [showPw, setShowPw] = useState(false);

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Boot - confirm auth, then load profile.
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/login?next=/profile');
        return;
      }
      setUser(user);

      const { data: profile } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', user.id)
        .single();

      if (profile) {
        setUsername(profile.username ?? '');
        setSavedUsername(profile.username ?? '');
        setAvatar(profile.avatar_url);
      }
    })();
  }, [router, supabase]);

  useGSAP(() => {
    gsap.from('.profile-card', {
      y: 16, autoAlpha: 0, duration: 0.4, stagger: 0.08, ease: 'power3.out',
    });
  }, { scope: root });

  // ─── Avatar handlers ────────────────────────────────────────────────────────
  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('That doesn\'t look like an image file.');
      return;
    }
    if (file.size > 2_000_000) {
      toast.error('Image is too large. Keep it under 2MB.');
      return;
    }
    setPendingFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  async function uploadAvatar() {
    if (!user || !pendingFile) return;
    setUploadingAvatar(true);

    const ext = pendingFile.name.split('.').pop()?.toLowerCase() || 'png';
    const path = `${user.id}/avatar-${Date.now()}.${ext}`;

    // Try to clean up old avatars (best effort - don't block on failure).
    if (avatar) {
      const oldPath = avatar.split('/avatars/')[1];
      if (oldPath) await supabase.storage.from('avatars').remove([oldPath]);
    }

    const { error: upErr } = await supabase.storage
      .from('avatars')
      .upload(path, pendingFile, {
        cacheControl: '3600',
        upsert: false,
        contentType: pendingFile.type,
      });

    if (upErr) {
      setUploadingAvatar(false);
      toast.error('Could not upload avatar', { description: upErr.message });
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);

    const { error: profErr } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
      .eq('id', user.id);

    setUploadingAvatar(false);

    if (profErr) {
      toast.error('Avatar uploaded but profile update failed', {
        description: profErr.message,
      });
      return;
    }

    setAvatar(publicUrl);
    setPendingFile(null);
    setPreviewUrl(null);
    toast.success('Avatar updated');
  }

  async function removeAvatar() {
    if (!user || !avatar) return;
    setUploadingAvatar(true);

    const oldPath = avatar.split('/avatars/')[1];
    if (oldPath) await supabase.storage.from('avatars').remove([oldPath]);

    const { error } = await supabase
      .from('profiles')
      .update({ avatar_url: null, updated_at: new Date().toISOString() })
      .eq('id', user.id);

    setUploadingAvatar(false);

    if (error) {
      toast.error('Could not remove avatar', { description: error.message });
      return;
    }
    setAvatar(null);
    toast.success('Avatar removed');
  }

  // ─── Username ───────────────────────────────────────────────────────────────
  async function saveUsername() {
    if (!user) return;
    const trimmed = username.trim();
    if (!/^[a-zA-Z0-9_]{3,24}$/.test(trimmed)) {
      toast.error('Username must be 3–24 characters: letters, numbers, underscores.');
      return;
    }
    if (trimmed === savedUsername) return;

    setSavingProfile(true);
    const { error } = await supabase
      .from('profiles')
      .update({ username: trimmed, updated_at: new Date().toISOString() })
      .eq('id', user.id);
    setSavingProfile(false);

    if (error) {
      // Most common case: unique-constraint violation on username.
      if (error.code === '23505') {
        toast.error('That username is already taken.');
      } else {
        toast.error('Could not update username', { description: error.message });
      }
      return;
    }
    setSavedUsername(trimmed);
    toast.success('Username updated');
  }

  // ─── Password ───────────────────────────────────────────────────────────────
  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (newPw.length < 8 || !/[a-zA-Z]/.test(newPw) || !/\d/.test(newPw)) {
      toast.error('New password needs 8+ characters with letters and a number.');
      return;
    }
    setSavingPw(true);

    // Re-authenticate to confirm the user really knows the old password.
    // Supabase's updateUser doesn't require this, but it's a basic safety check
    // since profile pages stay logged in for a long time.
    const { error: reauthErr } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: oldPw,
    });
    if (reauthErr) {
      setSavingPw(false);
      toast.error('Current password is wrong.');
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPw });
    setSavingPw(false);

    if (error) {
      toast.error('Could not update password', { description: error.message });
      return;
    }

    setOldPw('');
    setNewPw('');
    toast.success('Password changed');
  }

  if (!user) {
    return (
      <>
        <Navbar />
        <main className="mx-auto max-w-2xl px-5 py-20 text-center text-coal-600">
          Loading…
        </main>
      </>
    );
  }

  const currentAvatar = previewUrl || avatar;

  return (
    <>
      <Navbar />
      <main ref={root} className="mx-auto max-w-2xl px-5 py-12">
        <div className="mb-8">
          <span className="text-xs uppercase tracking-widest text-accent">Profile</span>
          <h1 className="font-display text-4xl md:text-5xl text-coal-900 tracking-tight mt-2">
            Your account.
          </h1>
          <p className="text-coal-600 mt-2">
            Signed in as <span className="text-coal-900">{user.email}</span>
          </p>
        </div>

        {/* Avatar card */}
        <section className="profile-card rounded-xl border border-coal-rule bg-coal-50/40 p-6 mb-4">
          <h2 className="font-display text-xl text-coal-900 mb-1">Profile picture</h2>
          <p className="text-sm text-coal-600 mb-5">PNG, JPG, or WebP, up to 2MB.</p>

          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="h-20 w-20 rounded-full overflow-hidden bg-coal-50 border border-coal-rule grid place-items-center">
                {currentAvatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={currentAvatar} alt="" className="h-full w-full object-cover" />
                ) : (
                  <UserIcon className="h-8 w-8 text-coal-500" />
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="press absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-accent grid place-items-center text-coal hover:bg-accent/90 tx-color"
                aria-label="Change avatar"
                title="Change avatar"
              >
                <Camera className="h-4 w-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={onPickFile}
                className="hidden"
              />
            </div>

            <div className="flex flex-col gap-2">
              {pendingFile ? (
                <>
                  <button
                    onClick={uploadAvatar}
                    disabled={uploadingAvatar}
                    className="press text-sm px-4 py-2 rounded-md bg-accent text-coal font-medium hover:bg-accent/90 disabled:opacity-50 tx-color"
                  >
                    {uploadingAvatar ? 'Uploading…' : 'Save new avatar'}
                  </button>
                  <button
                    onClick={() => { setPendingFile(null); setPreviewUrl(null); }}
                    className="press text-xs text-coal-600 hover:text-coal-900 tx-color"
                  >
                    Cancel
                  </button>
                </>
              ) : avatar ? (
                <button
                  onClick={removeAvatar}
                  disabled={uploadingAvatar}
                  className="press inline-flex items-center gap-1.5 text-xs text-coal-600 hover:text-crimson tx-color"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Remove avatar
                </button>
              ) : (
                <p className="text-xs text-coal-500">Click the camera icon to pick a photo.</p>
              )}
            </div>
          </div>
        </section>

        {/* Username card */}
        <section className="profile-card rounded-xl border border-coal-rule bg-coal-50/40 p-6 mb-4">
          <h2 className="font-display text-xl text-coal-900 mb-1">Username</h2>
          <p className="text-sm text-coal-600 mb-5">
            How you'll show up on leaderboards down the road.
          </p>

          <div className="flex gap-2">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.trim())}
              placeholder="username"
              className="flex-1 px-3 py-2.5 rounded-md bg-coal-50 border border-coal-rule text-coal-900 placeholder:text-coal-500 focus:border-accent focus:outline-none tx-color"
            />
            <button
              onClick={saveUsername}
              disabled={savingProfile || username.trim() === savedUsername || !username.trim()}
              className="press text-sm px-4 py-2.5 rounded-md bg-accent text-coal font-medium hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed tx-color"
            >
              {savingProfile ? 'Saving…' : 'Save'}
            </button>
          </div>
        </section>

        {/* Password card */}
        <section className="profile-card rounded-xl border border-coal-rule bg-coal-50/40 p-6 mb-4">
          <h2 className="font-display text-xl text-coal-900 mb-1">Change password</h2>
          <p className="text-sm text-coal-600 mb-5">
            Forgot your current one?{' '}
            <Link href="/forgot-password" className="text-accent hover:underline">
              Reset by email
            </Link>{' '}
            instead.
          </p>

          <form onSubmit={savePassword} className="space-y-3">
            <div>
              <label className="block text-xs uppercase tracking-wider text-coal-600 mb-1.5">
                Current password
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={oldPw}
                  onChange={(e) => setOldPw(e.target.value)}
                  autoComplete="current-password"
                  required
                  className="w-full pl-3 pr-10 py-2.5 rounded-md bg-coal-50 border border-coal-rule text-coal-900 focus:border-accent focus:outline-none tx-color"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-coal-500 hover:text-coal-900 tx-color"
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-coal-600 mb-1.5">
                New password
              </label>
              <input
                type={showPw ? 'text' : 'password'}
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                autoComplete="new-password"
                required
                className="w-full px-3 py-2.5 rounded-md bg-coal-50 border border-coal-rule text-coal-900 focus:border-accent focus:outline-none tx-color"
              />
              <p className="text-xs text-coal-500 mt-1.5">8+ characters with letters and a number.</p>
            </div>

            <button
              type="submit"
              disabled={savingPw}
              className="press text-sm px-4 py-2.5 rounded-md bg-accent text-coal font-medium hover:bg-accent/90 disabled:opacity-50 tx-color"
            >
              {savingPw ? 'Updating…' : 'Update password'}
            </button>
          </form>
        </section>
      </main>
      <Footer />
    </>
  );
}
