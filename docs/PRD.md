# PRD — PeluangKu

**Product Requirements Document** · versi 0.1 · 12 November 2026 · Tahap ADDIE: Analysis → Design

## 1. Latar belakang

Wawancara mendalam dengan siswa S01 (kelas VIII, sudah mempelajari peluang sederhana; 8 November 2026) menunjukkan bahwa
kesulitan siswa tidak hanya berasal dari konsep, tetapi juga dari cara materi dan soal disajikan.

| Sumber beban | Temuan utama | Kode |
|---|---|---|
| Intrinsic | Ruang sampel dan kejadian sering tertukar ("hampir sama") | IL01 |
| Intrinsic | Harus memegang tiga langkah sekaligus (kemungkinan → kejadian → hitung), lupa urutan bila soal panjang | IL02 |
| Intrinsic | Prasyarat pecahan dan pembagian belum kuat | IL03 |
| Intrinsic | Kesulitan meningkat pada soal cerita dan percobaan berulang | IL04 |
| Intrinsic | Langsung menghitung tanpa mendaftar kemungkinan | IL05 |
| Extraneous | Kalimat soal panjang membuat informasi penting tidak terlihat | EL01, EL05 |
| Extraneous | Teks saja menyulitkan; gambar dan tabel membantu | EL02 |
| Extraneous | Terlalu banyak tulisan dan warna mengganggu | EL03 |
| Extraneous | Penjelasan terlalu cepat; ingin urutan tetap | EL04 |
| Germane | Contoh dadu yang dijabarkan satu per satu membantu | GL01 |
| Germane | Mengecek jumlah kemungkinan dan 0 ≤ P ≤ 1 | GL02 |
| Germane | Petunjuk langkah demi langkah, tidak mau langsung diberi jawaban | GL03 |
| Germane | Menjelaskan kepada teman memperdalam pemahaman | GL04 |
| Germane | Transfer dengan mencari struktur yang sama | GL05 |

## 2. Tujuan produk

1. Membantu siswa **membedakan dan menentukan** ruang sampel, titik sampel, dan kejadian.
2. Membimbing siswa menghitung **P(A) = n(A) / n(S)** melalui langkah yang selalu berurutan sama.
3. Membantu siswa **memahami soal cerita** dengan memisahkan informasi yang *diketahui* dan yang *ditanya* (literasi matematika).
4. Memberi pengalaman konkret lewat **simulasi koin/dadu**.
5. Membangun kemandirian melalui **petunjuk bertingkat yang dikurangi bertahap** (*fading*).

### Bukan tujuan (out of scope v1)

- Peluang kejadian majemuk, permutasi, atau kombinasi
- Akun/login siswa, kelas daring, chat, atau fitur belajar yang membutuhkan internet
- Pengukuran beban kognitif di dalam aplikasi (dilakukan dengan angket terpisah pada tahap Evaluation)

## 3. Pengguna

| Persona | Deskripsi | Kebutuhan |
|---|---|---|
| **Siswa SMP kelas VIII** (utama) | Memakai HP Android kelas menengah, layar sekitar 360–412 px, koneksi tidak selalu stabil | Tampilan sederhana, langkah jelas, bisa diulang, bisa offline |
| **Guru / peneliti** (sekunder) | Mendampingi uji coba | Mengekspor catatan penggunaan (tanpa nama) untuk analisis |

## 4. Fitur dan kebutuhan fungsional

Prioritas: **P0** = wajib untuk MVP uji coba, **P1** = sebaiknya ada, **P2** = nanti.

