// Gambar satu titik sampel (dadu, koin, bola, kartu, spinner). Label teks selalu ada di dekat gambar (EL02),
// sehingga warna bola/spinner bukan satu-satunya penanda.

import type { SampleOutcome } from '../types';

const DICE = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

// Warna benda (data soal, bukan hiasan). Selalu disertai label teks.
const COLORS: Record<string, string> = {
  merah: '#d64545',
  biru: '#2f6fd6',
  hijau: '#2e9a4a',
  kuning: '#e3b400',
  putih: '#ffffff',
  jeruk: '#ef8a2b',
  stroberi: '#e0457b',
  mint: '#5cc8a8',
};

export function outcomeKind(o: SampleOutcome): 'die' | 'coin' | 'two-coins' | 'ball' | 'card' | 'spin' {
  if (o.id.startsWith('cc-')) return 'two-coins';
  if (o.id.startsWith('coin-')) return 'coin';
  if (o.id.startsWith('ball-')) return 'ball';
  if (o.id.startsWith('card-')) return 'card';
  if (o.id.startsWith('spin-')) return 'spin';
  return 'die';
}

export default function OutcomeView({ outcome }: { outcome: SampleOutcome }) {
  const kind = outcomeKind(outcome);
  const color = COLORS[outcome.label.toLowerCase()];
  switch (kind) {
    case 'die':
      return (
        <span className="oc oc-die">
          <span className="oc-glyph" aria-hidden="true">
            {DICE[(outcome.value ?? 1) - 1] ?? outcome.label}
          </span>
          <span className="oc-label">{outcome.label}</span>
        </span>
      );
    case 'coin':
      return (
        <span className="oc oc-coin">
          <span className="oc-disc" aria-hidden="true">
            {outcome.label[0]}
          </span>
          <span className="oc-label">{outcome.label}</span>
        </span>
      );
    case 'two-coins': {
      const pair = outcome.id.slice(3);
      return (
        <span className="oc oc-coin">
          <span className="oc-pair" aria-hidden="true">
            <span className="oc-disc oc-disc-sm">{pair[0]}</span>
            <span className="oc-disc oc-disc-sm">{pair[1]}</span>
          </span>
          <span className="oc-label">{pair}</span>
        </span>
      );
    }
    case 'ball':
      return (
        <span className="oc oc-ball">
          <span className="oc-dot" style={{ background: color }} aria-hidden="true" />
          <span className="oc-label">{outcome.label}</span>
        </span>
      );
    case 'card':
      return (
        <span className="oc oc-card">
          <span className="oc-card-face">{outcome.label}</span>
        </span>
      );
    case 'spin':
      return (
        <span className="oc oc-spin">
          <span className="oc-wedge" style={{ background: color }} aria-hidden="true" />
          <span className="oc-label">{outcome.label}</span>
        </span>
      );
  }
}
