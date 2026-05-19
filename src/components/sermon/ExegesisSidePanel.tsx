"use client";

// Painel lateral de exegeses no editor de sermão.
// - Granularidade: capítulo inteiro (versículos não entram)
// - Cache global compartilhado
// - Sempre parte dos originais (versão na tabela é fixa 'ORIGINAL')
// - Escuta vox:open-exegesis disparado pelo BubbleMenu do editor
//   para abrir automaticamente com livro + capítulo pré-preenchidos

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ExegesisStructured } from "@/components/sermon/ExegesisStructured";
import {
  createExegesisAction,
  unlinkExegesisFromSermonAction,
} from "@/lib/exegesis/actions";
import { BIBLE_BOOK_LIST } from "@/lib/exegesis/normalize";
import type { ExegesisContent } from "@/lib/ai/prompts/exegesis";

export interface ExegesisListItem {
  id: string;
  book_abbrev: string;
  book_name: string;
  chapter: number;
  canonical: string;
  content: ExegesisContent;
}

interface Props {
  sermonId: string;
  initialExegeses: ExegesisListItem[];
  plan: "manuscrito" | "concilio";
  aiEnabled: boolean;
  /** Sugestão inicial baseada em sermon.bible_ref. */
  defaultBookAbbrev?: string;
  defaultChapter?: number;
}

/**
 * Detalhes do evento que o BubbleMenu do editor dispara pra abrir
 * o painel já preenchido.
 */
export interface OpenExegesisEventDetail {
  bookAbbrev: string;
  chapter: number;
}

export const OPEN_EXEGESIS_EVENT = "vox:open-exegesis";

