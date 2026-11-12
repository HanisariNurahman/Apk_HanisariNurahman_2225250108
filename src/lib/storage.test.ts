import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AttemptLog } from '../types';
import {
  appendLog,
  defaultProgress,
  getCurrentStudent,
  keys,
  loadLogs,
  loadProgress,
  normalizeStudentCode,
  saveProgress,
  setCurrentStudent,
  writeJSON,
} from './storage';

function fakeStorage(): Storage {
  const m = new Map<string, string>();
  return {
    get length() {
      return m.size;
    },
    clear: () => m.clear(),
    getItem: (k) => m.get(k) ?? null,
    key: (i) => [...m.keys()][i] ?? null,
    removeItem: (k) => void m.delete(k),
    setItem: (k, v) => void m.set(k, String(v)),
  };
}

let seq = 0;
const log = (over: Partial<AttemptLog> = {}): AttemptLog => ({
  id: `00000000-0000-4000-8000-${String(++seq).padStart(12, '0')}`,
  classCode: '8A',
  studentCode: 'S01',
  problemId: 'D-01',
  step: 'S',
  startedAt: '2026-11-20T08:00:00.000Z',
  endedAt: '2026-11-20T08:00:30.000Z',
  tries: 1,
  maxHintLevel: 0,
  openedDiscussion: false,
  correct: true,
  ...over,
});

describe('normalizeStudentCode', () => {
  it('menerima kode', () => {
    expect(normalizeStudentCode('S01')).toBe('S01');
    expect(normalizeStudentCode(' s 02 ')).toBe('S02');
    expect(normalizeStudentCode('G123')).toBe('G123');
  });
  it('menolak nama atau format lain', () => {
    expect(normalizeStudentCode('Rina')).toBeNull();
    expect(normalizeStudentCode('')).toBeNull();
    expect(normalizeStudentCode('S1234')).toBeNull();
    expect(normalizeStudentCode('01')).toBeNull();
  });
});

describe('dengan localStorage tersedia', () => {
  beforeEach(() => vi.stubGlobal('localStorage', fakeStorage()));
  afterEach(() => vi.unstubAllGlobals());

  it('menyimpan & membaca kode siswa', () => {
    expect(getCurrentStudent()).toBeNull();
    expect(setCurrentStudent('s01')).toBe('S01');
    expect(getCurrentStudent()).toBe('S01');
    expect(setCurrentStudent('Budi')).toBeNull();
    expect(getCurrentStudent()).toBe('S01');
  });

  it('progres bawaan lalu tersimpan', () => {
    expect(loadProgress('S01')).toEqual(defaultProgress('S01'));
    const p = defaultProgress('S01');
    p.lessonsDone.push('ruang-sampel');
    p.mastery.S = 2;
    expect(saveProgress(p)).toBe(true);
    expect(loadProgress('S01')).toEqual(p);
  });

  it('progres per siswa terpisah (HP dipakai bergantian)', () => {
    const p = defaultProgress('S01');
    p.problemsDone.push('D-01');
    saveProgress(p);
    expect(loadProgress('S02').problemsDone).toEqual([]);
  });

  it('progres rusak/lama digabung dengan bawaan', () => {
    writeJSON(keys.progress('S01'), { lessonsDone: 'bukan-array', mastery: { S: 1 } });
    const p = loadProgress('S01');
    expect(p.lessonsDone).toEqual([]);
    expect(p.mastery.S).toBe(1);
    expect(p.mastery.P).toBe(0);
    expect(p.settings.theme).toBe('auto');
  });

  it('JSON rusak tidak membuat error', () => {
    localStorage.setItem(keys.progress('S01'), '{rusak');
    expect(loadProgress('S01')).toEqual(defaultProgress('S01'));
  });

  it('log ditambahkan berurutan', () => {
    appendLog(log());
    appendLog(log({ step: 'A', maxHintLevel: 2 }));
    const logs = loadLogs('S01');
    expect(logs).toHaveLength(2);
    expect(logs[1].maxHintLevel).toBe(2);
  });
});

describe('tanpa localStorage / diblokir', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('tidak tersedia → tetap berjalan dengan nilai bawaan', () => {
    vi.stubGlobal('localStorage', undefined);
    expect(getCurrentStudent()).toBeNull();
    expect(saveProgress(defaultProgress('S01'))).toBe(false);
    expect(loadProgress('S01')).toEqual(defaultProgress('S01'));
    expect(appendLog(log())).toBe(false);
  });

  it('setItem melempar error (penuh) → false, tidak crash', () => {
    const s = fakeStorage();
    s.setItem = () => {
      throw new Error('QuotaExceededError');
    };
    vi.stubGlobal('localStorage', s);
    expect(saveProgress(defaultProgress('S01'))).toBe(false);
  });
});
