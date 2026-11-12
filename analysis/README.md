# Analisis log PeluangKu (Python)

Skrip untuk tahap **Evaluation** (ADDIE): mengolah log `AttemptLog` menjadi tabel, grafik, dan ringkasan Markdown.
Hasilnya **deskriptif**. Beban kognitif tetap diukur dengan angket IL/EL/GL, bukan dari log ini.

## Persiapan

```bash
cd analysis
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

## Menjalankan

```bash
# 1) Dari file CSV (ekspor /api/teacher/logs?format=csv atau ekspor lokal area guru)
python report.py --csv peluangku-logs.csv --out laporan

# 2) Langsung dari backend. Token guru lewat variabel lingkungan, jangan ditulis di perintah.
set PELUANGKU_TEACHER_TOKEN=...
python report.py --api https://<backend>/api --class 8A --out laporan

# 3) Mencoba alur dengan DATA CONTOH BUATAN (bukan data siswa)
python sample_data.py --out contoh.csv --students 12
python report.py --csv contoh.csv --out laporan-contoh

pytest
```

## Hasil di folder `--out`

| File | Isi |
|---|---|
| `laporan.md` | Ringkasan, tabel, dan grafik dalam satu dokumen |
| `petunjuk_per_soal.png` | Level petunjuk tertinggi per soal ke-1, 2, …: garis abu-abu = tiap siswa, biru = rata-rata kelas (GL03) |
| `petunjuk_awal_akhir.png` | Rata-rata level petunjuk separuh awal (biru) vs separuh akhir (oranye) per siswa |
| `per_langkah.png` | % langkah benar dan rata-rata percobaan untuk langkah ①–⑤ (dua panel, bukan dua sumbu) |
| `per_soal.csv`, `tren_petunjuk.csv`, `per_langkah.csv` | Tabel lengkap untuk diolah lagi (mis. di Excel/SPSS) |

## Definisi

- **Soal** = semua log dengan `problem_id` yang sama untuk satu siswa, diurutkan menurut waktu mulai pertama.
- **Level petunjuk per soal** = `max_hint_level` tertinggi pada soal itu (0 = tanpa petunjuk).
- **Separuh awal/akhir** = ⌊n/2⌋ soal pertama vs sisanya. Definisi ini sama dengan `/api/teacher/summary`.
  Siswa dengan kurang dari 2 soal tidak dibandingkan.
- Log dengan `id` sama (terkirim dua kali) hanya dihitung sekali.

## Privasi

Data hanya berisi kode kelas dan kode siswa. Daftar kode ↔ nama disimpan peneliti di luar sistem.
File CSV dan folder laporan tidak di-commit (lihat `.gitignore`).
