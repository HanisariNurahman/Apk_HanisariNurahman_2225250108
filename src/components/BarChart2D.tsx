// Grafik batang 2D cadangan bila WebGL tidak tersedia (HP lama / dinonaktifkan).
import { chartScale, relativeFrequencies, total } from '../lib/simulation';

export interface BarChart2DProps {
  labels: string[];
  counts: number[];
  theoretical: number;
  theoreticalLabel: string;
  selected: number | null;
  onSelect: (index: number | null) => void;
}

// Ketuk kolom → pilih batang (detail tampil di baris tabel). aria-hidden: tabel adalah versi aksesibelnya.
export default function BarChart2D({ labels, counts, theoretical, theoreticalLabel, selected, onSelect }: BarChart2DProps) {
  const n = total(counts);
  const rel = relativeFrequencies(counts);
  const yMax = chartScale(rel, theoretical);
  const pct = (v: number) => `${(v / yMax) * 100}%`;

  return (
    <figure className="chart2d" aria-hidden="true">
      <div className="chart2d-plot">
        <div className="chart2d-theo" style={{ bottom: pct(theoretical) }}>
          <span>Teoretik {theoreticalLabel}</span>
        </div>
        {labels.map((label, i) => (
          <div
            className={selected === i ? 'chart2d-col is-selected' : 'chart2d-col'}
            key={label}
            onClick={() => onSelect(i)}
          >
            <span className="chart2d-value">{n ? counts[i] : ''}</span>
            <div className="chart2d-bar" style={{ height: pct(rel[i]) }} />
          </div>
        ))}
      </div>
      <div className="chart2d-labels">
        {labels.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
    </figure>
  );
}
