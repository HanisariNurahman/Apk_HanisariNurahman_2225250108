// Kode siswa aktif + progresnya. Satu HP bisa dipakai bergantian: progres disimpan per kode (PRD §7).

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { getCurrentStudent, keys, loadProgress, remove, saveProgress, setCurrentStudent } from '../lib/storage';
import type { Progress } from '../types';

interface StudentState {
  code: string | null;
  progress: Progress | null;
  /** Mengembalikan kode yang sudah dinormalkan, atau null bila formatnya salah. */
  signIn(raw: string): string | null;
  /** Kembali ke layar kode. Progres kode lama tetap tersimpan di HP. */
  switchStudent(): void;
  updateProgress(update: (p: Progress) => Progress): void;
}

const StudentContext = createContext<StudentState | null>(null);

export function StudentProvider({ children }: { children: ReactNode }) {
  const [code, setCode] = useState<string | null>(() => getCurrentStudent());
  const [progress, setProgress] = useState<Progress | null>(() => (code ? loadProgress(code) : null));

  const signIn = useCallback((raw: string) => {
    const normalized = setCurrentStudent(raw);
    if (normalized) {
      setCode(normalized);
      setProgress(loadProgress(normalized));
    }
    return normalized;
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
    () => ({ code, progress, signIn, switchStudent, updateProgress }),
    [code, progress, signIn, switchStudent, updateProgress],
  );
  return <StudentContext.Provider value={value}>{children}</StudentContext.Provider>;
}

export function useStudent(): StudentState {
  const ctx = useContext(StudentContext);
  if (!ctx) throw new Error('useStudent harus dipakai di dalam <StudentProvider>');
  return ctx;
}
