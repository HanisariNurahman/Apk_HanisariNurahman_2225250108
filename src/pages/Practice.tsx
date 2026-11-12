// Latihan (F3–F6, F9, F10): daftar soal per level + Pemandu 5 langkah.

import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { InlineFractionCards } from '../components/FractionDeck';
import Feedback, { type FeedbackValue } from '../components/Feedback';
import FractionInput, { EMPTY_DRAFT, FractionView, parseFraction, type FractionDraft } from '../components/FractionInput';
import HintLadder from '../components/HintLadder';
import NumberField from '../components/NumberField';
import PageHeader from '../components/PageHeader';
import Reflection from '../components/Reflection';
import SampleSpaceBoard from '../components/SampleSpaceBoard';
import StoryMarker, { MarkSummary } from '../components/StoryMarker';
import { useStudent } from '../components/StudentProvider';
import { FRACTION_CARDS } from '../content/fractionCards';
import { CONTEXT_NAMES, LEVELS, PROBLEMS, problemById } from '../content/problems';
import { makeLog } from '../lib/attempt';
import { isFaded, updateMastery } from '../lib/fading';
import { format } from '../lib/fraction';
import { gradeStep, type FeedbackCode } from '../lib/grader';
import { toggle } from '../lib/learn';
import { chunkStory, correctMarks, marksToSpans, nextMark, type Mark } from '../lib/marking';
import { appendLog, getClassCode, saveReflection } from '../lib/storage';
import { requestSync } from '../lib/sync';
import type { HintLevel, Problem, StepId } from '../types';
import { STEP_IDS } from '../types';
import '../styles/practice.css';

const STEP_NAMES: Record<StepId, string> = { mark: 'Tandai', S: 'Ruang sampel', A: 'Kejadian', P: 'Hitung', check: 'Periksa' };
const STEP_NUM = ['①', '②', '③', '④', '⑤'];

/** "Lanjut" (dua koin) terbuka setelah semua soal level lain selesai (IL04). */
export function advancedUnlocked(done: ReadonlySet<string>): boolean {
  return PROBLEMS.filter((p) => p.level !== 'lanjut').every((p) => done.has(p.id));
}

