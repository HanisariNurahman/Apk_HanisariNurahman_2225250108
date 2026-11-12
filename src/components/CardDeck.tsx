// Kartu bertahap (F1) [EL04, DS02]: satu kartu per layar, Lanjut/Kembali, indikator posisi.
// Siswa mengatur tempo sendiri; kartu interaktif harus diselesaikan dulu sebelum Lanjut.

import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

export interface CardDeckProps {
  title: string;
  backTo: string;
  backLabel: string;
  index: number;
  total: number;
  canAdvance: boolean;
  onBack: () => void;
  onNext: () => void;
  finishLabel?: string;
  children: ReactNode;
}

export default function CardDeck({
  title,
  backTo,
  backLabel,
  index,
  total,
  canAdvance,
  onBack,
  onNext,
  finishLabel = 'Selesai',
  children,
}: CardDeckProps) {
  const last = index === total - 1;
  return (
    <main className="deck">
      <header className="page-header deck-header">
        <Link to={backTo} className="back-link">
          <span aria-hidden="true">←</span> {backLabel}
        </Link>
        <div className="deck-title-row">
          <h1>{title}</h1>
          <span className="muted" aria-live="polite">
            {index + 1} dari {total}
          </span>
        </div>
        <div className="deck-progress" aria-hidden="true">
          <span style={{ width: `${((index + 1) / total) * 100}%` }} />
        </div>
      </header>

      <section className="deck-card card" key={index}>
        {children}
      </section>

      <nav className="deck-nav" aria-label="Navigasi kartu">
        <button type="button" className="btn-secondary" onClick={onBack} disabled={index === 0}>
          Kembali
        </button>
        <button type="button" className="btn-primary" onClick={onNext} disabled={!canAdvance}>
          {last ? finishLabel : 'Lanjut →'}
        </button>
      </nav>
      {!canAdvance && <p className="muted deck-hint">Selesaikan kartu ini dulu, lalu tekan Lanjut.</p>}
    </main>
  );
}