### F1. Modul belajar bertahap (P0) [EL04, IL01, DS02]
- Empat subbab berurutan: **Ruang Sampel → Titik Sampel → Kejadian → Peluang**.
- Setiap subbab terdiri dari 3–6 kartu. Satu kartu berisi satu ide. Navigasi memakai tombol *Lanjut*/*Kembali*.
- Siswa mengatur tempo sendiri. Setiap kartu bisa diulang. Ada indikator posisi (misalnya "2 dari 5").
- Perbedaan ruang sampel dan kejadian ditampilkan secara visual: kejadian adalah **bagian yang disorot** dari ruang sampel.
- **Kriteria terima:** tidak ada kartu yang berisi lebih dari 60 kata atau lebih dari satu interaksi.

### F2. Papan Ruang Sampel interaktif (P0) [IL01, IL05, K03, GL01]
- Menampilkan semua titik sampel sebagai gambar (6 sisi dadu, 2 sisi koin, bola berwarna, kartu angka).
- Siswa mengetuk titik sampel untuk memasukkannya ke kejadian A. Penghitung n(A) dan n(S) diperbarui langsung di dekat gambar.
- **Kriteria terima:** n(S) dan n(A) selalu terlihat dalam satu layar tanpa scroll pada lebar 360 px.

### F3. Pemandu Langkah penyelesaian (P0) [IL02, EL04, GL03]
Setiap soal dikerjakan dalam lima langkah tetap. Langkah aktif ditampilkan; langkah yang sudah selesai diringkas di atas.
1. Tandai yang **diketahui** dan yang **ditanya**
2. Tentukan **ruang sampel** S dan n(S)
3. Tentukan **kejadian** A dan n(A)
4. Hitung **P(A) = n(A)/n(S)**
5. **Sederhanakan** dan **periksa** (0 ≤ P ≤ 1)

- **Kriteria terima:** siswa tidak bisa melompat ke langkah 4 sebelum langkah 2–3 terisi (mencegah IL05).

### F4. Penanda soal cerita (P0) [EL01, EL05, IL04]
- Soal cerita dipecah per kalimat. Siswa mengetuk frasa untuk menandainya sebagai **Diketahui** (biru) atau **Ditanya** (oranye).
- Setelah ditandai, ringkasan muncul dalam kotak "Diketahui / Ditanya" di bawah soal.
- Jika penandaan keliru, petunjuk Level 1 muncul. Siswa tetap bisa lanjut setelah melihat penanda yang benar.

### F5. Petunjuk bertingkat dan *fading* (P0) [GL03, DS02]
- Tombol **"Butuh petunjuk?"** di setiap langkah.
  - Level 1: pertanyaan pancingan (*"Apa saja angka yang mungkin muncul pada dadu?"*)
  - Level 2: strategi (*"Coba tulis semua angkanya dulu, lalu lingkari yang genap."*)
  - Level 3: contoh langkah pada soal serupa (bukan soal ini)
- Jawaban soal ini hanya muncul lewat tombol terpisah **"Lihat pembahasan"**, setelah dua kali mencoba atau setelah Level 3.
- *Fading*: pada soal ke-n dalam satu set, langkah yang sudah dikuasai (benar tanpa petunjuk dua kali berturut-turut) diisi otomatis atau diringkas.

### F6. Umpan balik dengan alasan (P0) [GL02]
- Setiap jawaban mendapat umpan balik yang menyebut **apa** yang benar atau salah dan **mengapa**.
  - Contoh: *"n(S) kamu 5. Coba hitung lagi sisi dadu: ada 6 angka, 1 sampai 6."*
- Pemeriksa otomatis "masuk akal?": memberi peringatan jika P < 0, P > 1, atau n(A) > n(S).
- Jawaban yang setara dianggap benar (3/6 = 1/2), lalu siswa diajak menyederhanakannya.

### F7. Simulasi koin dan dadu (P0) [GL01, DS01]
- Lempar 1×, 10×, atau 50× (P1: 100×). Hasil ditampilkan sebagai tabel frekuensi dan diagram batang sederhana.
- Di samping hasil, ditampilkan perbandingan frekuensi relatif dengan peluang teoretik.
- Pertanyaan refleksi setelah simulasi: *"Mengapa hasilnya tidak selalu tepat 1/2?"*
- Lemparan berulang baru dibuka setelah modul F1 subbab Peluang selesai (karena IL04: percobaan berulang menambah kesulitan).

### F8. Penguat prasyarat pecahan (P1) [IL03]
- Kartu singkat "Ingat lagi": arti pecahan, menyederhanakan pecahan (FPB), dan pecahan senilai.
- Kartu muncul otomatis jika siswa salah di langkah 5 (sederhanakan), atau bisa dibuka dari menu.

### F9. Refleksi "Jelaskan ke teman" (P1) [GL04, GL02]
- Setelah menyelesaikan soal, siswa memilih atau melengkapi alasan (*"Peluangnya 1/2 karena ada ___ angka genap dari ___ kemungkinan."*).
- Tersedia isian teks bebas yang bersifat opsional.

### F10. Latihan variasi dan transfer (P0) [GL05, IL04]
- Bank soal dengan konteks berbeda tetapi struktur sama: koin, dadu, bola dalam kantong, kartu bernomor, spinner.
- Tingkat kesulitan: **Dasar** (langsung) → **Cerita pendek** → **Cerita panjang** → (P2) dua dadu atau dua koin.
- Setelah soal, muncul label "Mirip dengan soal …" untuk membantu siswa melihat struktur yang sama.

### F11. Pengumpulan log penelitian (P1) [Matriks H: "catat bantuan yang dibutuhkan"]
- Saat pertama kali membuka aplikasi, siswa memasukkan **kode kelas** (dari guru) dan **kode siswa** (S01, S02, …). Tidak ada nama.
- Per langkah soal, aplikasi mencatat: waktu, jumlah percobaan, level petunjuk tertinggi, apakah pembahasan dibuka, dan benar/salah.
- Log disimpan di HP lalu **dikirim otomatis ke server (FastAPI)** saat online. Proses ini tidak terlihat oleh siswa dan tidak mengganggu belajar.
- Area guru (PIN) menampilkan jumlah log yang belum terkirim dan menyediakan **ekspor CSV lokal** sebagai cadangan.

### F12. Dasbor dan ekspor guru di server (P1)
- Endpoint guru (token) menampilkan ringkasan per siswa: soal dikerjakan, % benar, rata-rata level petunjuk awal vs akhir, dan pembahasan dibuka.
- Data mentah bisa diunduh sebagai CSV/JSON untuk analisis.

### F13. Skrip analisis Python (P1) [tahap Evaluation]
- `analysis/report.py` membaca CSV atau API, lalu menghasilkan tabel dan grafik: tren level petunjuk per soal (bukti *fading*/kemandirian, GL03),
  kesalahan yang paling sering per kode (`S_PARTIAL`, `P_NOT_SIMPLE`, …), dan durasi per langkah.

