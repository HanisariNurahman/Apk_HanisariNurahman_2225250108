// Area guru (F11): dibuka dengan PIN. Menampilkan log di HP ini, log yang belum terkirim,
// kunci kelas untuk server, tombol kirim, dan ekspor CSV lokal sebagai cadangan.

import { useState, type FormEvent } from 'react';
import PageHeader from '../components/PageHeader';
import { useStudent } from '../components/StudentProvider';
import { logsToCsv } from '../lib/exportCsv';
import { checkPin, hashPin, isValidPin } from '../lib/pin';
import { keys, listStudentCodes, loadLogs, readJSON, writeJSON } from '../lib/storage';
import { configFromEnv, pendingLogs, syncAll } from '../lib/sync';
import '../styles/teacher.css';

const hasServer = () => !!(import.meta.env.VITE_API_URL ?? '').trim();

export default function TeacherArea() {
  const [stored, setStored] = useState<string | null>(() => readJSON<string | null>(keys.teacherPin, null));
  const [unlocked, setUnlocked] = useState(false);
  return (
    <main className="teacher">
      <PageHeader title="Area guru" />
      {unlocked ? (
        <TeacherPanel />
      ) : stored ? (
        <PinEntry stored={stored} onOk={() => setUnlocked(true)} />
      ) : (
        <PinCreate
          onCreate={(pin) => {
            const h = hashPin(pin);
            writeJSON(keys.teacherPin, h);
            setStored(h);
            setUnlocked(true);
          }}
        />
      )}
    </main>
  );
}

function PinCreate({ onCreate }: { onCreate: (pin: string) => void }) {
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [err, setErr] = useState('');
  function submit(e: FormEvent) {
    e.preventDefault();
    if (!isValidPin(a)) return setErr('PIN berisi 4 sampai 6 angka.');
    if (a !== b) return setErr('Kedua PIN belum sama.');
    onCreate(a);
  }
  return (
    <form className="stack" onSubmit={submit}>
      <p>Buat PIN guru untuk HP ini. PIN mencegah siswa membuka area ini tanpa sengaja.</p>
      <PinInput id="pin-new" label="PIN baru" value={a} onChange={setA} />
      <PinInput id="pin-again" label="Ulangi PIN" value={b} onChange={setB} />
      {err && (
        <p className="field-error" role="alert">
          ⚠ {err}
        </p>
      )}
      <button type="submit" className="btn-primary" disabled={!a || !b}>
        Simpan PIN
      </button>
    </form>
  );
}

function PinEntry({ stored, onOk }: { stored: string; onOk: () => void }) {
  const [pin, setPin] = useState('');
  const [err, setErr] = useState('');
  return (
    <form
      className="stack"
      onSubmit={(e) => {
        e.preventDefault();
        if (checkPin(pin, stored)) onOk();
        else setErr('PIN salah. Area ini hanya untuk guru.');
      }}
    >
      <PinInput id="pin" label="PIN guru" value={pin} onChange={(v) => (setPin(v), setErr(''))} />
      {err && (
        <p className="field-error" role="alert">
          ⚠ {err}
        </p>
      )}
      <button type="submit" className="btn-primary" disabled={!pin}>
        Buka
      </button>
    </form>
  );
}

function PinInput({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label htmlFor={id} className="code-label">
        {label}
      </label>
      <input
        id={id}
        className="code-input"
        type="password"
        inputMode="numeric"
        autoComplete="off"
        maxLength={6}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, ''))}
      />
    </div>
  );
}

function TeacherPanel() {
  const { classCode } = useStudent();
  const [, refresh] = useState(0);
  const [key, setKey] = useState(() => readJSON<string>(keys.classKey, ''));
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  const codes = listStudentCodes();
  const rows = codes.map((c) => ({ code: c, total: loadLogs(c).length, pending: pendingLogs(c).length }));
  const totalPending = rows.reduce((s, r) => s + r.pending, 0);

  function exportCsv() {
    const all = codes.flatMap((c) => loadLogs(c));
    const blob = new Blob([logsToCsv(all)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `peluangku-log-${classCode ?? 'kelas'}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function sendNow() {
    setBusy(true);
    setStatus('');
    const r = await syncAll(configFromEnv());
    setBusy(false);
    refresh((n) => n + 1);
    if (!r) setStatus('Isi kunci kelas dulu.');
    else if (r.ok) setStatus(`Terkirim ${r.sent} log. Belum terkirim: ${r.pending}.`);
    else setStatus(`Belum berhasil (offline atau kunci kelas salah). Belum terkirim: ${r.pending}.`);
  }

  return (
    <div className="stack">
      <p>
        Kelas di HP ini: <strong>{classCode ?? '–'}</strong>
      </p>

      <section className="card">
        <h2>Log di HP ini</h2>
        {rows.length === 0 ? (
          <p className="muted">Belum ada log. Log tercatat setelah siswa mengerjakan Latihan.</p>
        ) : (
          <table className="sim-table">
            <thead>
              <tr>
                <th scope="col">Kode</th>
                <th scope="col">Log</th>
                <th scope="col">Belum terkirim</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.code}>
                  <th scope="row">{r.code}</th>
                  <td>{r.total}</td>
                  <td>{r.pending}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <button type="button" className="btn-secondary" onClick={exportCsv} disabled={rows.length === 0}>
          Ekspor CSV
        </button>
      </section>

      <section className="card stack">
        <h2>Server</h2>
        {hasServer() ? (
          <>
            <label htmlFor="class-key" className="code-label">
              Kunci kelas
            </label>
            <input
              id="class-key"
              className="code-input code-input-sm"
              type="password"
              autoComplete="off"
              value={key}
              onChange={(e) => setKey(e.target.value.trim())}
              onBlur={() => writeJSON(keys.classKey, key)}
            />
            <button
              type="button"
              className="btn-primary"
              disabled={busy || !key || totalPending === 0}
              onClick={() => {
                writeJSON(keys.classKey, key);
                void sendNow();
              }}
            >
              {busy ? 'Mengirim…' : `Kirim sekarang (${totalPending})`}
            </button>
            {status && (
              <p className="muted" role="status">
                {status}
              </p>
            )}
          </>
        ) : (
          <p className="muted">Server belum diatur pada versi aplikasi ini. Gunakan Ekspor CSV.</p>
        )}
      </section>
    </div>
  );
}
