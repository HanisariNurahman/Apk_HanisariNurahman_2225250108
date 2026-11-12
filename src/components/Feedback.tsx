// Umpan balik dengan alasan (F6, GL02). Warna selalu disertai ikon dan teks ("Benar" / "Perlu dicek").
export interface FeedbackValue {
  ok: boolean;
  message: string;
}

export default function Feedback({ value }: { value: FeedbackValue | null }) {
  return (
    <div className="feedback-slot" aria-live="polite" role="status">
      {value && (
        <div className={value.ok ? 'feedback is-ok' : 'feedback is-check'}>
          <strong>{value.ok ? '✓ Benar' : '⚠ Perlu dicek'}</strong>
          <p>{value.message}</p>
        </div>
      )}
    </div>
  );
}
