// Petunjuk bertingkat (F5) [GL03, DS02]. Petunjuk muncul DI BAWAH tombol, tanpa pop-up yang menutupi soal.
// Jawaban akhir hanya lewat tombol terpisah "Lihat pembahasan" (setelah L3 atau 2× keliru), dan pemakaiannya dicatat.

import type { HintLevel } from '../types';

const LEVEL_NAMES = ['', 'Pancingan', 'Strategi', 'Contoh soal serupa'];

export default function HintLadder({
  hints,
  level,
  onMore,
  canDiscuss,
  discussionOpen,
  onOpenDiscussion,
  discussion,
}: {
  hints: [string, string, string] | undefined;
  level: HintLevel;
  onMore: () => void;
  canDiscuss: boolean;
  discussionOpen: boolean;
  onOpenDiscussion: () => void;
  discussion: string[];
}) {
  return (
    <div className="hints">
      {hints && level < 3 && (
        <button type="button" className="btn-link hint-btn" onClick={onMore}>
          {level === 0 ? 'Butuh petunjuk?' : 'Petunjuk berikutnya'}
        </button>
      )}
      {hints && level > 0 && (
        <ol className="hint-list" aria-live="polite">
          {hints.slice(0, level).map((h, i) => (
            <li key={h}>
              <span className="muted">
                Petunjuk {i + 1} · {LEVEL_NAMES[i + 1]}
              </span>
              <p>{h}</p>
            </li>
          ))}
        </ol>
      )}
      {canDiscuss && !discussionOpen && (
        <button type="button" className="btn-discuss" onClick={onOpenDiscussion}>
          Lihat pembahasan
        </button>
      )}
      {discussionOpen && (
        <div className="discussion card" aria-live="polite">
          <strong>Pembahasan</strong>
          <ol>
            {discussion.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ol>
          <p className="muted">Sekarang coba isi jawabanmu sendiri.</p>
        </div>
      )}
    </div>
  );
}
