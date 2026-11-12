// Halaman Simulasi koin & dadu (F7) [GL01, DS01].
// TODO(M3/M5): kunci tombol 10×/50× sampai subbab Peluang selesai (IL04); log refleksi (F9).

import { lazy, Suspense, useState } from 'react';
import BarChart2D from '../components/BarChart2D';
import { coin, die } from '../lib/sampleSpace';
import { addCounts, comparisonText, formatDecimal, rollMany, relativeText, tally, total } from '../lib/simulation';
import { hasWebGL } from '../lib/webgl';
import '../styles/simulation.css';

const Chart3D = lazy(() => import('../components/Chart3D'));

type ExpKey = 'die' | 'coin';

const EXPERIMENTS: Record<ExpKey, { name: string; labels: string[]; theoLabel: string; glyphs?: string[] }> = {
  die: { name: 'Dadu', labels: die().map((o) => o.label), theoLabel: '1/6', glyphs: ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'] },
  coin: { name: 'Koin', labels: coin().map((o) => o.label), theoLabel: '1/2' },
};

const TRIALS = [1, 10, 50] as const;


export default function Simulation() {
  const [exp, setExp] = useState<ExpKey>('die');
  const { labels, theoLabel, glyphs } = EXPERIMENTS[exp];
  const k = labels.length;
  const theoretical = 1 / k;

  const [counts, setCounts] = useState<number[]>(() => new Array(EXPERIMENTS.die.labels.length).fill(0));
  const [last, setLast] = useState<number | null>(null);
  const [use3D, setUse3D] = useState(() => hasWebGL());
  // Batang/baris yang sedang dilihat detailnya (ketuk lagi untuk menutup).
  const [selected, setSelected] = useState<number | null>(null);

  const n = total(counts);
  const toggle = (i: number | null) => setSelected((cur) => (i === null || cur === i ? null : i));

  function chooseExperiment(next: ExpKey) {
    if (next === exp) return;
    setExp(next);
    setCounts(new Array(EXPERIMENTS[next].labels.length).fill(0));
    setLast(null);
    setSelected(null);
  }

  function roll(times: number) {
    const seq = rollMany(k, times, Math.random);
    setCounts((c) => addCounts(c, tally(seq, k)));
    setLast(seq[seq.length - 1]);
  }

  function reset() {
    setCounts(new Array(k).fill(0));
    setLast(null);
    setSelected(null);
  }

  const chartProps = { labels, counts, theoretical, theoreticalLabel: theoLabel, selected, onSelect: toggle };

  return (
    <main className="sim stack">
      <h1>Simulasi</h1>

      <div className="seg" role="group" aria-label="Pilih percobaan">
        {(Object.keys(EXPERIMENTS) as ExpKey[]).map((key) => (
          <button key={key} type="button" aria-pressed={exp === key} onClick={() => chooseExperiment(key)}>
            {EXPERIMENTS[key].name}
          </button>
        ))}
      </div>

      <div className="card sim-last" aria-live="polite">
        {last === null ? (
          <span>Belum ada lemparan.</span>
        ) : (
          <span>
            Hasil terakhir:{' '}
            <strong>
              {glyphs ? `${glyphs[last]} ` : ''}
              {labels[last]}
            </strong>
          </span>
        )}
        <span className="muted">{n} lemparan</span>
      </div>

      <div className="sim-actions">
        {TRIALS.map((t) => (
          <button key={t} type="button" className={t === 1 ? 'btn-primary' : 'btn-secondary'} onClick={() => roll(t)}>
            Lempar {t}×
          </button>
        ))}
      </div>

      {use3D ? (
        <Suspense fallback={<div className="chart-loading muted">Memuat grafik…</div>}>
          <Chart3D key={exp} {...chartProps} onUnavailable={() => setUse3D(false)} />
        </Suspense>
      ) : (
        <BarChart2D {...chartProps} />
      )}

      <table className="sim-table">
        <caption className="muted">
          Peluang teoretik tiap hasil: {theoLabel} ≈ {formatDecimal(theoretical)}
        </caption>
        <thead>
          <tr>
            <th scope="col">Hasil</th>
            <th scope="col">Muncul</th>
            <th scope="col">Frekuensi relatif</th>
          </tr>
        </thead>
        <tbody>
          {labels.map((label, i) => {
            const isSel = selected === i;
            return (
              <tr key={label} className={isSel ? 'is-selected' : undefined}>
                <th scope="row">
                  <button type="button" className="sim-row-btn" aria-pressed={isSel} onClick={() => toggle(i)}>
                    {label}
                    {isSel && <span aria-hidden="true"> ✓</span>}
                  </button>
                </th>
                <td>{counts[i]}</td>
                <td>
                  {relativeText(counts[i], n)}
                  {isSel && n > 0 && <span className="sim-compare">{comparisonText(counts[i], n, k)}</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {n >= 10 && (
        <div className="card sim-reflect">
          <p>
            💭 Mengapa frekuensi relatifnya tidak selalu tepat <strong>{theoLabel}</strong>? Apa yang terjadi jika
            lemparannya ditambah?
          </p>
        </div>
      )}

      <button type="button" className="btn-secondary" onClick={reset} disabled={n === 0}>
        Ulang dari nol
      </button>
    </main>
  );
}
