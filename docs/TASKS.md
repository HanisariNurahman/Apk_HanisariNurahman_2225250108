# TASKS — Rencana Pengerjaan (tahap Development)

Kerjakan **berurutan**. Setiap milestone diakhiri dengan pengujian di HP Android sungguhan sebelum lanjut.
Tip *vibe coding*: berikan satu milestone per perintah ke Claude Code, misalnya *"Kerjakan M2 sesuai docs/TASKS.md"*.

## M0 — Persiapan proyek
- [ ] `npm create vite@latest . -- --template react-ts`
- [ ] Pasang `react-router-dom`, `vite-plugin-pwa`, `vitest`
- [ ] Buat `src/styles/tokens.css` sesuai DESIGN.md §2 (terang dan gelap)
- [ ] Buat `src/types.ts` sesuai ARCHITECTURE.md §3
- [ ] Inisialisasi git; commit pertama
- **Selesai jika:** `npm run dev -- --host` terbuka di HP lewat Wi-Fi yang sama

## M1 — Logika inti (tanpa UI)
- [ ] `lib/fraction.ts` + test
- [ ] `lib/sampleSpace.ts` + test
- [ ] `lib/grader.ts` + test (semua kode kesalahan di CONTENT.md §6)
- [ ] `lib/storage.ts` (try/catch)
- **Selesai jika:** `npm run test` hijau

## M2 — Kerangka dan Beranda
- [ ] Router + halaman kosong
- [ ] Layar input kode siswa (S01, …) saat pertama kali dibuka
- [ ] Beranda (DESIGN §4.1) dengan tombol "Lanjutkan"
- **Selesai jika:** lebar 360 px tanpa scroll horizontal

## M3 — Belajar (F1 + F2)
- [ ] `CardDeck` (Lanjut/Kembali, indikator posisi)
- [ ] `SampleSpaceBoard` (grid, ketuk untuk memilih, n(S)/n(A) langsung)
- [ ] Isi `content/lessons.ts` subbab 1–4 (CONTENT.md §2)
- **Selesai jika:** siswa bisa menyelesaikan keempat subbab; progres tersimpan

## M4 — Latihan (F3, F4, F5, F6)
- [ ] `StepGuide` 5 langkah dengan penguncian langkah ④
- [ ] `StoryMarker` (diketahui/ditanya)
- [ ] `HintLadder` L1–L3 + tombol "Lihat pembahasan"
- [ ] `Feedback` dengan pesan dari `grader`
- [ ] `FractionInput` / `FractionView`
- [ ] Isi `content/problems.ts` (minimal level Dasar dan Cerita pendek)
- **Selesai jika:** soal D-01 hingga C-04 dapat dikerjakan dari awal sampai akhir

## M5 — Simulasi (F7)
- [x] `lib/simulation.ts` + test (RNG ber-seed, frekuensi relatif, skala grafik)
- [x] Halaman simulasi koin dan dadu + tabel frekuensi
- [x] Grafik batang 3D interaktif (three.js, lazy-load) + cadangan 2D tanpa WebGL
- [x] Ketuk batang/baris tabel → detail frekuensi relatif dan perbandingan dengan peluang teoretik
- [x] Pertanyaan refleksi (tampil setelah ≥ 10 lemparan)
- [ ] Uji di HP Android sungguhan: putar grafik, mode gelap, kelancaran di HP kelas bawah
- [ ] Kunci tombol 10×/50× sampai subbab Peluang selesai (butuh progres dari M3)
- [ ] Simpan jawaban refleksi (F9)

## M6 — Fading, refleksi, prasyarat, transfer (F5-fading, F8, F9, F10)
- [ ] `lib/fading.ts` + test
- [ ] Kartu "Ingat lagi: Pecahan"
- [ ] `Reflection` (isian alasan)
- [ ] Soal cerita panjang + label "Mirip dengan …"

## M7 — Log, sinkronisasi, dan ekspor (F11)
- [ ] Pencatatan `AttemptLog` (dengan `id` UUID dan `classCode`)
- [ ] Layar input kode kelas
- [x] `lib/sync.ts` + test (antrean, idempoten, batch ≤ 500; diuji ujung ke ujung ke FastAPI lokal)
- [ ] Panggil `syncStudent` saat aplikasi dibuka, event `online`, dan setelah soal selesai
- [ ] Area guru (PIN): jumlah log belum terkirim + ekspor CSV lokal

## B1 — Backend FastAPI (Python)
- [x] Siapkan venv (Python 3.15 berhasil; `uvicorn` tanpa `[standard]` karena PyYAML belum punya wheel 3.15)
- [x] `backend/app`: config, db, models, schemas, security, router logs & teacher (ARCHITECTURE §4)
- [x] `.env.example`; rahasia tidak di-commit
- [x] pytest: log valid, duplikat, kunci kelas salah (401), token guru salah (401), data tidak valid (422)
- **Selesai jika:** `pytest` hijau dan `/docs` bisa dibuka

## B2 — Deploy backend
- [ ] PostgreSQL terkelola + Render/Railway; isi env
- [ ] Uji end-to-end: HP offline → kerjakan soal → online → log muncul di `/api/teacher/summary`

## A1 — Analisis data (Python)
- [ ] `analysis/load.py` (CSV atau API) dan `report.py` (tabel & grafik)
- [ ] Uji dengan data contoh buatan (bukan data siswa)

## M8 — PWA, aksesibilitas, rilis
- [ ] Manifest, ikon, service worker; uji offline
- [ ] Pengaturan ukuran huruf dan mode gelap
- [ ] Daftar periksa DESIGN §7
- [ ] Deploy (GitHub Pages / Netlify); uji "Tambahkan ke Layar Utama"

## M9 — Validasi dan revisi (ADDIE Development → Implementation)
- [ ] Validasi ahli materi dan ahli media → catat revisi di TRACEABILITY.md §4
- [ ] Uji one-to-one dengan 2–3 siswa (bukan informan utama), observasi, dan ekspor log
- [ ] Revisi v1.1
