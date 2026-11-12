// Belajar (F1): daftar subbab berurutan + kartu bertahap per subbab.
// Subbab berikutnya terbuka setelah subbab sebelumnya selesai (urutan tetap, EL04).

import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import CardDeck from '../components/CardDeck';
import LessonCardView from '../components/LessonCardView';
import PageHeader from '../components/PageHeader';
import { useStudent } from '../components/StudentProvider';
import { LESSON_CONTENT, isInteractive } from '../content/lessons';
import '../styles/learn.css';

export function LessonList() {
  const { progress } = useStudent();
  const done = new Set(progress?.lessonsDone ?? []);
  return (
    <main>
      <PageHeader title="Belajar" />
      <ol className="lesson-list">
        {LESSON_CONTENT.map((l, i) => {
          const unlocked = i === 0 || done.has(LESSON_CONTENT[i - 1].id);
          const isDone = done.has(l.id);
          const body = (
            <>
              <span className="lesson-num" aria-hidden="true">
                {isDone ? '✓' : i + 1}
              </span>
              <span className="lesson-text">
                <strong>{l.title}</strong>
                <span className="muted">
                  {isDone ? 'Selesai · bisa diulang' : unlocked ? `${l.cards.length} kartu` : 'Selesaikan subbab sebelumnya dulu'}
                </span>
              </span>
            </>
          );
          return (
            <li key={l.id}>
              {unlocked ? (
                <Link to={`/belajar/${l.id}`} className="lesson-item">
                  {body}
                </Link>
              ) : (
                <div className="lesson-item is-locked" aria-disabled="true">
                  {body}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </main>
  );
}

export function LessonDeck() {
  const { lessonId } = useParams();
  const { progress, updateProgress } = useStudent();
  const navigate = useNavigate();
  const index = LESSON_CONTENT.findIndex((l) => l.id === lessonId);
  const lesson = LESSON_CONTENT[index];
  const [cardIndex, setCardIndex] = useState(0);
  const [doneCards, setDoneCards] = useState<Set<number>>(new Set());

  const done = new Set(progress?.lessonsDone ?? []);
  const unlocked = index === 0 || (index > 0 && done.has(LESSON_CONTENT[index - 1].id));
  if (!lesson || !unlocked) return <Navigate to="/belajar" replace />;

  const card = lesson.cards[cardIndex];
  const canAdvance = !isInteractive(card) || doneCards.has(cardIndex);

  function next() {
    if (cardIndex < lesson.cards.length - 1) {
      setCardIndex(cardIndex + 1);
      window.scrollTo(0, 0);
      return;
    }
    updateProgress((p) =>
      p.lessonsDone.includes(lesson.id) ? p : { ...p, lessonsDone: [...p.lessonsDone, lesson.id] },
    );
    navigate('/belajar');
  }

  return (
    <CardDeck
      title={lesson.title}
      backTo="/belajar"
      backLabel="Belajar"
      index={cardIndex}
      total={lesson.cards.length}
      canAdvance={canAdvance}
      onBack={() => setCardIndex(Math.max(0, cardIndex - 1))}
      onNext={next}
      finishLabel="Selesai ✓"
    >
      <LessonCardView
        key={`${lesson.id}-${cardIndex}`}
        card={card}
        onDone={() => setDoneCards((s) => new Set(s).add(cardIndex))}
      />
    </CardDeck>
  );
}