export function PracticeList() {
  const { progress } = useStudent();
  const done = new Set(progress?.problemsDone ?? []);
  const advanced = advancedUnlocked(done);
  return (
    <main>
      <PageHeader title="Latihan" />
      <p className="muted">Kerjakan pelan-pelan. Kamu bisa minta petunjuk kapan saja.</p>
      {LEVELS.map((level) => {
        const items = PROBLEMS.filter((p) => p.level === level.id);
        const locked = level.id === 'lanjut' && !advanced;
        return (
          <section key={level.id} className="level">
            <h2>{level.title}</h2>
            {level.note && <p className="muted">{level.note}</p>}
            <ul className="problem-list">
              {items.map((p) => {
                const body = (
                  <>
                    <span className="problem-id">{p.id}</span>
                    <span className="problem-text">
                      <span>{CONTEXT_NAMES[p.context]}</span>
                      <span className="muted">{done.has(p.id) ? '✓ Selesai' : p.story[p.story.length - 1]}</span>
                    </span>
                  </>
                );
                return (
                  <li key={p.id}>
                    {locked ? (
                      <div className="problem-item is-locked" aria-disabled="true">
                        {body}
                      </div>
                    ) : (
                      <Link to={`/latihan/${p.id}`} className="problem-item">
                        {body}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </main>
  );
}

interface StepState {
  startedAt: Date;
  tries: number;
  wrong: number;
  hint: HintLevel;
  discussion: boolean;
  feedback: FeedbackValue | null;
  code: FeedbackCode | null;
  done: boolean;
  faded: boolean;
  revealed: boolean;
}

const freshStep = (): StepState => ({
  startedAt: new Date(),
  tries: 0,
  wrong: 0,
  hint: 0,
  discussion: false,
  feedback: null,
  code: null,
  done: false,
  faded: false,
  revealed: false,
});

export function PracticeProblem() {
  const { problemId } = useParams();
  const problem = problemId ? problemById(problemId) : undefined;
  const { progress } = useStudent();
  const done = new Set(progress?.problemsDone ?? []);
  if (!problem) return <Navigate to="/latihan" replace />;
  if (problem.level === 'lanjut' && !advancedUnlocked(done)) return <Navigate to="/latihan" replace />;
  return <ProblemRunner key={problem.id} problem={problem} />;
}

function ProblemRunner({ problem }: { problem: Problem }) {
  const { code, progress, updateProgress } = useStudent();
  const navigate = useNavigate();
  const chunks = chunkStory(problem.story, [...problem.knownSpans, ...problem.askedSpans]);
  const nS = problem.sampleSpace.length;
  const nA = problem.eventIds.length;
  const mastery = progress?.mastery;

  // Langkah ① sudah dikuasai? (fading) → isian awal langsung benar
  const markFaded = !!mastery && isFaded(mastery, 'mark', problem.level);

  // Nilai isian semua langkah
  const [marks, setMarks] = useState<Record<string, Mark>>(() =>
    markFaded ? correctMarks(problem.knownSpans, problem.askedSpans) : {},
  );
  const [nSInput, setNSInput] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pDraft, setPDraft] = useState<FractionDraft>(EMPTY_DRAFT);
  const [checkDraft, setCheckDraft] = useState<FractionDraft>(EMPTY_DRAFT);
  const [showFractionCards, setShowFractionCards] = useState(false);

  const [stepIndex, setStepIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  const [st, setSt] = useState<StepState>(() => (markFaded ? { ...freshStep(), done: true, faded: true } : freshStep()));

  const step = STEP_IDS[stepIndex];
  const index = PROBLEMS.findIndex((p) => p.id === problem.id);

  /** Masuk ke langkah berikutnya (dipanggil dari tombol Lanjut); langkah yang dikuasai diisi otomatis (fading, F5). */
  function enterStep(i: number): StepState {
    const s = STEP_IDS[i];
    const base = freshStep();
    if (mastery && isFaded(mastery, s, problem.level)) {
      if (s === 'mark') setMarks(correctMarks(problem.knownSpans, problem.askedSpans));
      if (s === 'S') setNSInput(String(nS));
      if (s === 'A') setSelected(new Set(problem.eventIds));
      return { ...base, done: true, faded: true };
    }
    return base;
  }

  function record(correct: boolean, s: StepState) {
    const classCode = getClassCode();
    if (!code || !classCode) return;
    appendLog(
      makeLog({ classCode, studentCode: code }, problem.id, {
        step,
        startedAt: s.startedAt,
        endedAt: new Date(),
        tries: s.tries,
        maxHintLevel: s.hint,
        openedDiscussion: s.discussion,
        correct,
      }),
    );
    updateProgress((p) => ({
      ...p,
      mastery: updateMastery(p.mastery, step, {
        tries: s.tries,
        maxHintLevel: s.hint,
        openedDiscussion: s.discussion,
        correct,
      }),
    }));
  }

  function check() {
    let r;
    switch (step) {
      case 'mark':
        r = gradeStep(problem, { step: 'mark', ...marksToSpans(marks, chunks) });
        break;
      case 'S':
        r = gradeStep(problem, { step: 'S', count: Number(nSInput) });
        break;
      case 'A':
        r = gradeStep(problem, { step: 'A', ids: [...selected] });
        break;
      case 'P': {
        const v = parseFraction(pDraft);
        if (!v) return;
        r = gradeStep(problem, { step: 'P', value: v });
        break;
      }
      case 'check': {
        const v = parseFraction(checkDraft);
        if (!v) return;
        r = gradeStep(problem, { step: 'check', value: v });
        break;
      }
    }
    const next: StepState = {
      ...st,
      tries: st.tries + 1,
      wrong: r.ok ? st.wrong : st.wrong + 1,
      // F4: penandaan keliru → petunjuk Level 1 muncul otomatis
      hint: !r.ok && step === 'mark' && st.hint === 0 ? 1 : st.hint,
      feedback: { ok: r.ok, message: r.message },
      code: r.code,
      done: r.ok,
    };
    setSt(next);
    if (r.ok) record(true, next);
    // F8: belum disederhanakan → kartu "Ingat lagi: Pecahan" muncul otomatis (IL03)
    if (r.code === 'P_NOT_SIMPLE') setShowFractionCards(true);
  }

  function revealMarks() {
    setMarks(correctMarks(problem.knownSpans, problem.askedSpans));
    const next = { ...st, done: true, revealed: true, feedback: { ok: true, message: 'Ini penanda yang benar. Perhatikan, lalu lanjut.' } };
    setSt(next);
    record(false, next);
  }

  function goNext() {
    if (stepIndex === STEP_IDS.length - 1) {
      setFinished(true);
      updateProgress((p) => (p.problemsDone.includes(problem.id) ? p : { ...p, problemsDone: [...p.problemsDone, problem.id] }));
      requestSync();
      window.scrollTo(0, 0);
      return;
    }
    const i = stepIndex + 1;
    if (STEP_IDS[i] === 'check' && !checkDraft.num && !checkDraft.den) setCheckDraft(pDraft);
    setStepIndex(i);
    setSt(enterStep(i));
    setShowFractionCards(false);
    window.scrollTo(0, 0);
  }

  const canCheck =
    !st.done &&
    (step === 'mark'
      ? Object.values(marks).some((m) => m !== 'none')
      : step === 'S'
        ? nSInput !== ''
        : step === 'A'
          ? true
          : !!parseFraction(step === 'P' ? pDraft : checkDraft));

  const nextProblem = PROBLEMS.slice(index + 1).find(
    (p) => p.level !== 'lanjut' || advancedUnlocked(new Set([...(progress?.problemsDone ?? []), problem.id])),
  );

  const header = (
    <header className="page-header">
      <Link to="/latihan" className="back-link">
        <span aria-hidden="true">←</span> Latihan
      </Link>
      <div className="deck-title-row">
        <h1>Soal {problem.id}</h1>
        <span className="muted">
          {index + 1} dari {PROBLEMS.length}
        </span>
      </div>
      <ol className="stepper" aria-label="Langkah">
        {STEP_IDS.map((s, i) => (
          <li
            key={s}
            className={i < stepIndex || finished ? 'is-done' : i === stepIndex ? 'is-active' : ''}
            aria-current={i === stepIndex && !finished ? 'step' : undefined}
          >
            <span aria-hidden="true">{i < stepIndex || finished ? '✓' : STEP_NUM[i]}</span>
            <span className="stepper-name">{STEP_NAMES[s]}</span>
          </li>
        ))}
      </ol>
    </header>
  );

  if (finished) {
    const similar = (problem.similarTo ?? []).map((id) => problemById(id)).filter((p): p is Problem => !!p);
    return (
      <main className="practice">
        {header}
        <div className="feedback is-ok">
          <strong>✓ Soal selesai</strong>
          <p>
            Peluangnya {format(problem.answer)}: ada {nA} hasil yang ditanya dari {nS} hasil yang mungkin.
          </p>
        </div>
        {problem.reflectionTemplate && (
          <Reflection
            template={problem.reflectionTemplate}
            expected={{ nA, nS }}
            onSave={(answers, text) =>
              code && saveReflection(code, { source: problem.id, answers, text, at: new Date().toISOString() })
            }
          />
        )}
        {similar.length > 0 && (
          <p className="similar">
            <strong>Mirip dengan soal {similar.map((p) => `${p.id} (${CONTEXT_NAMES[p.context]})`).join(' dan ')}.</strong>{' '}
            Langkahnya sama, hanya bendanya yang berbeda.
          </p>
        )}
        <div className="stack">
          {nextProblem && (
            <button type="button" className="btn-primary" onClick={() => navigate(`/latihan/${nextProblem.id}`)}>
              Soal berikutnya: {nextProblem.id} →
            </button>
          )}
          <Link to="/latihan" className="btn-secondary btn-link-block">
            Daftar soal
          </Link>
        </div>
      </main>
    );
  }

  const summary: { step: StepId; text: string }[] = [];
  if (stepIndex > 1) summary.push({ step: 'S', text: `n(S) = ${nS}` });
  if (stepIndex > 2) summary.push({ step: 'A', text: `n(A) = ${nA}` });
  if (stepIndex > 3) summary.push({ step: 'P', text: `P(A) = ${pDraft.num}/${pDraft.den}` });

  return (
    <main className="practice">
      {header}

      {stepIndex > 0 && (
        <section className="done-summary" aria-label="Langkah yang sudah selesai">
          <MarkSummary chunks={chunks} marks={marks} />
          {summary.length > 0 && (
            <ul>
              {summary.map((s) => (
                <li key={s.step}>✓ {s.text}</li>
              ))}
            </ul>
          )}
          <details>
            <summary>Baca soal lagi</summary>
            <StoryMarker chunks={chunks} marks={marks} />
          </details>
        </section>
      )}

      <section className="step card" aria-labelledby="step-title">
        <h2 id="step-title">
          Langkah {STEP_NUM[stepIndex]} {STEP_NAMES[step]}
        </h2>

        {st.faded && (
          <p className="faded-note">✓ Langkah ini sudah kamu kuasai, jadi diisi otomatis.</p>
        )}

        {step === 'mark' && (
          <>
            <p>Ketuk bagian soal. Ketuk 1×: Diketahui. 2×: Ditanya. 3×: hapus.</p>
            <StoryMarker
              chunks={chunks}
              marks={marks}
              disabled={st.done}
              onTap={(key) => {
                setMarks({ ...marks, [key]: nextMark(marks[key] ?? 'none') });
                setSt({ ...st, feedback: null });
              }}
            />
            <MarkSummary chunks={chunks} marks={marks} />
          </>
        )}

        {step === 'S' && (
          <>
            <p>Ada berapa hasil yang mungkin seluruhnya?</p>
            <SampleSpaceBoard space={problem.sampleSpace} />
            <NumberField
              label="n(S)"
              value={nSInput}
              disabled={st.done}
              onChange={(v) => {
                setNSInput(v);
                setSt({ ...st, feedback: null });
              }}
            />
          </>
        )}

        {step === 'A' && (
          <>
            <p>Ketuk hasil yang sesuai pertanyaan.</p>
            <SampleSpaceBoard
              space={problem.sampleSpace}
              selected={selected}
              showNS
              showNA
              disabled={st.done}
              onToggle={(id) => {
                setSelected(toggle(selected, id));
                setSt({ ...st, feedback: null });
              }}
            />
            {nA === 0 && !st.done && <p className="muted">Jika tidak ada yang sesuai, langsung tekan Periksa.</p>}
          </>
        )}

        {step === 'P' && (
          <>
            <p>Hitung peluangnya dengan rumus.</p>
            <div className="formula">
              <span>P(A) =</span>
              <FractionView num="n(A)" den="n(S)" numClass="count-chip is-selected" denClass="count-chip" />
            </div>
            <div className="p-row">
              <span>P(A) =</span>
              <FractionInput label="P(A)" value={pDraft} disabled={st.done} onChange={(d) => (setPDraft(d), setSt({ ...st, feedback: null }))} />
            </div>
          </>
        )}

        {step === 'check' && (
          <>
            <p>Tulis bentuk paling sederhana. Nilainya harus antara 0 dan 1.</p>
            <div className="p-row">
              <span>P(A) =</span>
              <FractionInput
                label="Bentuk paling sederhana"
                value={checkDraft}
                disabled={st.done}
                onChange={(d) => (setCheckDraft(d), setSt({ ...st, feedback: null }))}
              />
            </div>
          </>
        )}

        <Feedback value={st.feedback} />

        {st.code === 'P_NOT_SIMPLE' && !st.done && (
          <>
            <button type="button" className="btn-link" onClick={() => setShowFractionCards(!showFractionCards)}>
              {showFractionCards ? 'Tutup kartu pecahan' : 'Ingat lagi: Pecahan'}
            </button>
            {showFractionCards && <InlineFractionCards cards={FRACTION_CARDS} />}
          </>
        )}

        {st.done ? (
          <button type="button" className="btn-primary" onClick={goNext}>
            {stepIndex === STEP_IDS.length - 1 ? 'Selesai ✓' : 'Lanjut →'}
          </button>
        ) : (
          <button type="button" className="btn-primary" onClick={check} disabled={!canCheck}>
            Periksa
          </button>
        )}

        {step === 'mark' && !st.done && st.wrong >= 2 && (
          <button type="button" className="btn-secondary" onClick={revealMarks}>
            Tunjukkan penanda yang benar
          </button>
        )}

        {!st.done && (
          <HintLadder
            hints={problem.hints[step]}
            level={st.hint}
            onMore={() => setSt({ ...st, hint: Math.min(3, st.hint + 1) as HintLevel })}
            canDiscuss={st.hint >= 3 || st.wrong >= 2}
            discussionOpen={st.discussion}
            onOpenDiscussion={() => setSt({ ...st, discussion: true })}
            discussion={problem.discussion}
          />
        )}
      </section>
    </main>
  );
}
