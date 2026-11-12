// Isian pecahan bertumpuk (pembilang di atas penyebut), DESIGN §2. Nilai disimpan sebagai string agar
// isian kosong/separuh tidak hilang; parseFraction mengubahnya menjadi { num, den }.

import { useId } from 'react';
import type { Fraction } from '../types';

export interface FractionDraft {
  num: string;
  den: string;
}

export const EMPTY_DRAFT: FractionDraft = { num: '', den: '' };

export function parseFraction(d: FractionDraft): Fraction | null {
  if (!/^\d+$/.test(d.num.trim()) || !/^\d+$/.test(d.den.trim())) return null;
  return { num: Number(d.num), den: Number(d.den) };
}

export default function FractionInput({
  value,
  onChange,
  label,
  disabled,
}: {
  value: FractionDraft;
  onChange: (v: FractionDraft) => void;
  label: string;
  disabled?: boolean;
}) {
  const id = useId();
  const clean = (s: string) => s.replace(/\D/g, '').slice(0, 3);
  return (
    <fieldset className="fraction-input" disabled={disabled}>
      <legend className="sr-only">{label}</legend>
      <label htmlFor={`${id}-n`} className="sr-only">
        Pembilang
      </label>
      <input
        id={`${id}-n`}
        inputMode="numeric"
        autoComplete="off"
        value={value.num}
        placeholder="?"
        onChange={(e) => onChange({ ...value, num: clean(e.target.value) })}
      />
      <span className="fraction-bar" aria-hidden="true" />
      <label htmlFor={`${id}-d`} className="sr-only">
        Penyebut
      </label>
      <input
        id={`${id}-d`}
        inputMode="numeric"
        autoComplete="off"
        value={value.den}
        placeholder="?"
        onChange={(e) => onChange({ ...value, den: clean(e.target.value) })}
      />
    </fieldset>
  );
}

/** Pecahan bertumpuk untuk tampilan (bukan isian). */
export function FractionView({
  num,
  den,
  numClass,
  denClass,
  label,
}: {
  num: React.ReactNode;
  den: React.ReactNode;
  numClass?: string;
  denClass?: string;
  label?: string;
}) {
  return (
    <span className="fraction-view" role="img" aria-label={label}>
      <span className={numClass}>{num}</span>
      <span className="fraction-bar" aria-hidden="true" />
      <span className={denClass}>{den}</span>
    </span>
  );
}
