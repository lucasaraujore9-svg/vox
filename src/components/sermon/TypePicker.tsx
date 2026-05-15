"use client";

import { useState } from "react";
import type { SermonType } from "@/types/database";
import { cn } from "@/lib/utils";

interface TypeOption {
  id: SermonType;
  label: string;
  tagline: string;
  description: string;
}

const OPTIONS: readonly TypeOption[] = [
  {
    id: "esboço",
    label: "Esboço guia",
    tagline: "Manuscrito por blocos",
    description:
      "Escreva o sermão em blocos estruturados por um framework homilético. Texto bíblico, contexto, pontos, aplicação.",
  },
  {
    id: "apresentação",
    label: "Apresentação",
    tagline: "Slides com comentários",
    description:
      "Importe seus slides (PDF ou Google Slides) e adicione comentários do apresentador para cada slide.",
  },
];

interface TypePickerProps {
  value?: SermonType;
  defaultValue?: SermonType;
  onChange?: (value: SermonType) => void;
  name?: string;
  className?: string;
}

export function TypePicker({
  value,
  defaultValue = "esboço",
  onChange,
  name,
  className,
}: TypePickerProps) {
  const [internal, setInternal] = useState<SermonType>(defaultValue);
  const current = value ?? internal;

  function handleSelect(id: SermonType) {
    if (value === undefined) setInternal(id);
    onChange?.(id);
  }

  return (
    <div className={cn("grid sm:grid-cols-2 gap-4", className)}>
      {OPTIONS.map((option) => {
        const selected = option.id === current;
        return (
          <label
            key={option.id}
            className={cn(
              "relative cursor-pointer rounded-xl p-6 transition-all bg-card border"
            )}
            style={{
              borderColor: selected ? "var(--vox-forest)" : "var(--vox-whisper)",
              borderWidth: selected ? "1.5px" : "1px",
              boxShadow: selected
                ? "var(--vox-shadow-card-hover)"
                : "var(--vox-shadow-card)",
            }}
          >
            <input
              type="radio"
              name={name ?? "type"}
              value={option.id}
              checked={selected}
              onChange={() => handleSelect(option.id)}
              className="sr-only"
            />
            <p className="vox-eyebrow" style={{ color: selected ? "var(--vox-forest)" : undefined }}>
              {option.tagline}
            </p>
            <h3 className="vox-h3 mt-3">{option.label}</h3>
            <p className="vox-body text-sm mt-3">{option.description}</p>
          </label>
        );
      })}
    </div>
  );
}
