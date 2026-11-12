// Logika Beranda (DESIGN §4.1): ke mana tombol "Lanjutkan" membawa siswa, dan ringkasan progres.

import type { LessonOutline } from '../content/lessons';
import type { Progress } from '../types';

export interface ContinueTarget {
  /** Teks di atas tombol, mis. "Kejadian". */
  title: string;
  /** Keterangan pendek, mis. "Subbab 3 dari 4". */
  detail: string;
  /** Rute tujuan (HashRouter). */
  to: string;
}

/** Subbab pertama yang belum selesai, mengikuti urutan tetap. Semua selesai → Latihan. */
export function continueTarget(progress: Progress, lessons: readonly LessonOutline[]): ContinueTarget {
  const done = new Set(progress.lessonsDone);
  const index = lessons.findIndex((l) => !done.has(l.id));
  if (index === -1) {
    return { title: 'Latihan', detail: 'Semua subbab sudah selesai', to: '/latihan' };
  }
  const lesson = lessons[index];
  return { title: lesson.title, detail: `Subbab ${index + 1} dari ${lessons.length}`, to: `/belajar/${lesson.id}` };
}

/** Banyak subbab selesai (hanya id yang dikenal, agar data lama/rusak tidak membuat angka > total). */
export function lessonsDoneCount(progress: Progress, lessons: readonly LessonOutline[]): number {
  const done = new Set(progress.lessonsDone);
  return lessons.filter((l) => done.has(l.id)).length;
}

/** Lempar berulang (10×/50×) di Simulasi dibuka setelah subbab Peluang selesai (F7, IL04). */
export function repeatedTrialsUnlocked(progress: Progress): boolean {
  return progress.lessonsDone.includes('peluang');
}
