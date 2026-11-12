// Kartu "Ingat lagi: Pecahan" (F8) — sumber: docs/CONTENT.md §7.
// Dibuka dari Beranda, atau muncul di Latihan saat siswa belum menyederhanakan (P_NOT_SIMPLE, IL03).

import type { Fraction } from '../types';

export type FractionCard =
  | { kind: 'bars'; title: string; body: string[]; bars: Fraction[] }
  | { kind: 'text'; title: string; body: string[] }
  | { kind: 'simplify'; title: string; given: Fraction };

export const FRACTION_CARDS: readonly FractionCard[] = [
  {
    kind: 'bars',
    title: 'Arti pecahan',
    body: ['Pecahan menyatakan bagian dari keseluruhan.', 'Batang dibagi 6 bagian sama besar. Ada 3 bagian diarsir, jadi 3/6.'],
    bars: [{ num: 3, den: 6 }],
  },
  {
    kind: 'bars',
    title: 'Pecahan senilai',
    body: ['3/6 dan 1/2 menunjukkan bagian yang sama besar.', 'Pecahan seperti ini disebut senilai.'],
    bars: [
      { num: 3, den: 6 },
      { num: 1, den: 2 },
    ],
  },
  {
    kind: 'text',
    title: 'Menyederhanakan',
    body: [
      'Bagi pembilang dan penyebut dengan FPB-nya.',
      'FPB dari 3 dan 6 adalah 3.',
      '3 : 3 = 1 dan 6 : 3 = 2, jadi 3/6 = 1/2.',
    ],
  },
  { kind: 'simplify', title: 'Latihan cepat 1', given: { num: 2, den: 4 } },
  { kind: 'simplify', title: 'Latihan cepat 2', given: { num: 4, den: 8 } },
  { kind: 'simplify', title: 'Latihan cepat 3', given: { num: 3, den: 9 } },
  { kind: 'simplify', title: 'Latihan cepat 4', given: { num: 5, den: 10 } },
];
