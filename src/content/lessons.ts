// Kartu Belajar (F1) — sumber: docs/CONTENT.md §2. Urutan TETAP: ruang sampel → titik sampel → kejadian → peluang (EL04).
// Satu kartu = satu ide dan paling banyak satu interaksi; ≤ 60 kata (diuji di content.test.ts).
// Jangan ubah urutan/isi tanpa memperbarui CONTENT.md dan TRACEABILITY.md.

import { balls, coin, die } from '../lib/sampleSpace';
import type { Fraction, SampleOutcome } from '../types';

export interface Visual {
  space: SampleOutcome[];
  /** Titik yang disorot sebagai kejadian A (warna "terpilih" + ✓). */
  highlight?: string[];
  showNS?: boolean;
  showNA?: boolean;
}

export type LessonCard =
  | { kind: 'text'; title: string; body: string[]; visual?: Visual; formula?: boolean }
  /** Ketuk semua titik sampel. */
  | { kind: 'tapAll'; title: string; prompt: string; space: SampleOutcome[]; done: string }
  /** Ketuk hanya titik yang termasuk kejadian. */
  | { kind: 'tapEvent'; title: string; prompt: string; space: SampleOutcome[]; eventIds: string[]; done: string }
  /** Isi satu bilangan (mis. n(S)). `near` = jawaban keliru yang umum + alasannya. */
  | {
      kind: 'count';
      title: string;
      prompt: string;
      label: string;
      visual?: Visual;
      answer: number;
      done: string;
      near: Record<number, string>;
      retry: string;
    }
  | { kind: 'choice'; title: string; prompt: string; options: { text: string; correct: boolean; reason: string }[] }
  | { kind: 'compare'; title: string; head: [string, string]; rows: [string, string][] }
  /** Contoh terurai: langkah ditampilkan satu per satu. */
  | { kind: 'worked'; title: string; steps: string[] }
  /** Contoh setengah jadi: langkah awal terisi, siswa mengisi P(A). */
  | {
      kind: 'complete';
      title: string;
      given: string[];
      prompt: string;
      space: SampleOutcome[];
      eventIds: string[];
      answer: Fraction;
    }
  | { kind: 'range'; title: string; body: string; points: { at: '0' | '1/2' | '1'; label: string }[] };

export interface Lesson {
  id: string;
  title: string;
  cards: LessonCard[];
}

/** Ringkasan subbab (dipakai Beranda tanpa memuat isi kartu). */
export type LessonOutline = Pick<Lesson, 'id' | 'title'>;

const DIE = die();
const evens = ['d2', 'd4', 'd6'];

