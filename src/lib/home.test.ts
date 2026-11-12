import { describe, expect, it } from 'vitest';
import { LESSONS } from '../content/lessons';
import { defaultProgress } from './storage';
import { continueTarget, lessonsDoneCount, repeatedTrialsUnlocked } from './home';

const withDone = (...ids: string[]) => ({ ...defaultProgress('S01'), lessonsDone: ids });

describe('urutan subbab', () => {
  it('tetap: ruang sampel → titik sampel → kejadian → peluang (EL04)', () => {
    expect(LESSONS.map((l) => l.id)).toEqual(['ruang-sampel', 'titik-sampel', 'kejadian', 'peluang']);
  });
});

describe('continueTarget', () => {
  it('siswa baru mulai dari Ruang Sampel', () => {
    expect(continueTarget(withDone(), LESSONS)).toEqual({
      title: 'Ruang Sampel',
      detail: 'Subbab 1 dari 4',
      to: '/belajar/ruang-sampel',
    });
  });

  it('melanjutkan ke subbab pertama yang belum selesai, bukan yang sesudah terakhir dikerjakan', () => {
    // Kejadian sudah, tetapi Titik Sampel belum → urutan tetap mengarahkan ke Titik Sampel
    expect(continueTarget(withDone('ruang-sampel', 'kejadian'), LESSONS).to).toBe('/belajar/titik-sampel');
  });

  it('semua subbab selesai → Latihan', () => {
    const t = continueTarget(withDone(...LESSONS.map((l) => l.id)), LESSONS);
    expect(t.to).toBe('/latihan');
  });
});

describe('lessonsDoneCount', () => {
  it('mengabaikan id yang tidak dikenal atau ganda', () => {
    expect(lessonsDoneCount(withDone('kejadian', 'kejadian', 'lama-dihapus'), LESSONS)).toBe(1);
  });
});

describe('repeatedTrialsUnlocked', () => {
  it('hanya setelah subbab Peluang selesai', () => {
    expect(repeatedTrialsUnlocked(withDone('ruang-sampel', 'kejadian'))).toBe(false);
    expect(repeatedTrialsUnlocked(withDone('peluang'))).toBe(true);
  });
});
