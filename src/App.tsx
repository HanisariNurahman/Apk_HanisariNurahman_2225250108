// Rute aplikasi (HashRouter: aman untuk hosting statis). Tanpa kode siswa → layar kode dulu.
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { StudentProvider, useStudent } from './components/StudentProvider';
import ComingSoon from './pages/ComingSoon';
import Home from './pages/Home';
import Simulation from './pages/Simulation';
import StudentCode from './pages/StudentCode';

function AppRoutes() {
  const { code } = useStudent();
  if (!code) return <StudentCode />;
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/belajar/*" element={<ComingSoon title="Belajar" />} />
      <Route path="/latihan" element={<ComingSoon title="Latihan" />} />
      <Route path="/simulasi" element={<Simulation />} />
      <Route path="/pecahan" element={<ComingSoon title="Ingat Pecahan" />} />
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
