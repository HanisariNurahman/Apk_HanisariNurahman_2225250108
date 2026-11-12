import { describe, expect, it } from 'vitest';
import { equals, format, frac, gcd, isProbability, isSimplest, isValid, simplify, toNumber } from './fraction';

describe('gcd', () => {
  it('menghitung FPB', () => {
    expect(gcd(6, 3)).toBe(3);
    expect(gcd(12, 18)).toBe(6);
    expect(gcd(7, 5)).toBe(1);
    expect(gcd(-4, 6)).toBe(2);
    expect(gcd(0, 5)).toBe(5);
  });
});

describe('simplify', () => {
  it('3/6 → 1/2', () => expect(simplify(frac(3, 6))).toEqual(frac(1, 2)));
  it('0/6 → 0/1', () => expect(simplify(frac(0, 6))).toEqual(frac(0, 1)));
  it('6/6 → 1/1', () => expect(simplify(frac(6, 6))).toEqual(frac(1, 1)));
  it('6/12 → 1/2', () => expect(simplify(frac(6, 12))).toEqual(frac(1, 2)));
  it('4/15 tetap', () => expect(simplify(frac(4, 15))).toEqual(frac(4, 15)));
  it('penyebut negatif dinormalkan', () => expect(simplify(frac(2, -4))).toEqual(frac(-1, 2)));
  it('penyebut 0 ditolak', () => expect(() => simplify(frac(1, 0))).toThrow(RangeError));
});

describe('isSimplest', () => {
  it('mengenali bentuk paling sederhana', () => {
    expect(isSimplest(frac(1, 2))).toBe(true);
    expect(isSimplest(frac(3, 6))).toBe(false);
    expect(isSimplest(frac(0, 1))).toBe(true);
    expect(isSimplest(frac(0, 6))).toBe(false);
    expect(isSimplest(frac(1, 1))).toBe(true);
    expect(isSimplest(frac(1, -2))).toBe(false);
    expect(isSimplest(frac(1, 0))).toBe(false);
  });
});

describe('equals', () => {
  it('pecahan senilai dianggap sama', () => {
    expect(equals(frac(3, 6), frac(1, 2))).toBe(true);
    expect(equals(frac(2, 6), frac(1, 3))).toBe(true);
    expect(equals(frac(0, 6), frac(0, 1))).toBe(true);
    expect(equals(frac(2, 5), frac(3, 5))).toBe(false);
  });
});

describe('lain-lain', () => {
  it('isValid', () => {
    expect(isValid(frac(1, 2))).toBe(true);
    expect(isValid(frac(1, 0))).toBe(false);
    expect(isValid(frac(1.5, 2))).toBe(false);
    expect(isValid(frac(NaN, 2))).toBe(false);
  });
  it('isProbability', () => {
    expect(isProbability(frac(0, 6))).toBe(true);
    expect(isProbability(frac(6, 6))).toBe(true);
    expect(isProbability(frac(7, 6))).toBe(false);
    expect(isProbability(frac(-1, 6))).toBe(false);
  });
  it('toNumber & format', () => {
    expect(toNumber(frac(1, 4))).toBe(0.25);
    expect(format(frac(3, 10))).toBe('3/10');
  });
});
