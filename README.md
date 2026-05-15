# Premeth+ Install Guide

Everything in this folder either drops into the existing `premeth-app` repo as-is, or replaces an existing file. **No package.json changes required** — the build uses libraries you already have (`@supabase/ssr`, `@supabase/supabase-js`, `gsap`, `framer-motion`, `lucide-react`, `sonner`, `tailwindcss`).

---

## What's in this drop

```
out/
├── supabase/migrations/0002_premeth_plus.sql   ← run this on Supabase
├── lib/
│   ├── premeth-plus.ts                          ← NEW: subscription helpers
│   └── streaks.ts                               ← NEW: streak computation
├── components/
│   ├── SessionHeartbeat.tsx                     ← NEW: anti-share session enforcement
│   ├── PremethPlusSection.tsx                   ← NEW: homepage upsell
│   ├── Navbar.tsx                               ← REPLACES existing
│   └── Footer.tsx                               ← REPLACES existing
├── app/
│   ├── layout.tsx                               ← REPLACES existing (adds heartbeat)
│   ├── page.tsx                                 ← REPLACES existing (adds upsell)
│   ├── dashboard/
│   │   ├── page.tsx                             ← REPLACES existing (adds + features row)
│   │   └── export/page.tsx                      ← NEW: PDF export
│   ├── pricing/page.tsx                         ← NEW: payment flow
│   ├── redeem/page.tsx                          ← NEW: code entry
│   ├── drill/page.tsx                           ← NEW: Adaptive Daily Drill
│   ├── vault/page.tsx                           ← NEW: Mistake Vault
│   ├── mock/page.tsx                            ← NEW: Timed Mock Exam
│   ├── goal/page.tsx                            ← NEW: Goal Tracker
│   ├── admin/payments/page.tsx                  ← NEW: admin dashboard
│   └── api/
│       ├── payments/submit/route.ts             ← NEW
│       ├── admin/approve/route.ts               ← NEW
│       ├── admin/reject/route.ts                ← NEW
│       ├── redeem/route.ts                      ← NEW
│       └── session/heartbeat/route.ts           ← NEW
└── PATCH_practice_page.ts                       ← MANUAL EDIT to existing practice page
```

---

## Step 1 — Run the database migration

In your Supabase project, open the SQL editor and paste in the contents of `supabase/migrations/0002_premeth_plus.sql`. Run it. This creates:

- `payment_requests` — JazzCash/EasyPaisa submissions awaiting verification
- `redemption_codes` — codes bound to specific buyers
- `subscriptions` — active Premeth+ subscriptions
- `session_fingerprints` — IP + user-agent hashes for sharing detection
- `mistake_vault` — wrong-answer spaced repetition queue
- `mock_exam_attempts` — full mock simulation results
- `study_goals` — exam date + daily target
- `streaks` — cached streak counts
- Plus the `payment-receipts` storage bucket and `public.is_premeth_plus()` helper function.

## Step 2 — Make yourself an admin

After the migration, you need to flag your own account as admin so you can approve payments. Find your user ID in the Supabase auth dashboard (Authentication → Users), then run:

```sql
update public.profiles set is_admin = true where id = 'YOUR-AUTH-UID-HERE';
```

Now visit `/admin/payments` while signed in to that account — you'll see the admin dashboard.

## Step 3 — Add your payment account details

Open `lib/premeth-plus.ts` and replace the placeholder phone numbers in `PAYMENT_ACCOUNTS`:

```ts
export const PAYMENT_ACCOUNTS = {
  jazzcash: {
    title: 'JazzCash',
    account_number: '03XX-XXXXXXX',  // ← your JazzCash number
    account_name: 'Your Name Here',
  },
  easypaisa: {
    title: 'EasyPaisa',
    account_number: '03XX-XXXXXXX',  // ← your EasyPaisa number
    account_name: 'Your Name Here',
  },
};
```

These are shown to the buyer on `/pricing` after they pick a method.

## Step 4 — Drop in the files

Copy every file under `out/` into the same path under your repo root. Things that overwrite existing files (`Navbar.tsx`, `Footer.tsx`, `layout.tsx`, `app/page.tsx`, `app/dashboard/page.tsx`) — back them up first if you want, then replace.

## Step 5 — Apply the practice page patch

Open `app/practice/[category]/[paperId]/page.tsx`. Find the `const finish = useCallback(...)` block (around line 122). Replace that callback with the version in `PATCH_practice_page.ts`. The change adds wrong-answer-to-vault upserts for paid users without changing existing behavior for free users.

## Step 6 — Deploy

```bash
npm run build
# then deploy via Vercel as usual
```

No new environment variables required.

---

## How the flow works end-to-end

### For the buyer

