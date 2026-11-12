import { describe, expect, it } from 'vitest';
import {
  addCounts,
  comparisonText,
  compareToTheoretical,
  relativeText,
  chartScale,
  mulberry32,
  relativeFrequencies,
  rollMany,
  rollOnce,
  tally,
  total,
} from './simulation';

describe('rollOnce', () => {
  it('selalu dalam rentang 0..k-1, termasuk di tepi', () => {
    expect(rollOnce(6, () => 0)).toBe(0);
    expect(rollOnce(6, () => 0.999999999)).toBe(5);
    const rng = mulberry32(1);
    for (let i = 0; i < 1000; i++) {
      const r = rollOnce(6, rng);
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThan(6);
    }
  });
  it('k tidak valid ditolak', () => {
    expect(() => rollOnce(0, Math.random)).toThrow(RangeError);
    expect(() => rollOnce(2.5, Math.random)).toThrow(RangeError);
  });
});

describe('rollMany & tally', () => {
  it('total frekuensi = banyak lemparan', () => {
    const seq = rollMany(6, 50, mulberry32(7));
    expect(seq).toHaveLength(50);
    expect(total(tally(seq, 6))).toBe(50);
  });
  it('seed tetap → hasil tetap', () => {
    expect(rollMany(6, 20, mulberry32(42))).toEqual(rollMany(6, 20, mulberry32(42)));
    expect(rollMany(6, 20, mulberry32(42))).not.toEqual(rollMany(6, 20, mulberry32(43)));
  });
  it('lemparan banyak → frekuensi relatif mendekati 1/6 (hukum bilangan besar)', () => {
    const rel = relativeFrequencies(tally(rollMany(6, 60000, mulberry32(2026)), 6));
    for (const r of rel) expect(Math.abs(r - 1 / 6)).toBeLessThan(0.01);
  });
  it('koin → mendekati 1/2', () => {
    const rel = relativeFrequencies(tally(rollMany(2, 20000, mulberry32(5)), 2));
    expect(Math.abs(rel[0] - 0.5)).toBeLessThan(0.01);
  });
  it('n = 0 dan indeks asing', () => {
    expect(rollMany(6, 0, Math.random)).toEqual([]);
    expect(() => rollMany(6, -1, Math.random)).toThrow(RangeError);
    expect(() => tally([6], 6)).toThrow(RangeError);
  });
});

describe('frekuensi', () => {
  it('addCounts', () => {
    expect(addCounts([1, 2], [3, 4])).toEqual([4, 6]);
    expect(() => addCounts([1], [1, 2])).toThrow(RangeError);
  });
  it('relativeFrequencies: belum ada lemparan → semua 0', () => {
    expect(relativeFrequencies([0, 0, 0])).toEqual([0, 0, 0]);
    expect(relativeFrequencies([1, 3])).toEqual([0.25, 0.75]);
  });
  it('chartScale minimal 2× peluang teoretik', () => {
    expect(chartScale([0, 0], 0.5)).toBe(1);
    expect(chartScale([0.1, 0.2], 1 / 6)).toBeCloseTo(1 / 3);
    expect(chartScale([1, 0, 0, 0, 0, 0], 1 / 6)).toBe(1);
  });
});

describe('perbandingan dengan peluang teoretik', () => {
  it('membandingkan tanpa galat desimal', () => {
    expect(compareToTheoretical(3, 10, 6)).toBe('more');
    expect(compareToTheoretical(1, 10, 6)).toBe('less');
    expect(compareToTheoretical(5, 30, 6)).toBe('equal');
    expect(compareToTheoretical(5, 10, 2)).toBe('equal');
    expect(compareToTheoretical(0, 0, 6)).toBeNull();
  });

  it('menulis teks perbandingan', () => {
    expect(comparisonText(3, 10, 6)).toBe('lebih dari 1/6');
    expect(comparisonText(5, 30, 6)).toBe('sama dengan 1/6');
    expect(comparisonText(0, 4, 2)).toBe('kurang dari 1/2');
    expect(comparisonText(0, 0, 2)).toBe('');
  });

  it('menulis frekuensi relatif sebagai pecahan dan desimal', () => {
    expect(relativeText(3, 10)).toBe('3/10 ≈ 0,30');
    expect(relativeText(1, 6)).toBe('1/6 ≈ 0,17');
    expect(relativeText(0, 0)).toBe('–');
  });
});
