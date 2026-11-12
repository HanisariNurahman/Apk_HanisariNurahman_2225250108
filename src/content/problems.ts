// Bank soal Latihan (F3–F6, F10) — sumber: docs/CONTENT.md §4–5.
// Soal disimpan sebagai DATA. Petunjuk L3 selalu memakai contoh soal LAIN dengan konteks sama (bukan jawaban soal ini).
// Kunci jawaban dihitung dari n(A)/n(S) dan diperiksa grader.checkProblem di content.test.ts.

import { format, simplify } from '../lib/fraction';
import { spanOf } from '../lib/marking';
import { balls, cards, coin, die, spinner, twoCoins } from '../lib/sampleSpace';
import type { Experiment, Problem, ProblemLevel, SampleOutcome, StepId } from '../types';

interface Words {
  /** Benda percobaan, mis. "dadu". */
  obj: string;
  /** Semua hasil, mis. "semua sisi dadu". */
  all: string;
  /** Kejadian yang ditanya, mis. "angka 5". */
  event: string;
  /** S untuk pembahasan, mis. "{1, 2, 3, 4, 5, 6}". */
  sSet: string;
  /** A untuk pembahasan, mis. "{5}". */
  aSet: string;
}

interface Spec {
  id: string;
  level: ProblemLevel;
  context: Experiment;
  structureTag: string;
  story: string[];
  known: [number, string][];
  asked: [number, string][];
  space: SampleOutcome[];
  event: (o: SampleOutcome) => boolean;
  words: Words;
}

// Contoh soal serupa untuk petunjuk Level 3 (per konteks).
const EXAMPLES: Record<Experiment, Record<'S' | 'A' | 'P' | 'check', string>> = {
  die: {
    S: 'Contoh: dadu dilempar, S = {1, 2, 3, 4, 5, 6}, jadi n(S) = 6.',
    A: 'Contoh: ditanya angka genap, A = {2, 4, 6}, jadi n(A) = 3.',
    P: 'Contoh: P(genap) = 3/6.',
    check: 'Contoh: 3/6 → bagi 3 → 1/2.',
  },
  coin: {
    S: 'Contoh: koin dilempar, S = {Angka, Gambar}, jadi n(S) = 2.',
    A: 'Contoh: ditanya Angka, A = {Angka}, jadi n(A) = 1.',
    P: 'Contoh: P(Angka) = 1/2.',
    check: 'Contoh: 1/2 sudah paling sederhana.',
  },
  balls: {
    S: 'Contoh: kantong berisi 2 hijau dan 4 kuning, jadi n(S) = 6.',
    A: 'Contoh: ditanya hijau, ada 2, jadi n(A) = 2.',
    P: 'Contoh: P(hijau) = 2/6.',
    check: 'Contoh: 2/6 → bagi 2 → 1/3.',
  },
  cards: {
    S: 'Contoh: kartu bernomor 1 sampai 8, jadi n(S) = 8.',
    A: 'Contoh: ditanya kelipatan 4, A = {4, 8}, jadi n(A) = 2.',
    P: 'Contoh: P(kelipatan 4) = 2/8.',
    check: 'Contoh: 2/8 → bagi 2 → 1/4.',
  },
  spinner: {
    S: 'Contoh: spinner 3 bagian sama besar, jadi n(S) = 3.',
    A: 'Contoh: ditanya biru, ada 1 bagian, jadi n(A) = 1.',
    P: 'Contoh: P(biru) = 1/3.',
    check: 'Contoh: 1/3 sudah paling sederhana.',
  },
  'two-coins': {
    S: 'Contoh: dua koin, S = {AA, AG, GA, GG}, jadi n(S) = 4.',
    A: 'Contoh: ditanya dua Angka, A = {AA}, jadi n(A) = 1.',
    P: 'Contoh: P(dua Angka) = 1/4.',
    check: 'Contoh: 1/4 sudah paling sederhana.',
  },
};

const MARK_EXAMPLE =
  'Contoh: "Ada 4 kartu. Satu kartu diambil. Berapa peluang terambil kartu 2?" ' +
  'Diketahui: 4 kartu, satu diambil. Ditanya: peluang kartu 2.';

