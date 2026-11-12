// Rute aplikasi (HashRouter: aman untuk hosting statis). Tanpa kode kelas/siswa → layar kode dulu.
import { useEffect } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { StudentProvider, useStudent } from './components/StudentProvider';
import { requestSync } from './lib/sync';
import FractionRefresher from './pages/FractionRefresher';
import Home from './pages/Home';
import { LessonDeck, LessonList } from './pages/Learn';
import { PracticeList, PracticeProblem } from './pages/Practice';
import Simulation from './pages/Simulation';
import StudentCode from './pages/StudentCode';
import TeacherArea from './pages/TeacherArea';

/** Sinkronisasi log di latar: saat aplikasi dibuka dan saat kembali online (ARCHITECTURE §5). */
function useAutoSync() {
  useEffect(() => {
    requestSync();
    window.addEventListener('online', requestSync);
    return () => window.removeEventListener('online', requestSync);
  }, []);
}

function AppRoutes() {
  const { code, classCode } = useStudent();
  useAutoSync();
  if (!code || !classCode) return <StudentCode />;
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/belajar" element={<LessonList />} />
      <Route path="/belajar/:lessonId" element={<LessonDeck />} />
      <Route path="/latihan" element={<PracticeList />} />
      <Route path="/latihan/:problemId" element={<PracticeProblem />} />
      <Route path="/simulasi" element={<Simulation />} />
      <Route path="/pecahan" element={<FractionRefresher />} />
      <Route path="/guru" element={<TeacherArea />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <StudentProvider>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </StudentProvider>
  );
}
