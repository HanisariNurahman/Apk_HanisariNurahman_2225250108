# TRACEABILITY — Jejak Keputusan ADDIE

Dokumen ini menghubungkan **bukti wawancara → interpretasi → keputusan fitur → cara menguji**. Format ini mengikuti Matriks H
pada pedoman wawancara. Sesuai pedoman, setiap fitur harus memiliki bukti temuan, alasan, perilaku yang diharapkan, dan indikator uji.

Informan: **S01** (kelas VIII, wawancara 8 November 2026, 45 menit). Data dari S02 belum ada (lihat §3).

## 1. Matriks temuan → fitur

| Kode | Kutipan S01 (diringkas) | Interpretasi | Fitur | Perilaku yang diharapkan | Cara uji |
|---|---|---|---|---|---|
| IL01 | "Ruang sampel dan kejadian suka tertukar … hampir sama." | Dua konsep yang mirip belum terbedakan (IL) | F1 subbab 3, F2 (A disorot di dalam S) | Siswa menyebut A sebagai "bagian dari S" | Minta siswa menjelaskan beda S dan A setelah subbab 3 |
| IL02 | "Cari semua kemungkinan, tentukan yang diminta, hitung … suka lupa urutannya." | Banyak unsur harus dipegang sekaligus (IL) | F3 Pemandu 5 langkah | Siswa mengikuti urutan tanpa melompat | Log: jumlah salah di langkah ④ akibat ②/③ yang keliru |
| IL03 | "Harus bisa pecahan … kadang perlu melihat contoh." | Prasyarat pecahan lemah (IL) | F8, kesalahan `P_NOT_SIMPLE` memicu F8 | Siswa menyederhanakan tanpa bantuan di soal akhir | Log: frekuensi `P_NOT_SIMPLE` per soal |
| IL04 | "Kalau cerita atau beberapa kali lempar, mulai bingung." | Kompleksitas naik pada soal cerita/majemuk (IL) | F10 level bertahap; F7 lempar berulang dikunci | Siswa menyelesaikan level dasar sebelum cerita | Tingkat penyelesaian per level |
| IL05 | "Langsung menghitung tanpa menuliskan semua kemungkinan." | Melewati langkah daftar S | F3 langkah ④ terkunci sebelum ②–③ | Siswa selalu mengisi S terlebih dahulu | Observasi; log urutan langkah |
| K03 | "Masih perlu menuliskan angka 1 sampai 6." | Representasi eksternal membantu | F2 papan titik sampel visual | Siswa memakai papan saat ragu | Observasi |
| EL01 | "Kalimat soal panjang … bingung yang penting." | Penyajian panjang menambah beban (EL) | F4 penanda; soal dipecah per kalimat | Siswa menemukan info relevan | Akurasi penandaan pada L-01 (ada pengecoh) |
| EL02 | "Lebih mudah gambar dadu atau tabel … gambar dan penjelasan sekaligus." | Teks dan visual perlu terpadu (EL, split-attention) | DESIGN §1 kedekatan; label di samping gambar | — | Angket kejelasan tampilan; observasi navigasi |
| EL03 | "Terlalu banyak tulisan dan warna … warna untuk menandai saja." | Hiasan mengganggu (EL) | DESIGN: warna hanya untuk makna, tanpa hiasan | — | Validasi ahli media; angket respons |
| EL04 | "Belum paham langkah pertama sudah masuk langkah berikut." Ingin urutan S → A → P. | Tempo eksternal terlalu cepat (EL) | F1 kartu dengan kontrol tempo; urutan tetap | Siswa mengulang kartu sesuai kebutuhan | Log: jumlah tekan "Kembali" |
| EL05 | "Sulit membedakan diketahui dan ditanya … terbantu kalau bisa ditandai." | Perlu sinyal struktur soal (EL) | F4 Diketahui/Ditanya | — | Akurasi penandaan |
| GL01 | "Lebih paham dengan contoh dadu dijelaskan satu per satu." | Contoh konkret membangun skema (GL) | F2, F7, contoh terurai di F1-4 | — | Siswa menjelaskan hasil simulasi |
| GL02 | "Memeriksa jumlah kemungkinan … tidak kurang dari 0 atau lebih dari 1." | Strategi verifikasi sudah ada; perlu diperkuat | F3 langkah ⑤, F6 pemeriksa "masuk akal" | Siswa mengecek jawaban sebelum "Periksa" | Log `P_OUT_RANGE` menurun |
| GL03 | "Petunjuk langkah demi langkah dan contoh mirip … tidak ingin langsung diberi jawaban." | Bantuan bertahap mendukung kemandirian (GL) | F5 petunjuk L1–L3 + fading | Level petunjuk menurun antarsoal | Log `maxHintLevel` soal awal vs akhir |
| GL04 | "Menjelaskan ke teman … jadi lebih paham karena harus menjelaskan alasan." | Self-explanation (GL) | F9 refleksi | Siswa melengkapi alasan | Kualitas isian refleksi |
| GL05 | "Melihat yang sama dari soal sebelumnya … menyesuaikan daftar kemungkinan." | Transfer lewat struktur (GL) | F10 `structureTag`, label "Mirip dengan …" | Siswa berhasil pada konteks baru | Akurasi pada soal konteks baru |
| DS01 | "Gambar dadu/koin yang bisa dicoba, langkah demi langkah, latihan." | Kebutuhan fitur langsung | F2, F3, F7, F10 | — | Angket respons |
| DS02 | "Ruang sampel & kejadian pelan-pelan … beri petunjuk, jangan langsung jawaban." | Kontrol tempo + bantuan tanpa jawaban | F1, F5 | — | — |
| DS03 | "Jangan terlalu banyak tulisan, animasi, tombol." | Minimalis | DESIGN §1, CLAUDE.md aturan 1, 4, 7 | — | Daftar periksa DESIGN §7 |