function hints(spec: Spec): Problem['hints'] {
  const { obj, all, event } = spec.words;
  const ex = EXAMPLES[spec.context];
  const out: Partial<Record<StepId, [string, string, string]>> = {
    mark: [
      spec.level === 'cerita-panjang'
        ? 'Tidak semua kalimat penting. Kalimat mana yang menyebut benda dan jumlahnya?'
        : 'Benda apa yang dipakai? Apa yang ditanyakan?',
      'Benda, jumlahnya, dan cara mengambil atau melemparnya = Diketahui. Kalimat "Berapa peluang …" = Ditanya.',
      MARK_EXAMPLE,
    ],
    S: [`Hasil apa saja yang mungkin terjadi pada ${obj}?`, `Hitung ${all}, satu per satu.`, ex.S],
    A: [`Hasil mana yang sesuai dengan "${event}"?`, `Ketuk hanya ${event}. Biarkan yang lain.`, ex.A],
    P: ['Ingat rumusnya: n(A) dibagi apa?', 'Letakkan n(A) di atas dan n(S) di bawah.', ex.P],
    check: [
      'Bisakah pecahannya disederhanakan?',
      'Cari bilangan yang membagi pembilang dan penyebut. Nilainya harus antara 0 dan 1.',
      ex.check,
    ],
  };
  return out;
}

function build(spec: Spec): Problem {
  const eventIds = spec.space.filter(spec.event).map((o) => o.id);
  const nS = spec.space.length;
  const nA = eventIds.length;
  const answer = simplify({ num: nA, den: nS });
  const raw = `${nA}/${nS}`;
  const simple = format(answer);
  const { aSet, sSet, event } = spec.words;
  const last =
    nA === 0
      ? `⑤ ${raw} = 0. Peluang 0 berarti tidak mungkin terjadi.`
      : nA === nS
        ? `⑤ ${raw} = 1. Peluang 1 berarti pasti terjadi.`
        : raw === simple
          ? `⑤ ${raw} sudah paling sederhana. Nilainya antara 0 dan 1.`
          : `⑤ ${raw} disederhanakan menjadi ${simple}. Nilainya antara 0 dan 1.`;
  return {
    id: spec.id,
    level: spec.level,
    context: spec.context,
    structureTag: spec.structureTag,
    story: spec.story,
    knownSpans: spec.known.map(([i, p]) => spanOf(spec.story, i, p)),
    askedSpans: spec.asked.map(([i, p]) => spanOf(spec.story, i, p)),
    sampleSpace: spec.space,
    eventIds,
    answer,
    hints: hints(spec),
    discussion: [
      `① Diketahui: ${spec.known.map(([, p]) => p).join('; ')}. Ditanya: peluang ${event}.`,
      `② S = ${sSet}, jadi n(S) = ${nS}.`,
      `③ A = ${aSet}, jadi n(A) = ${nA}.`,
      `④ P(A) = n(A) / n(S) = ${raw}.`,
      last,
    ],
    reflectionTemplate: `Peluangnya ${simple} karena ada {nA} hasil ${event} dari {nS} hasil yang mungkin.`,
  };
}

const D = die();
const val = (o: SampleOutcome) => o.value ?? NaN;
const DIE_S = '{1, 2, 3, 4, 5, 6}';
const dieWords = (event: string, aSet: string): Words => ({ obj: 'dadu', all: 'semua sisi dadu', event, sSet: DIE_S, aSet });

