import { describe, expect, it } from 'vitest';
import { balls, cards, coin, countByLabel, die, pickIds, spinner, twoCoins } from './sampleSpace';

const uniqueIds = (s: { id: string }[]) => new Set(s.map((o) => o.id)).size === s.length;

describe('sampleSpace', () => {
  it('dadu: n(S) = 6, label 1–6', () => {
    const s = die();
    expect(s).toHaveLength(6);
    expect(s.map((o) => o.label)).toEqual(['1', '2', '3', '4', '5', '6']);
    expect(uniqueIds(s)).toBe(true);
  });

  it('koin: n(S) = 2', () => {
    expect(coin().map((o) => o.label)).toEqual(['Angka', 'Gambar']);
  });

  it('dua koin: n(S) = 4', () => {
    const s = twoCoins();
    expect(s).toHaveLength(4);
    expect(uniqueIds(s)).toBe(true);
  });

  it('bola: setiap bola satu titik sampel', () => {
    const s = balls({ Merah: 3, Biru: 2 });
    expect(s).toHaveLength(5);
    expect(uniqueIds(s)).toBe(true);
    expect(countByLabel(s).get('Biru')).toBe(2);
  });

  it('bola: jumlah tidak valid ditolak', () => {
    expect(() => balls({ Merah: -1 })).toThrow(RangeError);
    expect(() => balls({ Merah: 1.5 })).toThrow(RangeError);
  });

  it('kartu 1–10: n(S) = 10', () => {
    expect(cards(1, 10)).toHaveLength(10);
    expect(() => cards(5, 1)).toThrow(RangeError);
  });

  it('spinner 4 warna', () => {
    const s = spinner(['Merah', 'Kuning', 'Hijau', 'Biru']);
    expect(s).toHaveLength(4);
    expect(uniqueIds(s)).toBe(true);
  });

  it('pickIds: angka genap pada dadu', () => {
    expect(pickIds(die(), (o) => (o.value ?? 0) % 2 === 0)).toEqual(['d2', 'd4', 'd6']);
  });

  it('pickIds: kelipatan 3 pada kartu 1–10', () => {
    expect(pickIds(cards(1, 10), (o) => (o.value ?? 0) % 3 === 0)).toHaveLength(3);
  });
});
