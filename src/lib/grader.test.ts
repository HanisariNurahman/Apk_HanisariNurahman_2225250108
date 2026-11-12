import { describe, expect, it } from 'vitest';
import type { Problem } from '../types';
import { checkProblem, gradeStep } from './grader';
import { frac } from './fraction';
import { balls, die, pickIds } from './sampleSpace';

const S_DIE = die();

// Soal pemicu-mirip: peluang angka genap pada dadu → 1/2
const genap: Problem = {
  id: 'T-GENAP',
  level: 'dasar',
  context: 'die',
  structureTag: 'satu-dadu-himpunan-bagian',
  story: ['Sebuah dadu dilempar satu kali.', 'Berapa peluang muncul angka genap?'],
  knownSpans: [[0, 0, 31]],
  askedSpans: [[1, 0, 34]],
  sampleSpace: S_DIE,
  eventIds: pickIds(S_DIE, (o) => (o.value ?? 0) % 2 === 0),
  answer: frac(1, 2),
  hints: {},
  discussion: [],
};

// C-01: 3 merah, 2 biru, peluang biru → 2/5
const S_BALLS = balls({ Merah: 3, Biru: 2 });
const biru: Problem = {
  ...genap,
  id: 'C-01',
  context: 'balls',
  story: ['Dalam kantong ada 3 bola merah dan 2 bola biru.', 'Berapa peluang terambil bola biru?'],
  knownSpans: [[0, 0, 47]],
  askedSpans: [[1, 0, 34]],
  sampleSpace: S_BALLS,
  eventIds: pickIds(S_BALLS, (o) => o.label === 'Biru'),
  answer: frac(2, 5),
};

// D-05: angka 7 → 0
const mustahil: Problem = { ...genap, id: 'D-05', eventIds: [], answer: frac(0, 1) };

describe('① tandai', () => {
  it('benar jika span sama (urutan bebas)', () => {
    expect(gradeStep(genap, { step: 'mark', known: [[0, 0, 31]], asked: [[1, 0, 34]] }).ok).toBe(true);
  });
  it('MARK_KNOWN / MARK_ASKED', () => {
    expect(gradeStep(genap, { step: 'mark', known: [], asked: [[1, 0, 34]] }).code).toBe('MARK_KNOWN');
    expect(gradeStep(genap, { step: 'mark', known: [[0, 0, 31]], asked: [[0, 0, 31]] }).code).toBe('MARK_ASKED');
  });
});

describe('② ruang sampel', () => {
  it('benar', () => expect(gradeStep(genap, { step: 'S', count: 6 }).ok).toBe(true));
  it('S_PARTIAL: mengisi n(A) sebagai n(S)', () => {
    expect(gradeStep(genap, { step: 'S', count: 3 }).code).toBe('S_PARTIAL');
  });
  it('S_PARTIAL: hanya bola merah (salah satu kelompok)', () => {
    expect(gradeStep(biru, { step: 'S', count: 3 }).code).toBe('S_PARTIAL');
    expect(gradeStep(biru, { step: 'S', count: 2 }).code).toBe('S_PARTIAL');
  });
  it('S_MISCOUNT', () => {
    expect(gradeStep(genap, { step: 'S', count: 5 }).code).toBe('S_MISCOUNT');
    expect(gradeStep(genap, { step: 'S', count: -1 }).code).toBe('S_MISCOUNT');
    expect(gradeStep(genap, { step: 'S', count: 2.5 }).code).toBe('S_MISCOUNT');
  });
});

describe('③ kejadian', () => {
  it('benar dari papan (urutan & duplikat tidak masalah)', () => {
    expect(gradeStep(genap, { step: 'A', ids: ['d6', 'd2', 'd4', 'd2'] }).ok).toBe(true);
  });
  it('A_WRONG_SET menyebut label yang keliru', () => {
    const r = gradeStep(genap, { step: 'A', ids: ['d2', 'd3'] });
    expect(r.code).toBe('A_WRONG_SET');
    expect(r.message).toContain('"3"');
  });
  it('A_MISSING', () => {
    expect(gradeStep(genap, { step: 'A', ids: ['d2', 'd4'] }).code).toBe('A_MISSING');
  });
  it('A_GT_S saat diisi angka', () => {
    expect(gradeStep(genap, { step: 'A', count: 7 }).code).toBe('A_GT_S');
  });
  it('A_MISCOUNT / benar saat diisi angka', () => {
    expect(gradeStep(genap, { step: 'A', count: 2 }).code).toBe('A_MISCOUNT');
    expect(gradeStep(genap, { step: 'A', count: 3 }).ok).toBe(true);
  });
  it('kejadian mustahil: n(A) = 0', () => {
    expect(gradeStep(mustahil, { step: 'A', ids: [] }).ok).toBe(true);
  });
});

