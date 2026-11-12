import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeLog, uuid } from './attempt';
import { logsToCsv } from './exportCsv';
import { FADE_AFTER, isFaded, isIndependent, updateMastery } from './fading';
import { checkSelection, formatSet, gradeSimplify, toggle, wordCount } from './learn';
import { chunkSentence, correctMarks, marksToSpans, nextMark, spanOf } from './marking';
import { checkPin, hashPin, isValidPin } from './pin';
import {
  appendLog,
  getClassCode,
  listStudentCodes,
  loadReflections,
  normalizeClassCode,
  saveReflection,
  setClassCode,
  writeJSON,
} from './storage';
import { syncAll } from './sync';

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

describe('learn', () => {
  it('checkSelection membedakan pilihan lebih dan kurang', () => {
    expect(checkSelection(['d2', 'd4', 'd6'], ['d2', 'd4', 'd6']).ok).toBe(true);
    expect(checkSelection(['d2', 'd3'], ['d2', 'd4'])).toEqual({ ok: false, extra: ['d3'], missing: ['d4'] });
  });
  it('formatSet, wordCount, toggle', () => {
    expect(formatSet(['2', '4'])).toBe('{2, 4}');
    expect(formatSet([])).toBe('{ }');
    expect(wordCount('P(A) = n(A) / n(S) = 3/6.')).toBe(4); // simbol = dan / bukan kata
    expect([...toggle(new Set(['a']), 'a')]).toEqual([]);
    expect([...toggle(new Set(), 'b')]).toEqual(['b']);
  });
  it('gradeSimplify: harus senilai dan paling sederhana, dengan alasan', () => {
    expect(gradeSimplify({ num: 2, den: 4 }, { num: 1, den: 2 }).ok).toBe(true);
    expect(gradeSimplify({ num: 4, den: 8 }, { num: 2, den: 4 }).message).toContain('masih bisa dibagi');
    expect(gradeSimplify({ num: 3, den: 9 }, { num: 1, den: 2 }).message).toContain('berubah');
    expect(gradeSimplify({ num: 3, den: 9 }, { num: 1, den: 0 }).ok).toBe(false);
  });
});

describe('marking', () => {
  const story = ['Dalam kantong ada 3 bola merah dan 2 bola biru.', 'Berapa peluang terambil bola biru?'];
  const known = spanOf(story, 0, '3 bola merah dan 2 bola biru');
  const asked = spanOf(story, 1, 'Berapa peluang terambil bola biru');

  it('spanOf menemukan frasa dan menolak frasa yang tidak ada', () => {
    expect(known).toEqual([0, 18, 46]);
    expect(() => spanOf(story, 0, 'kucing')).toThrow();
  });

  it('chunkSentence memotong di batas span dan tanda baca, bukan di dalam span', () => {
    const s = ['Isinya 6 rasa jeruk, 4 rasa stroberi, dan 5 rasa mint.'];
    const c = chunkSentence(s[0], 0, [spanOf(s, 0, '6 rasa jeruk, 4 rasa stroberi, dan 5 rasa mint')]);
    expect(c.map((x) => x.text)).toEqual(['Isinya', '6 rasa jeruk, 4 rasa stroberi, dan 5 rasa mint', '.']);
    expect(chunkSentence(story[0], 0, [known]).map((x) => x.text)).toEqual([
      'Dalam kantong ada',
      '3 bola merah dan 2 bola biru',
      '.',
    ]);
  });

  it('ketukan berputar dan tanda menjadi span', () => {
    expect(nextMark('none')).toBe('known');
    expect(nextMark('known')).toBe('asked');
    expect(nextMark('asked')).toBe('none');
    const chunks = [chunkSentence(story[0], 0, [known]), chunkSentence(story[1], 1, [asked])];
    expect(marksToSpans(correctMarks([known], [asked]), chunks)).toEqual({ known: [known], asked: [asked] });
  });
});

describe('fading (F5)', () => {
  const zero = { mark: 0, S: 0, A: 0, P: 0, check: 0 };
  const indep = { tries: 1, maxHintLevel: 0, openedDiscussion: false, correct: true };

  it('aktif setelah 2 benar berturut-turut tanpa petunjuk', () => {
    let m = updateMastery(zero, 'S', indep);
    expect(isFaded(m, 'S', 'dasar')).toBe(false);
    m = updateMastery(m, 'S', indep);
    expect(m.S).toBe(FADE_AFTER);
    expect(isFaded(m, 'S', 'dasar')).toBe(true);
  });

  it('petunjuk, percobaan kedua, atau pembahasan mengulang hitungan', () => {
    const m = { ...zero, A: 1 };
    expect(updateMastery(m, 'A', { ...indep, maxHintLevel: 1 }).A).toBe(0);
    expect(updateMastery(m, 'A', { ...indep, tries: 2 }).A).toBe(0);
    expect(updateMastery(m, 'A', { ...indep, openedDiscussion: true }).A).toBe(0);
    expect(isIndependent({ ...indep, correct: false })).toBe(false);
  });

  it('langkah ④ ⑤ tidak pernah diringkas; penandaan cerita panjang juga tidak', () => {
    const m = { mark: 5, S: 5, A: 5, P: 5, check: 5 };
    expect(isFaded(m, 'P', 'dasar')).toBe(false);
    expect(isFaded(m, 'check', 'dasar')).toBe(false);
    expect(isFaded(m, 'mark', 'cerita-pendek')).toBe(true);
    expect(isFaded(m, 'mark', 'cerita-panjang')).toBe(false);
  });
});