export function ExegesisSidePanel({
  sermonId,
  initialExegeses,
  plan,
  aiEnabled,
  defaultBookAbbrev,
  defaultChapter,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [showForm, setShowForm] = useState(initialExegeses.length === 0);
  const [bookAbbrev, setBookAbbrev] = useState<string>(
    defaultBookAbbrev ?? "rm"
  );
  const [chapter, setChapter] = useState<string>(
    defaultChapter ? String(defaultChapter) : "1"
  );
  const [expandedId, setExpandedId] = useState<string | null>(
    initialExegeses[0]?.id ?? null
  );
  const [pending, startTransition] = useTransition();

  const selectedBook = useMemo(
    () => BIBLE_BOOK_LIST.find((b) => b.abbrev === bookAbbrev),
    [bookAbbrev]
  );
  const canUse = plan === "concilio" && aiEnabled;

  // Escuta o evento do BubbleMenu pra abrir já preenchido
  useEffect(() => {
    function onOpen(e: Event) {
      const detail = (e as CustomEvent<OpenExegesisEventDetail>).detail;
      if (!detail) return;
      setBookAbbrev(detail.bookAbbrev);
      setChapter(String(detail.chapter));
      setShowForm(true);
      setOpen(true);
    }
    window.addEventListener(OPEN_EXEGESIS_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_EXEGESIS_EVENT, onOpen);
  }, []);

  function generate() {
    if (!canUse) return;
    if (!selectedBook) {
      toast.error("Selecione um livro");
      return;
    }
    const chapterNum = Number.parseInt(chapter, 10);
    if (
      Number.isNaN(chapterNum) ||
      chapterNum < 1 ||
      chapterNum > selectedBook.chapters
    ) {
      toast.error(
        `${selectedBook.name} tem ${selectedBook.chapters} capítulos.`
      );
      return;
    }
    const passage = `${selectedBook.name} ${chapterNum}`;
    startTransition(async () => {
      const result = await createExegesisAction({
        passage,
        sermon_id: sermonId,
      });
      if (result.ok) {
        if (result.cache_hit) {
          toast.success(`${result.canonical}: exegese existente carregada`);
        } else {
          toast.success(`Exegese de ${result.canonical} gerada`);
        }
        setShowForm(false);
        router.refresh();
      } else {
        toast.error(result.error ?? "Não foi possível gerar");
      }
    });
  }

  function remove(id: string) {
    if (!confirm("Remover esta exegese deste sermão?")) return;
    startTransition(async () => {
      const result = await unlinkExegesisFromSermonAction(sermonId, id);
      if (result.ok) {
        toast.success("Exegese desvinculada");
        if (expandedId === id) setExpandedId(null);
        router.refresh();
      } else {
        toast.error(result.error ?? "Não foi possível remover");
      }
    });
  }

  const oldTestament = useMemo(
    () => BIBLE_BOOK_LIST.filter((b) => b.testament === "VT"),
    []
  );
  const newTestament = useMemo(
    () => BIBLE_BOOK_LIST.filter((b) => b.testament === "NT"),
    []
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          Exegeses ({initialExegeses.length})
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl gap-0 p-0 flex flex-col"
        style={{ background: "var(--vox-bg)" }}
      >
        <SheetHeader
          className="px-6 py-5 border-b"
          style={{ borderColor: "var(--vox-whisper)" }}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="vox-eyebrow text-[10px]">Estudo do texto</p>
              <SheetTitle className="vox-h3 text-lg mt-1">
                Exegeses
              </SheetTitle>
            </div>
            {canUse ? (
              <Button
                size="sm"
                onClick={() => setShowForm((v) => !v)}
                disabled={pending}
              >
                {showForm ? "Cancelar" : "Nova exegese"}
              </Button>
            ) : null}
          </div>
        </SheetHeader>

        {!canUse ? (
          <UpgradePrompt plan={plan} aiEnabled={aiEnabled} />
        ) : (
          <div className="flex-1 overflow-y-auto">
            {showForm ? (
              <div
                className="px-6 py-5 border-b space-y-4"
                style={{
                  background: "var(--vox-surface-deep)",
                  borderColor: "var(--vox-whisper)",
                }}
              >
                <div className="grid grid-cols-[1fr_100px] gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="ex-book">Livro</Label>
                    <Select value={bookAbbrev} onValueChange={setBookAbbrev}>
                      <SelectTrigger id="ex-book">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <p className="vox-mono text-[10px] uppercase tracking-wider text-vox-muted px-2 py-1.5">
                          Antigo Testamento
                        </p>
                        {oldTestament.map((b) => (
                          <SelectItem key={b.abbrev} value={b.abbrev}>
                            {b.name}
                          </SelectItem>
                        ))}
                        <p className="vox-mono text-[10px] uppercase tracking-wider text-vox-muted px-2 py-1.5 mt-1">
                          Novo Testamento
                        </p>
                        {newTestament.map((b) => (
                          <SelectItem key={b.abbrev} value={b.abbrev}>
                            {b.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ex-chapter">Capítulo</Label>
                    <Input
                      id="ex-chapter"
                      type="number"
                      min={1}
                      max={selectedBook?.chapters ?? 150}
                      value={chapter}
                      onChange={(e) => setChapter(e.target.value)}
                      className="vox-mono"
                      disabled={pending}
                    />
                  </div>
                </div>
                {selectedBook ? (
                  <p className="vox-mono text-[10px] uppercase tracking-wider text-vox-muted">
                    {selectedBook.name} tem {selectedBook.chapters} capítulos
                  </p>
                ) : null}
                <Button
                  className="w-full"
                  onClick={generate}
                  disabled={pending || !selectedBook}
                >
                  {pending ? "Gerando…" : "Gerar exegese"}
                </Button>
                <p className="text-[11px] text-vox-muted leading-relaxed">
                  Análise técnica do capítulo em 14 seções, partindo dos
                  originais (hebraico/grego). Primeira geração leva ~30s;
                  consultas seguintes são instantâneas.
                </p>
              </div>
            ) : null}

            {initialExegeses.length === 0 && !showForm ? (
              <div className="p-10 text-center">
                <p className="vox-body text-sm text-vox-muted">
                  Nenhuma exegese vinculada a este sermão.
                </p>
                <Button
                  size="sm"
                  className="mt-4"
                  onClick={() => setShowForm(true)}
                >
                  Criar primeira
                </Button>
              </div>
            ) : null}

            <ul
              className="divide-y"
              style={{ borderColor: "var(--vox-whisper)" }}
            >
              {initialExegeses.map((ex) => {
                const isOpen = expandedId === ex.id;
                return (
                  <li
                    key={ex.id}
                    style={{ borderColor: "var(--vox-whisper)" }}
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedId(isOpen ? null : ex.id)}
                      className="w-full text-left px-6 py-4 hover:bg-[var(--vox-surface-deep)] transition-colors flex items-start justify-between gap-3"
                    >
                      <p
                        className="vox-ref text-[15px]"
                        style={{ color: "var(--vox-gold)" }}
                      >
                        {ex.canonical}
                      </p>
                      <span
                        aria-hidden
                        className="vox-mono text-xl shrink-0 transition-transform"
                        style={{
                          color: "var(--vox-forest)",
                          lineHeight: 1,
                          transform: isOpen ? "rotate(45deg)" : undefined,
                        }}
                      >
                        +
                      </span>
                    </button>
                    {isOpen ? (
                      <div className="px-6 pb-6">
                        <ExegesisStructured content={ex.content} />
                        <div className="flex justify-end mt-4">
                          <button
                            type="button"
                            onClick={() => remove(ex.id)}
                            disabled={pending}
                            className="text-xs text-vox-muted hover:text-vox-destructive"
                          >
                            Remover deste sermão
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function UpgradePrompt({
  plan,
  aiEnabled,
}: {
  plan: "manuscrito" | "concilio";
  aiEnabled: boolean;
}) {
  return (
    <div className="p-10 text-center space-y-4">
      <div
        className="mx-auto size-12 rounded-full flex items-center justify-center"
        style={{ background: "var(--vox-forest-soft)" }}
      >
        <span
          className="vox-mono text-lg"
          style={{ color: "var(--vox-forest)" }}
        >
          ✻
        </span>
      </div>
      {plan === "manuscrito" ? (
        <>
          <h3 className="vox-h3 text-lg">Exegese é do plano Concílio</h3>
          <p className="vox-body text-sm text-vox-muted max-w-sm mx-auto">
            A análise técnica de cada capítulo que você prega faz parte do
            plano <strong>Concílio</strong>.
          </p>
          <Button asChild size="sm">
            <Link href="/settings">Mudar plano</Link>
          </Button>
        </>
      ) : !aiEnabled ? (
        <>
          <h3 className="vox-h3 text-lg">Assistente desativado</h3>
          <p className="vox-body text-sm text-vox-muted max-w-sm mx-auto">
            Ative o assistente em configurações para gerar exegeses.
          </p>
          <Button asChild size="sm">
            <Link href="/settings">Ativar assistente</Link>
          </Button>
        </>
      ) : null}
    </div>
  );
}
