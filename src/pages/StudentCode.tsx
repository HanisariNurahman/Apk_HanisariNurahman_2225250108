// Layar kode siswa saat pertama kali membuka aplikasi (PRD F11, CLAUDE.md aturan 9: tanpa nama).

import { useState, type FormEvent } from 'react';
import { useStudent } from '../components/StudentProvider';

export default function StudentCode() {
  const { signIn } = useStudent();
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!signIn(value)) {
      setError('Kode berisi satu huruf lalu angka, misalnya S01. Jangan tulis nama.');
    }
  }

  return (
    <main className="code-screen">
      <h1>PeluangKu</h1>
      <form onSubmit={submit} className="stack" noValidate>
        <label htmlFor="student-code" className="code-label">
          Kode kamu
        </label>
        <p className="muted" id="student-code-hint">
          Contoh: S01. Tanyakan kodemu kepada guru.
        </p>
        <input
          id="student-code"
          className={error ? 'code-input is-check' : 'code-input'}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError(null);
          }}
          inputMode="text"
          autoCapitalize="characters"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          maxLength={6}
          aria-describedby={error ? 'student-code-error' : 'student-code-hint'}
          aria-invalid={error ? true : undefined}
        />
        {error && (
          <p id="student-code-error" className="field-error" role="alert">
            <span aria-hidden="true">⚠ </span>
            {error}
          </p>
        )}
        <button type="submit" className="btn-primary" disabled={!value.trim()}>
          Mulai
        </button>
      </form>
    </main>
  );
}
