// Daftar subbab Belajar (F1). Urutan TETAP: ruang sampel → titik sampel → kejadian → peluang (EL04).
// Isi kartu tiap subbab ditambahkan di M3 (lihat docs/CONTENT.md §2). Jangan ubah urutan tanpa memperbarui
// CONTENT.md dan TRACEABILITY.md.

export interface LessonOutline {
  id: string;
  title: string;
}

export const LESSONS: readonly LessonOutline[] = [
  { id: 'ruang-sampel', title: 'Ruang Sampel' },
  { id: 'titik-sampel', title: 'Titik Sampel' },
  { id: 'kejadian', title: 'Kejadian' },
  { id: 'peluang', title: 'Peluang' },
];
