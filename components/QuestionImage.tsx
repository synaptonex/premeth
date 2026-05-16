'use client';

// Renders an image from a question's `image` or `explanationImage` field.
// The data uses absolute URLs in some files and relative paths in others;
// this component handles both and falls back gracefully if the asset is broken.

import { useState } from 'react';
import { ImageOff } from 'lucide-react';

interface Props {
  src: string;
  alt: string;
  className?: string;
}

function resolveSrc(src: string): string {
  if (!src) return '';
  if (src.startsWith('http://') || src.startsWith('https://')) return src;
  // Some legacy paths in the dataset look like "/images/..." — leave them; if
  // the data team migrates images to Supabase Storage, swap this for the
  // storage URL builder.
  return src;
}

export default function QuestionImage({ src, alt, className = '' }: Props) {
  const [errored, setErrored] = useState(false);

  if (!src) return null;

  if (errored) {
    return (
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-md bg-coal-50 border border-coal-rule text-coal-600 text-xs ${className}`}
      >
        <ImageOff className="h-4 w-4" />
        Diagram could not be loaded. You can flag this question to help fix it.
      </div>
    );
  }

  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src={resolveSrc(src)}
      alt={alt}
      onError={() => setErrored(true)}
      className={`max-w-full rounded-md border border-coal-rule bg-coal-50 ${className}`}
      loading="lazy"
    />
  );
}
