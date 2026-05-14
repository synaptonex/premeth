import type { CategoryIndex, Paper } from './types';

// Index files are bundled in /public/data/indexes/{category}.json so they ship
// with the deploy and load instantly when browsing the catalog.
//
// Paper files (large; ~540MB total) live in Supabase Storage and are fetched
// on demand. The upload script (scripts/upload-data.mjs) puts them in a public
// bucket named "premeth-data" at the path {category}/{paperId}.json.

const PAPER_BUCKET = 'premeth-data';

function publicStorageUrl(category: string, paperId: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set');
  }
  return `${base}/storage/v1/object/public/${PAPER_BUCKET}/${category}/${paperId}.json`;
}

/** Fetch the index for a category. Cached aggressively — these rarely change. */
export async function fetchIndex(category: string): Promise<CategoryIndex | null> {
  // In the browser, fetch from /public/data/indexes. On the server, do the same
  // via a fully-qualified URL or the filesystem. Easiest: import-time JSON.
  try {
    const indexes = await import('./data/indexes');
    return indexes.INDEXES[category] ?? null;
  } catch {
    return null;
  }
}

/** Fetch a full paper (questions + options + explanations) from Supabase Storage. */
export async function fetchPaper(category: string, paperId: string): Promise<Paper | null> {
  const url = publicStorageUrl(category, paperId);
  try {
    const res = await fetch(url, {
      // Cache aggressively — paper content is immutable.
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return (await res.json()) as Paper;
  } catch {
    return null;
  }
}
