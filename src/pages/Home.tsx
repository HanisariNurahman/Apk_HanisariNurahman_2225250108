// Beranda (DESIGN §4.1): satu tombol utama "Lanjutkan" + maksimal 4 tile.

import { Link } from 'react-router-dom';
import AppMenu from '../components/AppMenu';
import { useStudent } from '../components/StudentProvider';
import { LESSONS } from '../content/lessons';
import { continueTarget, lessonsDoneCount } from '../lib/home';
import '../styles/home.css';

export default function Home() {
  const { code, progress, switchStudent } = useStudent();
  if (!code || !progress) return null;

  const next = continueTarget(progress, LESSONS);
  const doneLessons = lessonsDoneCount(progress, LESSONS);
  const doneProblems = progress.problemsDone.length;

  return (
    <main className="home">
      <header className="home-header">
        <span className="home-title">PeluangKu</span>
        <span className="code-chip" aria-label={`Kode siswa ${code}`}>
          {code}
        </span>
        <AppMenu code={code} onSwitchStudent={switchStudent} />
      </header>

      <section className="continue" aria-labelledby="continue-title">
        <p className="muted">Berikutnya</p>
        <h1 id="continue-title" className="continue-title">
          {next.title}
        </h1>
        <p className="muted">{next.detail}</p>
        <Link to={next.to} className="btn-primary btn-link-block">
          Lanjutkan <span aria-hidden="true">→</span>
        </Link>
      </section>

      <nav className="tiles" aria-label="Menu utama">
        <Link to="/belajar" className="tile">
          <span className="tile-title">Belajar</span>
          <span className="dots" aria-hidden="true">
            {LESSONS.map((l, i) => (
              <span key={l.id} className={i < doneLessons ? 'dot is-done' : 'dot'} />
            ))}
          </span>
          <span className="muted">
            {doneLessons} dari {LESSONS.length} subbab
          </span>
        </Link>
        <Link to="/latihan" className="tile">
          <span className="tile-title">Latihan</span>
          <span className="muted">{doneProblems ? `${doneProblems} soal selesai` : 'Belum ada soal'}</span>
        </Link>
        <Link to="/simulasi" className="tile">
          <span className="tile-title">Simulasi</span>
          <span className="muted">Lempar koin dan dadu</span>
        </Link>
        <Link to="/pecahan" className="tile">
          <span className="tile-title">Ingat Pecahan</span>
          <span className="muted">Kartu pengingat</span>
        </Link>
      </nav>
    </main>
  );
}
