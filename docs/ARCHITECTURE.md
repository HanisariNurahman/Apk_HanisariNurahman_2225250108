# ARCHITECTURE — PeluangKu

Arsitektur: **React + PWA (frontend) + Python (backend FastAPI dan analisis data)**. Prinsipnya *offline-first*.

```
 HP siswa (Chrome Android)                      Server (cloud)                     Laptop peneliti
┌──────────────────────────────┐   HTTPS    ┌───────────────────────────┐      ┌──────────────────────┐
│ PWA React                    │  POST log  │ FastAPI  /api/...         │      │ analysis/ (Python)   │
│ • semua materi & soal offline│ ─────────► │ • terima log (idempoten)  │ ◄─── │ • tarik CSV dari API │
│ • log disimpan dulu di       │  (saat     │ • dasbor/ekspor guru      │ CSV  │ • tabel & grafik     │
│   localStorage (antrean)     │  online)   │ PostgreSQL / SQLite (dev) │      │   tahap Evaluation   │
└──────────────────────────────┘            └───────────────────────────┘      └──────────────────────┘
```

- Aplikasi **tetap berfungsi penuh tanpa internet**. Server hanya dipakai untuk **mengumpulkan log penelitian**.
- Jika `VITE_API_URL` kosong, sinkronisasi dimatikan dan aplikasi berjalan murni lokal. Ekspor CSV manual tetap tersedia sebagai cadangan.

## 1. Keputusan teknis

| Keputusan | Pilihan | Alasan |
|---|---|---|
| Jenis aplikasi | Web app + **PWA** | Dibuka lewat Chrome Android, bisa di-*install*, berjalan offline, tanpa Play Store |
| Frontend | **Vite + React 18 + TypeScript** | Populer dan cocok untuk *vibe coding*; TypeScript mencegah kesalahan pada data soal |
| Styling | CSS biasa + CSS variables | Ringan; token mengikuti DESIGN.md |
| Grafik 3D | **three.js 0.170** (tanpa react-three-fiber) + `OrbitControls` + `CSS2DRenderer` untuk label | Grafik simulasi interaktif; di-*lazy-load* (`React.lazy`) agar bundle awal tetap kecil; render sesuai permintaan, bukan loop terus-menerus |
| Routing | `react-router-dom` (HashRouter) | Aman untuk hosting statis |
| Penyimpanan klien | `localStorage` | Progres per kode siswa + antrean log yang belum terkirim |
| **Backend** | **Python 3.12/3.13 + FastAPI + SQLAlchemy 2** | Validasi data otomatis (Pydantic), dokumentasi API otomatis di `/docs` |
| Database | SQLite (pengembangan) / PostgreSQL (produksi) | Dipilih lewat `DATABASE_URL` |
| **Analisis** | **Python (csv, statistics) + matplotlib** | Mengolah log untuk tahap Evaluation ADDIE. pandas tidak dipakai karena DLL-nya diblokir Smart App Control (Windows) di laptop peneliti; numpy & matplotlib lolos |
| Uji | Vitest (frontend), pytest (backend) | Logika inti dan API wajib teruji |
| Hosting | Frontend: GitHub Pages/Netlify · Backend: Render/Railway · DB: PostgreSQL terkelola (mis. Neon) | Semua punya paket gratis; HTTPS wajib untuk PWA |

> **Catatan versi Python:** backend sudah terpasang dan teruji di Python 3.15. `uvicorn` dipasang **tanpa** `[standard]`,
> karena PyYAML belum punya *wheel* 3.15 dan build dari sumber diblokir Windows Application Control di laptop ini.
> Python 3.14 dari `uv` juga diblokir kebijakan yang sama, jadi gunakan Python bawaan sistem.

## 2. Struktur folder

