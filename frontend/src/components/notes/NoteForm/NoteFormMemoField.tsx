'use client';

interface NoteFormMemoFieldProps {
  mode: 'create' | 'view' | 'edit';
  memo: string;
  errors: Record<string, string>;
  setMemo: (v: string) => void;
}

export function NoteFormMemoField({
  mode,
  memo,
  errors,
  setMemo,
}: NoteFormMemoFieldProps) {
  const isView = mode === 'view';
  return (
    <div className="mb-6">
      <label
        htmlFor="memo"
        className="block text-sm font-medium text-fg-muted mb-2"
      >
        対策メモ
      </label>
      <textarea
        id="memo"
        value={memo}
        onChange={(e) => setMemo(e.target.value)}
        disabled={isView}
        rows={6}
        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent ${errors.memo ? 'border-danger' : 'border-line-strong'} ${isView ? 'bg-surface-2 cursor-not-allowed' : ''}`}
        placeholder="対策のポイントやコツを記入してください"
        aria-invalid={!!errors.memo}
        aria-describedby={errors.memo ? 'memo-error' : undefined}
      />
      {errors.memo && (
        <p id="memo-error" className="text-sm text-danger-fg mt-1" role="alert">
          {errors.memo}
        </p>
      )}
    </div>
  );
}
