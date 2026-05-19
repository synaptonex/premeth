'use client';

// Mounted once in the root layout. Its only job is to run the referral
// capture hook so a ?ref= tag on any landing page is stored for signup.

import { useCaptureReferral } from '@/lib/referral';

export default function ReferralCapture() {
  useCaptureReferral();
  return null;
}
