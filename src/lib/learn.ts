// Logika kartu belajar (F1/F2/F8): membandingkan pilihan siswa di papan dengan himpunan yang diminta.

import type { Fraction } from '../types';
import { equals, format, gcd, isSimplest, isValid, simplify } from './fraction';

export interface SelectionCheck {
  ok: boolean;
  /** Dipilih tetapi tidak termasuk yang diminta. */
  extra: string[];
  /** Diminta tetapi belum dipilih. */
  missing: string[];
}

export function checkSelection(selected: Iterable<string>, target: Iterable<string>): SelectionCheck {
  const s = new Set(selected);
  const t = new Set(target);
  const extra = [...s].filter((id) => !t.has(id));
  const missing = [...t].filter((id) => !s.has(id));
  return { ok: extra.length === 0 && missing.length === 0, extra, missing };
}

/** Tulis himpunan untuk teks berjalan, mis. "{2, 4, 6}". Kosong → "{ }". */
export function formatSet(labels: string[]): string {
  return labels.length ? `{${labels.join(', ')}}` : '{ }';
}

/** Hitung kata (untuk uji konten: maksimal 60 kata per kartu, F1). */
export function wordCount(text: string): number {
  return text.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
}

export function toggle(set: ReadonlySet<string>, id: string): Set<string> {
  const next = new Set(set);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}

/** Latihan menyederhanakan (F8): nilai harus sama DAN paling sederhana. Umpan balik dengan alasan (GL02). */
export function gradeSimplify(given: Fraction, input: Fraction): { ok: boolean; message: string } {
  if (!isValid(input)) return { ok: false, message: 'Isi pembilang dan penyebut dengan bilangan bulat. Penyebut bukan 0.' };
  const target = simplify(given);
  if (!equals(given, input)) {
    return { ok: false, message: 'Nilainya berubah. Bagi pembilang dan penyebut dengan bilangan yang SAMA.' };
  }
  if (!isSimplest(input)) {
    return { ok: false, message: `Nilainya sama, tetapi ${format(input)} masih bisa dibagi lagi.` };
  }
  const g = gcd(given.num, given.den);
  return { ok: true, message: `Tepat! FPB dari ${given.num} dan ${given.den} adalah ${g}, jadi ${format(given)} = ${format(target)}.` };
}
