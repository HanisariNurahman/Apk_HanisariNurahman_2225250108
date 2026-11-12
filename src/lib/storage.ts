// Penyimpanan lokal (localStorage). Semua akses dibungkus try/catch:
// jika penyimpanan tidak tersedia (mode privat, diblokir), aplikasi tetap berjalan tanpa menyimpan.
// Tidak ada data pribadi: hanya kode siswa (mis. S01).

import type { AttemptLog, Progress, StepId } from '../types';
import { STEP_IDS } from '../types';

const PREFIX = 'peluangku:';

export const keys = {
  currentStudent: `${PREFIX}currentStudent`,
  classCode: `${PREFIX}classCode`,
  classKey: `${PREFIX}classKey`, // kunci kelas dari guru untuk header X-Class-Key (bukan data pribadi)
  progress: (code: string) => `${PREFIX}progress:${code}`,
  logs: (code: string) => `${PREFIX}logs:${code}`,
  synced: (code: string) => `${PREFIX}synced:${code}`,
  teacherPin: `${PREFIX}teacherPin`,
} as const;

function store(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = store()?.getItem(key);
    return raw == null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

/** Mengembalikan false jika gagal menyimpan (penyimpanan penuh/diblokir). */
export function writeJSON(key: string, value: unknown): boolean {
  try {
    const s = store();
    if (!s) return false;
    s.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function remove(key: string): void {
  try {
    store()?.removeItem(key);
  } catch {
    /* abaikan */
  }
}

/**
 * Kode siswa: satu huruf diikuti 1–3 angka (S01, S12, G1). Spasi dibuang, huruf dibesarkan.
 * Mengembalikan null jika format tidak sesuai — mencegah siswa mengetik nama.
 */
export function normalizeStudentCode(raw: string): string | null {
  const code = raw.trim().toUpperCase().replace(/\s+/g, '');
  return /^[A-Z]\d{1,3}$/.test(code) ? code : null;
}

export function getCurrentStudent(): string | null {
  const v = readJSON<unknown>(keys.currentStudent, null);
  return typeof v === 'string' ? normalizeStudentCode(v) : null;
}

export function setCurrentStudent(raw: string): string | null {
  const code = normalizeStudentCode(raw);
  if (code) writeJSON(keys.currentStudent, code);
  return code;
}

export function defaultProgress(studentCode: string): Progress {
  return {
    studentCode,
    lessonsDone: [],
    problemsDone: [],
    mastery: Object.fromEntries(STEP_IDS.map((s) => [s, 0])) as Record<StepId, number>,
    settings: { fontScale: 1, theme: 'auto' },
  };
}

/** Memuat progres; data rusak/lama digabung dengan nilai bawaan agar tidak error. */
export function loadProgress(studentCode: string): Progress {
  const base = defaultProgress(studentCode);
  const saved = readJSON<Partial<Progress> | null>(keys.progress(studentCode), null);
  if (!saved || typeof saved !== 'object') return base;
  return {
    studentCode,
    lessonsDone: Array.isArray(saved.lessonsDone) ? saved.lessonsDone : base.lessonsDone,
    problemsDone: Array.isArray(saved.problemsDone) ? saved.problemsDone : base.problemsDone,
    mastery: { ...base.mastery, ...(saved.mastery ?? {}) },
    settings: { ...base.settings, ...(saved.settings ?? {}) },
  };
}

export function saveProgress(progress: Progress): boolean {
  return writeJSON(keys.progress(progress.studentCode), progress);
}

export function loadLogs(studentCode: string): AttemptLog[] {
  const v = readJSON<unknown>(keys.logs(studentCode), []);
  return Array.isArray(v) ? (v as AttemptLog[]) : [];
}

export function appendLog(log: AttemptLog): boolean {
  const logs = loadLogs(log.studentCode);
  logs.push(log);
  return writeJSON(keys.logs(log.studentCode), logs);
}