const SPECS: Spec[] = [
  // ── Dasar ──
  {
    id: 'D-01', level: 'dasar', context: 'die', structureTag: 'satu-hasil',
    story: ['Sebuah dadu dilempar sekali.', 'Berapa peluang muncul angka 5?'],
    known: [[0, 'dadu dilempar sekali']], asked: [[1, 'Berapa peluang muncul angka 5']],
    space: D, event: (o) => val(o) === 5, words: dieWords('angka 5', '{5}'),
  },
  {
    id: 'D-02', level: 'dasar', context: 'coin', structureTag: 'satu-hasil',
    story: ['Sebuah koin dilempar sekali.', 'Berapa peluang muncul Gambar?'],
    known: [[0, 'koin dilempar sekali']], asked: [[1, 'Berapa peluang muncul Gambar']],
    space: coin(), event: (o) => o.label === 'Gambar',
    words: { obj: 'koin', all: 'semua sisi koin', event: 'Gambar', sSet: '{Angka, Gambar}', aSet: '{Gambar}' },
  },
  {
    id: 'D-03', level: 'dasar', context: 'die', structureTag: 'syarat-bilangan',
    story: ['Sebuah dadu dilempar sekali.', 'Berapa peluang muncul angka kurang dari 3?'],
    known: [[0, 'dadu dilempar sekali']], asked: [[1, 'Berapa peluang muncul angka kurang dari 3']],
    space: D, event: (o) => val(o) < 3, words: dieWords('angka kurang dari 3', '{1, 2}'),
  },
  {
    id: 'D-04', level: 'dasar', context: 'die', structureTag: 'syarat-bilangan',
    story: ['Sebuah dadu dilempar sekali.', 'Berapa peluang muncul angka ganjil?'],
    known: [[0, 'dadu dilempar sekali']], asked: [[1, 'Berapa peluang muncul angka ganjil']],
    space: D, event: (o) => val(o) % 2 === 1, words: dieWords('angka ganjil', '{1, 3, 5}'),
  },
  {
    id: 'D-05', level: 'dasar', context: 'die', structureTag: 'mustahil',
    story: ['Sebuah dadu dilempar sekali.', 'Berapa peluang muncul angka 7?'],
    known: [[0, 'dadu dilempar sekali']], asked: [[1, 'Berapa peluang muncul angka 7']],
    space: D, event: (o) => val(o) === 7, words: dieWords('angka 7', '{ } (kosong)'),
  },
  {
    id: 'D-06', level: 'dasar', context: 'die', structureTag: 'pasti',
    story: ['Sebuah dadu dilempar sekali.', 'Berapa peluang muncul angka kurang dari 7?'],
    known: [[0, 'dadu dilempar sekali']], asked: [[1, 'Berapa peluang muncul angka kurang dari 7']],
    space: D, event: (o) => val(o) < 7, words: dieWords('angka kurang dari 7', DIE_S),
  },
  // ── Cerita pendek ──
  {
    id: 'C-01', level: 'cerita-pendek', context: 'balls', structureTag: 'kelompok-warna',
    story: ['Dalam kantong ada 3 bola merah dan 2 bola biru.', 'Satu bola diambil tanpa melihat.', 'Berapa peluang terambil bola biru?'],
    known: [[0, '3 bola merah dan 2 bola biru'], [1, 'Satu bola diambil tanpa melihat']],
    asked: [[2, 'Berapa peluang terambil bola biru']],
    space: balls({ Merah: 3, Biru: 2 }), event: (o) => o.label === 'Biru',
    words: { obj: 'kantong', all: 'semua bola, merah dan biru', event: 'bola biru', sSet: 'semua 5 bola (3 merah, 2 biru)', aSet: '2 bola biru' },
  },
  {
    id: 'C-02', level: 'cerita-pendek', context: 'cards', structureTag: 'syarat-bilangan',
    story: ['Kartu bernomor 1 sampai 10 dikocok, lalu diambil satu.', 'Berapa peluang terambil kartu bernomor kelipatan 3?'],
    known: [[0, 'Kartu bernomor 1 sampai 10 dikocok, lalu diambil satu']],
    asked: [[1, 'Berapa peluang terambil kartu bernomor kelipatan 3']],
    space: cards(1, 10), event: (o) => val(o) % 3 === 0,
    words: { obj: 'kartu', all: 'semua kartu, 1 sampai 10', event: 'kelipatan 3', sSet: '{1, 2, …, 10}', aSet: '{3, 6, 9}' },
  },
  {
    id: 'C-03', level: 'cerita-pendek', context: 'spinner', structureTag: 'satu-hasil',
    story: [
      'Sebuah spinner dibagi 4 bagian sama besar.',
      'Warnanya merah, kuning, hijau, dan biru.',
      'Jarum spinner diputar sekali.',
      'Berapa peluang jarum berhenti di hijau?',
    ],
    known: [[0, 'spinner dibagi 4 bagian sama besar'], [1, 'merah, kuning, hijau, dan biru'], [2, 'Jarum spinner diputar sekali']],
    asked: [[3, 'Berapa peluang jarum berhenti di hijau']],
    space: spinner(['Merah', 'Kuning', 'Hijau', 'Biru']), event: (o) => o.label === 'Hijau',
    words: { obj: 'spinner', all: 'semua bagian spinner', event: 'hijau', sSet: '{merah, kuning, hijau, biru}', aSet: '{hijau}' },
  },
  {
    id: 'C-04', level: 'cerita-pendek', context: 'balls', structureTag: 'komplemen',
    story: ['Kotak berisi 4 kelereng hijau, 5 kuning, dan 1 putih.', 'Satu kelereng diambil tanpa melihat.', 'Berapa peluang terambil kelereng yang bukan kuning?'],
    known: [[0, '4 kelereng hijau, 5 kuning, dan 1 putih'], [1, 'Satu kelereng diambil tanpa melihat']],
    asked: [[2, 'Berapa peluang terambil kelereng yang bukan kuning']],
    space: balls({ Hijau: 4, Kuning: 5, Putih: 1 }), event: (o) => o.label !== 'Kuning',
    words: { obj: 'kotak', all: 'semua kelereng', event: 'bukan kuning', sSet: 'semua 10 kelereng', aSet: '4 hijau dan 1 putih' },
  },
  // ── Cerita panjang (ada informasi pengecoh) ──
  {
    id: 'L-01', level: 'cerita-panjang', context: 'cards', structureTag: 'syarat-bilangan',
    story: [
      'Pada acara class meeting, panitia menyiapkan 12 kupon undian bernomor 1–12.',
      'Hadiah utama berupa tas sekolah, sedangkan hadiah hiburan berupa alat tulis.',
      'Rina mendapat giliran pertama mengambil satu kupon.',
      'Kupon yang bernomor genap mendapat hadiah alat tulis.',
      'Berapa peluang Rina mendapat alat tulis?',
    ],
    known: [[0, '12 kupon undian bernomor 1–12'], [2, 'mengambil satu kupon'], [3, 'Kupon yang bernomor genap mendapat hadiah alat tulis']],
    asked: [[4, 'Berapa peluang Rina mendapat alat tulis']],
    space: cards(1, 12), event: (o) => val(o) % 2 === 0,
    words: { obj: 'kupon', all: 'semua kupon, 1 sampai 12', event: 'kupon bernomor genap', sSet: '{1, 2, …, 12}', aSet: '{2, 4, 6, 8, 10, 12}' },
  },
  {
    id: 'L-02', level: 'cerita-panjang', context: 'balls', structureTag: 'kelompok-warna',
    story: [
      'Koperasi sekolah membagikan permen dalam toples.',
      'Isinya 6 rasa jeruk, 4 rasa stroberi, dan 5 rasa mint.',
      'Harga satu permen Rp500.',
      'Dimas mengambil satu permen tanpa melihat.',
      'Berapa peluang Dimas mendapat permen rasa stroberi?',
    ],
    known: [[1, '6 rasa jeruk, 4 rasa stroberi, dan 5 rasa mint'], [3, 'Dimas mengambil satu permen tanpa melihat']],
    asked: [[4, 'Berapa peluang Dimas mendapat permen rasa stroberi']],
    space: balls({ Jeruk: 6, Stroberi: 4, Mint: 5 }), event: (o) => o.label === 'Stroberi',
    words: { obj: 'toples', all: 'semua permen di toples', event: 'rasa stroberi', sSet: 'semua 15 permen', aSet: '4 permen stroberi' },
  },
  {
    id: 'L-03', level: 'cerita-panjang', context: 'die', structureTag: 'syarat-bilangan',
    story: [
      'Dalam permainan ular tangga, Sari harus mendapat angka lebih dari 4 agar bidaknya naik tangga.',
      'Ia melempar satu dadu satu kali.',
      'Berapa peluang Sari naik tangga?',
    ],
    known: [[0, 'angka lebih dari 4 agar bidaknya naik tangga'], [1, 'melempar satu dadu satu kali']],
    asked: [[2, 'Berapa peluang Sari naik tangga']],
    space: D, event: (o) => val(o) > 4, words: dieWords('angka lebih dari 4', '{5, 6}'),
  },
  // ── Lanjut (P2, dibuka setelah semua level selesai; IL04) ──
  {
    id: 'X-01', level: 'lanjut', context: 'two-coins', structureTag: 'dua-koin',
    story: ['Dua koin dilempar bersamaan.', 'Berapa peluang muncul tepat satu Gambar?'],
    known: [[0, 'Dua koin dilempar bersamaan']], asked: [[1, 'Berapa peluang muncul tepat satu Gambar']],
    space: twoCoins(), event: (o) => o.id === 'cc-AG' || o.id === 'cc-GA',
    words: { obj: 'dua koin', all: 'semua pasangan sisi kedua koin', event: 'tepat satu Gambar', sSet: '{AA, AG, GA, GG}', aSet: '{AG, GA}' },
  },
]; // prettier-ignore

