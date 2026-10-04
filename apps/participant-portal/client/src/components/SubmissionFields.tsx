import type { SubmissionFormData } from "@/types/portal";

type FieldId = keyof SubmissionFormData & string;
export type FieldErrors = Partial<Record<FieldId, string>>;

type TextFieldProps = {
  id: FieldId;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
  hint?: string;
  error?: string;
  placeholder?: string;
  maxLength?: number;
  autoComplete?: string;
};

export function TextField({ id, label, value, onChange, required, type = "text", hint, error, placeholder, maxLength, autoComplete }: TextFieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  return (
    <div className={`form-field ${error ? "has-error" : ""}`}>
      <label htmlFor={id}>{label}{required && <span className="required-mark" aria-label="required"> *</span>}</label>
      {hint && <p className="field-hint" id={hintId}>{hint}</p>}
      <input id={id} name={id} type={type} value={value} onChange={event => onChange(event.target.value)} required={required} maxLength={maxLength} placeholder={placeholder} autoComplete={autoComplete} aria-invalid={Boolean(error)} aria-describedby={[hintId, errorId].filter(Boolean).join(" ") || undefined} />
      {error && <p className="field-error" id={errorId} role="alert">{error}</p>}
    </div>
  );
}

type TextAreaFieldProps = Omit<TextFieldProps, "type" | "autoComplete"> & { rows?: number };
export function TextAreaField({ id, label, value, onChange, required, hint, error, placeholder, rows = 4, maxLength }: TextAreaFieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  return (
    <div className={`form-field ${error ? "has-error" : ""}`}>
      <label htmlFor={id}>{label}{required && <span className="required-mark" aria-label="required"> *</span>}</label>
      {hint && <p className="field-hint" id={hintId}>{hint}</p>}
      <textarea id={id} name={id} value={value} onChange={event => onChange(event.target.value)} required={required} placeholder={placeholder} rows={rows} maxLength={maxLength} aria-invalid={Boolean(error)} aria-describedby={[hintId, errorId].filter(Boolean).join(" ") || undefined} />
      {error && <p className="field-error" id={errorId} role="alert">{error}</p>}
    </div>
  );
}

export function SelectField({ id, label, value, onChange, required, options, placeholder, error }: {
  id: FieldId;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  options: string[];
  placeholder: string;
  error?: string;
}) {
  return (
    <div className={`form-field ${error ? "has-error" : ""}`}>
      <label htmlFor={id}>{label}{required && <span className="required-mark" aria-label="required"> *</span>}</label>
      <select id={id} name={id} value={value} onChange={event => onChange(event.target.value)} required={required} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined}>
        <option value="">{placeholder}</option>
        {options.map(option => <option key={option} value={option}>{option}</option>)}
      </select>
      {error && <p className="field-error" id={`${id}-error`} role="alert">{error}</p>}
    </div>
  );
}

export const submissionCategories = ["Developer tools", "Education", "Climate & energy", "Health & care", "Finance & commerce", "Public interest", "Creative tools", "Other"];
export const projectStatuses = ["In progress", "Beta", "Live", "Paused", "Archived"];
