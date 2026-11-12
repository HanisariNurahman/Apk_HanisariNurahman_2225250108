// Menu ⋮ di Beranda. Untuk sekarang hanya "Ganti kode siswa"; ukuran huruf, mode gelap, dan area guru
// ditambahkan saat fiturnya ada (M7, M8), agar tidak ada menu yang belum berfungsi.

import { useEffect, useId, useRef, useState } from 'react';

export default function AppMenu({ code, onSwitchStudent }: { code: string; onSwitchStudent: () => void }) {
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
        </div>
      )}
    </div>
  );
}
