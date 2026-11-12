// Penilai jawaban per langkah + umpan balik beralasan (F6, GL02).
// Pesan mengikuti docs/CONTENT.md §6. Nada: tidak menghakimi, sebut bagian yang keliru dan alasannya.

import type { Fraction, Problem, Span } from '../types';
import { equals, format, isSimplest, isValid, normalize, simplify, toNumber } from './fraction';
import { countByLabel } from './sampleSpace';

export type FeedbackCode =
  | 'OK'
  | 'MARK_KNOWN'
  | 'MARK_ASKED'
  | 'S_PARTIAL'
  | 'S_MISCOUNT'
  | 'A_WRONG_SET'
  | 'A_MISSING'
  | 'A_GT_S'
  | 'A_MISCOUNT'
  | 'P_ZERO_DEN'
  | 'P_INVERTED'
  | 'P_OUT_RANGE'
  | 'P_WRONG'
  | 'P_NOT_SIMPLE';

export interface GradeResult {
  ok: boolean;
  code: FeedbackCode;
  message: string;
}

export type StepInput =
  | { step: 'mark'; known: Span[]; asked: Span[] }
  | { step: 'S'; count: number }
  | { step: 'A'; ids: string[] }
  | { step: 'A'; count: number }
  | { step: 'P'; value: Fraction }
  | { step: 'check'; value: Fraction };

const ok = (message: string): GradeResult => ({ ok: true, code: 'OK', message });
const fail = (code: Exclude<FeedbackCode, 'OK'>, message: string): GradeResult => ({ ok: false, code, message });

export function gradeStep(problem: Problem, input: StepInput): GradeResult {
  switch (input.step) {
    case 'mark':
      return gradeMark(problem, input.known, input.asked);
    case 'S':
      return gradeSampleSpace(problem, input.count);
    case 'A':
      return 'ids' in input ? gradeEventIds(problem, input.ids) : gradeEventCount(problem, input.count);
    case 'P':
      return gradeProbability(problem, input.value, false);
    case 'check':
      return gradeProbability(problem, input.value, true);
  }
}

// ① Tandai diketahui / ditanya
function gradeMark(problem: Problem, known: Span[], asked: Span[]): GradeResult {
  if (!sameSpans(known, problem.knownSpans)) {
    return fail('MARK_KNOWN', 'Cek lagi bagian yang diketahui. Cari benda atau jumlah yang disebutkan di soal.');
  }
  if (!sameSpans(asked, problem.askedSpans)) {
    return fail('MARK_ASKED', 'Cek lagi bagian yang ditanya. Biasanya ada di kalimat dengan kata "berapa".');
  }
  return ok('Tepat! Sekarang kamu tahu apa yang diketahui dan apa yang ditanya.');
}

// ② Ruang sampel
function gradeSampleSpace(problem: Problem, count: number): GradeResult {
  const nS = problem.sampleSpace.length;
  const nA = problem.eventIds.length;
  if (count === nS) {
    return ok(`Tepat! Ada ${nS} hasil yang mungkin, jadi n(S) = ${nS}.`);
  }
  if (!Number.isInteger(count) || count < 0) {
    return fail('S_MISCOUNT', 'n(S) adalah banyaknya hasil, jadi berupa bilangan cacah. Coba hitung lagi.');
  }
  const groupSizes = new Set(countByLabel(problem.sampleSpace).values());
  if (count < nS && (count === nA || groupSizes.has(count))) {
    return fail(
      'S_PARTIAL',
      `${count} itu baru sebagian hasil. Ruang sampel adalah SEMUA hasil yang mungkin muncul.`,
    );
  }
  return fail('S_MISCOUNT', 'Coba hitung lagi semua kemungkinannya satu per satu.');
}

// ③ Kejadian (dipilih pada papan titik sampel)
function gradeEventIds(problem: Problem, ids: string[]): GradeResult {
  const chosen = new Set(ids);
  const event = new Set(problem.eventIds);
  const labelOf = new Map(problem.sampleSpace.map((o) => [o.id, o.label]));

  const extra = [...chosen].filter((id) => !event.has(id));
  if (extra.length > 0) {
    const label = labelOf.get(extra[0]) ?? extra[0];
    return fail('A_WRONG_SET', `"${label}" tidak sesuai dengan yang ditanyakan. Baca lagi pertanyaannya.`);
  }
  const missing = [...event].filter((id) => !chosen.has(id));
  if (missing.length > 0) {
    return fail('A_MISSING', 'Pilihanmu sudah benar, tetapi masih ada hasil lain yang sesuai pertanyaan. Cari lagi.');
  }
  return okEvent(problem);
}

