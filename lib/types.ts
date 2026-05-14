// Mirrors the schema documented in premeth-data/README.md exactly.
// Do not rename fields — the JSON files use these names.

export interface QuestionOption {
  letter: string;
  text: string;
  isCorrect: boolean;
  explanation: string;
}

export interface Question {
  text: string;
  image: string | null;
  subject: string;
  topic: string;
  year: number | null;
  options: QuestionOption[];
  explanation: string;
  explanationImage: string | null;
  hints: string[];
}

export interface Paper {
  questions: Question[];
}

export interface PaperMeta {
  id: string;
  // Several fields are nullable in legacy data; the UI handles that gracefully.
  name: string | null;
  subject: string | null;
  questionCount: number;
  topics: string[];
  year: number | null;
}

export interface CategoryIndex {
  papers: PaperMeta[];
}

export type Subject =
  | 'Biology'
  | 'Chemistry'
  | 'Physics'
  | 'English'
  | 'Logical Reasoning'
  | 'Computer Science';

export interface Profile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface QuestionReport {
  id: string;
  user_id: string;
  category: string;
  paper_id: string;
  question_index: number;
  reason: string;
  details: string | null;
  status: 'open' | 'reviewed' | 'fixed' | 'dismissed';
  created_at: string;
}

export interface Attempt {
  id: string;
  user_id: string;
  category: string;
  paper_id: string;
  score: number;
  total: number;
  correct_answers: number[];
  user_answers: (number | null)[];
  duration_seconds: number;
  completed_at: string;
}
