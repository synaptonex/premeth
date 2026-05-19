#!/usr/bin/env node
/* eslint-disable no-console */
// clean-missing-diagrams.mjs
//
// Some questions reference a diagram ("in the figure below", "the graph
// shown", etc.) but have "image": null, because the diagram was never
// captured. A student cannot answer those. This script finds them.
//
// It works on a LOCAL copy of the data directory, the same folder you used
// with build-indexes.mjs and upload-data.mjs. It does not touch Supabase.
// After cleaning locally and reviewing, re-upload with upload-data.mjs.
//
// Two modes:
//
//   npm run clean-diagrams -- report /path/to/premeth-data
//       Scans everything, changes NOTHING. Prints counts per category and a
//       sample of flagged question text so you can check the matching.
//
//   npm run clean-diagrams -- apply /path/to/premeth-data
//       Removes the flagged questions and rewrites the local JSON files.
//       Only run this after a report you trust. A backup copy of each
//       changed file is written next to it as <name>.json.bak first.
//
// The original past papers are not modified. Only the JSON data folder is.

import fs from 'node:fs';
import path from 'node:path';

// ── Phrase matching ──────────────────────────────────────────────────────────
// A question is "diagram-dependent" when its text clearly points at a visual
// that should be present. These patterns look for a figure being REFERRED TO,
// not just the word "structure" or "diagram" appearing in passing. If the
// report shows false positives, tighten this list and report again.
const DIAGRAM_PATTERNS = [
  /\bin the (figure|diagram|image|picture|graph|chart|illustration)\b/i,
  /\bthe (figure|diagram|image|picture|graph) (below|above|shown)\b/i,
  /\b(figure|diagram|graph) (below|above)\b/i,
  /\bshown in the (figure|diagram|image|picture|graph)\b/i,
  /\bfrom the (figure|diagram|graph) (below|above|shown)\b/i,
  /\brefer to the (figure|diagram|image|graph)\b/i,
  /\bthe following (diagram|figure|graph|image)\b/i,
  /\baccording to the (figure|diagram|graph)\b/i,
  /\bas shown (below|above|in the figure)\b/i,
  /\bgiven (figure|diagram)\b/i,
  /\bidentify the (structure|part|organ) (labell?ed|marked|shown|in)\b/i,
  /\bin the given (figure|diagram|image)\b/i,
];

function isDiagramDependent(text) {
  if (!text || typeof text !== 'string') return false;
  return DIAGRAM_PATTERNS.some((re) => re.test(text));
}

function imageIsMissing(q) {
  return q.image === null || q.image === undefined || q.image === '';
}

// ── Args ─────────────────────────────────────────────────────────────────────
const mode = process.argv[2];
const dataDir = process.argv[3] || process.env.PREMETH_DATA_DIR;

if (mode !== 'report' && mode !== 'apply') {
  console.error('Usage: node clean-missing-diagrams.mjs <report|apply> <data-dir>');
  process.exit(1);
}
if (!dataDir || !fs.existsSync(dataDir)) {
  console.error(`Data directory not found: ${dataDir || '(not given)'}`);
  console.error('Pass the path to your premeth-data folder.');
  process.exit(1);
}

// ── Walk ─────────────────────────────────────────────────────────────────────
const categories = fs.readdirSync(dataDir, { withFileTypes: true })
  .filter((d) => d.isDirectory() && !d.name.startsWith('.') && d.name !== 'scripts')
  .map((d) => d.name);

console.log(`Mode: ${mode}`);
console.log(`Data: ${dataDir}`);
console.log(`Categories: ${categories.length}\n`);

const perCategory = {};
const samples = [];
let totalQuestions = 0;
let totalFlagged = 0;
let filesChanged = 0;

for (const category of categories) {
  const catDir = path.join(dataDir, category);
  const files = fs.readdirSync(catDir).filter((f) => f.endsWith('.json') && !f.endsWith('.bak'));

  for (const file of files) {
    const full = path.join(catDir, file);
    let paper;
    try {
      paper = JSON.parse(fs.readFileSync(full, 'utf8'));
    } catch {
      console.error(`  Skipped unreadable file: ${category}/${file}`);
      continue;
    }
    if (!paper || !Array.isArray(paper.questions)) continue;

    const kept = [];
    let flaggedHere = 0;

    for (const q of paper.questions) {
      totalQuestions += 1;
      if (isDiagramDependent(q.text) && imageIsMissing(q)) {
        flaggedHere += 1;
        totalFlagged += 1;
        if (samples.length < 30) {
          samples.push(`[${category}] ${String(q.text).slice(0, 150)}`);
        }
      } else {
        kept.push(q);
      }
    }

    if (flaggedHere > 0) {
      perCategory[category] = (perCategory[category] ?? 0) + flaggedHere;
      if (mode === 'apply') {
        // Backup, then write the cleaned paper.
        fs.copyFileSync(full, `${full}.bak`);
        fs.writeFileSync(full, JSON.stringify({ ...paper, questions: kept }, null, 2));
        filesChanged += 1;
      }
    }
  }
}

// ── Report ───────────────────────────────────────────────────────────────────
console.log('Questions referencing a missing diagram, per category:');
for (const [cat, n] of Object.entries(perCategory).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${cat}: ${n}`);
}
console.log('');
console.log(`Total questions scanned:  ${totalQuestions}`);
console.log(`Total flagged for removal: ${totalFlagged}`);
if (totalQuestions > 0) {
  console.log(`Share of bank affected:    ${((totalFlagged / totalQuestions) * 100).toFixed(2)}%`);
}
console.log('');
console.log('Sample of flagged question text. Check these genuinely need a diagram:');
for (const s of samples) console.log(`  - ${s}`);

if (mode === 'report') {
  console.log('\nReport only. Nothing was changed.');
  console.log('If every sample above genuinely needs a diagram, re-run with: apply');
  console.log('If any sample does NOT need a diagram, do not run apply. Send the');
  console.log('false positives back so the matching can be tightened first.');
} else {
  console.log(`\nApply complete. ${filesChanged} files were cleaned.`);
  console.log('A .json.bak backup sits next to every changed file.');
  console.log('Next: re-run build-indexes, then upload-data, to push the cleaned set.');
}
