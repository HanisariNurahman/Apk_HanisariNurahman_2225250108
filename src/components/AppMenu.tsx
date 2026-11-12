// Menu ⋮ di Beranda (DESIGN §3): Ganti kode siswa · Ukuran huruf · Mode gelap · Area guru.

import { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { FontScale, Progress, ThemeSetting } from '../types';

const FONT_OPTIONS: { value: FontScale; label: string; aria: string }[] = [
  { value: 1, label: 'A', aria: 'Huruf normal' },
  { value: 1.15, label: 'A+', aria: 'Huruf besar' },
  { value: 1.3, label: 'A++', aria: 'Huruf sangat besar' },
];

const THEME_OPTIONS: { value: ThemeSetting; label: string }[] = [
  { value: 'auto', label: 'Otomatis' },
  { value: 'light', label: 'Terang' },
  { value: 'dark', label: 'Gelap' },
];

export default function AppMenu({
  code,
  settings,
  onSettings,
  onSwitchStudent,
}: {
  code: string;
  settings: Progress['settings'];
  onSettings: (s: Progress['settings']) => void;
  onSwitchStudent: () => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="app-menu" ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        className="icon-btn"
        aria-label="Menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((o) => !o)}
      >
        <span aria-hidden="true">⋮</span>
      </button>
      {open && (
        <div id={menuId} className="app-menu-panel card">
          <button type="button" className="app-menu-item" onClick={onSwitchStudent}>
            Ganti kode siswa
          </button>
          <p className="muted">Progres {code} tetap tersimpan di HP ini.</p>

          <p className="menu-label">Ukuran huruf</p>
          <div className="seg seg-3" role="group" aria-label="Ukuran huruf">
            {FONT_OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                aria-pressed={settings.fontScale === o.value}
                aria-label={o.aria}
                onClick={() => onSettings({ ...settings, fontScale: o.value })}
              >
                {o.label}
              </button>
            ))}
          </div>

          <p className="menu-label">Tampilan</p>
          <div className="seg seg-3" role="group" aria-label="Mode terang atau gelap">
            {THEME_OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                aria-pressed={settings.theme === o.value}
                onClick={() => onSettings({ ...settings, theme: o.value })}
              >
                {o.label}
              </button>
            ))}
          </div>

          <Link to="/guru" className="app-menu-item app-menu-link">
            Area guru
          </Link>
        </div>
      )}
    </div>
  );
}
