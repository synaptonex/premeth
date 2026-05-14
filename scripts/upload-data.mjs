#!/usr/bin/env node
// One-time upload script. Run AFTER creating a Supabase project and bucket.
//
// Setup:
//   1. In Supabase Studio → Storage → New Bucket → name "premeth-data" → make public.
//   2. In your .env.local, set SUPABASE_SERVICE_ROLE_KEY (NOT the anon key —
//      the service role bypasses RLS so uploads work).
//   3. Run: npm run upload-data -- /path/to/premeth-data
//      (or set PREMETH_DATA_DIR env var)
//
// The script uploads every paper JSON to {category}/{paperId}.json in the bucket.
// Skips files already present (so re-running is safe and resumable).

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// Load .env.local manually (no extra deps).
const envFile = path.join(ROOT, '.env.local');
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (m) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = 'premeth-data';

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const dataDir =
  process.argv[2] ||
  process.env.PREMETH_DATA_DIR ||
  path.resolve(ROOT, '../premeth-data-main');

if (!fs.existsSync(dataDir)) {
  console.error(`Data directory not found: ${dataDir}`);
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false },
});

// Confirm bucket exists (or create it).
{
  const { data: buckets, error } = await supabase.storage.listBuckets();
  if (error) {
    console.error('Could not list buckets:', error.message);
    process.exit(1);
  }
  if (!buckets.find((b) => b.name === BUCKET)) {
    console.log(`Creating bucket "${BUCKET}"...`);
    const { error: createErr } = await supabase.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: 5_000_000, // 5MB per file — papers are well under this
    });
    if (createErr) {
      console.error('Could not create bucket:', createErr.message);
      process.exit(1);
    }
  }
}

const categories = fs.readdirSync(dataDir, { withFileTypes: true })
  .filter((d) => d.isDirectory() && d.name !== 'scripts' && !d.name.startsWith('.'))
  .map((d) => d.name);

let uploaded = 0;
let skipped = 0;
let failed = 0;

for (const cat of categories) {
  const dir = path.join(dataDir, cat);
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json') && f !== 'index.json');

  console.log(`\n[${cat}] ${files.length} papers`);

  // List existing keys in this category to enable resume.
  const { data: existing } = await supabase.storage.from(BUCKET).list(cat, { limit: 5000 });
  const existingNames = new Set((existing || []).map((o) => o.name));

  for (const file of files) {
    if (existingNames.has(file)) {
      skipped++;
      continue;
    }
    const full = path.join(dir, file);
    const buf = fs.readFileSync(full);
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(`${cat}/${file}`, buf, {
        contentType: 'application/json',
        cacheControl: '31536000', // 1 year — content is immutable
        upsert: false,
      });

    if (error) {
      console.error(`  ✗ ${file}: ${error.message}`);
      failed++;
    } else {
      uploaded++;
      if (uploaded % 25 === 0) process.stdout.write('.');
    }
  }
}

console.log(`\n\nDone.  Uploaded: ${uploaded}   Skipped (already there): ${skipped}   Failed: ${failed}`);
