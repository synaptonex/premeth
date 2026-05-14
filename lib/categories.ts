// 31 categories that mirror the data folders in premeth-data.
// Display name + a one-line description so the /exams page reads like a menu, not a directory listing.

export interface CategoryInfo {
  slug: string;          // folder name in the data repo
  name: string;          // pretty display name
  description: string;   // one-liner
  group: 'Past Papers' | 'Subject Drills' | 'Programs' | 'Other';
}

export const CATEGORIES: CategoryInfo[] = [
  // Past Papers
  { slug: 'aku_papers',         name: 'AKU Papers',          description: 'Aga Khan University mock and practice tests.',         group: 'Past Papers' },
  { slug: 'pmc_papers',         name: 'PMC Papers',          description: 'Pakistan Medical Commission past papers.',             group: 'Past Papers' },
  { slug: 'nums_practice',      name: 'NUMS Practice',       description: 'NUMS entrance exam practice papers.',                  group: 'Past Papers' },
  { slug: 'fsc_board',          name: 'FSc Board',           description: 'FSc board exam papers across years.',                  group: 'Past Papers' },
  { slug: 'guess_papers',       name: 'Guess Papers',        description: 'Predicted question sets from senior coaches.',         group: 'Past Papers' },
  { slug: 'regional_punjab',    name: 'Punjab (UHS)',        description: 'UHS Punjab MDCAT papers.',                             group: 'Past Papers' },
  { slug: 'regional_sindh',     name: 'Sindh (DUHS)',        description: 'Sindh MDCAT papers from DUHS and partners.',           group: 'Past Papers' },
  { slug: 'regional_etea',      name: 'ETEA (KP)',           description: 'Khyber Pakhtunkhwa ETEA papers.',                      group: 'Past Papers' },
  { slug: 'regional_balochistan', name: 'Balochistan',       description: 'Balochistan regional papers.',                         group: 'Past Papers' },
  { slug: 'regional_federal',   name: 'Federal',             description: 'Federal board past papers.',                           group: 'Past Papers' },
  { slug: 'regional_papers',    name: 'Regional (Other)',    description: 'Other regional and provincial papers.',                group: 'Past Papers' },
  { slug: 'private_university', name: 'Private Universities', description: 'AKU, Ziauddin, and other private university papers.', group: 'Past Papers' },

  // Subject drills
  { slug: 'subject_biology',    name: 'Biology Drills',      description: 'Topic-by-topic Biology MCQs and explanations.',        group: 'Subject Drills' },
  { slug: 'subject_chemistry',  name: 'Chemistry Drills',    description: 'Inorganic, organic, and physical chemistry drills.',   group: 'Subject Drills' },
  { slug: 'subject_physics',    name: 'Physics Drills',      description: 'Mechanics, electricity, waves, and modern physics.',   group: 'Subject Drills' },
  { slug: 'subject_english',    name: 'English Drills',      description: 'Grammar, comprehension, and vocabulary practice.',     group: 'Subject Drills' },
  { slug: 'subject_logic',      name: 'Logical Reasoning',   description: 'Series, deductions, and logic puzzles.',               group: 'Subject Drills' },
  { slug: 'subject_cs',         name: 'Computer Science',    description: 'For ECAT and CS-track entry tests.',                   group: 'Subject Drills' },
  { slug: 'topical_mcqs',       name: 'Topical MCQs',        description: 'Cross-paper topic drills, grouped by chapter.',        group: 'Subject Drills' },

  // Programs
  { slug: '100_days_meth',      name: '100 Days of Meth',    description: 'The 100-day MDCAT countdown program.',                 group: 'Programs' },
  { slug: 'meth_course',        name: 'Meth Course',         description: 'The complete Meth-style preparation course.',          group: 'Programs' },
  { slug: 'ibtida_course',      name: 'Ibtida Course',       description: 'Foundation course for new MDCAT students.',            group: 'Programs' },
  { slug: 'crash_course',       name: 'Crash Course',        description: 'Last-month sprint for time-short students.',           group: 'Programs' },
  { slug: 'operation_mdcat',    name: 'Operation MDCAT',     description: 'Targeted operation-style mock series.',                group: 'Programs' },
  { slug: 'mdcat_cohorts',      name: 'MDCAT Cohorts',       description: 'Cohort-based weekly testing.',                         group: 'Programs' },

  // Tests
  { slug: 'daily_tests',        name: 'Daily Tests',         description: 'Daily 20–30 MCQ check-ins.',                           group: 'Other' },
  { slug: 'weekly_tests',       name: 'Weekly Tests',        description: 'Weekly evaluation tests across subjects.',             group: 'Other' },
  { slug: 'monthly_tests',      name: 'Monthly Tests',       description: 'Monthly progress evaluation tests.',                   group: 'Other' },
  { slug: 'practice_mcqs',      name: 'Practice MCQs',       description: 'General practice MCQ sets.',                           group: 'Other' },
  { slug: 'book_questions',     name: 'Book Questions',      description: 'Textbook-derived question sets.',                      group: 'Other' },
  { slug: 'other',              name: 'Other',               description: 'Miscellaneous papers and one-offs.',                   group: 'Other' },
];

export function getCategory(slug: string): CategoryInfo | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}

export const SUBJECT_COLORS: Record<string, string> = {
  Biology:            'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  Chemistry:          'bg-amber-500/15  text-amber-300  border-amber-500/30',
  Physics:            'bg-sky-500/15    text-sky-300    border-sky-500/30',
  English:            'bg-rose-500/15   text-rose-300   border-rose-500/30',
  'Logical Reasoning':'bg-violet-500/15 text-violet-300 border-violet-500/30',
  'Computer Science': 'bg-cyan-500/15   text-cyan-300   border-cyan-500/30',
};
