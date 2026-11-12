// Isi satu kartu Belajar (F1/F2). Satu kartu = satu ide, maksimal satu interaksi.

import { useState } from 'react';
import type { LessonCard } from '../content/lessons';
import { gradeStep } from '../lib/grader';
import { isSimplest, format, simplify } from '../lib/fraction';
import { checkSelection, toggle } from '../lib/learn';
import type { Problem, SampleOutcome } from '../types';
import Feedback, { type FeedbackValue } from './Feedback';
import FractionInput, { EMPTY_DRAFT, FractionView, parseFraction } from './FractionInput';
import NumberField from './NumberField';
import SampleSpaceBoard from './SampleSpaceBoard';

interface Props {
  card: LessonCard;
  onDone: () => void;
}

export default function LessonCardView({ card, onDone }: Props) {
  switch (card.kind) {
    case 'text':
      return (
        <>
          <h2>{card.title}</h2>
          {card.body.map((p) => (
            <p key={p}>{p}</p>
          ))}
          {card.formula && <Formula />}
          {card.visual && (
            <SampleSpaceBoard
              space={card.visual.space}
              selected={card.visual.highlight}
              showNS={card.visual.showNS}
              showNA={card.visual.showNA}
            />
          )}
        </>
      );
    case 'tapAll':
      return <TapAll card={card} onDone={onDone} />;
    case 'tapEvent':
      return <TapEvent card={card} onDone={onDone} />;
    case 'count':
      return <Count card={card} onDone={onDone} />;
    case 'choice':
      return <Choice card={card} onDone={onDone} />;
    case 'compare':
      return (
        <>
          <h2>{card.title}</h2>
          <table className="compare">
            <thead>
              <tr>
                <th scope="col">{card.head[0]}</th>
                <th scope="col" className="is-selected-col">
                  {card.head[1]}
                </th>
              </tr>
            </thead>
            <tbody>
              {card.rows.map(([a, b]) => (
                <tr key={a}>
                  <td>{a}</td>
                  <td className="is-selected-col">{b}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      );
    case 'worked':
      return <Worked card={card} onDone={onDone} />;
    case 'complete':
      return <Complete card={card} onDone={onDone} />;
    case 'range':
      return (
        <>
          <h2>{card.title}</h2>
          <p>{card.body}</p>
          <ol className="range-line" aria-label="Garis peluang dari 0 sampai 1">
            {card.points.map((pt) => (
              <li key={pt.at} className={`range-pt at-${pt.at.replace('/', '-')}`}>
                <strong>{pt.at === '1/2' ? '½' : pt.at}</strong>
                <span>{pt.label}</span>
              </li>
            ))}
          </ol>
        </>
      );
  }
}

/** P(A) = n(A)/n(S). n(A) memakai warna "terpilih" yang sama dengan papan (DESIGN §1, kedekatan). */
function Formula() {
  return (
    <div className="formula" aria-label="P(A) sama dengan n(A) dibagi n(S)">
      <span aria-hidden="true">P(A) =</span>
      <FractionView num="n(A)" den="n(S)" numClass="count-chip is-selected" denClass="count-chip" />
    </div>
  );
}

const labelsOf = (space: SampleOutcome[], ids: Iterable<string>) => {
  const set = new Set(ids);
  return space.filter((o) => set.has(o.id)).map((o) => o.label);
};

function TapAll({ card, onDone }: { card: Extract<LessonCard, { kind: 'tapAll' }>; onDone: () => void }) {
  const [sel, setSel] = useState<Set<string>>(new Set());
  const all = sel.size === card.space.length;
  return (
    <>
      <h2>{card.title}</h2>
      <p>{card.prompt}</p>
      <SampleSpaceBoard
        space={card.space}
        selected={sel}
        disabled={all}
        onToggle={(id) => {
          const next = toggle(sel, id);
          setSel(next);
          if (next.size === card.space.length) onDone();
        }}
      />
      <p className="muted">
        Sudah diketuk: {sel.size} dari {card.space.length}
      </p>
      <Feedback value={all ? { ok: true, message: card.done } : null} />
    </>
  );
}

function TapEvent({ card, onDone }: { card: Extract<LessonCard, { kind: 'tapEvent' }>; onDone: () => void }) {
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [fb, setFb] = useState<FeedbackValue | null>(null);
  const solved = fb?.ok === true;
  function check() {
    const r = checkSelection(sel, card.eventIds);
    if (r.ok) {
      setFb({ ok: true, message: card.done });
      onDone();
    } else if (r.extra.length) {
      const [label] = labelsOf(card.space, r.extra);
      setFb({ ok: false, message: `"${label}" tidak sesuai dengan yang diminta. Baca lagi pertanyaannya.` });
    } else {
      setFb({ ok: false, message: 'Pilihanmu sudah benar, tetapi masih ada yang belum diketuk.' });
    }
  }
  return (
    <>
      <h2>{card.title}</h2>
      <p>{card.prompt}</p>
      <SampleSpaceBoard
        space={card.space}
        selected={sel}
        showNS
        showNA
        disabled={solved}
        onToggle={(id) => {
          setSel(toggle(sel, id));
          setFb(null);
        }}
      />
      {!solved && (
        <button type="button" className="btn-primary" onClick={check} disabled={sel.size === 0}>
          Periksa
        </button>
      )}
      <Feedback value={fb} />
    </>
  );
}

function Count({ card, onDone }: { card: Extract<LessonCard, { kind: 'count' }>; onDone: () => void }) {
  const [v, setV] = useState('');
  const [fb, setFb] = useState<FeedbackValue | null>(null);
  const solved = fb?.ok === true;
  function check() {
    const n = Number(v);
    if (n === card.answer) {
      setFb({ ok: true, message: card.done });
      onDone();
    } else {
      setFb({ ok: false, message: card.near[n] ?? card.retry });
    }
  }
  return (
    <>
      <h2>{card.title}</h2>
      <p>{card.prompt}</p>
      {card.visual && <SampleSpaceBoard space={card.visual.space} />}
      <NumberField
        label={card.label}
        value={v}
        disabled={solved}
        onChange={(x) => {
          setV(x);
          setFb(null);
        }}
      />
      {!solved && (
        <button type="button" className="btn-primary" onClick={check} disabled={!v}>
          Periksa
        </button>
      )}
      <Feedback value={fb} />
    </>
  );
}

function Choice({ card, onDone }: { card: Extract<LessonCard, { kind: 'choice' }>; onDone: () => void }) {
  const [picked, setPicked] = useState<number | null>(null);
  const solved = picked !== null && card.options[picked].correct;
  return (
    <>
      <h2>{card.title}</h2>
      <p>{card.prompt}</p>
      <div className="choices" role="group" aria-label="Pilihan jawaban">
        {card.options.map((opt, i) => (
          <button
            key={opt.text}
            type="button"
            className={picked === i ? 'choice is-picked' : 'choice'}
            aria-pressed={picked === i}
            disabled={solved}
            onClick={() => {
              setPicked(i);
              if (opt.correct) onDone();
            }}
          >
            {opt.text}
          </button>
        ))}
      </div>
      <Feedback value={picked === null ? null : { ok: card.options[picked].correct, message: card.options[picked].reason }} />
    </>
  );
}

function Worked({ card, onDone }: { card: Extract<LessonCard, { kind: 'worked' }>; onDone: () => void }) {
  const [shown, setShown] = useState(1);
  return (
    <>
      <h2>{card.title}</h2>
      <ol className="worked">
        {card.steps.slice(0, shown).map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ol>
      {shown < card.steps.length && (
        <button
          type="button"
          className="btn-secondary"
          onClick={() => {
            const next = shown + 1;
            setShown(next);
            if (next === card.steps.length) onDone();
          }}
        >
          Tampilkan langkah berikutnya ({shown + 1}/{card.steps.length})
        </button>
      )}
    </>
  );
}

function Complete({ card, onDone }: { card: Extract<LessonCard, { kind: 'complete' }>; onDone: () => void }) {
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [fb, setFb] = useState<FeedbackValue | null>(null);
  const solved = fb?.ok === true;
  // Soal kecil sementara agar penilaian memakai grader yang sama dengan Latihan.
  const problem: Problem = {
    id: 'kartu',
    level: 'dasar',
    context: 'die',
    structureTag: '',
    story: [],
    knownSpans: [],
    askedSpans: [],
    sampleSpace: card.space,
    eventIds: card.eventIds,
    answer: card.answer,
    hints: {},
    discussion: [],
  };
  function check() {
    const value = parseFraction(draft);
    if (!value) return;
    const r = gradeStep(problem, { step: 'P', value });
    if (r.ok) {
      const extra = isSimplest(value) ? '' : ` Bisa disederhanakan menjadi ${format(simplify(value))}.`;
      setFb({ ok: true, message: `Tepat! P(A) = ${format(value)}.${extra}` });
      onDone();
    } else {
      setFb({ ok: false, message: r.message });
    }
  }
  return (
    <>
      <h2>{card.title}</h2>
      <ul className="given">
        {card.given.map((g) => (
          <li key={g}>✓ {g}</li>
        ))}
      </ul>
      <SampleSpaceBoard space={card.space} selected={card.eventIds} showNS showNA />
      <p>
        <strong>{card.prompt}</strong>
      </p>
      <div className="p-row">
        <span>P(A) =</span>
        <FractionInput label="P(A)" value={draft} onChange={(d) => (setDraft(d), setFb(null))} disabled={solved} />
      </div>
      {!solved && (
        <button type="button" className="btn-primary" onClick={check} disabled={!parseFraction(draft)}>
          Periksa
        </button>
      )}
      <Feedback value={fb} />
    </>
  );
}

