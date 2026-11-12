// Ekspor CSV lokal di Area guru (F11, cadangan bila server tidak tersedia).
// Kolom sama dengan GET /api/teacher/logs?format=csv agar analysis/report.py bisa membaca keduanya.

import type { AttemptLog } from '../types';

export const CSV_COLUMNS = [
  'id', 'class_code', 'student_code', 'problem_id', 'step', 'started_at', 'ended_at',
  'tries', 'max_hint_level', 'opened_discussion', 'correct',
] as const; // prettier-ignore

function cell(v: string | number | boolean): string {
  const s = typeof v === 'boolean' ? (v ? 'True' : 'False') : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function logsToCsv(logs: AttemptLog[]): string {
  const rows = logs.map((l) =>
    [
      l.id, l.classCode, l.studentCode, l.problemId, l.step, l.startedAt, l.endedAt,
      l.tries, l.maxHintLevel, l.openedDiscussion, l.correct,
    ].map(cell).join(','), // prettier-ignore
  );
  return [CSV_COLUMNS.join(','), ...rows].join('\n') + '\n';
}