```
Aplikasi/
├── CLAUDE.md
├── docs/
├── index.html, package.json, vite.config.ts, tsconfig.json   # frontend (root)
├── public/
│   ├── icons/
│   └── dice/ coin/ balls/ cards/ spinner/   # SVG titik sampel
├── src/
│   ├── main.tsx, App.tsx, types.ts
│   ├── styles/        tokens.css, base.css
│   ├── pages/         Home, Learn, Practice, Simulation, FractionRefresher, TeacherArea
│   ├── components/    SampleSpaceBoard, StepGuide, StoryMarker, HintLadder, Feedback,
│   │                  FractionInput, FractionView, Reflection, CardDeck,
│   │                  Chart3D (three.js, lazy), BarChart2D (cadangan tanpa WebGL)
│   ├── lib/           fraction, sampleSpace, grader, simulation, fading, storage, sync, webgl  (+ *.test.ts)
│   └── content/       lessons.ts, problems.ts, fractionCards.ts
├── backend/
│   ├── pyproject.toml / requirements.txt
│   ├── .env.example                # DATABASE_URL, CLASS_KEYS, TEACHER_TOKEN, FRONTEND_ORIGIN
│   ├── app/
│   │   ├── main.py                 # FastAPI app, CORS, router
│   │   ├── config.py               # baca variabel lingkungan
│   │   ├── db.py                   # engine + session SQLAlchemy
│   │   ├── models.py               # tabel attempt_logs
│   │   ├── schemas.py              # Pydantic (cermin types.ts AttemptLog)
│   │   ├── security.py             # cek X-Class-Key & token guru
│   │   └── routers/
│   │       ├── logs.py             # POST /api/logs
│   │       └── teacher.py          # GET /api/teacher/...
│   └── tests/                      # pytest + TestClient
└── analysis/
    ├── requirements.txt            # matplotlib (+ numpy), pytest
    ├── README.md                   # cara menjalankan
    ├── load.py                     # ambil data dari CSV ekspor atau API guru
    ├── metrics.py                  # ukuran deskriptif (per soal, tren petunjuk, per langkah)
    ├── sample_data.py              # data contoh BUATAN untuk uji alur
    ├── report.py                   # tabel CSV, grafik PNG, laporan.md
    └── tests/                      # pytest
```

## 3. Model data (frontend)

```ts
// src/types.ts
export type Fraction = { num: number; den: number };
export type StepId = 'mark' | 'S' | 'A' | 'P' | 'check';

export interface SampleOutcome { id: string; label: string; icon: string; value?: number }

export interface Problem {
  id: string; level: 'dasar' | 'cerita-pendek' | 'cerita-panjang' | 'lanjut';
  context: Experiment; structureTag: string;
  story: string[]; knownSpans: Span[]; askedSpans: Span[];
  sampleSpace: SampleOutcome[]; eventIds: string[]; answer: Fraction;
  hints: Partial<Record<StepId, [string, string, string]>>;
  discussion: string[]; reflectionTemplate?: string; similarTo?: string[];
}

export interface AttemptLog {
  id: string;            // UUID dibuat di HP → server menolak duplikat (idempoten)
  classCode: string;     // kode kelas, mis. "8A"
  studentCode: string;   // "S01"
  problemId: string;
  step: StepId;
  startedAt: string;     // ISO 8601
  endedAt: string;
  tries: number;
  maxHintLevel: 0 | 1 | 2 | 3;
  openedDiscussion: boolean;
  correct: boolean;
}
```
(Definisi lengkap ada di `src/types.ts`.)

### Kunci localStorage
- `peluangku:currentStudent` → `"S01"`
- `peluangku:classCode` → `"8A"`
- `peluangku:classKey` → kunci kelas dari guru (dikirim sebagai `X-Class-Key`)
- `peluangku:progress:S01` → `Progress`
- `peluangku:logs:S01` → `AttemptLog[]` (semua log, untuk ekspor cadangan)
- `peluangku:synced:S01` → `string[]` id log yang sudah diterima server

## 4. API backend

| Metode & path | Akses | Isi |
|---|---|---|
| `GET /api/health` | publik | `{ "status": "ok" }` |
| `POST /api/logs` | header `X-Class-Key` | Body `{ logs: AttemptLog[] }` (maks. 500). Balasan `{ accepted: string[], duplicates: string[] }` |
| `GET /api/teacher/logs?class_code=&student_code=&format=json\|csv` | `Authorization: Bearer <TEACHER_TOKEN>` | Data mentah untuk analisis |
| `GET /api/teacher/summary?class_code=` | token guru | Per siswa: soal dikerjakan, % benar, rata-rata level petunjuk (awal vs akhir), pembahasan dibuka |

Aturan:
- **Idempoten:** `id` log adalah primary key. Mengirim ulang log yang sama tidak membuat duplikat, jadi aman jika koneksi putus.
- **Validasi** (Pydantic): `studentCode` cocok `^[A-Z]\d{1,3}$`, `step` salah satu dari 5 nilai, `maxHintLevel` 0–3, `endedAt ≥ startedAt`.
- `X-Class-Key` dicocokkan dengan daftar `CLASS_KEYS` di server. Ini mencegah kiriman iseng; bukan autentikasi kuat.
- CORS hanya untuk `FRONTEND_ORIGIN`.
- Semua waktu dinormalkan ke **UTC** saat diterima, dan diekspor dengan zona (`+00:00`), karena SQLite tidak menyimpan zona waktu.
- JSON memakai camelCase (sama dengan `types.ts`); kolom CSV memakai snake_case (nama kolom tabel).

