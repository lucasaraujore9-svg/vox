"use client";

import { useState } from "react";

interface Slide {
  numero: number;
  titulo: string;
  bullets: string[];
  refBiblica?: string;
  proximoTitulo: string;
  notas: Array<{ color: string; texto: string }>;
}

const SLIDES: Slide[] = [
  {
    numero: 1,
    titulo: "A paz que vem de fora",
    bullets: ["Romanos 5:1,11", "Justificados pela fé", "Não pelo esforço"],
    refBiblica: "Romanos 5:1,11",
    proximoTitulo: "Três efeitos da justificação",
    notas: [
      {
        color: "var(--vox-gold)",
        texto: "Ler o versículo devagar. Pausar entre \"fé\" e \"temos paz\".",
      },
      {
        color: "var(--vox-forest)",
        texto: "Pausa de 3 segundos. Olhar para a congregação antes do ponto.",
      },
      {
        color: "var(--vox-ink)",
        texto:
          "Frase-chave: paz com Deus não é sensação, é posição declarada.",
      },
    ],
  },
  {
    numero: 2,
    titulo: "Três efeitos da justificação",
    bullets: [
      "Acesso ao Pai",
      "Esperança da glória",
      "Alegria nas tribulações",
    ],
    proximoTitulo: "Aplicação: você está tentando ou recebendo?",
    notas: [
      {
        color: "var(--vox-prose)",
        texto:
          "Não corra. Cada efeito merece um minuto de pausa narrativa.",
      },
      {
        color: "#0D7C7C",
        texto:
          "Ilustração breve: o filho que herda vs o empregado que trabalha pelo salário.",
      },
      {
        color: "var(--vox-muted)",
        texto: "Olhar de relance pro pessoal da galeria, eles costumam dispersar aqui.",
      },
    ],
  },
  {
    numero: 3,
    titulo: "Você está tentando ou recebendo?",
    bullets: [
      "Pare de orar pedindo o que já é seu",
      "Comece a orar reconhecendo",
      "Essa é a diferença",
    ],
    proximoTitulo: "Encerramento, oração",
    notas: [
      {
        color: "#0D7C7C",
        texto:
          "Pergunta direta para a congregação. Esperar. Não responder no lugar deles.",
      },
      {
        color: "var(--vox-ink)",
        texto:
          "Pessoal, antes de orar pedindo algo hoje, ore reconhecendo o que já é seu em Cristo.",
      },
    ],
  },
];

export function PresenterDemo() {
  const [idx, setIdx] = useState(0);
  const slide = SLIDES[idx] ?? SLIDES[0]!;
  const proximo = SLIDES[idx + 1];

  const goPrev = () => setIdx((i) => Math.max(0, i - 1));
  const goNext = () => setIdx((i) => Math.min(SLIDES.length - 1, i + 1));

  return (
    <div>
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: "var(--vox-surface)",
          border: "1px solid var(--vox-whisper)",
          boxShadow: "var(--vox-shadow-card)",
        }}
      >
        <div className="grid md:grid-cols-[1fr_1fr] divide-y md:divide-y-0 md:divide-x divide-[var(--vox-whisper)]">
          <PublicoView slide={slide} />
          <PregadorView
            slide={slide}
            proximo={proximo}
            idx={idx}
            total={SLIDES.length}
          />
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goPrev}
            disabled={idx === 0}
            className="vox-mono text-xs uppercase tracking-wider px-3 py-2 rounded-md transition-all disabled:opacity-30"
            style={{
              background: "var(--vox-surface)",
              border: "1px solid var(--vox-whisper)",
              color: "var(--vox-prose)",
            }}
            aria-label="slide anterior"
          >
            ← anterior
          </button>
          <button
            type="button"
            onClick={goNext}
            disabled={idx === SLIDES.length - 1}
            className="vox-mono text-xs uppercase tracking-wider px-3 py-2 rounded-md transition-all disabled:opacity-30"
            style={{
              background: "var(--vox-forest)",
              border: "1px solid var(--vox-forest)",
              color: "#fff",
            }}
            aria-label="próximo slide"
          >
            próximo →
          </button>
        </div>
        <span className="vox-mono text-[10px] uppercase tracking-wider text-vox-muted">
          slide {idx + 1} de {SLIDES.length} · experimente avançar
        </span>
      </div>
    </div>
  );
}

