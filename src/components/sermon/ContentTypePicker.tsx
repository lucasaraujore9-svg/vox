"use client";

import { useState } from "react";
import type { ContentType } from "@/types/database";
import { CONTENT_TYPES } from "@/lib/mocks/content-types";
import { cn } from "@/lib/utils";

interface ContentTypePickerProps {
  value?: ContentType;
  defaultValue?: ContentType;
  onChange?: (value: ContentType) => void;
  /** Modo controlado vs não-controlado */
  name?: string;
  className?: string;
}

export function ContentTypePicker({
  value,
  defaultValue = "sermão",
  onChange,
  name,
  className,
}: ContentTypePickerProps) {
  const [internal, setInternal] = useState<ContentType>(defaultValue);
  const current = value ?? internal;

  function handleSelect(id: ContentType) {
    if (value === undefined) setInternal(id);
    onChange?.(id);
  }

  return (
    <div className={cn("grid sm:grid-cols-3 gap-3", className)}>
      {CONTENT_TYPES.map((type) => {
        const selected = type.id === current;
        return (
          <label
            key={type.id}
            className={cn(
              "relative cursor-pointer rounded-xl p-5 transition-all",
              "border bg-card",
              selected ? "shadow-[var(--vox-shadow-card-hover)]" : "shadow-[var(--vox-shadow-card)]"
            )}
            style={{
              borderColor: selected ? "var(--vox-forest)" : "var(--vox-whisper)",
              borderWidth: selected ? "1.5px" : "1px",
            }}
          >
            <input
              type="radio"
              name={name ?? "content_type"}
              value={type.id}
              checked={selected}
              onChange={() => handleSelect(type.id)}
              className="sr-only"
            />
            <div className="flex items-center gap-2">
              <span
                className="inline-block size-2 rounded-full"
                style={{
                  background: selected
                    ? "var(--vox-forest)"
                    : "var(--vox-whisper-strong)",
                }}
              />
              <p className="vox-eyebrow" style={{ color: selected ? "var(--vox-forest)" : undefined }}>
                {type.label}
              </p>
            </div>
            <p className="vox-body mt-2 text-sm">{type.description}</p>
            <p className="vox-mono text-xs text-vox-muted mt-3">
              Recomendado: {type.defaultFrameworkHint}
            </p>
          </label>
        );
      })}
    </div>
  );
}