describe('④ hitung P(A)', () => {
  it('3/6 diterima di langkah hitung', () => {
    expect(gradeStep(genap, { step: 'P', value: frac(3, 6) }).ok).toBe(true);
  });
  it('1/2 juga diterima', () => {
    expect(gradeStep(genap, { step: 'P', value: frac(1, 2) }).ok).toBe(true);
  });
  it('P_INVERTED: n(S)/n(A)', () => {
    expect(gradeStep(genap, { step: 'P', value: frac(6, 3) }).code).toBe('P_INVERTED');
    expect(gradeStep(biru, { step: 'P', value: frac(5, 2) }).code).toBe('P_INVERTED');
  });
  it('P_OUT_RANGE', () => {
    expect(gradeStep(genap, { step: 'P', value: frac(7, 6) }).code).toBe('P_OUT_RANGE');
    expect(gradeStep(genap, { step: 'P', value: frac(-1, 6) }).code).toBe('P_OUT_RANGE');
  });
  it('P_ZERO_DEN', () => {
    expect(gradeStep(genap, { step: 'P', value: frac(3, 0) }).code).toBe('P_ZERO_DEN');
  });
  it('P_WRONG: penyebut benar, pembilang salah', () => {
    const r = gradeStep(genap, { step: 'P', value: frac(2, 6) });
    expect(r.code).toBe('P_WRONG');
    expect(r.message).toContain('pembilang');
  });
  it('P_WRONG: penyebut salah', () => {
    const r = gradeStep(biru, { step: 'P', value: frac(2, 3) });
    expect(r.code).toBe('P_WRONG');
    expect(r.message).toContain('Penyebut');
  });
  it('penyebut negatif dinormalkan', () => {
    expect(gradeStep(genap, { step: 'P', value: frac(-3, -6) }).ok).toBe(true);
  });
});

describe('⑤ periksa', () => {
  it('P_NOT_SIMPLE: benar tetapi belum disederhanakan', () => {
    const r = gradeStep(genap, { step: 'check', value: frac(3, 6) });
    expect(r.ok).toBe(false);
    expect(r.code).toBe('P_NOT_SIMPLE');
  });
  it('bentuk paling sederhana diterima', () => {
    expect(gradeStep(genap, { step: 'check', value: frac(1, 2) }).ok).toBe(true);
    expect(gradeStep(biru, { step: 'check', value: frac(2, 5) }).ok).toBe(true);
  });
  it('kejadian mustahil: 0/1 benar, 0/6 belum sederhana', () => {
    expect(gradeStep(mustahil, { step: 'check', value: frac(0, 1) }).ok).toBe(true);
    expect(gradeStep(mustahil, { step: 'check', value: frac(0, 6) }).code).toBe('P_NOT_SIMPLE');
  });
});

describe('checkProblem', () => {
  it('soal konsisten tidak punya masalah', () => {
    expect(checkProblem(genap)).toEqual([]);
    expect(checkProblem(biru)).toEqual([]);
    expect(checkProblem(mustahil)).toEqual([]);
  });
  it('menemukan jawaban yang tidak cocok', () => {
    expect(checkProblem({ ...genap, answer: frac(1, 3) }).join()).toContain('n(A)/n(S)');
  });
  it('menemukan jawaban yang belum sederhana', () => {
    expect(checkProblem({ ...genap, answer: frac(3, 6) })).toContain('answer harus pecahan paling sederhana');
  });
  it('menemukan eventId asing dan span di luar kalimat', () => {
    const issues = checkProblem({ ...genap, eventIds: ['d9'], knownSpans: [[5, 0, 3]] });
    expect(issues.some((s) => s.includes('d9'))).toBe(true);
    expect(issues.some((s) => s.includes('known span'))).toBe(true);
  });
});
