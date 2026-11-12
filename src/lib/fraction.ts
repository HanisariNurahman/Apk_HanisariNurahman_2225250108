import type { Fraction } from '../types';

/** FPB (faktor persekutuan terbesar) dengan algoritma Euclid. gcd(0, 0) = 0. */
export function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b !== 0) {
    [a, b] = [b, a % b];
  }
  return a;
}

export function frac(num: number, den: number): Fraction {
  return { num, den };
}

/** Pecahan valid: pembilang & penyebut bilangan bulat, penyebut ≠ 0. */
export function isValid(f: Fraction): boolean {
  return Number.isInteger(f.num) && Number.isInteger(f.den) && f.den !== 0;
}

/** Penyebut dibuat positif. Tanda negatif dipindah ke pembilang. */
export function normalize(f: Fraction): Fraction {
  assertValid(f);
  return f.den < 0 ? { num: -f.num || 0, den: -f.den } : { num: f.num || 0, den: f.den };
}

/** Bentuk paling sederhana. 3/6 → 1/2, 0/6 → 0/1, 6/6 → 1/1. */
export function simplify(f: Fraction): Fraction {
  const n = normalize(f);
  if (n.num === 0) return { num: 0, den: 1 };
  const g = gcd(n.num, n.den);
  return { num: n.num / g, den: n.den / g };
}

/** Apakah pecahan sudah dalam bentuk paling sederhana (dan penyebut positif). */
export function isSimplest(f: Fraction): boolean {
  if (!isValid(f) || f.den < 0) return false;
  const s = simplify(f);
  return s.num === f.num && s.den === f.den;
}

/** Kesamaan nilai (pecahan senilai dianggap sama): 3/6 = 1/2. */
export function equals(a: Fraction, b: Fraction): boolean {
  assertValid(a);
  assertValid(b);
  return a.num * b.den === b.num * a.den;
}

export function toNumber(f: Fraction): number {
  assertValid(f);
  return f.num / f.den;
}

/** Nilai berada dalam rentang peluang 0 ≤ P ≤ 1. */
export function isProbability(f: Fraction): boolean {
  if (!isValid(f)) return false;
  const v = toNumber(f);
  return v >= 0 && v <= 1;
}

/** Tampilan teks berjalan, mis. "1/2". */
export function format(f: Fraction): string {
  return `${f.num}/${f.den}`;
}

function assertValid(f: Fraction): void {
  if (!isValid(f)) {
    throw new RangeError(`Pecahan tidak valid: ${f.num}/${f.den}`);
  }
}
