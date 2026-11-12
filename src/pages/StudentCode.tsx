// Layar kode saat pertama kali membuka aplikasi (PRD F11): kode kelas dari guru + kode siswa. Tanpa nama (aturan 9).

import { useState, type FormEvent } from 'react';
import { useStudent } from '../components/StudentProvider';

export default function StudentCode() {
  const { signIn, classCode } = useStudent();
  const [cls, setCls] = useState(classCode ?? '');
  const [value, setValue] = useState('');
  const [errors, setErrors] = useState<{ cls?: string; student?: string }>({});

  function submit(e: FormEvent) {
    e.preventDefault();
    const r = signIn(cls, value);
    setErrors({
      cls: r.classOk ? undefined : 'Kode kelas berisi huruf dan angka, misalnya 8A.',
      student: r.studentOk ? undefined : 'Kode berisi satu huruf lalu angka, misalnya S01. Jangan tulis nama.',
    });
  }

  return (
    <main className="code-screen">
      <h1>PeluangKu</h1>
      <form onSubmit={submit} className="stack" noValidate>
        <div>
          <label htmlFor="class-code" className="code-label">
            Kode kelas
          </label>
          <p className="muted" id="class-code-hint">
            Contoh: 8A. Tanyakan kepada guru.
          </p>
          <input
            id="class-code"
            className={errors.cls ? 'code-input is-check' : 'code-input'}
            value={cls}
            onChange={(e) => {
              setCls(e.target.value);
              setErrors({ ...errors, cls: undefined });
            }}
            autoCapitalize="characters"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            maxLength={16}
            aria-describedby={errors.cls ? 'class-code-error' : 'class-code-hint'}
            aria-invalid={errors.cls ? true : undefined}
          />
          {errors.cls && (
            <p id="class-code-error" className="field-error" role="alert">
              <span aria-hidden="true">⚠ </span>
              {errors.cls}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="student-code" className="code-label">
            Kode kamu
          </label>
          <p className="muted" id="student-code-hint">
            Contoh: S01. Tanyakan kodemu kepada guru.
          </p>
          <input
            id="student-code"
            className={errors.student ? 'code-input is-check' : 'code-input'}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setErrors({ ...errors, student: undefined });
            }}
            autoCapitalize="characters"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            maxLength={6}
            aria-describedby={errors.student ? 'student-code-error' : 'student-code-hint'}
            aria-invalid={errors.student ? true : undefined}
          />
          {errors.student && (
            <p id="student-code-error" className="field-error" role="alert">
              <span aria-hidden="true">⚠ </span>
              {errors.student}
            </p>
          )}
        </div>
        <button type="submit" className="btn-primary" disabled={!value.trim() || !cls.trim()}>
          Mulai
        </button>
      </form>
    </main>
  );
}
