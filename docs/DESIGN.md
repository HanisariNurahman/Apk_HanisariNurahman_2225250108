# DESIGN — PeluangKu

Dokumen desain UI/UX. Setiap keputusan dirujuk ke prinsip *Cognitive Load Theory* (CLT) dan ke kode temuan wawancara.

## 1. Prinsip desain

| Prinsip | Penerapan | Dasar |
|---|---|---|
| **Segmentasi** | Satu ide atau satu interaksi per layar; materi dibagi menjadi kartu | EL04, DS03 |
| **Kedekatan (spatial contiguity)** | Label n(S), n(A) diletakkan tepat di samping gambar; tidak memakai keterangan di bawah halaman | EL02 |
| **Sinyal (signaling)** | Warna hanya untuk menandai peran informasi (diketahui, ditanya, terpilih) | EL03, EL05 |
| **Koherensi** | Tanpa hiasan, maskot, musik, atau animasi dekoratif | EL03, DS03 |
| **Contoh terurai → fading** | Contoh lengkap → soal setengah jadi → soal mandiri | GL01, GL03 |
| **Kontrol oleh siswa** | Tombol Lanjut/Kembali; tidak ada auto-advance atau timer | EL04 |
| **Pengetahuan prasyarat** | Kartu "Ingat lagi" pecahan yang muncul hanya saat dibutuhkan | IL03 |

## 2. Gaya visual

### Warna (token CSS)

| Token | Terang | Gelap | Makna |
|---|---|---|---|
| `--bg` | `#FAFAF7` | `#16181D` | Latar |
| `--surface` | `#FFFFFF` | `#1F2229` | Kartu |
| `--text` | `#1C1F24` | `#ECEDEF` | Teks utama |
| `--muted` | `#5B6270` | `#A3A9B5` | Teks pendukung |
| `--primary` | `#2457C5` | `#7FA6F5` | Tombol utama, tautan |
| `--known` | `#DCEBFF` / garis `#2457C5` | `#1E3358` | **Diketahui** |
| `--asked` | `#FFE8CC` / garis `#C25E00` | `#4A3016` | **Ditanya** |
| `--selected` | `#FFF3B0` / garis `#9A7A00` | `#4A4012` | Titik sampel yang masuk kejadian A |
| `--correct` | `#1B7F3B` | `#5CCB80` | Benar |
| `--check` | `#B3261E` | `#F2867E` | Perlu dicek (bukan "salah" yang menghakimi) |

Aturan: maksimal **dua warna makna** aktif di satu layar. Warna tidak boleh menjadi satu-satunya penanda; selalu disertai ikon atau teks
(misalnya ✓, label "Diketahui").

### Tipografi
- Font sistem (`system-ui, "Segoe UI", Roboto, sans-serif`) agar cepat dimuat dan tanpa unduhan font.
- Ukuran: isi 17 px, judul kartu 22 px, angka atau pecahan utama 28–32 px.
- Pecahan ditampilkan bertumpuk (pembilang di atas penyebut), bukan `3/6`, kecuali dalam teks berjalan.

### Ruang dan ukuran
- Gutter samping 16 px; jarak antarblok 16–24 px.
- Tombol utama penuh lebar, tinggi 52 px, diletakkan di bawah agar mudah dijangkau ibu jari.
- Target sentuh titik sampel minimal 56×56 px (grid 3 kolom untuk dadu).

### Gerak
- Hanya: lemparan dadu/koin (≤ 300 ms), transisi kartu (geser 200 ms), dan kilat umpan balik.
- Jika `prefers-reduced-motion` aktif, semua animasi diganti perubahan langsung.

## 3. Arsitektur informasi

```
Beranda
├── Belajar (F1)
│   ├── 1. Ruang Sampel
│   ├── 2. Titik Sampel
│   ├── 3. Kejadian
│   └── 4. Peluang
├── Coba Simulasi (F7)          ← terkunci sampai Belajar 4 selesai (opsi lempar berulang)
├── Latihan (F3–F6, F9, F10)
│   ├── Dasar
│   ├── Cerita Pendek
│   └── Cerita Panjang
├── Ingat Lagi: Pecahan (F8)
└── Menu (⋮): Ganti kode siswa · Ukuran huruf · Mode gelap · Area guru (PIN → Ekspor) (F11)
```

Navigasi utama: maksimal **4 tombol** di beranda. Tidak ada bottom-nav tambahan pada layar belajar atau latihan; hanya tombol ← Kembali.

## 4. Wireframe layar utama (360 px)

### 4.1 Beranda
```
┌──────────────────────────────┐
│ PeluangKu            S01  ⋮  │
│                              │
│ Lanjutkan: Kejadian (3/5)    │
│ [      Lanjutkan  →       ]  │
│                              │
│ ┌──────────┐ ┌──────────┐    │
│ │ Belajar  │ │ Latihan  │    │
│ │ ●●●○     │ │ 4 soal ✓ │    │
│ └──────────┘ └──────────┘    │
│ ┌──────────┐ ┌──────────┐    │
│ │ Simulasi │ │ Ingat    │    │
│ │ 🎲       │ │ Pecahan  │    │
│ └──────────┘ └──────────┘    │
└──────────────────────────────┘
```

### 4.2 Kartu belajar: Kejadian (F1 + F2)
```
┌──────────────────────────────┐
│ ← Kejadian            3 / 5  │
│                              │
│ Kejadian adalah BAGIAN dari  │
│ ruang sampel yang ditanyakan.│
│                              │
│ Ketuk angka GENAP:           │
│  [⚀]  [⚁]  [⚂]              │
│  [⚃]  [⚄]  [⚅]              │
│  n(S) = 6     n(A) = 2       │  ← tepat di bawah gambar
│                              │
│ S = {1,2,3,4,5,6}            │
│ A = {2,4}                    │
│                              │
│ [ Kembali ]  [  Lanjut →  ]  │
└──────────────────────────────┘
```
Titik sampel yang dipilih diberi latar `--selected` dan tanda ✓. S tetap terlihat utuh, sehingga siswa melihat bahwa A ⊂ S (IL01).