const BUILT = SPECS.map(build);

/** "Mirip dengan" (F10, GL05): struktur sama; konteks berbeda didahulukan. */
for (const p of BUILT) {
  p.similarTo = BUILT.filter((q) => q.id !== p.id && q.structureTag === p.structureTag)
    .sort((a, b) => Number(a.context === p.context) - Number(b.context === p.context))
    .slice(0, 2)
    .map((q) => q.id);
}

export const PROBLEMS: readonly Problem[] = BUILT;

export const LEVELS: readonly { id: ProblemLevel; title: string; note?: string }[] = [
  { id: 'dasar', title: 'Dasar' },
  { id: 'cerita-pendek', title: 'Cerita pendek' },
  { id: 'cerita-panjang', title: 'Cerita panjang', note: 'Ada informasi yang tidak dipakai.' },
  { id: 'lanjut', title: 'Lanjut: dua koin', note: 'Terbuka setelah semua soal lain selesai.' },
];

export const CONTEXT_NAMES: Record<Experiment, string> = {
  die: 'Dadu',
  coin: 'Koin',
  balls: 'Kantong',
  cards: 'Kartu',
  spinner: 'Spinner',
  'two-coins': 'Dua koin',
};

export function problemById(id: string): Problem | undefined {
  return PROBLEMS.find((p) => p.id === id);
}
