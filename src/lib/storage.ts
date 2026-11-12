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

/** Kode kelas dari guru, mis. "8A". Huruf/angka/tanda hubung, 1–16 karakter (sama dengan validasi backend). */
export function normalizeClassCode(raw: string): string | null {
  const code = raw.trim().toUpperCase().replace(/\s+/g, '');
  return /^[A-Z0-9-]{1,16}$/.test(code) ? code : null;
}

export function getClassCode(): string | null {
  const v = readJSON<unknown>(keys.classCode, null);
  return typeof v === 'string' ? normalizeClassCode(v) : null;
}

export function setClassCode(raw: string): string | null {
  const code = normalizeClassCode(raw);
  if (code) writeJSON(keys.classCode, code);
  return code;
}

/** Semua kode siswa yang punya log di HP ini (HP bisa dipakai bergantian). */
export function listStudentCodes(): string[] {
  const out = new Set<string>();
  try {
    const s = globalThis.localStorage;
    if (!s) return [];
    const prefix = keys.logs('');
    for (let i = 0; i < s.length; i++) {
      const k = s.key(i);
      if (k?.startsWith(prefix)) {
        const code = normalizeStudentCode(k.slice(prefix.length));
        if (code) out.add(code);
      }
    }
  } catch {
    /* penyimpanan tidak tersedia */
  }
  return [...out].sort();
}

/** Jawaban refleksi (F9). Disimpan di HP saja; tidak dikirim ke server (skema log tetap). */
export interface ReflectionEntry {
  source: string; // id soal, atau "simulasi"
  answers: Record<string, string>;
  text: string;
  at: string;
}

export function saveReflection(studentCode: string, entry: ReflectionEntry): boolean {
  const key = `peluangku:reflections:${studentCode}`;
  const list = readJSON<unknown>(key, []);
  const arr = Array.isArray(list) ? (list as ReflectionEntry[]) : [];
  arr.push(entry);
  return writeJSON(key, arr);
}

export function loadReflections(studentCode: string): ReflectionEntry[] {
  const v = readJSON<unknown>(`peluangku:reflections:${studentCode}`, []);
  return Array.isArray(v) ? (v as ReflectionEntry[]) : [];
}
