interface NumberFieldProps {
  id: string;
  label: string;
  value: number;
  min?: number;
  step?: number;
  suffix?: string;
  onChange: (value: number) => void;
  helper?: string;
}

export function NumberField({ id, label, value, min, step, suffix, onChange, helper }: NumberFieldProps) {
  return (
    <div className="space-y-1">
      <label htmlFor={id}>{label}</label>
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="number"
          value={value}
          min={min}
          step={step}
          onChange={(event) => onChange(parseFloat(event.target.value))}
        />
        {suffix ? <span className="text-sm text-text-muted w-10">{suffix}</span> : null}
      </div>
      {helper ? <div className="helper-text">{helper}</div> : null}
    </div>
  );
}
