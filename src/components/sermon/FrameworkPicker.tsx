"use client";

import { useState } from "react";
import { VOX_FRAMEWORKS, type FrameworkId } from "@/lib/mocks/frameworks";
import { cn } from "@/lib/utils";

interface FrameworkPickerProps {
  value?: FrameworkId;
  defaultValue?: FrameworkId;
  onChange?: (value: FrameworkId) => void;
  name?: string;
  className?: string;
}

export function FrameworkPicker({
  value,
  defaultValue = "expositivo",
  onChange,
  name,
  className,
}: FrameworkPickerProps) {
  const [internal, setInternal] = useState<FrameworkId>(defaultValue);
  const current = value ?? internal;

  function handleSelect(id: FrameworkId) {
    if (value === undefined) setInternal(id);
    onChange?.(id);
  }

  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4", className)}>
      {VOX_FRAMEWORKS.map((fw) => {
        const selected = fw.id === current;
        const accent = `var(--vox-fw-${fw.id})`;
        return (
          <label
            key={fw.id}
            className="relative cursor-pointer rounded-xl p-5 transition-all bg-card border"
            style={{
              borderColor: selected ? accent : "var(--vox-whisper)",
              borderWidth: selected ? "1.5px" : "1px",
              boxShadow: selected
                ? "var(--vox-shadow-card-hover)"
                : "var(--vox-shadow-card)",
            }}
          >
            <input
              type="radio"
              name={name ?? "framework"}
              value={fw.id}
              checked={selected}
              onChange={() => handleSelect(fw.id)}
              className="sr-only"
            />
            <div className="flex items-center gap-2">
              <span className="inline-block size-2 rounded-full" style={{ background: accent }} />
              <p className="vox-eyebrow" style={{ color: accent }}>
                {fw.name}
              </p>
            </div>
            <p className="vox-h3 mt-2 text-base">{fw.tagline}</p>
            <p className="vox-body text-xs mt-2 line-clamp-2">{fw.description}</p>
            <ul className="mt-4 space-y-1 text-xs vox-mono text-vox-muted">
              {fw.outline.slice(0, 4).map((block, idx) => (
                <li key={`${fw.id}-${idx}`} className="flex items-center gap-1.5">
                  <span className="opacity-60">{String(idx + 1).padStart(2, "0")}</span>
                  <span>{block}</span>
                </li>
              ))}
              {fw.outline.length > 4 ? (
                <li className="opacity-60">+ {fw.outline.length - 4} blocos</li>
              ) : null}
            </ul>
          </label>
        );
      })}
    </div>
  );
}
