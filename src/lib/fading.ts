// Fading (F5): langkah yang sudah dikuasai (benar tanpa bantuan dua kali berturut-turut) diringkas
// pada soal berikutnya. Langkah ④ dan ⑤ (inti perhitungan) tidak pernah diringkas.

import type { ProblemLevel, StepId } from '../types';

export const FADE_AFTER = 2;
export const FADEABLE: readonly StepId[] = ['mark', 'S', 'A'];

export interface StepOutcome {
  tries: number;
  maxHintLevel: number;
  openedDiscussion: boolean;
  correct: boolean;
}

/** Mandiri = benar pada percobaan pertama, tanpa petunjuk, tanpa membuka pembahasan. */
export function isIndependent(o: StepOutcome): boolean {
  return o.correct && o.tries === 1 && o.maxHintLevel === 0 && !o.openedDiscussion;
}

export function updateMastery(
  mastery: Record<StepId, number>,
  step: StepId,
  outcome: StepOutcome,
): Record<StepId, number> {
  return { ...mastery, [step]: isIndependent(outcome) ? (mastery[step] ?? 0) + 1 : 0 };
}

/**
 * Diringkas bila sudah dikuasai. Penandaan pada cerita panjang tidak pernah diringkas,
 * karena di sana ada informasi pengecoh yang justru harus dilatih (EL01).
 */
export function isFaded(mastery: Record<StepId, number>, step: StepId, level: ProblemLevel): boolean {
  if (!FADEABLE.includes(step)) return false;
  if (step === 'mark' && level === 'cerita-panjang') return false;
  return (mastery[step] ?? 0) >= FADE_AFTER;
}
