// Pembuatan AttemptLog (F11). id = UUID v4 dibuat di HP agar server bisa menolak kiriman ganda.

import type { AttemptLog, HintLevel, StepId } from '../types';

/** UUID v4. crypto.randomUUID hanya ada di konteks aman (HTTPS); di http://IP-laptop dipakai getRandomValues. */
export function uuid(rand: (bytes: Uint8Array) => Uint8Array = defaultRandom): string {
  const b = rand(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

function defaultRandom(bytes: Uint8Array): Uint8Array {
  if (globalThis.crypto?.getRandomValues) return globalThis.crypto.getRandomValues(bytes);
  for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  return bytes;
}

export interface StepRecord {
  step: StepId;
  startedAt: Date;
  endedAt: Date;
  tries: number;
  maxHintLevel: HintLevel;
  openedDiscussion: boolean;
  correct: boolean;
}

export function makeLog(
  who: { classCode: string; studentCode: string },
  problemId: string,
  r: StepRecord,
  id: string = uuid(),
): AttemptLog {
  const ended = r.endedAt < r.startedAt ? r.startedAt : r.endedAt;
  return {
    id,
    classCode: who.classCode,
    studentCode: who.studentCode,
    problemId,
    step: r.step,
    startedAt: r.startedAt.toISOString(),
    endedAt: ended.toISOString(),
    tries: r.tries,
    maxHintLevel: r.maxHintLevel,
    openedDiscussion: r.openedDiscussion,
    correct: r.correct,
  };
}
