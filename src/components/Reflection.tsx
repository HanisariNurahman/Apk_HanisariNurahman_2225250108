// Refleksi "Jelaskan ke teman" (F9) [GL04, GL02]: siswa melengkapi alasan, lalu boleh menambah kalimat sendiri.
// Disimpan di HP (bukan bagian log server).

import { useState } from 'react';
import Feedback, { type FeedbackValue } from './Feedback';

export default function Reflection({
  template,
  expected,
  onSave,
}: {
  /** Kalimat dengan isian {nA} dan {nS}. */
  template: string;
  expected: { nA: number; nS: number };
  onSave: (answers: Record<string, string>, text: string) => void;
}) {
  const [vals, setVals] = useState<Record<string, string>>({ nA: '', nS: '' });
  const [text, setText] = useState('');
  const [fb, setFb] = useState<FeedbackValue | null>(null);
  const [saved, setSaved] = useState(false);
  const parts = template.split(/(\{nA\}|\{nS\})/);

  function check() {
    const okA = Number(vals.nA) === expected.nA;
    const okS = Number(vals.nS) === expected.nS;
    if (okA && okS) {
      setFb({ ok: true, message: 'Alasanmu lengkap: banyak hasil yang ditanya dibagi banyak semua hasil.' });
      onSave(vals, text.trim());
      setSaved(true);
    } else {
      setFb({
        ok: false,
        message: !okA
          ? 'Isian pertama adalah n(A), banyak hasil yang ditanyakan.'
          : 'Isian kedua adalah n(S), banyak semua hasil yang mungkin.',
      });
    }
  }

  return (
    <section className="reflection card" aria-labelledby="refl-title">
      <h2 id="refl-title">Jelaskan ke teman</h2>
      <p className="reflection-sentence">
        {parts.map((p, i) =>
          p === '{nA}' || p === '{nS}' ? (
            <input
              key={i}
              className="blank"
              inputMode="numeric"
              aria-label={p === '{nA}' ? 'Banyak hasil yang ditanya' : 'Banyak semua hasil'}
              value={vals[p.slice(1, 3)]}
              disabled={saved}
              onChange={(e) => {
                setVals({ ...vals, [p.slice(1, 3)]: e.target.value.replace(/\D/g, '').slice(0, 3) });
                setFb(null);
              }}
            />
          ) : (
            <span key={i}>{p}</span>
          ),
        )}
      </p>
      <label className="muted" htmlFor="refl-text">
        Kata-katamu sendiri (boleh dikosongkan)
      </label>
      <textarea id="refl-text" rows={2} value={text} disabled={saved} onChange={(e) => setText(e.target.value)} maxLength={300} />
      {!saved && (
        <button type="button" className="btn-secondary" onClick={check} disabled={!vals.nA || !vals.nS}>
          Periksa alasan
        </button>
      )}
      <Feedback value={fb} />
    </section>
  );
}
