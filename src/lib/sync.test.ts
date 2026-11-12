import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AttemptLog } from '../types';
import { appendLog, keys, writeJSON } from './storage';
import { MAX_BATCH, configFromEnv, loadSynced, pendingLogs, syncStudent } from './sync';

function fakeStorage(): Storage {
  const m = new Map<string, string>();
  return {
    get length() {
      return m.size;
    },
    clear: () => m.clear(),
    getItem: (k) => m.get(k) ?? null,
    key: (i) => [...m.keys()][i] ?? null,
    removeItem: (k) => void m.delete(k),
    setItem: (k, v) => void m.set(k, String(v)),
  };
}

let seq = 0;
const log = (over: Partial<AttemptLog> = {}): AttemptLog => ({
  id: `00000000-0000-4000-8000-${String(++seq).padStart(12, '0')}`,
  classCode: '8A',
  studentCode: 'S01',
  problemId: 'D-01',
  step: 'P',
  startedAt: '2026-11-20T08:00:00.000Z',
  endedAt: '2026-11-20T08:00:30.000Z',
  tries: 1,
  maxHintLevel: 0,
  openedDiscussion: false,
  correct: true,
  ...over,
});

/** Server palsu yang meniru POST /api/logs FastAPI (idempoten). */
function fakeServer() {
  const stored = new Set<string>();
  const calls: AttemptLog[][] = [];
  const fetchFn = vi.fn(async (_url: string, init?: RequestInit) => {
    const { logs } = JSON.parse(String(init?.body)) as { logs: AttemptLog[] };
    calls.push(logs);
    const accepted: string[] = [];
    const duplicates: string[] = [];
    for (const l of logs) (stored.has(l.id) ? duplicates : accepted).push(l.id), stored.add(l.id);
    return new Response(JSON.stringify({ accepted, duplicates }), { status: 200 });
  });
  return { fetchFn: fetchFn as unknown as typeof fetch, calls, stored, mock: fetchFn };
}

const cfg = (fetchFn: typeof fetch) => ({ apiUrl: 'http://api.test/api', classKey: 'k8a', fetchFn });

beforeEach(() => {
  vi.stubGlobal('localStorage', fakeStorage());
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('syncStudent', () => {
  it('mengirim log yang belum terkirim lalu menandainya', async () => {
    const a = log();
    const b = log();
    appendLog(a);
    appendLog(b);
    const server = fakeServer();

    const r = await syncStudent('S01', cfg(server.fetchFn));
    expect(r).toEqual({ ok: true, sent: 2, pending: 0 });
    expect(loadSynced('S01')).toEqual(new Set([a.id, b.id]));
    const [url, init] = server.mock.mock.calls[0];
    expect(url).toBe('http://api.test/api/logs');
    expect((init?.headers as Record<string, string>)['X-Class-Key']).toBe('k8a');
  });

  it('tidak mengirim dua kali: log terkirim tidak dikirim lagi', async () => {
    appendLog(log());
    const server = fakeServer();
    await syncStudent('S01', cfg(server.fetchFn));
    const c = log();
    appendLog(c);
    await syncStudent('S01', cfg(server.fetchFn));
    expect(server.calls[1].map((l) => l.id)).toEqual([c.id]);
  });

  it('panggilan bersamaan berbagi satu proses', async () => {
    appendLog(log());
    const server = fakeServer();
    const [r1, r2] = await Promise.all([
      syncStudent('S01', cfg(server.fetchFn)),
      syncStudent('S01', cfg(server.fetchFn)),
    ]);
    expect(server.calls).toHaveLength(1);
    expect(r1).toBe(r2);
  });

  it('id yang dibalas sebagai duplikat juga ditandai terkirim', async () => {
    const a = log();
    appendLog(a);
    const server = fakeServer();
    server.stored.add(a.id); // server sudah menerima, tapi balasan sebelumnya hilang
    const r = await syncStudent('S01', cfg(server.fetchFn));
    expect(r).toEqual({ ok: true, sent: 1, pending: 0 });
  });

  it.each([
    ['offline', () => Promise.reject(new TypeError('Failed to fetch'))],
    ['server error', async () => new Response('err', { status: 500 })],
    ['kunci salah', async () => new Response('{}', { status: 401 })],
    ['balasan rusak', async () => new Response('bukan json', { status: 200 })],
  ])('gagal (%s) → log tetap di antrean, tidak melempar error', async (_name, impl) => {
    appendLog(log());
    const r = await syncStudent('S01', cfg(vi.fn(impl) as unknown as typeof fetch));
    expect(r).toEqual({ ok: false, sent: 0, pending: 1 });
    expect(pendingLogs('S01')).toHaveLength(1);
  });

  it('mengirim dalam batch maksimal 500', async () => {
    writeJSON(keys.logs('S01'), Array.from({ length: MAX_BATCH + 3 }, () => log()));
    const server = fakeServer();
    const r = await syncStudent('S01', cfg(server.fetchFn));
    expect(server.calls.map((c) => c.length)).toEqual([MAX_BATCH, 3]);
    expect(r).toEqual({ ok: true, sent: MAX_BATCH + 3, pending: 0 });
  });

  it('mengabaikan id di balasan yang tidak dikirim', async () => {
    const a = log();
    appendLog(a);
    const fetchFn = vi.fn(
      async () => new Response(JSON.stringify({ accepted: [a.id, 'id-asing'], duplicates: [] }), { status: 200 }),
    ) as unknown as typeof fetch;
    await syncStudent('S01', cfg(fetchFn));
    expect(loadSynced('S01')).toEqual(new Set([a.id]));
  });
});

describe('configFromEnv', () => {
  it('mati bila VITE_API_URL kosong', () => {
    vi.stubEnv('VITE_API_URL', '');
    writeJSON(keys.classKey, 'k8a');
    expect(configFromEnv()).toBeNull();
  });

  it('mati bila kunci kelas belum diisi', () => {
    vi.stubEnv('VITE_API_URL', 'http://api.test/api');
    expect(configFromEnv()).toBeNull();
  });

  it('membuang garis miring di akhir URL', () => {
    vi.stubEnv('VITE_API_URL', 'http://api.test/api/');
    writeJSON(keys.classKey, 'k8a');
    expect(configFromEnv()).toEqual({ apiUrl: 'http://api.test/api', classKey: 'k8a' });
  });
});
