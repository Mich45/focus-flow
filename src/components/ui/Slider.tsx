interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  onChange: (v: number) => void;
}

/** Labelled range slider tinted with the current accent. */
export function Slider({ label, value, min, max, step = 1, suffix = "", onChange }: SliderProps) {
  return (
    <label className="block">
      <div className="mb-1.5 flex items-center justify-between text-[12.5px]" style={{ color: "var(--ui-text-2)" }}>
        <span>{label}</span>
        <span style={{ color: "var(--ui-text)", fontVariantNumeric: "tabular-nums" }}>
          {value}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.currentTarget.value))}
        className="w-full"
        style={{ accentColor: "var(--accent)" }}
        aria-label={label}
      />
    </label>
  );
}