## 5. Kebutuhan non-fungsional

| Aspek | Target |
|---|---|
| Perangkat | Android 9+ dengan Chrome; layar 360×640 px atau lebih |
| Kinerja | Muat pertama < 3 detik di 4G; ukuran bundle JS < 300 KB (gzip) |
| Offline | Semua materi dan soal tersedia offline setelah kunjungan pertama (PWA) |
| Aksesibilitas | Kontras teks ≥ 4.5:1, target sentuh ≥ 48 px, ukuran huruf dasar 16–18 px, mendukung pembaca layar untuk tombol utama |
| Privasi | Tanpa data pribadi atau cookie pelacak. Server hanya menerima kode kelas, kode siswa, dan data jawaban (lihat ARCHITECTURE §6) |
| Konektivitas | Semua fitur belajar berjalan offline; log terkirim otomatis saat online |
| Bahasa | Bahasa Indonesia |

## 6. Ukuran keberhasilan (untuk tahap Evaluation)

- **Kelayakan:** validasi ahli materi dan ahli media (skor kelayakan; instrumen terpisah).
- **Kepraktisan:** angket respons siswa; observasi navigasi (lihat TRACEABILITY.md).
- **Beban kognitif:** angket IL/EL/GL (adaptasi Leppink et al., 2013 atau Klepsch et al., 2017) setelah penggunaan.
- **Data log:** penurunan level petunjuk dari soal awal ke soal akhir (indikator kemandirian, GL03).

## 7. Asumsi, batasan, dan risiko

- **Data analisis baru dari 1 informan (S01).** Pedoman wawancara mensyaratkan minimal 2 siswa. Disarankan menambah wawancara S02
  (dengan kemampuan berbeda) sebelum desain dikunci, lalu mendokumentasikan variasinya di TRACEABILITY.md.
- Temuan wawancara bersifat retrospektif, sehingga dapat dipengaruhi ingatan siswa.
- Tidak semua siswa memiliki HP sendiri. Aplikasi harus tetap dapat dipakai bergantian (progres per kode siswa).