### Tabel `attempt_logs`
`id (PK, text) · class_code · student_code · problem_id · step · started_at · ended_at · tries · max_hint_level · opened_discussion · correct · received_at`
dengan indeks pada `(class_code, student_code)`.

## 5. Sinkronisasi (frontend `lib/sync.ts`)

1. Setiap log disimpan dulu di `localStorage`.
2. Saat aplikasi dibuka, saat event `online`, dan setelah soal selesai: kirim log yang belum ada di `synced` (batch ≤ 500).
3. Id yang ada di `accepted` dan `duplicates` ditandai sebagai terkirim.
4. Gagal (offline/5xx) → dicoba lagi nanti; tidak pernah mengganggu siswa. Tidak ada pesan error di layar belajar.
5. Area guru menampilkan "N log belum terkirim" dan tombol ekspor CSV lokal sebagai cadangan.
6. Kunci kelas (`X-Class-Key`) diisi guru di Area guru pada tiap HP, bukan oleh siswa.
7. `id` log dibuat dengan `crypto.getRandomValues` (bukan `crypto.randomUUID`), karena `randomUUID` tidak tersedia di
   `http://IP-laptop` saat uji coba lewat Wi-Fi.
8. PIN guru disimpan sebagai hash (FNV-1a bergaram). Ini hanya penghalang agar siswa tidak membuka area guru tanpa sengaja,
   bukan keamanan kuat.

## 6. Privasi dan etika data

- Data di server: **kode kelas, kode siswa, dan data jawaban saja**. Tidak ada nama, email, foto, lokasi, atau ID perangkat.
- Daftar pasangan kode ↔ nama siswa disimpan peneliti **di luar sistem** (offline).
- Server hanya dipakai setelah ada persetujuan sekolah, orang tua/wali, dan siswa (sesuai pedoman wawancara bagian C).
- `TEACHER_TOKEN` dan `CLASS_KEYS` disimpan sebagai variabel lingkungan di hosting dan **tidak di-commit**.
- Setelah penelitian selesai, data di server diekspor lalu dihapus.

## 7. Logika inti yang wajib diuji

| Modul | Kasus uji minimal |
|---|---|
| `fraction.ts` | 3/6 → 1/2; 0/6 → 0/1; 6/6 → 1/1; kesetaraan pecahan |
| `grader.ts` | semua kode kesalahan di CONTENT.md §6 |
| `sampleSpace.ts` | dadu 6, koin 2, dua koin 4, bola per kelompok |
| `storage.ts` | localStorage tidak tersedia/penuh tidak membuat crash |
| `sync.ts` | log terkirim ditandai; gagal → tetap di antrean; tidak mengirim dua kali |
| `simulation.ts` | total frekuensi = n; seed tetap → hasil tetap |
| `fading.ts` | fading aktif setelah 2 benar berturut-turut tanpa petunjuk |
| backend | log valid diterima; duplikat ditolak sebagai `duplicates`; kunci kelas salah → 401; token guru salah → 401; data tidak valid → 422 |

## 8. Menjalankan

```bash
# Frontend
npm install
npm run dev -- --host          # buka http://<IP-laptop>:5173 di HP (Wi-Fi sama)
npm run test

# Backend
cd backend
python -m venv .venv && .venv\Scripts\activate
pip install -r requirements-dev.txt   # requirements.txt saja untuk produksi
copy .env.example .env         # isi CLASS_KEYS, TEACHER_TOKEN
uvicorn app.main:app --reload  # http://127.0.0.1:8000/docs
pytest

# Analisis
cd analysis
pip install -r requirements.txt
python report.py --api https://<backend>/api --class 8A   # atau --csv file.csv
```

## 9. Deploy

1. **Backend** ke Render/Railway: start command `uvicorn app.main:app --host 0.0.0.0 --port $PORT`. Isi env `DATABASE_URL`
   (PostgreSQL), `CLASS_KEYS`, `TEACHER_TOKEN`, `FRONTEND_ORIGIN`. Jangan memakai SQLite di hosting gratis, karena disknya bisa terhapus.
2. **Frontend**: isi `VITE_API_URL=https://<backend>/api`, lalu `npm run build` dan unggah `dist/`.
3. Di HP: buka URL → ⋮ → **Tambahkan ke Layar Utama**. Uji offline dengan mode pesawat, lalu online lagi dan cek log masuk di `/api/teacher/summary`.
