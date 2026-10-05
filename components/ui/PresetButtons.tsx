"use client";

interface Preset {
  label: string;
  value: number;
}

export function PresetButtons({
  label,
  presets,
  current,
  onSelect,
}: {
  label: string;
  presets: Preset[];
  current: number;
  onSelect: (value: number) => void;
}) {
  return (
    <div role="group" aria-label={label}>
      <p className="text-sm font-semibold text-ink" aria-hidden="true">
        {label}
      </p>
      <div className="mt-1.5 flex flex-wrap gap-2">
        {presets.map((p) => {
          const active = p.value === current;
          return (
            <button
              key={p.value}
              type="button"
              aria-pressed={active}
              onClick={() => onSelect(p.value)}
              className={`rounded border px-3 py-1.5 text-sm font-semibold tabular-nums transition-colors ${
                active
                  ? "border-brand bg-brand text-white"
                  : "border-line-strong bg-surface text-ink hover:border-brand hover:text-brand"
              }`}
            >
              {p.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
