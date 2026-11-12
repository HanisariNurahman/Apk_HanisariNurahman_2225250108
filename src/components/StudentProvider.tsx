// Kode kelas + kode siswa aktif + progresnya. Satu HP bisa dipakai bergantian: progres disimpan per kode (PRD §7).
// Pengaturan tampilan (ukuran huruf, tema) diterapkan ke <html> (M8).

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  getClassCode,
  getCurrentStudent,
  keys,
  loadProgress,
  remove,
  saveProgress,
  setClassCode,
  setCurrentStudent,
} from '../lib/storage';
import type { Progress } from '../types';

interface StudentState {
  classCode: string | null;
  code: string | null;
  progress: Progress | null;
  /** Mengembalikan pesan galat, atau null bila berhasil. */
  signIn(rawClass: string, rawStudent: string): { classOk: boolean; studentOk: boolean };
  /** Kembali ke layar kode. Progres kode lama tetap tersimpan di HP. */
  switchStudent(): void;
  updateProgress(update: (p: Progress) => Progress): void;
}

const StudentContext = createContext<StudentState | null>(null);

export function applySettings(p: Progress | null): void {
  const root = document.documentElement;
  const scale = p?.settings.fontScale ?? 1;
  root.style.setProperty('--font-scale', String(scale));
  const theme = p?.settings.theme ?? 'auto';
  if (theme === 'auto') delete root.dataset.theme;
  else root.dataset.theme = theme;
}

export function StudentProvider({ children }: { children: ReactNode }) {
  const [classCode, setClass] = useState<string | null>(() => getClassCode());
  const [code, setCode] = useState<string | null>(() => getCurrentStudent());
  const [progress, setProgress] = useState<Progress | null>(() => (code ? loadProgress(code) : null));

  useEffect(() => applySettings(progress), [progress]);

  const signIn = useCallback((rawClass: string, rawStudent: string) => {
    const cls = setClassCode(rawClass);
    const student = cls ? setCurrentStudent(rawStudent) : null;
    if (cls) setClass(cls);
    if (cls && student) {
      setCode(student);
      setProgress(loadProgress(student));
    }
    return { classOk: !!cls, studentOk: !!student || !cls };
  }, []);

  const switchStudent = useCallback(() => {
    remove(keys.currentStudent);
    setCode(null);
    setProgress(null);
  }, []);

  const updateProgress = useCallback((update: (p: Progress) => Progress) => {
    setProgress((p) => {
      if (!p) return p;
      const next = update(p);
      saveProgress(next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ classCode, code, progress, signIn, switchStudent, updateProgress }),
    [classCode, code, progress, signIn, switchStudent, updateProgress],
  );
  return <StudentContext.Provider value={value}>{children}</StudentContext.Provider>;
}

export function useStudent(): StudentState {
  const ctx = useContext(StudentContext);
  if (!ctx) throw new Error('useStudent harus dipakai di dalam <StudentProvider>');
  return ctx;
}
