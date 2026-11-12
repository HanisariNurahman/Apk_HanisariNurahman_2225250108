// Isi kartu "Ingat lagi: Pecahan" (F8). Dipakai di halaman /pecahan dan di dalam Latihan (P_NOT_SIMPLE).

import { useState } from 'react';
import type { FractionCard } from '../content/fractionCards';
import { gradeSimplify } from '../lib/learn';
import type { Fraction } from '../types';
import Feedback, { type FeedbackValue } from './Feedback';
import FractionInput, { EMPTY_DRAFT, FractionView, parseFraction } from './FractionInput';

export function FractionBar({ f }: { f: Fraction }) {
  return (
    <div className="fbar-row">
      <div className="fbar" role="img" aria-label={`${f.den} bagian, ${f.num} diarsir`}>
        {Array.from({ length: f.den }, (_, i) => (
          <span key={i} className={i < f.num ? 'fbar-part is-filled' : 'fbar-part'} />
        ))}
      </div>
      <FractionView num={f.num} den={f.den} label={`${f.num} per ${f.den}`} />
    </div>
  );
}

export function FractionCardView({ card, onDone }: { card: FractionCard; onDone: () => void }) {
  if (card.kind === 'simplify') return <Simplify card={card} onDone={onDone} />;
  return (
    <>
      <h2>{card.title}</h2>
      {card.body.map((p) => (
        <p key={p}>{p}</p>
      ))}
      {card.kind === 'bars' && card.bars.map((b) => <FractionBar key={`${b.num}/${b.den}`} f={b} />)}
    </>
  );
}

function Simplify({ card, onDone }: { card: Extract<FractionCard, { kind: 'simplify' }>; onDone: () => void }) {
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [fb, setFb] = useState<FeedbackValue | null>(null);
  const solved = fb?.ok === true;
  return (
    <>
      <h2>{card.title}</h2>
      <p>Sederhanakan pecahan ini.</p>
      <div className="p-row">
        <FractionView num={card.given.num} den={card.given.den} />
        <span aria-hidden="true">=</span>
        <FractionInput label="Bentuk paling sederhana" value={draft} onChange={(d) => (setDraft(d), setFb(null))} disabled={solved} />
      </div>
      {!solved && (
        <button
          type="button"
          className="btn-primary"
          disabled={!parseFraction(draft)}
          onClick={() => {
            const v = parseFraction(draft);
            if (!v) return;
            const r = gradeSimplify(card.given, v);
            setFb(r);
            if (r.ok) onDone();
          }}
        >
          Periksa
        </button>
      )}
      <Feedback value={fb} />
    </>
  );
}

/** Versi ringkas di dalam Latihan: kartu dibuka satu per satu tanpa meninggalkan soal. */
export function InlineFractionCards({ cards }: { cards: readonly FractionCard[] }) {
  const [i, setI] = useState(0);
  const [done, setDone] = useState<Set<number>>(new Set());
  const card = cards[i];
  const canNext = card.kind !== 'simplify' || done.has(i);
  return (
    <div className="inline-deck card">
      <p className="muted">
        Ingat lagi: Pecahan · {i + 1} dari {cards.length}
      </p>
      <FractionCardView key={i} card={card} onDone={() => setDone((s) => new Set(s).add(i))} />
      <div className="deck-nav">
        <button type="button" className="btn-secondary" disabled={i === 0} onClick={() => setI(i - 1)}>
          Kembali
        </button>
        <button type="button" className="btn-secondary" disabled={i === cards.length - 1 || !canNext} onClick={() => setI(i + 1)}>
          Lanjut →
        </button>
      </div>
    </div>
  );
}
