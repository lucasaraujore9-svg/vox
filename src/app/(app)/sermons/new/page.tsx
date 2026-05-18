// Wizard de criação de esboço.
// Steps possíveis:
//   1) Tipo de conteúdo (Sermão/Palestra/Aula)
//   2) Modo de escrita (Folha em branco / Esboço guiado / Apresentação)
//   3) Framework (apenas Esboço guiado)
//   4) Informações básicas (título + ref bíblica)
//   5) Vínculo (série/curso opcional — apenas Esboço guiado / Apresentação)
//
// Folha em branco: salta 3 e 5 — vai direto pra escrever, sem fricção.
// Vínculo de série criada na hora: se newSeriesTitle estiver preenchido,
// upsertSeriesAction roda antes do createSermonAction.

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ContentTypePicker } from "@/components/sermon/ContentTypePicker";
import { TypePicker, type WritingMode } from "@/components/sermon/TypePicker";
import { FrameworkPicker } from "@/components/sermon/FrameworkPicker";
import { FrameworkHintDialog } from "@/components/sermon/FrameworkHintDialog";
import { LinkPicker, type LinkSelection } from "@/components/sermon/LinkPicker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ContentType, SermonType } from "@/types/database";
import type { FrameworkId } from "@/lib/mocks/frameworks";
import { createSermonAction } from "@/lib/sermons/actions";
import { upsertSeriesAction } from "@/lib/series/actions";

type Step = 1 | 2 | 3 | 4 | 5;

export default function NewSermonWizardPage() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [step, setStep] = useState<Step>(1);
  const [contentType, setContentType] = useState<ContentType>("sermão");
  const [mode, setMode] = useState<WritingMode>("branco");
  const [framework, setFramework] = useState<FrameworkId>("expositivo");
  const [title, setTitle] = useState("");
  const [bibleRef, setBibleRef] = useState("");
  const [link, setLink] = useState<LinkSelection>({ seriesId: null, courseId: null });
  const [error, setError] = useState<string | null>(null);

  const isBlank = mode === "branco";
  const isSlides = mode === "apresentação";
  // Esboço guiado precisa de framework explícito; os outros não.
  const usesFramework = mode === "esboço";
  // Folha em branco: sem step de framework e sem step de vínculo (atalho).
  const totalSteps = isBlank ? 3 : usesFramework ? 5 : 4;

  function visualStep(): number {
    if (isBlank) {
      // 1 → 1, 2 → 2, 4 → 3
      if (step === 4) return 3;
      return step;
    }
    if (!usesFramework && step >= 4) return step - 1;
    return step;
  }

  function nextStep() {
    setError(null);
    if (step === 1) {
      setStep(2);
      return;
    }
    if (step === 2) {
      // Folha em branco pula framework
      if (isBlank) setStep(4);
      else setStep(usesFramework ? 3 : 4);
      return;
    }
    if (step === 3) {
      setStep(4);
      return;
    }
    if (step === 4) {
      // Folha em branco: cria direto, sem vínculo
      if (isBlank) {
        submit();
      } else {
        setStep(5);
      }
      return;
    }
    if (step === 5) submit();
  }

  function prevStep() {
    if (step === 1) {
      router.push("/sermons");
      return;
    }
    if (step === 4 && (isBlank || !usesFramework)) {
      setStep(2);
      return;
    }
    setStep((step - 1) as Step);
  }

  function resolvedType(): SermonType {
    if (isSlides) return "apresentação";
    return "esboço";
  }

  function resolvedFramework(): FrameworkId | undefined {
    if (isBlank) return "livre";
    if (usesFramework) return framework;
    return undefined;
  }

  function submit() {
    startTransition(async () => {
      // Se o usuário escolheu "Criar série nova", cria a série antes
      // e usa o id retornado.
      let seriesId: string | undefined = link.seriesId ?? undefined;
      const newTitle = link.newSeriesTitle?.trim();
      if (!seriesId && newTitle) {
        const seriesRes = await upsertSeriesAction({ title: newTitle });
        if (!seriesRes.ok) {
          setError(`Falha ao criar série: ${seriesRes.error}`);
          return;
        }
        seriesId = seriesRes.id;
      }

      const result = await createSermonAction({
        title: title.trim() || (isBlank ? "Sem título" : "Novo manuscrito"),
        type: resolvedType(),
        content_type: contentType,
        framework: resolvedFramework(),
        bible_ref: bibleRef.trim() || undefined,
        series_id: seriesId,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(`/sermons/${result.id}`);
    });
  }

  return (
    <div className="max-w-4xl">
      <header className="flex items-center justify-between gap-4 mb-10 flex-wrap">
        <div>
          <p className="vox-eyebrow">
            Passo {visualStep()} de {totalSteps}
          </p>
          <h1 className="vox-h1 mt-3">
            {step === 1 ? "O que você vai preparar?" : null}
            {step === 2 ? "Como você quer escrever?" : null}
            {step === 3 ? "Qual estrutura?" : null}
            {step === 4 ? "Informações básicas" : null}
            {step === 5 ? "Vincular a uma coleção?" : null}
          </h1>
        </div>
        <Stepper step={visualStep()} total={totalSteps} />
      </header>

      {error ? (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {step === 1 ? (
        <ContentTypePicker value={contentType} onChange={setContentType} />
      ) : null}

      {step === 2 ? <TypePicker value={mode} onChange={setMode} /> : null}

      {step === 3 && usesFramework ? (
        <>
          <FrameworkPicker value={framework} onChange={setFramework} />
          <FrameworkHintDialog framework={framework} autoOpen key={framework} />
        </>
      ) : null}

      {step === 4 ? (
        <section className="space-y-5 max-w-lg">
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                isBlank
                  ? "Deixe em branco se ainda não souber"
                  : "Como o manuscrito vai aparecer no banco"
              }
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bibleRef">Referência bíblica (opcional)</Label>
            <Input
              id="bibleRef"
              value={bibleRef}
              onChange={(e) => setBibleRef(e.target.value)}
              placeholder="Ex: Romanos 5:1—11"
            />
          </div>
        </section>
      ) : null}

      {step === 5 ? (
        <LinkPicker
          contentType={contentType}
          value={link}
          onChange={setLink}
        />
      ) : null}

      <footer className="mt-10 flex items-center justify-between gap-3">
        <Button variant="ghost" onClick={prevStep} disabled={pending}>
          {step === 1 ? "Cancelar" : "Voltar"}
        </Button>
        <Button size="lg" onClick={nextStep} disabled={pending}>
          {(step === 5 || (step === 4 && isBlank))
            ? pending
              ? "Criando…"
              : isBlank
                ? "Começar a escrever"
                : "Abrir editor"
            : "Continuar"}
        </Button>
      </footer>
    </div>
  );
}

function Stepper({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, idx) => {
        const filled = idx + 1 <= step;
        return (
          <span
            key={idx}
            className="block h-1 rounded-full transition-all"
            style={{
              width: filled ? 32 : 16,
              background: filled ? "var(--vox-forest)" : "var(--vox-whisper-strong)",
            }}
          />
        );
      })}
    </div>
  );
}
