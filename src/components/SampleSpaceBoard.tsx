// Papan Ruang Sampel (F2) [IL01, IL05, K03, GL01].
// Semua titik sampel tampil; yang dipilih/disorot = kejadian A (warna "terpilih" + ✓).
// n(S) dan n(A) ditampilkan tepat di atas papan, satu layar dengan gambar (EL02).

import type { SampleOutcome } from '../types';
import OutcomeView, { outcomeKind } from './OutcomeView';

export interface SampleSpaceBoardProps {
  space: SampleOutcome[];
  /** Id yang dipilih/disorot sebagai kejadian A. */
  selected?: ReadonlySet<string> | readonly string[];
  /** Ada → titik bisa diketuk. */
  onToggle?: (id: string) => void;
  showNS?: boolean;
  showNA?: boolean;
  /** Teks n(S) bila belum boleh ditampilkan angkanya, mis. "?". */
  nSText?: string;
  label?: string;
  disabled?: boolean;
}

function columns(space: SampleOutcome[]): number | undefined {
  const kind = space[0] ? outcomeKind(space[0]) : 'die';
  if (space.length <= 4) return space.length;
  if (kind === 'die') return 3;
  return undefined; // isi otomatis (min 56 px per kotak)
}

export default function SampleSpaceBoard({
  space,
  selected,
  onToggle,
  showNS,
  showNA,
  nSText,
  label = 'Ruang sampel',
  disabled,
}: SampleSpaceBoardProps) {
  const sel = new Set(selected ?? []);
  const nA = space.filter((o) => sel.has(o.id)).length;
  const cols = columns(space);

  return (
    <div className="board">
      {(showNS || showNA) && (
        <div className="board-counts" aria-live="polite">
          {showNS && <span className="count-chip">n(S) = {nSText ?? space.length}</span>}
          {showNA && <span className="count-chip is-selected">n(A) = {nA}</span>}
        </div>
      )}
      <div
        className="board-grid"
        role={onToggle ? 'group' : 'list'}
        aria-label={label}
        style={cols ? { gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` } : undefined}
      >
        {space.map((o) => {
          const isSel = sel.has(o.id);
          const cls = isSel ? 'board-item is-selected' : 'board-item';
          return onToggle ? (
            <button
              key={o.id}
              type="button"
              className={cls}
              aria-pressed={isSel}
              aria-label={o.label}
              disabled={disabled}
              onClick={() => onToggle(o.id)}
            >
              <OutcomeView outcome={o} />
              {isSel && (
                <span className="board-check" aria-hidden="true">
                  ✓
                </span>
              )}
            </button>
          ) : (
            <div key={o.id} className={cls} role="listitem" aria-label={isSel ? `${o.label}, terpilih` : o.label}>
              <OutcomeView outcome={o} />
              {isSel && (
                <span className="board-check" aria-hidden="true">
                  ✓
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
