// Penanda soal cerita (F4): memecah kalimat menjadi potongan yang bisa diketuk,
// lalu mengubah tanda siswa menjadi Span untuk dinilai grader (gradeStep 'mark').

import type { Span } from '../types';

export type Mark = 'none' | 'known' | 'asked';

export interface Chunk {
  key: string; // "i:start:end"
  span: Span;
  text: string;
}

const PUNCT = /[,.;:?!]/;

/**
 * Potong kalimat di batas setiap span target dan di tanda baca di luar span.
 * Spasi di tepi potongan dibuang, sehingga potongan target persis sama dengan span-nya.
 */
export function chunkSentence(sentence: string, index: number, spans: Span[]): Chunk[] {
  const own = spans.filter(([i]) => i === index);
  const inside = (pos: number) => own.some(([, s, e]) => pos >= s && pos < e);
  const cuts = new Set<number>([0, sentence.length]);
  for (const [, s, e] of own) {
    cuts.add(s);
    cuts.add(e);
  }
  for (let p = 0; p < sentence.length; p++) {
    if (PUNCT.test(sentence[p]) && !inside(p)) cuts.add(p + 1);
  }
  const points = [...cuts].sort((a, b) => a - b);
  const chunks: Chunk[] = [];
  for (let k = 0; k < points.length - 1; k++) {
    let s = points[k];
    let e = points[k + 1];
    while (s < e && /\s/.test(sentence[s])) s++;
    while (e > s && /\s/.test(sentence[e - 1])) e--;
    if (e > s) chunks.push({ key: `${index}:${s}:${e}`, span: [index, s, e], text: sentence.slice(s, e) });
  }
  return chunks;
}

export function chunkStory(story: string[], spans: Span[]): Chunk[][] {
  return story.map((sentence, i) => chunkSentence(sentence, i, spans));
}

/** Ketukan berputar: kosong → Diketahui → Ditanya → kosong. */
export function nextMark(m: Mark): Mark {
  return m === 'none' ? 'known' : m === 'known' ? 'asked' : 'none';
}

export function marksToSpans(marks: Record<string, Mark>, chunks: Chunk[][]): { known: Span[]; asked: Span[] } {
  const known: Span[] = [];
  const asked: Span[] = [];
  for (const c of chunks.flat()) {
    const m = marks[c.key];
    if (m === 'known') known.push(c.span);
    if (m === 'asked') asked.push(c.span);
  }
  return { known, asked };
}

/** Tanda yang benar (dipakai saat siswa memilih "Tunjukkan penanda yang benar"). */
export function correctMarks(known: Span[], asked: Span[]): Record<string, Mark> {
  const out: Record<string, Mark> = {};
  for (const s of known) out[s.join(':')] = 'known';
  for (const s of asked) out[s.join(':')] = 'asked';
  return out;
}

/** Span dari frasa pada kalimat ke-i (untuk menulis konten tanpa menghitung indeks huruf). */
export function spanOf(story: string[], index: number, phrase: string): Span {
  const sentence = story[index];
  const start = sentence?.indexOf(phrase) ?? -1;
  if (start < 0) throw new Error(`Frasa "${phrase}" tidak ada di kalimat ${index}`);
  return [index, start, start + phrase.length];
}
