// Wizard de criação de esboço.
// Steps: 1) Tipo conteúdo (Sermão/Palestra/Aula)
//        2) Formato (Esboço vs Apresentação)
//        3) Framework (só esboço)
//        4) Informações básicas (título + ref bíblica)
//        5) Vínculo (série/curso opcional)

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ContentTypePicker } from "@/components/sermon/ContentTypePicker";
import { TypePicker } from "@/components/sermon/TypePicker";
import { FrameworkPicker } from "@/components/sermon/FrameworkPicker";
import { FrameworkHintDialog } from "@/components/sermon/FrameworkHintDialog";
import { LinkPicker, type LinkSelection } from "@/components/sermon/LinkPicker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ContentType, SermonType } from "@/types/database";
import type { FrameworkId } from "@/lib/mocks/frameworks";
import { createSermonAction } from "@/lib/sermons/actions";

type Step = 1 | 2 | 3 | 4 | 5;

export default function NewSermonWizardPage() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [step, setStep] = useState<Step>(1);
  const [contentType, setContentType] = useState<ContentType>("sermão");
  const [type, setType] = useState<SermonType>("esboço");
  const [framework, setFramework] = useState<FrameworkId>("expositivo");
  const [title, setTitle] = useState("");
  const [bibleRef, setBibleRef] = useState("");
  const [link, setLink] = useState<LinkSelection>({ seriesId: null, courseId: null });
  const [error, setError] = useState<string | null>(null);

  // Step 3 só existe pra esboço.
  const usesFramework = type === "esboço";
  const totalSteps = usesFramework ? 5 : 4;

  function visualStep(): number {
    if (!usesFramework && step >= 4) return step - 1;
    return step;
  }

  function nextStep() {
    setError(null);
    if (step === 1) setStep(2);
    else if (step === 2) setStep(usesFramework ? 3 : 4);
    else if (step === 3) setStep(4);
    else if (step === 4) setStep(5);
    else if (step === 5) submit();
  }

  function prevStep() {
    if (step === 1) {
      router.push("/sermons");
      return;
    }
    if (step === 4 && !usesFramework) {
      setStep(2);
      return;
    }
    setStep((step - 1) as Step);
  }

  function submit() {
    startTransition(async () => {
      const result = await createSermonAction({
        title: title.trim() || "Novo manuscrito",
        type,
        content_type: contentType,
        framework: usesFramework ? framework : undefined,
        bible_ref: bibleRef.trim() || undefined,
        series_id: link.seriesId ?? undefined,
        // newSeriesTitle e courseId são tratados em behaviors futuros
        // (createSeriesAction + linkLessonAction); criamos o sermão primeiro.
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
      <header className="flex items-center justify-between gap-4 mb-10">
        <div>
          <p className="vox-eyebrow">
            Passo {visualStep()} de {totalSteps}
          </p>
          <h1 className="vox-h1 mt-3">
            {step === 1 ? "O que você vai preparar?" : null}
            {step === 2 ? "Como você vai entregar?" : null}
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

      {step === 2 ? <TypePicker value={type} onChange={setType} /> : null}

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
              placeholder="Como o manuscrito vai aparecer no banco"
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

      <footer className="mt-10 flex items-center justify-between">
        <Button variant="ghost" onClick={prevStep} disabled={pending}>
          {step === 1 ? "Cancelar" : "Voltar"}
        </Button>
        <Button size="lg" onClick={nextStep} disabled={pending}>
          {step === 5
            ? pending
              ? "Criando…"
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
