import { INDEXES } from './data/indexes';
import type { CategoryIndex, Paper } from './types';

// Index files are bundled directly via the static import above.
// Paper files (large; ~540MB total) live in Supabase Storage and are fetched on demand.

const PAPER_BUCKET = 'premeth-data';

function publicStorageUrl(category: string, paperId: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set');
  return `${base}/storage/v1/object/public/${PAPER_BUCKET}/${category}/${paperId}.json`;
}

export async function fetchIndex(category: string): Promise<CategoryIndex | null> {
  return INDEXES[category] ?? null;
}

export async function fetchPaper(category: string, paperId: string): Promise<Paper | null> {
  const url = publicStorageUrl(category, paperId);
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    return (await res.json()) as Paper;
  } catch {
    return null;
  }
}
