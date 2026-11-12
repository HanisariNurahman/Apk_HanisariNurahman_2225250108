// Model data — sumber: docs/ARCHITECTURE.md §3

export type Fraction = { num: number; den: number };

export type Experiment = 'coin' | 'die' | 'balls' | 'cards' | 'spinner' | 'two-coins';

export interface SampleOutcome {
  id: string; // "d1".."d6", "coin-A", "ball-merah-1"
  label: string; // "1", "Angka", "Merah"
  icon: string; // path relatif di public/, mis. "dice/d1.svg"
  value?: number; // nilai angka (dadu, kartu) untuk memudahkan filter kejadian
}

/** [indeksKalimat, indeksAwal, indeksAkhir] pada `Problem.story`. */
export type Span = [number, number, number];

export type StepId = 'mark' | 'S' | 'A' | 'P' | 'check';

export const STEP_IDS: readonly StepId[] = ['mark', 'S', 'A', 'P', 'check'];

export type ProblemLevel = 'dasar' | 'cerita-pendek' | 'cerita-panjang' | 'lanjut';

export type HintLevel = 0 | 1 | 2 | 3;

export interface Problem {
  id: string; // "D-01"
  level: ProblemLevel;
  context: Experiment;
  structureTag: string; // untuk transfer (F10)
  story: string[]; // dipecah per kalimat (F4)
  knownSpans: Span[];
  askedSpans: Span[];
  sampleSpace: SampleOutcome[]; // S
  eventIds: string[]; // A ⊂ S
  answer: Fraction; // bentuk paling sederhana
  hints: Partial<Record<StepId, [string, string, string]>>; // L1, L2, L3
  discussion: string[]; // pembahasan lengkap (dibuka eksplisit)
  reflectionTemplate?: string;
  similarTo?: string[];
}

// Harus selalu sama dengan backend/app/schemas.py
export interface AttemptLog {
  id: string; // UUID dibuat di HP → server menolak duplikat (idempoten)
  classCode: string; // kode kelas dari guru, mis. "8A"
  studentCode: string;
  problemId: string;
  step: StepId;
  startedAt: string; // ISO
  endedAt: string;
  tries: number;
  maxHintLevel: HintLevel;
  openedDiscussion: boolean;
  correct: boolean;
}

export type FontScale = 1 | 1.15 | 1.3;
export type ThemeSetting = 'auto' | 'light' | 'dark';

export interface Progress {
  studentCode: string;
  lessonsDone: string[];
  problemsDone: string[];
  mastery: Record<StepId, number>; // streak benar tanpa petunjuk (fading)
  settings: { fontScale: FontScale; theme: ThemeSetting };
}
