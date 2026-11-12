// Isian satu bilangan cacah, mis. "n(S) = [ 6 ]". Label menempel pada kotak (EL02).
import { useId } from 'react';

export default function NumberField({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <div className="number-field">
      <label htmlFor={id}>{label} =</label>
      <input
        id={id}
        inputMode="numeric"
        autoComplete="off"
        value={value}
        disabled={disabled}
        placeholder="?"
        onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 3))}
      />
    </div>
  );
}
