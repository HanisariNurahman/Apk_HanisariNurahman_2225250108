// Sinkronisasi log penelitian ke backend Python (FastAPI) — ARCHITECTURE.md §5, F11.
// - Log selalu disimpan dulu di localStorage (storage.appendLog); modul ini hanya mengirim yang belum terkirim.
// - Idempoten: id yang dibalas sebagai `accepted` ATAU `duplicates` ditandai terkirim.
// - Gagal (offline, 4xx/5xx, jaringan) → log tetap di antrean, dicoba lagi nanti. Tidak pernah melempar error ke UI.
// - Fitur belajar tidak bergantung pada modul ini: tanpa VITE_API_URL, sinkronisasi mati.

import type { AttemptLog } from '../types';
import { keys, loadLogs, readJSON, writeJSON } from './storage';

export const MAX_BATCH = 500;

export interface SyncConfig {
  /** Mis. "https://peluangku-api.onrender.com/api" (tanpa garis miring di akhir). */
  apiUrl: string;
  /** Kunci kelas dari guru, dikirim sebagai header X-Class-Key. */
  classKey: string;
  fetchFn?: typeof fetch;
}

export interface SyncResult {
  ok: boolean;
  /** Banyak log yang kini ditandai terkirim pada percobaan ini. */
  sent: number;
  /** Banyak log yang masih menunggu. */
  pending: number;
}

export function loadSynced(studentCode: string): Set<string> {
  const v = readJSON<unknown>(keys.synced(studentCode), []);
  return new Set(Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);
}

export function pendingLogs(studentCode: string): AttemptLog[] {
  const synced = loadSynced(studentCode);
  return loadLogs(studentCode).filter((log) => !synced.has(log.id));
}

function markSynced(studentCode: string, ids: string[]): void {
  const synced = loadSynced(studentCode);
  ids.forEach((id) => synced.add(id));
  writeJSON(keys.synced(studentCode), [...synced]);
}

function isIdList(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === 'string');
}

async function sendBatch(batch: AttemptLog[], cfg: SyncConfig): Promise<string[] | null> {
  const doFetch = cfg.fetchFn ?? globalThis.fetch;
  try {
    const res = await doFetch(`${cfg.apiUrl}/logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Class-Key': cfg.classKey },
      body: JSON.stringify({ logs: batch }),
    });
    if (!res.ok) return null;
    const body: unknown = await res.json();
    const { accepted, duplicates } = (body ?? {}) as { accepted?: unknown; duplicates?: unknown };
    if (!isIdList(accepted) || !isIdList(duplicates)) return null;
    // Hanya id yang memang dikirim di batch ini yang boleh ditandai.
    const sentIds = new Set(batch.map((l) => l.id));
    return [...accepted, ...duplicates].filter((id) => sentIds.has(id));
  } catch {
    return null;
  }
}

const inFlight = new Map<string, Promise<SyncResult>>();

/** Kirim semua log yang belum terkirim untuk satu siswa. Panggilan bersamaan berbagi satu proses (tidak kirim dua kali). */
export function syncStudent(studentCode: string, cfg: SyncConfig): Promise<SyncResult> {
  const running = inFlight.get(studentCode);
  if (running) return running;
  const job = (async (): Promise<SyncResult> => {
    const queue = pendingLogs(studentCode);
    let sent = 0;
    let ok = true;
    for (let i = 0; i < queue.length; i += MAX_BATCH) {
      const ids = await sendBatch(queue.slice(i, i + MAX_BATCH), cfg);
      if (!ids) {
        ok = false;
        break;
      }
      markSynced(studentCode, ids);
      sent += ids.length;
    }
    return { ok, sent, pending: pendingLogs(studentCode).length };
  })().finally(() => inFlight.delete(studentCode));
  inFlight.set(studentCode, job);
  return job;
}

/** Konfigurasi dari env build + kunci kelas di localStorage. null → sinkronisasi mati (aplikasi tetap jalan offline). */
export function configFromEnv(): SyncConfig | null {
  const apiUrl = (import.meta.env.VITE_API_URL ?? '').trim().replace(/\/+$/, '');
  const classKey = readJSON<unknown>(keys.classKey, null);
  if (!apiUrl || typeof classKey !== 'string' || !classKey) return null;
  return { apiUrl, classKey };
}