1. Buyer visits `/pricing`, picks JazzCash or EasyPaisa
2. They see the destination phone number and amount (Rs 999 founders / Rs 1,499 regular)
3. They send the payment from their own JazzCash/EasyPaisa app
4. They come back to `/pricing` and paste their **transaction ID** + sender phone
5. They get a "Pending approval — usually within 12 hours" confirmation
6. You (admin) review at `/admin/payments`, verify the TID in your JazzCash/EasyPaisa transaction history, click **Approve**
7. The system generates a unique code (e.g. `PRMTH-7K9R-M2X4`) **bound to that buyer's account**
8. You message the buyer the code (or it can be displayed to them in-app — they refresh `/pricing` and see it)
9. Buyer goes to `/redeem`, pastes the code, clicks Redeem
10. Their `subscriptions` row is created/extended — they're in

### For the system (anti-sharing)

- **Code-level**: Codes carry the buyer's `auth.uid()` in `issued_to`. Anyone else trying to redeem gets rejected. Sharing the code in a WhatsApp group does nothing.
- **Session-level**: `SessionHeartbeat` polls every 60s. If the user logs in from a second device, the second login generates a new session token; the first device sees a token mismatch on its next heartbeat and is kicked to `/login?kicked=1`.
- **Fingerprint-level**: Every heartbeat logs (IP_hash, UA_hash). If a user accumulates more than 5 distinct fingerprints in 7 days, `flagged_for_review = true` is set. You can see flagged users in the admin dashboard. No automatic ban — just a flag for you to investigate.
- **Personalization moat**: The actual deepest anti-share defense is that *the features are useless when shared*. Two people sharing one account would get a Mistake Vault polluted with each other's wrong answers, a Daily Drill that targets a weighted average of their weak topics (helping neither), and a streak that breaks every time the other person doesn't hit the daily target.

### For you (admin)

- Visit `/admin/payments` to see pending payments
- Click "Approve" on each verified one — a modal shows the generated code, you copy and message it
- Click "Reject" on suspicious ones — buyer gets nothing, you note the reason
- Scroll down to "Flagged accounts" to see anyone who's tripping the sharing fingerprint detector
- The flag-review job runs once per heartbeat; no extra cron needed

---

## What you can change later if you want

- **Pricing**: Edit `PREMETH_PLUS_PRICE_PKR` etc. in `lib/premeth-plus.ts`
- **Duration**: `PREMETH_PLUS_DURATION_MONTHS` (currently 6)
- **Founders limit**: `PREMETH_PLUS_FOUNDERS_LIMIT` (currently 100)
- **Mock exam quotas**: `SUBJECT_QUOTAS` in `app/mock/page.tsx` (currently set to official PMDC 200-MCQ format)
- **Streak target**: defaults to user's `daily_question_target` or 20 if unset
- **SR intervals**: `STAGE_INTERVALS_DAYS` in `app/vault/page.tsx` (currently 1/3/7/14/30, mastered at stage 6)
- **Fingerprint threshold**: `MAX_DISTINCT_FINGERPRINTS_PER_WEEK = 5` in the heartbeat route

---

## Things not implemented (intentionally)

- **No Stripe / no automated payments**. Manual approval is the right move for the Pakistani market — most students don't have credit cards, and JazzCash/EasyPaisa is universal. The labor cost of approving 10-50 payments a day is minimal at this scale.
- **No refunds API**. If you need to refund someone, do it manually via JazzCash and run `update subscriptions set status='cancelled' where user_id='...'`.
- **No referral program**. Easy to add later — the `redemption_codes` table can be extended with a `referrer_id` column.
- **No email notifications**. Buyers see status on `/pricing`. If you want automated email when payment is approved, wire Supabase auth's email service to the approval route.
- **No PDF library**. The export feature uses browser print-to-PDF for cleaner output and no bundle bloat.

---

## Testing locally

1. Create two test accounts (e.g. `test1@example.com`, `test2@example.com`)
2. Mark `test1` as admin
3. Sign in as `test2`, go to `/pricing`, submit a fake payment with a TID like `TEST123`
4. Switch to `test1`, go to `/admin/payments`, approve the request
5. Copy the generated code
6. Sign back in as `test2`, go to `/redeem`, paste the code
7. Verify `test2` can now access `/drill`, `/vault`, `/mock`, `/goal`, `/dashboard/export`
8. Try copying the same code into `test1` — it should fail with "This code is bound to another account"
9. Sign in as `test2` from a second browser — the first session should be kicked within 60 seconds

---

## Files marked NEW vs REPLACES

If something is marked **NEW**, just drop it in. If it's marked **REPLACES existing**, you're overwriting the file that was already there. The replacements are drop-in compatible with everything else in the codebase — no other files need to change.

The only manual edit required is `PATCH_practice_page.ts`, which patches a single callback inside the practice page (the rest of that file is fine).
