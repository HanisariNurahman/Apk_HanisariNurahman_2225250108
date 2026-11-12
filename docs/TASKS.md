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
- [x] Router (HashRouter) + halaman kosong Belajar, Latihan, Ingat Pecahan
- [x] Layar input kode siswa (S01, …) saat pertama kali dibuka; ganti kode lewat menu ⋮, progres per kode
- [x] Beranda (DESIGN §4.1) dengan tombol "Lanjutkan" (`lib/home.ts` + test)
- **Selesai jika:** lebar 360 px tanpa scroll horizontal

## M3 — Belajar (F1 + F2)
- [x] `CardDeck` (Lanjut/Kembali, indikator posisi; Lanjut aktif setelah interaksi kartu selesai)
- [x] `SampleSpaceBoard` (grid, ketuk untuk memilih, n(S)/n(A) langsung)
- [x] Isi `content/lessons.ts` subbab 1–4 (CONTENT.md §2), 5 kartu per subbab; subbab berikutnya terkunci sampai yang sebelumnya selesai
- **Selesai jika:** siswa bisa menyelesaikan keempat subbab; progres tersimpan

## M4 — Latihan (F3, F4, F5, F6)
- [x] Pemandu 5 langkah (`pages/Practice.tsx`) dengan penguncian langkah ④
- [x] `StoryMarker` (diketahui/ditanya) + `lib/marking.ts`
- [x] `HintLadder` L1–L3 + tombol "Lihat pembahasan" (dicatat di log)
- [x] `Feedback` dengan pesan dari `grader`
- [x] `FractionInput` / `FractionView`
- [x] Isi `content/problems.ts`: 14 soal CONTENT.md §4 (Dasar, Cerita pendek, Cerita panjang, Lanjut)
- **Selesai jika:** soal D-01 hingga C-04 dapat dikerjakan dari awal sampai akhir

## M5 — Simulasi (F7)
- [x] `lib/simulation.ts` + test (RNG ber-seed, frekuensi relatif, skala grafik)
- [x] Halaman simulasi koin dan dadu + tabel frekuensi
- [x] Grafik batang 3D interaktif (three.js, lazy-load) + cadangan 2D tanpa WebGL
- [x] Ketuk batang/baris tabel → detail frekuensi relatif dan perbandingan dengan peluang teoretik
- [x] Pertanyaan refleksi (tampil setelah ≥ 10 lemparan)
- [ ] Uji di HP Android sungguhan: putar grafik, mode gelap, kelancaran di HP kelas bawah
- [x] Kunci tombol 10×/50× sampai subbab Peluang selesai
- [x] Simpan jawaban refleksi (F9, di HP)

## M6 — Fading, refleksi, prasyarat, transfer (F5-fading, F8, F9, F10)
- [x] `lib/fading.ts` + test
- [x] Kartu "Ingat lagi: Pecahan" (halaman + otomatis saat `P_NOT_SIMPLE`)
- [x] `Reflection` (isian alasan + kalimat sendiri opsional)
- [x] Soal cerita panjang + label "Mirip dengan …"

## M7 — Log, sinkronisasi, dan ekspor (F11)
- [x] Pencatatan `AttemptLog` (dengan `id` UUID dan `classCode`)
- [x] Layar input kode kelas (bersama kode siswa)
- [x] `lib/sync.ts` + test (antrean, idempoten, batch ≤ 500; diuji ujung ke ujung ke FastAPI lokal)
- [x] Panggil sinkronisasi saat aplikasi dibuka, event `online`, dan setelah soal selesai
- [x] Area guru (PIN): jumlah log belum terkirim + kunci kelas + ekspor CSV lokal

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
- [x] `analysis/load.py` (CSV atau API), `metrics.py`, dan `report.py` (tabel, grafik PNG, `laporan.md`)
- [x] Uji dengan data contoh buatan (bukan data siswa): `sample_data.py` + pytest

## M8 — PWA, aksesibilitas, rilis
- [x] Manifest, ikon PNG 192/512/maskable, service worker; uji offline (build produksi, mode pesawat)
- [x] Pengaturan ukuran huruf dan mode gelap (menu ⋮)
- [ ] Daftar periksa DESIGN §7 (sudah: 360 px tanpa scroll, warna + teks/ikon, tanpa jawaban langsung, reduced-motion; belum: ukur kontras WCAG AA)
- [ ] Deploy GitHub Pages (`npm run deploy` → branch `gh-pages`; sumber Pages harus `gh-pages` / root); uji "Tambahkan ke Layar Utama" di HP

## M9 — Validasi dan revisi (ADDIE Development → Implementation)
- [ ] Validasi ahli materi dan ahli media → catat revisi di TRACEABILITY.md §4
- [ ] Uji one-to-one dengan 2–3 siswa (bukan informan utama), observasi, dan ekspor log
- [ ] Revisi v1.1
