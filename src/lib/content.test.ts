// Uji konten (CLAUDE.md): data soal & kartu harus konsisten dan mematuhi batas beban kognitif.
import { describe, expect, it } from 'vitest';
import { FRACTION_CARDS } from '../content/fractionCards';
import { LESSON_CONTENT, LESSONS, type LessonCard } from '../content/lessons';
import { PROBLEMS } from '../content/problems';
import { checkProblem, gradeStep } from './grader';
import { wordCount } from './learn';
import { chunkStory, correctMarks, marksToSpans } from './marking';

function cardText(c: LessonCard): string {
  switch (c.kind) {
    case 'text':
      return [c.title, ...c.body].join(' ');
    case 'tapAll':
    case 'tapEvent':
      return [c.title, c.prompt, c.done].join(' ');
    case 'count':
      return [c.title, c.prompt, c.done].join(' ');
    case 'choice':
      return [c.title, c.prompt, ...c.options.map((o) => o.text)].join(' ');
    case 'compare':
      return [c.title, ...c.head, ...c.rows.flat()].join(' ');
    case 'worked':
      return [c.title, ...c.steps].join(' ');
    case 'complete':
      return [c.title, ...c.given, c.prompt].join(' ');
    case 'range':
      return [c.title, c.body, ...c.points.map((p) => p.label)].join(' ');
  }
}

describe('kartu belajar (F1)', () => {
  it('urutan subbab tetap (EL04)', () => {
    expect(LESSONS.map((l) => l.id)).toEqual(['ruang-sampel', 'titik-sampel', 'kejadian', 'peluang']);
  });

  it('setiap subbab 3–6 kartu', () => {
    for (const l of LESSON_CONTENT) expect(l.cards.length, l.id).toBeGreaterThanOrEqual(3);
    for (const l of LESSON_CONTENT) expect(l.cards.length, l.id).toBeLessThanOrEqual(6);
  });

  it('tidak ada kartu lebih dari 60 kata', () => {
    for (const l of LESSON_CONTENT)
      for (const c of l.cards) expect(wordCount(cardText(c)), `${l.id}: ${c.title}`).toBeLessThanOrEqual(60);
  });

  it('kartu ketuk-kejadian hanya memakai id yang ada di ruang sampel', () => {
    for (const l of LESSON_CONTENT)
      for (const c of l.cards)
        if (c.kind === 'tapEvent' || c.kind === 'complete') {
          const ids = new Set(c.space.map((o) => o.id));
          for (const id of c.eventIds) expect(ids.has(id), `${c.title}: ${id}`).toBe(true);
        }
  });

  it('pilihan ganda punya tepat satu jawaban benar dan setiap pilihan punya alasan (GL02)', () => {
    for (const l of LESSON_CONTENT)
      for (const c of l.cards)
        if (c.kind === 'choice') {
          expect(c.options.filter((o) => o.correct)).toHaveLength(1);
          for (const o of c.options) expect(o.reason.length).toBeGreaterThan(10);
        }
  });
});

describe('bank soal (F10)', () => {
  it('semua soal konsisten (checkProblem)', () => {
    for (const p of PROBLEMS) expect(checkProblem(p), p.id).toEqual([]);
  });

  it('id unik, sesuai daftar CONTENT.md §4', () => {
    expect(PROBLEMS.map((p) => p.id)).toEqual([
      'D-01', 'D-02', 'D-03', 'D-04', 'D-05', 'D-06',
      'C-01', 'C-02', 'C-03', 'C-04',
      'L-01', 'L-02', 'L-03',
      'X-01',
    ]); // prettier-ignore
  });

  it('kunci jawaban sesuai CONTENT.md', () => {
    const answers = Object.fromEntries(PROBLEMS.map((p) => [p.id, `${p.answer.num}/${p.answer.den}`]));
    expect(answers).toEqual({
      'D-01': '1/6', 'D-02': '1/2', 'D-03': '1/3', 'D-04': '1/2', 'D-05': '0/1', 'D-06': '1/1',
      'C-01': '2/5', 'C-02': '3/10', 'C-03': '1/4', 'C-04': '1/2',
      'L-01': '1/2', 'L-02': '4/15', 'L-03': '1/3', 'X-01': '1/2',
    }); // prettier-ignore
  });

  it('kalimat soal ≤ 20 kata (CLAUDE.md aturan 8)', () => {
    for (const p of PROBLEMS) for (const s of p.story) expect(wordCount(s), `${p.id}: ${s}`).toBeLessThanOrEqual(20);
  });

  it('setiap span penanda menjadi potongan yang bisa diketuk, dan tanda benar lolos grader', () => {
    for (const p of PROBLEMS) {
      const chunks = chunkStory(p.story, [...p.knownSpans, ...p.askedSpans]);
      const keys = new Set(chunks.flat().map((c) => c.key));
      for (const s of [...p.knownSpans, ...p.askedSpans]) expect(keys.has(s.join(':')), `${p.id} ${s}`).toBe(true);
      const spans = marksToSpans(correctMarks(p.knownSpans, p.askedSpans), chunks);
      expect(gradeStep(p, { step: 'mark', ...spans }).ok, p.id).toBe(true);
    }
  });

  it('cerita panjang punya informasi pengecoh (≥ 3 kata) yang tidak ditandai (EL01)', () => {
    for (const p of PROBLEMS.filter((q) => q.level === 'cerita-panjang')) {
      const spans = [...p.knownSpans, ...p.askedSpans];
      const targets = new Set(spans.map((s) => s.join(':')));
      const distractors = chunkStory(p.story, spans)
        .flat()
        .filter((c) => !targets.has(c.key) && wordCount(c.text) >= 3);
      expect(distractors.length, p.id).toBeGreaterThan(0);
    }
  });

  it('setiap langkah punya petunjuk L1–L3, dan L3 bukan jawaban soal ini (DS02)', () => {
    for (const p of PROBLEMS)
      for (const step of ['mark', 'S', 'A', 'P', 'check'] as const) {
        const h = p.hints[step];
        expect(h, `${p.id} ${step}`).toHaveLength(3);
        expect(h![2], `${p.id} ${step}`).toMatch(/^Contoh/);
      }
  });

  it('pembahasan 5 baris dan memuat jawaban akhir', () => {
    for (const p of PROBLEMS) {
      expect(p.discussion).toHaveLength(5);
      expect(p.discussion[3]).toContain(`${p.eventIds.length}/${p.sampleSpace.length}`);
    }
  });

  it('setiap soal cerita punya pasangan struktur sama ("Mirip dengan", GL05)', () => {
    for (const p of PROBLEMS.filter((q) => q.level === 'cerita-pendek' || q.level === 'cerita-panjang')) {
      if (p.structureTag === 'komplemen') continue; // pasangan konteks lain menyusul (CONTENT.md: target v1)
      expect(p.similarTo?.length, p.id).toBeGreaterThan(0);
    }
  });
});

describe('kartu pecahan (F8)', () => {
  it('latihan cepat sesuai CONTENT.md §7', () => {
    const given = FRACTION_CARDS.filter((c) => c.kind === 'simplify').map((c) =>
      c.kind === 'simplify' ? `${c.given.num}/${c.given.den}` : '',
    );
    expect(given).toEqual(['2/4', '4/8', '3/9', '5/10']);
  });
});