// ③ Kejadian (diisi sebagai angka)
function gradeEventCount(problem: Problem, count: number): GradeResult {
  const nS = problem.sampleSpace.length;
  if (count > nS) {
    return fail(
      'A_GT_S',
      'Kejadian adalah bagian dari ruang sampel, jadi n(A) tidak bisa lebih besar dari n(S).',
    );
  }
  if (count === problem.eventIds.length) return okEvent(problem);
  return fail('A_MISCOUNT', 'Hitung lagi hanya hasil yang sesuai dengan pertanyaan.');
}

function okEvent(problem: Problem): GradeResult {
  const nA = problem.eventIds.length;
  return nA === 0
    ? ok('Tepat! Tidak ada hasil yang sesuai, jadi n(A) = 0.')
    : ok(`Tepat! Ada ${nA} hasil yang sesuai pertanyaan, jadi n(A) = ${nA}.`);
}

// ④ Hitung P(A) dan ⑤ Periksa (harus paling sederhana)
function gradeProbability(problem: Problem, raw: Fraction, requireSimplest: boolean): GradeResult {
  if (!isValid(raw)) {
    return raw.den === 0
      ? fail('P_ZERO_DEN', 'Penyebut tidak boleh 0. Penyebut adalah n(S), banyak semua kemungkinan.')
      : fail('P_WRONG', 'Isi pembilang dan penyebut dengan bilangan bulat.');
  }
  const value = normalize(raw);
  const nS = problem.sampleSpace.length;
  const nA = problem.eventIds.length;
  const answer = problem.answer;

  const inverted =
    toNumber(value) > 1 &&
    ((value.num === nS && value.den === nA) ||
      (answer.num !== 0 && equals(value, { num: answer.den, den: answer.num })));
  if (inverted) {
    return fail('P_INVERTED', 'Pecahanmu lebih dari 1. Apakah pembilang dan penyebutnya tertukar?');
  }
  if (toNumber(value) < 0 || toNumber(value) > 1) {
    return fail('P_OUT_RANGE', 'Peluang selalu antara 0 dan 1. Apakah n(A) lebih besar dari n(S)?');
  }
  if (!equals(value, answer)) {
    if (value.den !== nS && !isSimplest(value)) {
      return fail('P_WRONG', 'Ingat P(A) = n(A) / n(S). Cek lagi n(A) dan n(S) yang sudah kamu temukan.');
    }
    return fail(
      'P_WRONG',
      value.den === nS
        ? 'Penyebutnya sudah tepat. Cek lagi pembilangnya: berapa banyak hasil yang ditanyakan?'
        : 'Ingat P(A) = n(A) / n(S). Penyebutnya adalah banyak SEMUA kemungkinan.',
    );
  }
  if (requireSimplest && !isSimplest(value)) {
    return fail('P_NOT_SIMPLE', `Nilainya sudah benar! Bisakah ${format(value)} disederhanakan?`);
  }
  if (requireSimplest) {
    return ok(`Tepat! Peluangnya ${format(value)}, dan nilainya antara 0 dan 1.`);
  }
  return ok(`Tepat! P(A) = ${nA}/${nS}.`);
}

function sameSpans(a: Span[], b: Span[]): boolean {
  const key = (s: Span) => s.join(':');
  const sa = new Set(a.map(key));
  const sb = new Set(b.map(key));
  return sa.size === sb.size && [...sa].every((k) => sb.has(k));
}

/**
 * Pemeriksa konsistensi data soal (untuk uji konten di M4).
 * Mengembalikan daftar masalah; kosong berarti soal konsisten.
 */
export function checkProblem(problem: Problem): string[] {
  const issues: string[] = [];
  const ids = problem.sampleSpace.map((o) => o.id);
  const idSet = new Set(ids);
  if (idSet.size !== ids.length) issues.push('id titik sampel tidak unik');
  if (problem.sampleSpace.length === 0) issues.push('ruang sampel kosong');
  for (const id of problem.eventIds) {
    if (!idSet.has(id)) issues.push(`eventId "${id}" tidak ada di ruang sampel`);
  }
  if (new Set(problem.eventIds).size !== problem.eventIds.length) issues.push('eventIds duplikat');
  if (!isValid(problem.answer) || !isSimplest(problem.answer)) {
    issues.push('answer harus pecahan paling sederhana');
  } else if (problem.sampleSpace.length > 0) {
    const expected = simplify({ num: problem.eventIds.length, den: problem.sampleSpace.length });
    if (!equals(expected, problem.answer)) {
      issues.push(`answer ${format(problem.answer)} ≠ n(A)/n(S) = ${format(expected)}`);
    }
  }
  const checkSpan = ([i, start, end]: Span, kind: string) => {
    const sentence = problem.story[i];
    if (sentence === undefined || start < 0 || end > sentence.length || start >= end) {
      issues.push(`${kind} span [${i},${start},${end}] di luar kalimat`);
    }
  };
  problem.knownSpans.forEach((s) => checkSpan(s, 'known'));
  problem.askedSpans.forEach((s) => checkSpan(s, 'asked'));
  return issues;
}
