// Halaman "Ingat lagi: Pecahan" (F8) [IL03].
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CardDeck from '../components/CardDeck';
import { FractionCardView } from '../components/FractionDeck';
import { FRACTION_CARDS } from '../content/fractionCards';
import '../styles/learn.css';

export default function FractionRefresher() {
  const [i, setI] = useState(0);
  const [done, setDone] = useState<Set<number>>(new Set());
  const navigate = useNavigate();
  const card = FRACTION_CARDS[i];
  return (
    <CardDeck
      title="Ingat Pecahan"
      backTo="/"
      backLabel="Beranda"
      index={i}
      total={FRACTION_CARDS.length}
      canAdvance={card.kind !== 'simplify' || done.has(i)}
      onBack={() => setI(Math.max(0, i - 1))}
      onNext={() => (i < FRACTION_CARDS.length - 1 ? setI(i + 1) : navigate('/'))}
    >
      <FractionCardView key={i} card={card} onDone={() => setDone((s) => new Set(s).add(i))} />
    </CardDeck>
  );
}