function PublicoView({ slide }: { slide: Slide }) {
  return (
    <div className="relative p-7 sm:p-9 min-h-[340px] flex flex-col justify-center">
      <div
        className="absolute top-4 left-4 vox-mono text-[10px] uppercase tracking-wider"
        style={{ color: "var(--vox-muted)" }}
      >
        vista do público
      </div>
      <div
        className="absolute top-4 right-4 flex items-center gap-1.5 vox-mono text-[10px] uppercase tracking-wider"
        style={{ color: "var(--vox-muted)" }}
      >
        <span
          className="size-1.5 rounded-full inline-block"
          style={{ background: "var(--vox-destructive)" }}
        />
        ao vivo
      </div>

      <div
        className="rounded-xl p-7 sm:p-9 flex flex-col justify-center min-h-[220px]"
        style={{
          background: "var(--vox-stage-bg)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <p
          className="vox-mono text-[10px] uppercase tracking-wider"
          style={{ color: "rgba(255,255,255,0.45)" }}
        >
          slide {slide.numero}
        </p>
        <h3
          className="mt-3 text-white"
          style={{
            fontFamily: "var(--vox-font-display)",
            fontSize: "clamp(20px, 2.4vw, 26px)",
            lineHeight: 1.15,
            letterSpacing: "-0.01em",
            fontWeight: 500,
          }}
        >
          {slide.titulo}
        </h3>
        <ul className="mt-5 space-y-2.5">
          {slide.bullets.map((b) => (
            <li
              key={b}
              className="flex items-start gap-2.5 text-sm"
              style={{ color: "rgba(255,255,255,0.78)" }}
            >
              <span
                className="mt-1.5 size-1 rounded-full shrink-0"
                style={{ background: "rgba(255,255,255,0.45)" }}
              />
              <span>{b}</span>
            </li>
          ))}
        </ul>
        {slide.refBiblica ? (
          <p
            className="mt-5 vox-mono text-[11px] uppercase tracking-wider"
            style={{ color: "rgba(180, 83, 9, 0.85)" }}
          >
            {slide.refBiblica}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function PregadorView({
  slide,
  proximo,
  idx,
  total,
}: {
  slide: Slide;
  proximo?: Slide;
  idx: number;
  total: number;
}) {
  return (
    <div className="p-6 sm:p-8 min-h-[340px]">
      <div className="flex items-center justify-between">
        <p
          className="vox-mono text-[10px] uppercase tracking-wider"
          style={{ color: "var(--vox-muted)" }}
        >
          painel do pregador
        </p>
        <div
          className="vox-mono text-[10px] uppercase tracking-wider flex items-center gap-3"
          style={{ color: "var(--vox-prose)" }}
        >
          <span style={{ fontVariantNumeric: "tabular-nums" }}>
            {String(idx + 12).padStart(2, "0")}:
            {String((idx * 17) % 60).padStart(2, "0")}
          </span>
          <span>·</span>
          <span>
            {idx + 1}/{total}
          </span>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-[1fr_auto] gap-3 items-start">
        <div>
          <p className="vox-eyebrow">Próximo slide</p>
          <div
            className="mt-2 rounded-md p-3"
            style={{
              background: "var(--vox-surface-deep)",
              border: "1px solid var(--vox-whisper)",
            }}
          >
            {proximo ? (
              <>
                <p
                  className="vox-mono text-[9px] uppercase tracking-wider"
                  style={{ color: "var(--vox-muted)" }}
                >
                  slide {proximo.numero}
                </p>
                <p
                  className="mt-1 text-[13px] leading-tight"
                  style={{
                    fontFamily: "var(--vox-font-display)",
                    color: "var(--vox-ink)",
                    fontWeight: 500,
                  }}
                >
                  {proximo.titulo}
                </p>
              </>
            ) : (
              <p
                className="vox-mono text-[10px] uppercase tracking-wider"
                style={{ color: "var(--vox-muted)" }}
              >
                último slide
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <p className="vox-eyebrow">Suas notas</p>
        <ul className="mt-3 space-y-2.5">
          {slide.notas.map((n, i) => (
            <li
              key={i}
              className="flex items-start gap-2.5 text-[13px] leading-relaxed"
              style={{ color: "var(--vox-prose)" }}
            >
              <span
                className="mt-1.5 size-1.5 rounded-full shrink-0"
                style={{ background: n.color }}
              />
              <span>{n.texto}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
