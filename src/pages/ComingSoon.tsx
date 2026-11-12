// Halaman sementara untuk bagian yang dikerjakan di milestone berikutnya (Belajar M3, Latihan M4, Pecahan M6).
import PageHeader from '../components/PageHeader';

export default function ComingSoon({ title }: { title: string }) {
  return (
    <main>
      <PageHeader title={title} />
      <p className="muted">Bagian ini sedang disiapkan.</p>
    </main>
  );
}
