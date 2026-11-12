import type { SampleOutcome } from '../types';

/** Dadu bersisi `sides` (default 6): S = {1, 2, …, sides}. */
export function die(sides = 6): SampleOutcome[] {
  return Array.from({ length: sides }, (_, i) => {
    const v = i + 1;
    return { id: `d${v}`, label: String(v), icon: `dice/d${v}.svg`, value: v };
  });
}

/** Satu koin: S = {Angka, Gambar}. */
export function coin(): SampleOutcome[] {
  return [
    { id: 'coin-A', label: 'Angka', icon: 'coin/angka.svg' },
    { id: 'coin-G', label: 'Gambar', icon: 'coin/gambar.svg' },
  ];
}

/** Dua koin dilempar bersamaan (P2): S = {AA, AG, GA, GG}. */
export function twoCoins(): SampleOutcome[] {
  const sides = [
    ['A', 'Angka'],
    ['G', 'Gambar'],
  ] as const;
  const out: SampleOutcome[] = [];
  for (const [a, la] of sides) {
    for (const [b, lb] of sides) {
      out.push({ id: `cc-${a}${b}`, label: `${la}–${lb}`, icon: `coin/${a}${b}.svg` });
    }
  }
  return out;
}

/**
 * Bola/kelereng/permen dalam kantong. Setiap benda adalah satu titik sampel.
 * balls({ Merah: 3, Biru: 2 }) → 5 titik sampel.
 */
export function balls(groups: Record<string, number>): SampleOutcome[] {
  const out: SampleOutcome[] = [];
  for (const [label, count] of Object.entries(groups)) {
    if (!Number.isInteger(count) || count < 0) {
      throw new RangeError(`Jumlah "${label}" harus bilangan cacah, didapat ${count}`);
    }
    const key = slug(label);
    for (let i = 1; i <= count; i++) {
      out.push({ id: `ball-${key}-${i}`, label, icon: `balls/${key}.svg` });
    }
  }
  return out;
}

/** Kartu bernomor `from` sampai `to`. */
export function cards(from: number, to: number): SampleOutcome[] {
  if (!Number.isInteger(from) || !Number.isInteger(to) || to < from) {
    throw new RangeError(`Rentang kartu tidak valid: ${from}–${to}`);
  }
  return Array.from({ length: to - from + 1 }, (_, i) => {
    const v = from + i;
    return { id: `card-${v}`, label: String(v), icon: 'cards/card.svg', value: v };
  });
}

/** Spinner dengan bagian sama besar, satu label per bagian. */
export function spinner(labels: string[]): SampleOutcome[] {
  return labels.map((label, i) => ({
    id: `spin-${i + 1}-${slug(label)}`,
    label,
    icon: `spinner/${slug(label)}.svg`,
  }));
}

/** Ambil id titik sampel yang memenuhi syarat kejadian. */
export function pickIds(space: SampleOutcome[], pred: (o: SampleOutcome) => boolean): string[] {
  return space.filter(pred).map((o) => o.id);
}

/** Banyak titik sampel per label, mis. { Merah: 3, Biru: 2 }. */
export function countByLabel(space: SampleOutcome[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const o of space) m.set(o.label, (m.get(o.label) ?? 0) + 1);
  return m;
}

function slug(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