describe('attempt log (F11)', () => {
  it('uuid v4 valid, juga tanpa crypto.randomUUID', () => {
    const id = uuid((b) => b.fill(0xab));
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(uuid()).not.toBe(uuid());
  });

  it('makeLog sesuai AttemptLog; waktu selesai tidak sebelum mulai', () => {
    const start = new Date('2026-11-20T01:00:00Z');
    const log = makeLog({ classCode: '8A', studentCode: 'S01' }, 'D-01', {
      step: 'S',
      startedAt: start,
      endedAt: new Date('2026-11-20T00:59:00Z'),
      tries: 2,
      maxHintLevel: 1,
      openedDiscussion: false,
      correct: true,
    }, 'id-1');
    expect(log).toEqual({
      id: 'id-1', classCode: '8A', studentCode: 'S01', problemId: 'D-01', step: 'S',
      startedAt: '2026-11-20T01:00:00.000Z', endedAt: '2026-11-20T01:00:00.000Z',
      tries: 2, maxHintLevel: 1, openedDiscussion: false, correct: true,
    }); // prettier-ignore
  });
});

describe('ekspor CSV', () => {
  it('kolom sama dengan CSV backend; nilai berisi koma diberi tanda kutip', () => {
    const csv = logsToCsv([
      {
        id: 'a', classCode: '8A', studentCode: 'S01', problemId: 'D,01', step: 'P',
        startedAt: 't0', endedAt: 't1', tries: 1, maxHintLevel: 0, openedDiscussion: false, correct: true,
      },
    ]); // prettier-ignore
    const [head, row] = csv.trim().split('\n');
    expect(head).toBe('id,class_code,student_code,problem_id,step,started_at,ended_at,tries,max_hint_level,opened_discussion,correct');
    expect(row).toBe('a,8A,S01,"D,01",P,t0,t1,1,0,False,True');
  });
});

describe('PIN guru', () => {
  it('4–6 angka; hash cocok; PIN salah ditolak', () => {
    expect(isValidPin('1234')).toBe(true);
    expect(isValidPin('12a4')).toBe(false);
    expect(isValidPin('123')).toBe(false);
    const h = hashPin('2468');
    expect(h).not.toContain('2468');
    expect(checkPin('2468', h)).toBe(true);
    expect(checkPin('2469', h)).toBe(false);
    expect(checkPin('2468', null)).toBe(false);
  });
});

describe('storage tambahan', () => {
  beforeEach(() => vi.stubGlobal('localStorage', fakeStorage()));
  afterEach(() => vi.unstubAllGlobals());

  it('kode kelas dinormalkan dan divalidasi seperti backend', () => {
    expect(normalizeClassCode(' 8a ')).toBe('8A');
    expect(normalizeClassCode('8 B')).toBe('8B');
    expect(normalizeClassCode('kelas#1')).toBeNull();
    expect(setClassCode('viii-a')).toBe('VIII-A');
    expect(getClassCode()).toBe('VIII-A');
  });

  it('listStudentCodes hanya kode siswa valid yang punya log', () => {
    writeJSON('peluangku:logs:S02', []);
    writeJSON('peluangku:logs:S01', []);
    writeJSON('peluangku:logs:budi', []);
    writeJSON('peluangku:progress:S09', {});
    expect(listStudentCodes()).toEqual(['S01', 'S02']);
  });

  it('refleksi disimpan per siswa', () => {
    saveReflection('S01', { source: 'D-01', answers: { nA: '1' }, text: 'karena', at: 't' });
    expect(loadReflections('S01')).toHaveLength(1);
    expect(loadReflections('S02')).toHaveLength(0);
  });

  it('syncAll mengirim log semua siswa di HP; mati tanpa konfigurasi', async () => {
    const base = {
      classCode: '8A', problemId: 'D-01', step: 'P' as const, startedAt: 't', endedAt: 't',
      tries: 1, maxHintLevel: 0 as const, openedDiscussion: false, correct: true,
    }; // prettier-ignore
    appendLog({ ...base, id: 'id-00000001', studentCode: 'S01' });
    appendLog({ ...base, id: 'id-00000002', studentCode: 'S02' });
    const fetchFn = vi.fn(async (_u: string, init?: RequestInit) => {
      const ids = (JSON.parse(String(init?.body)).logs as { id: string }[]).map((l) => l.id);
      return new Response(JSON.stringify({ accepted: ids, duplicates: [] }), { status: 200 });
    }) as unknown as typeof fetch;
    expect(await syncAll(null)).toBeNull();
    expect(await syncAll({ apiUrl: 'http://x/api', classKey: 'k', fetchFn })).toEqual({ ok: true, sent: 2, pending: 0 });
  });
});