export const LESSON_CONTENT: readonly Lesson[] = [
  {
    id: 'ruang-sampel',
    title: 'Ruang Sampel',
    cards: [
      {
        kind: 'text',
        title: 'Percobaan',
        body: ['Melempar dadu satu kali adalah sebuah percobaan.', 'Setiap kali dilempar, muncul satu hasil.'],
        visual: { space: DIE },
      },
      {
        kind: 'tapAll',
        title: 'Semua hasil yang mungkin',
        prompt: 'Hasil apa saja yang mungkin muncul? Ketuk semuanya.',
        space: DIE,
        done: 'Tepat! Ada 6 hasil yang mungkin, yaitu 1 sampai 6.',
      },
      {
        kind: 'text',
        title: 'Ruang sampel',
        body: [
          'Kumpulan semua hasil yang mungkin disebut ruang sampel.',
          'Ruang sampel ditulis S.',
          'Dadu: S = {1, 2, 3, 4, 5, 6}',
        ],
        visual: { space: DIE },
      },
      {
        kind: 'tapAll',
        title: 'Coba dengan koin',
        prompt: 'Koin dilempar sekali. Ketuk semua hasil yang mungkin.',
        space: coin(),
        done: 'Tepat! S = {Angka, Gambar}.',
      },
      {
        kind: 'count',
        title: 'Cek pemahaman',
        prompt: 'Kantong berisi 2 bola merah dan 1 bola biru. Satu bola diambil. Ada berapa bola yang mungkin terambil?',
        label: 'Banyak hasil',
        visual: { space: balls({ Merah: 2, Biru: 1 }) },
        answer: 3,
        done: 'Tepat! Ketiga bola bisa terambil, jadi ada 3 hasil yang mungkin.',
        near: {
          2: 'Itu baru bola merah. Bola biru juga bisa terambil.',
          1: 'Itu baru bola biru. Bola merah juga bisa terambil.',
        },
        retry: 'Hitung semua bola, merah dan biru, satu per satu.',
      },
    ],
  },
  {
    id: 'titik-sampel',
    title: 'Titik Sampel',
    cards: [
      {
        kind: 'text',
        title: 'Titik sampel',
        body: ['Setiap anggota ruang sampel disebut titik sampel.', 'Angka 4 adalah salah satu titik sampel dadu.'],
        visual: { space: DIE, highlight: ['d4'] },
      },
      {
        kind: 'text',
        title: 'Banyak titik sampel',
        body: ['Banyaknya titik sampel ditulis n(S).', 'Dadu punya 6 titik sampel, jadi n(S) = 6.'],
        visual: { space: DIE, showNS: true },
      },
      {
        kind: 'count',
        title: 'Latihan cepat: koin',
        prompt: 'Koin dilempar sekali. Berapa n(S)?',
        label: 'n(S)',
        visual: { space: coin() },
        answer: 2,
        done: 'Tepat! Koin punya 2 sisi, jadi n(S) = 2.',
        near: { 1: 'Itu satu sisi saja. Koin punya sisi Angka dan sisi Gambar.' },
        retry: 'Hitung sisi koin yang mungkin muncul.',
      },
      {
        kind: 'count',
        title: 'Latihan cepat: dadu',
        prompt: 'Dadu dilempar sekali. Berapa n(S)?',
        label: 'n(S)',
        visual: { space: DIE },
        answer: 6,
        done: 'Tepat! Ada 6 sisi dadu, jadi n(S) = 6.',
        near: {},
        retry: 'Hitung sisi dadu satu per satu: 1, 2, 3, ….',
      },
      {
        kind: 'count',
        title: 'Latihan cepat: kantong',
        prompt: 'Kantong berisi 3 bola merah dan 2 bola biru. Satu bola diambil. Berapa n(S)?',
        label: 'n(S)',
        visual: { space: balls({ Merah: 3, Biru: 2 }) },
        answer: 5,
        done: 'Tepat! Setiap bola adalah titik sampel, jadi n(S) = 5.',
        near: {
          3: 'Itu bola merah saja. Bola biru juga bisa terambil.',
          2: 'Itu bola biru saja. Bola merah juga bisa terambil.',
        },
        retry: 'Setiap bola adalah satu titik sampel. Hitung semuanya.',
      },
    ],
  },
  {
    id: 'kejadian',
    title: 'Kejadian',
    cards: [
      {
        kind: 'text',
        title: 'Kejadian',
        body: [
          'Kejadian adalah bagian dari ruang sampel yang ditanyakan.',
          'Kejadian ditulis A.',
          'Contoh: muncul angka genap. A = {2, 4, 6}',
        ],
        visual: { space: DIE, highlight: evens, showNS: true, showNA: true },
      },
      {
        kind: 'compare',
        title: 'Bedanya apa?',
        head: ['Ruang sampel S', 'Kejadian A'],
        rows: [
          ['Semua hasil yang mungkin', 'Hasil yang ditanyakan saja'],
          ['Dadu: {1, 2, 3, 4, 5, 6}', 'Angka genap: {2, 4, 6}'],
          ['n(S) = 6', 'n(A) = 3'],
        ],
      },
      {
        kind: 'tapEvent',
        title: 'Coba: angka genap',
        prompt: 'Dadu dilempar sekali. Ketuk angka genap.',
        space: DIE,
        eventIds: evens,
        done: 'Tepat! A = {2, 4, 6}, jadi n(A) = 3.',
      },
      {
        kind: 'tapEvent',
        title: 'Coba: lebih dari 4',
        prompt: 'Sekarang ketuk angka yang lebih dari 4.',
        space: DIE,
        eventIds: ['d5', 'd6'],
        done: 'Tepat! A = {5, 6}, jadi n(A) = 2. Angka 4 tidak termasuk.',
      },
      {
        kind: 'choice',
        title: 'Cek pemahaman',
        prompt: 'Dadu dilempar sekali. Manakah yang merupakan kejadian?',
        options: [
          {
            text: '{1, 2, 3, 4, 5, 6}',
            correct: false,
            reason: 'Itu semua hasil yang mungkin. Itu ruang sampel S, bukan kejadian.',
          },
          {
            text: 'Muncul angka ganjil: {1, 3, 5}',
            correct: true,
            reason: 'Tepat! Angka ganjil hanya sebagian dari S, yaitu hasil yang ditanyakan.',
          },
          { text: '{7}', correct: false, reason: '7 tidak ada pada dadu. Kejadian selalu bagian dari S.' },
        ],
      },
    ],
  },
  {
    id: 'peluang',
    title: 'Peluang',
    cards: [
      {
        kind: 'text',
        title: 'Rumus peluang',
        body: ['Peluang kejadian A adalah banyak hasil yang ditanyakan dibagi banyak semua hasil.'],
        formula: true,
        visual: { space: DIE, highlight: evens, showNS: true, showNA: true },
      },
      {
        kind: 'worked',
        title: 'Contoh: angka genap',
        steps: [
          '① Diketahui: dadu dilempar sekali. Ditanya: peluang muncul angka genap.',
          '② S = {1, 2, 3, 4, 5, 6}, jadi n(S) = 6.',
          '③ A = {2, 4, 6}, jadi n(A) = 3.',
          '④ P(A) = n(A) / n(S) = 3/6.',
          '⑤ 3/6 disederhanakan menjadi 1/2. Nilainya antara 0 dan 1.',
        ],
      },
      {
        kind: 'complete',
        title: 'Giliranmu: angka kurang dari 3',
        given: [
          '① Ditanya: peluang muncul angka kurang dari 3.',
          '② S = {1, 2, 3, 4, 5, 6}, jadi n(S) = 6.',
          '③ A = {1, 2}, jadi n(A) = 2.',
        ],
        prompt: '④ Hitung P(A).',
        space: DIE,
        eventIds: ['d1', 'd2'],
        answer: { num: 1, den: 3 },
      },
      {
        kind: 'range',
        title: 'Rentang peluang',
        body: 'Peluang selalu antara 0 dan 1. Jika hasilmu lebih dari 1, pasti ada yang keliru.',
        points: [
          { at: '0', label: 'Tidak mungkin: muncul angka 7' },
          { at: '1/2', label: 'Muncul angka genap' },
          { at: '1', label: 'Pasti: muncul angka kurang dari 7' },
        ],
      },
      {
        kind: 'text',
        title: 'Lima langkah',
        body: [
          '① Tandai yang diketahui dan ditanya.',
          '② Tentukan ruang sampel S dan n(S).',
          '③ Tentukan kejadian A dan n(A).',
          '④ Hitung P(A) = n(A) / n(S).',
          '⑤ Sederhanakan dan periksa: antara 0 dan 1?',
        ],
      },
    ],
  },
];

export const LESSONS: readonly LessonOutline[] = LESSON_CONTENT.map(({ id, title }) => ({ id, title }));

/** Kartu yang perlu diselesaikan dulu sebelum tombol Lanjut aktif. */
export function isInteractive(card: LessonCard): boolean {
  return card.kind !== 'text' && card.kind !== 'compare' && card.kind !== 'range';
}
