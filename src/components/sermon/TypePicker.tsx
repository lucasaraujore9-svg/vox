"use client";

import { useState } from "react";
import type { SermonType } from "@/types/database";
import { cn } from "@/lib/utils";

// O wizard usa um "modo de escrita" expandido — Folha em branco é um perfil
// do esboço (type=esboço + framework=livre) sem wizard de framework. Não muda
// o schema; o id "branco" só vive no wizard.
export type WritingMode = SermonType | "branco";

interface TypeOption {
  id: WritingMode;
  label: string;
  tagline: string;
  description: string;
}

const OPTIONS: readonly TypeOption[] = [
  {
    id: "branco",
    label: "Folha em branco",
    tagline: "Escrita corrida",
    description:
      "Página em branco, sem framework e sem blocos. Escreva como num editor de texto comum. Pode inserir tópicos se quiser estruturar depois.",
  },
  {
    id: "esboço",
    label: "Esboço guia",
    tagline: "Manuscrito por blocos",
    description:
      "Escreva o sermão em blocos estruturados por um framework homilético: texto bíblico, contexto, pontos, aplicação.",
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
  value?: WritingMode;
  defaultValue?: WritingMode;
  onChange?: (value: WritingMode) => void;
  name?: string;
  className?: string;
}

export function TypePicker({
  value,
  defaultValue = "branco",
  onChange,
  name,
  className,
}: TypePickerProps) {
  const [internal, setInternal] = useState<WritingMode>(defaultValue);
  const current = value ?? internal;

  function handleSelect(id: WritingMode) {
    if (value === undefined) setInternal(id);
    onChange?.(id);
  }

  return (
    <div className={cn("grid sm:grid-cols-2 lg:grid-cols-3 gap-4", className)}>
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
            <p
              className="vox-eyebrow"
              style={{ color: selected ? "var(--vox-forest)" : undefined }}
            >
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
