#!/usr/bin/env node
// Tiny one-off: upload just the three files that failed during the bulk run.
// Update FILES below if you need to retry different ones.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// Load .env.local
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

// The three files that failed. Format: { category, file }.
// To use this script later for other files, just edit this list.
const FILES = [
  { category: 'subject_logic',  file: 'logical_deduction_past_paper_eng.json' },
  { category: 'subject_chemistry', file: 'chemistry_of_life_past_paper_eng.json' },
  { category: 'ibtida_course',  file: 'ibtida_mdcat_weekly_test_23.json' },
];

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false },
});

let uploaded = 0;
let failed = 0;

for (const { category, file } of FILES) {
  const full = path.join(dataDir, category, file);
  if (!fs.existsSync(full)) {
    console.error(`  ✗ NOT FOUND on disk: ${category}/${file}`);
    failed++;
    continue;
  }

  // Try up to 3 times. Network blips are the usual cause of the failures.
  let lastErr = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    const buf = fs.readFileSync(full);
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(`${category}/${file}`, buf, {
        contentType: 'application/json',
        cacheControl: '31536000',
        upsert: true,
      });

    if (!error) {
      console.log(`  ✓ ${category}/${file} (attempt ${attempt})`);
      uploaded++;
      lastErr = null;
      break;
    }
    lastErr = error;
    console.log(`  ... attempt ${attempt} failed: ${error.message}. Retrying.`);
    await new Promise((r) => setTimeout(r, 1500));
  }

  if (lastErr) {
    console.error(`  ✗ ${category}/${file}: ${lastErr.message}`);
    failed++;
  }
}

console.log(`\nDone.  Uploaded: ${uploaded}   Failed: ${failed}`);