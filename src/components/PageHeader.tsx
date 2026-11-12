// Kepala halaman non-beranda: hanya tombol ← Beranda dan judul (DESIGN §3: tanpa bottom-nav).
import { Link } from 'react-router-dom';

export default function PageHeader({ title }: { title: string }) {
  return (
    <header className="page-header">
      <Link to="/" className="back-link">
        <span aria-hidden="true">←</span> Beranda
      </Link>
      <h1>{title}</h1>
    </header>
  );
}
