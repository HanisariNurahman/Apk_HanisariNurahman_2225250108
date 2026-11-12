# CLAUDE.md — Panduan Kerja untuk Claude Code

File ini dibaca otomatis oleh Claude Code setiap sesi. Isinya aturan proyek yang **wajib** diikuti saat menulis kode.

## Ringkasan proyek

**PeluangKu** adalah aplikasi web (PWA, *mobile-first*) untuk siswa SMP kelas VIII yang sedang belajar **peluang sederhana**.
Tujuannya menurunkan *extraneous cognitive load*, mengelola *intrinsic load* lewat langkah bertahap, dan mendorong *germane load*
(simulasi, refleksi, transfer). Aplikasi ini mendukung literasi matematika siswa.

- Konteks riset: skripsi S1 Pendidikan Matematika, model **ADDIE**. Tahap Analysis selesai (wawancara S01, 8 Nov 2026).
- Dokumen acuan (baca sebelum mengerjakan fitur):
  - [docs/PRD.md](docs/PRD.md): kebutuhan produk dan fitur
  - [docs/DESIGN.md](docs/DESIGN.md): desain UI/UX dan prinsip beban kognitif
  - [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md): stack, struktur folder, model data
  - [docs/CONTENT.md](docs/CONTENT.md): materi, contoh soal, dan petunjuk bertingkat
  - [docs/TRACEABILITY.md](docs/TRACEABILITY.md): temuan wawancara → keputusan fitur → cara uji
  - [docs/TASKS.md](docs/TASKS.md): urutan pengerjaan (milestone)

## Stack (jangan diganti tanpa persetujuan)

- **Frontend (root):** Vite + React 18 + TypeScript, CSS variables, `vite-plugin-pwa`
- **Backend (`backend/`):** Python + FastAPI + SQLAlchemy 2; SQLite saat pengembangan, PostgreSQL di produksi
- **Analisis (`analysis/`):** Python + pandas + matplotlib
- **Offline-first:** aplikasi harus berfungsi penuh tanpa internet. Backend hanya untuk mengumpulkan log penelitian.
  Log disimpan dulu di `localStorage`, lalu dikirim saat online (`src/lib/sync.ts`). Tidak boleh ada fitur belajar yang bergantung pada server.
- Tidak ada login siswa dan tidak ada analitik pihak ketiga.
- Uji: Vitest (frontend), pytest (backend)

## Perintah

```bash
npm install            # pasang dependensi frontend
npm run dev -- --host  # server pengembangan, bisa dibuka di HP
npm run build          # build produksi ke dist/
npm run test           # Vitest

cd backend && uvicorn app.main:app --reload   # API di http://127.0.0.1:8000/docs
cd backend && pytest
```

## Aturan wajib (berasal dari temuan wawancara)

1. **Satu langkah per layar.** Jangan tampilkan lebih dari satu tugas kognitif dalam satu layar (EL04, DS03).
2. **Urutan materi tetap:** ruang sampel → titik sampel → kejadian → peluang (EL04).
3. **Teks dan visual berdekatan.** Label atau penjelasan diletakkan langsung di dekat gambar dadu/koin, bukan di paragraf terpisah (EL02, split-attention).
4. **Warna hanya untuk makna.** Gunakan warna untuk menandai: *diketahui*, *ditanya*, *terpilih*, *benar*, dan *perlu dicek*. Jangan dipakai sebagai hiasan (EL03).
5. **Jangan pernah langsung menampilkan jawaban akhir.** Petunjuk diberikan bertingkat (Level 1 → 2 → 3). Jawaban akhir hanya muncul setelah siswa menekan tombol eksplisit "Lihat pembahasan", dan pemakaiannya dicatat (GL03, DS02).
6. **Umpan balik harus menyertakan alasan**, bukan hanya "Benar/Salah" (GL02).
7. **Animasi minimal.** Durasi ≤ 300 ms, hanya untuk umpan balik (misalnya dadu dilempar). Hormati `prefers-reduced-motion`.
   **Grafik 3D (three.js)** hanya di [Chart3D.tsx](src/components/Chart3D.tsx): wajib lazy-load, render sesuai permintaan
   (tanpa loop `requestAnimationFrame` permanen), tanpa rotasi otomatis atau objek hiasan, dan harus selalu punya cadangan 2D
   serta tabel data. Lihat DESIGN.md §4.5.
8. **Bahasa:** Bahasa Indonesia baku tetapi ramah, kalimat pendek (≤ 20 kata), sapaan "kamu". Hindari istilah CLT (intrinsic, extraneous, germane) di UI.
9. **Tanpa data pribadi.** Siswa hanya memasukkan kode (contoh: S01). Jangan menambahkan field nama, email, atau foto.
10. **Mobile-first.** Uji pada lebar 360 px. Target sentuh minimal 48×48 px. Tidak boleh ada scroll horizontal.

## Konvensi kode

- Komponen di `src/components/`, halaman di `src/pages/`, logika murni di `src/lib/` (wajib punya unit test).
- Konten soal disimpan sebagai **data** di `src/content/*.ts` (lihat skema di ARCHITECTURE.md). Jangan menulis soal langsung di JSX.
- Pecahan selalu direpresentasikan sebagai `{ num: number; den: number }`, bukan desimal, agar penyederhanaan dapat dinilai.
- Nama variabel/fungsi dalam bahasa Inggris; teks UI dalam Bahasa Indonesia.
- Skema log di `backend/app/schemas.py` harus selalu sama dengan `AttemptLog` di `src/types.ts`. Ubah keduanya bersamaan.
- Rahasia (`TEACHER_TOKEN`, `CLASS_KEYS`, `DATABASE_URL`) hanya ada di `.env` atau env hosting, tidak pernah di-commit.
- Setiap fitur baru ditandai di commit/PR dengan kode temuan yang menjadi dasarnya, misalnya `feat(hint): petunjuk bertingkat [GL03, DS02]`.

## Yang TIDAK boleh dilakukan

- Menambahkan gamifikasi berlebihan (konfeti, maskot, poin berkedip, leaderboard). Ini menambah beban yang tidak relevan.
- Menambah tombol/menu yang tidak dipakai di layar tersebut.
- Mengubah urutan atau isi materi tanpa memperbarui CONTENT.md dan TRACEABILITY.md.
- Mengklaim di UI atau dokumen bahwa aplikasi "terbukti" menurunkan beban kognitif. Itu baru diuji pada tahap Evaluation.