### 4.3 Latihan: Pemandu Langkah (F3–F6)
```
┌──────────────────────────────┐
│ ← Latihan Cerita  Soal 2/8   │
│ ① Tandai  ② S  ③ A  ④ P  ⑤ ✓ │  ← stepper, langkah aktif tebal
│ ─────────────────────────────│
│ ✓ Diketahui: kantong berisi  │  ← ringkasan langkah selesai
│   3 merah, 2 biru            │
│ ✓ Ditanya: peluang biru      │
│ ─────────────────────────────│
│ Langkah ②: Ruang sampel      │
│ Ada berapa bola seluruhnya?  │
│  🔴🔴🔴 🔵🔵                    │
│  n(S) = [ 5 ]                │
│                              │
│ [Butuh petunjuk?]            │
│ [        Periksa         ]   │
└──────────────────────────────┘
```

### 4.4 Umpan balik
```
│ ⚠ Perlu dicek                │
│ n(S) kamu 3. Itu hanya bola  │
│ merah. Ruang sampel = SEMUA  │
│ bola yang mungkin terambil.  │
│ [ Coba lagi ]                │
```
Nada umpan balik: tidak menghakimi, menyebut bagian yang keliru, dan memberi alasan (GL02).

### 4.5 Simulasi (F7) dengan grafik 3D
```
┌──────────────────────────────┐
│ Simulasi                     │
│ [  Dadu  ] [  Koin  ]        │
│ Hasil terakhir: ⚄ 5   50 lempar│
│ [Lempar 1×] [10×] [50×]      │
│ ┌──────────────────────────┐ │
│ │      8                   │ │  ← grafik batang 3D (three.js)
│ │  ▆  ▆  6  ▆        ▆     │ │     bisa diputar dengan jari
│ │ ═══════════════ Teoretik │ │  ← bidang transparan = 1/6
│ │  ▆  ▆  ▆  ▆  ▆  ▆        │ │
│ │  1  2  3  4  5  6        │ │
│ └──────────────────────────┘ │
│ Geser untuk memutar.  Reset  │
│ Hasil  Muncul  Frek. relatif │
│  1      8      8/50 ≈ 0,16   │
│  …                           │
│ 💭 Mengapa tidak tepat 1/6?  │
│ [ Ulang dari nol ]           │
└──────────────────────────────┘
```

**Aturan grafik 3D:**
- 3D hanya dipakai bila menambah makna: batang = titik sampel, bidang = peluang teoretik. Tidak ada objek, bayangan, atau latar dekoratif.
- Warna: batang `--primary`, bidang teoretik warna teks netral transparan. Tidak ada warna makna baru.
- Label nama hasil dan frekuensi menempel pada batang (kedekatan), bukan di legenda terpisah.
- Interaksi: putar dengan satu jari, sudut dibatasi ±60° horizontal; tanpa geser (pan), tanpa rotasi otomatis; tombol Reset.
- Ketuk batang (atau baris tabel) → batang dan baris memakai warna `--selected` + tanda ✓, dan kotak detail di atas batang menampilkan frekuensi relatif ("10/50 ≈ 0,20") serta perbandingannya dengan teori ("lebih dari 1/6"). Angka batang lain disembunyikan selama ada pilihan (satu fokus). Ketuk lagi untuk menutup. Geser > 8 px dihitung memutar, bukan memilih.
- Animasi tinggi batang 300 ms ease-out; langsung berubah bila `prefers-reduced-motion`.
- Tabel di bawah grafik tetap ada sebagai sumber data yang dapat dibaca pembaca layar.
- Tanpa WebGL → grafik 2D (`BarChart2D`) dengan garis putus-putus untuk peluang teoretik.

## 5. Pola interaksi petunjuk bertingkat (F5)

```
[Butuh petunjuk?] → L1 pertanyaan pancingan
        ↓ (ketuk lagi)
                  → L2 strategi
        ↓ (ketuk lagi)
                  → L3 contoh soal serupa
        ↓ (setelah L3 atau 2× salah)
[Lihat pembahasan] muncul (sekunder, abu-abu)
```
- Petunjuk ditampilkan **di bawah tombol**, tanpa pop-up yang menutupi soal, agar soal tetap terlihat (split-attention).
- Level yang dipakai dicatat untuk F11.

## 6. Mikrocopy (contoh nada)

| Situasi | Teks |
|---|---|
| Mulai latihan | "Kerjakan pelan-pelan. Kamu bisa minta petunjuk kapan saja." |
| Benar | "Tepat! Ada 3 angka genap dari 6 kemungkinan." |
| Perlu dicek | "Hampir. Coba hitung lagi semua kemungkinannya." |
| P > 1 | "Peluang tidak mungkin lebih dari 1. Apakah n(A) lebih besar dari n(S)?" |
| Belum disederhanakan | "3/6 sudah benar. Bisakah kamu menyederhanakannya?" |

## 7. Daftar periksa desain sebelum rilis

- [ ] Setiap layar memiliki ≤ 1 interaksi utama dan ≤ 60 kata
- [ ] Tidak ada scroll horizontal di 360 px
- [ ] Warna makna selalu disertai teks atau ikon
- [ ] Kontras lulus WCAG AA (terang dan gelap)
- [ ] Tidak ada tombol yang menampilkan jawaban akhir secara langsung
- [ ] Animasi mati saat `prefers-reduced-motion`
