// Simulasi percobaan acak (F7) — logika murni, bisa diuji dengan RNG ber-seed.

/** Pembangkit bilangan acak: mengembalikan bilangan di [0, 1). */
export type Rng = () => number;

/** RNG ber-seed (mulberry32): seed sama → urutan hasil sama. Untuk test dan demo yang bisa diulang. */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Satu percobaan dengan `k` hasil yang sama mungkin. Mengembalikan indeks 0..k-1. */
export function rollOnce(k: number, rng: Rng): number {
  if (!Number.isInteger(k) || k < 1) throw new RangeError(`Banyak hasil tidak valid: ${k}`);
  return Math.min(k - 1, Math.floor(rng() * k));
}

/** `n` percobaan berturut-turut. Mengembalikan urutan indeks hasil. */
export function rollMany(k: number, n: number, rng: Rng): number[] {
  if (!Number.isInteger(n) || n < 0) throw new RangeError(`Banyak lemparan tidak valid: ${n}`);
  return Array.from({ length: n }, () => rollOnce(k, rng));
}

/** Frekuensi tiap hasil dari urutan indeks. */
export function tally(sequence: number[], k: number): number[] {
  const counts = new Array<number>(k).fill(0);
  for (const i of sequence) {
    if (i < 0 || i >= k) throw new RangeError(`Indeks hasil di luar rentang: ${i}`);
    counts[i]++;
  }
  return counts;
}

export function addCounts(a: number[], b: number[]): number[] {
  if (a.length !== b.length) throw new RangeError('Panjang frekuensi berbeda');
  return a.map((v, i) => v + b[i]);
}

export function total(counts: number[]): number {
  return counts.reduce((s, c) => s + c, 0);
}

/** Frekuensi relatif tiap hasil = frekuensi / banyak lemparan. Semua 0 jika belum ada lemparan. */
export function relativeFrequencies(counts: number[]): number[] {
  const n = total(counts);
  return counts.map((c) => (n === 0 ? 0 : c / n));
}

/**
 * Nilai tertinggi sumbu tegak grafik. Minimal 2× peluang teoretik, sehingga
 * bidang peluang teoretik berada di tengah tinggi grafik saat data mendekati teori.
 */
export function chartScale(relFreq: number[], theoretical: number): number {
  return Math.max(theoretical * 2, ...relFreq, Number.EPSILON);
}

/** Perbandingan frekuensi relatif count/n dengan peluang teoretik 1/k (tanpa desimal agar tepat). */
export type Comparison = 'more' | 'equal' | 'less';

export function compareToTheoretical(count: number, n: number, k: number): Comparison | null {
  if (n === 0) return null;
  const a = count * k;
  return a > n ? 'more' : a < n ? 'less' : 'equal';
}

const COMPARISON_TEXT: Record<Comparison, string> = {
  more: 'lebih dari',
  equal: 'sama dengan',
  less: 'kurang dari',
};

/** Teks pendek untuk detail batang, mis. "lebih dari 1/6". Kosong bila belum ada lemparan. */
export function comparisonText(count: number, n: number, k: number): string {
  const c = compareToTheoretical(count, n, k);
  return c ? `${COMPARISON_TEXT[c]} 1/${k}` : '';
}

/** Dua angka di belakang koma dengan koma desimal, mis. 0,30. */
export function formatDecimal(x: number): string {
  return x.toFixed(2).replace('.', ',');
}

/** Frekuensi relatif sebagai pecahan dan desimal, mis. "3/10 ≈ 0,30". */
export function relativeText(count: number, n: number): string {
  return n === 0 ? '–' : `${count}/${n} ≈ ${formatDecimal(count / n)}`;
}