## 2. Rencana tahap ADDIE berikutnya

| Tahap | Kegiatan | Luaran | Dokumen |
|---|---|---|---|
| **Analysis** ✅ | Wawancara S01; analisis kebutuhan | Peta beban kognitif (tabel di atas) | Pedoman wawancara, file ini |
| **Design** ⏳ | PRD, desain UI, storyboard, konten | PRD.md, DESIGN.md, CONTENT.md | — |
| **Development** | Coding dengan Claude Code; validasi ahli materi dan media; revisi | Aplikasi v1 + lembar validasi | TASKS.md |
| **Implementation** | Uji coba terbatas (one-to-one 2–3 siswa → kelompok kecil) | Log penggunaan, catatan observasi | F11 ekspor |
| **Evaluation** | Angket beban kognitif (IL/EL/GL), angket kepraktisan, analisis log, revisi | Laporan efektivitas dan kepraktisan | — |

## 3. Celah data dan tindak lanjut

- [ ] **Wawancara S02** (pedoman mensyaratkan minimal 2 informan). Pilih siswa dengan kemampuan berbeda dari S01.
  Catat di tabel baru: temuan yang **sama**, **berbeda**, dan **baru**. Jangan menganggap S01 mewakili semua siswa.
- [ ] Triangulasi: bandingkan dengan bahan ajar/buku yang dipakai sekolah dan hasil tugas pemicu.
- [ ] Validasi isi pedoman wawancara oleh 2–3 ahli (jika belum dilakukan).
- [ ] Kutipan pada §1 diringkas. Saat menulis laporan, gunakan kutipan verbatim dari transkrip.

## 4. Riwayat perubahan keputusan

| Tanggal | Perubahan | Alasan / bukti |
|---|---|---|
| 2026-11-12 | Draf awal v0.1 | Hasil wawancara S01 |
| 2026-11-12 | Ditambah backend FastAPI (pengumpulan log) dan skrip analisis Python (F12, F13); aplikasi tetap offline-first | Kebutuhan data tahap Implementation/Evaluation (Matriks H: catat bantuan yang dibutuhkan) |
