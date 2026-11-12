// Penanda soal cerita (F4) [EL01, EL05]. Soal dipecah per kalimat; ketuk potongan untuk menandai
// Diketahui (biru) → Ditanya (oranye) → kosong. Tanda selalu disertai teks, bukan warna saja.

import type { Chunk, Mark } from '../lib/marking';

const isPunct = (t: string) => /^[\p{P}\s]+$/u.test(t);

export default function StoryMarker({
  chunks,
  marks,
  onTap,
  disabled,
}: {
  chunks: Chunk[][];
  marks: Record<string, Mark>;
  onTap?: (key: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="story">
      {chunks.map((sentence, i) => (
        <p key={i} className="story-sentence">
          {sentence.map((c, k) => {
            const m = marks[c.key] ?? 'none';
            // Spasi hanya bila potongan berikutnya bukan tanda baca ("sekali." bukan "sekali .").
            const after = sentence[k + 1] && !/^\p{P}/u.test(sentence[k + 1].text) ? ' ' : '';
            if (isPunct(c.text) || !onTap) {
              return (
                <span key={c.key}>
                  <span className={`chunk-static mark-${m}`}>{c.text}</span>
                  {after}
                </span>
              );
            }
            // <span role="button"> (bukan <button>) agar potongan mengalir sebagai teks dan bisa terbungkus antarbaris.
            return (
              <span key={c.key}>
                <span
                  role="button"
                  tabIndex={disabled ? -1 : 0}
                  aria-disabled={disabled || undefined}
                  className={`chunk mark-${m}`}
                  aria-label={`${c.text}${m === 'known' ? ', ditandai diketahui' : m === 'asked' ? ', ditandai ditanya' : ''}`}
                  onClick={() => !disabled && onTap(c.key)}
                  onKeyDown={(e) => {
                    if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault();
                      onTap(c.key);
                    }
                  }}
                >
                  {c.text}
                  {m !== 'none' && <span className="chunk-tag">{m === 'known' ? 'Diketahui' : 'Ditanya'}</span>}
                </span>
                {after}
              </span>
            );
          })}
        </p>
      ))}
    </div>
  );
}

export function MarkSummary({ chunks, marks }: { chunks: Chunk[][]; marks: Record<string, Mark> }) {
  const flat = chunks.flat();
  const known = flat.filter((c) => marks[c.key] === 'known').map((c) => c.text);
  const asked = flat.filter((c) => marks[c.key] === 'asked').map((c) => c.text);
  return (
    <dl className="mark-summary">
      <div className="mark-known">
        <dt>Diketahui</dt>
        <dd>{known.length ? known.join('; ') : '–'}</dd>
      </div>
      <div className="mark-asked">
        <dt>Ditanya</dt>
        <dd>{asked.length ? asked.join('; ') : '–'}</dd>
      </div>
    </dl>
  );
}
