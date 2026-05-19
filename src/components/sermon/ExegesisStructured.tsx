// Renderiza as 14 seções de uma exegese. Cada seção pode ser null se
// a chamada paralela correspondente falhou — UI mostra "Não disponível"
// nesse caso pra que o pregador saiba o que falta.

import type {
  ExegesisContent,
  LexicalEntry,
} from "@/lib/ai/prompts/exegesis";

interface Props {
  content: ExegesisContent;
}

export function ExegesisStructured({ content }: Props) {
  return (
    <div className="space-y-3">
      <Section title="1. Perícope" eyebrow="Análise preliminar" open>
        {content.pericope ? (
          <>
            <Field label="Delimitação">
              {content.pericope.delimitacao}
            </Field>
            <Field label="Marcadores literários">
              {content.pericope.marcadores_literarios}
            </Field>
            <Field label="Crítica textual">
              {content.pericope.critica_textual}
            </Field>
            <Field label="Tradução comentada">
              {content.pericope.traducao_propria}
            </Field>
          </>
        ) : (
          <Unavailable />
        )}
      </Section>

      <Section title="2. Contexto" eyebrow="Background">
        {content.contexto ? (
          <>
            <Field label="Histórico">{content.contexto.historico}</Field>
            <Field label="Cultural e geográfico">
              {content.contexto.cultural_geografico}
            </Field>
            <Field label="Literário">{content.contexto.literario}</Field>
            <Field label="Canônico">{content.contexto.canonico}</Field>
          </>
        ) : (
          <Unavailable />
        )}
      </Section>

      <Section title="3. Gênero literário" eyebrow="Hermenêutica do gênero">
        {content.genero ? (
          <>
            <Field label="Tipo">{content.genero.tipo}</Field>
            <Field label="Implicações hermenêuticas">
              {content.genero.implicacoes_hermeneuticas}
            </Field>
          </>
        ) : (
          <Unavailable />
        )}
      </Section>

      <Section title="4. Estrutura literária" eyebrow="Análise formal">
        {content.literario_estrutural ? (
          <Paragraph>{content.literario_estrutural}</Paragraph>
        ) : (
          <Unavailable />
        )}
      </Section>

      <Section title="5. Análise gramatical e sintática" eyebrow="Originais">
        {content.gramatical_sintatico ? (
          <Paragraph>{content.gramatical_sintatico}</Paragraph>
        ) : (
          <Unavailable />
        )}
      </Section>

      <Section title="6. Análise lexical" eyebrow="Termos-chave">
        {content.lexical && content.lexical.length > 0 ? (
          <ul className="space-y-3 mt-2">
            {content.lexical.map((term, i) => (
              <LexicalCard key={i} term={term} />
            ))}
          </ul>
        ) : (
          <Unavailable />
        )}
      </Section>

      <Section title="7. Histórico-cultural" eyebrow="Background expandido">
        {content.historico_cultural ? (
          <Paragraph>{content.historico_cultural}</Paragraph>
        ) : (
          <Unavailable />
        )}
      </Section>

      <Section title="8. Intertextualidade" eyebrow="Citações, alusões, ecos">
        {content.intertextualidade ? (
          <Paragraph>{content.intertextualidade}</Paragraph>
        ) : (
          <Unavailable />
        )}
      </Section>

      <Section title="9. Teologia" eyebrow="Argumento teológico">
        {content.teologico ? (
          <Paragraph>{content.teologico}</Paragraph>
        ) : (
          <Unavailable />
        )}
      </Section>

      <Section
        title="10. História da interpretação"
        eyebrow="Pais, Reforma, contemporâneos"
      >
        {content.historia_interpretacao ? (
          <Paragraph>{content.historia_interpretacao}</Paragraph>
        ) : (
          <Unavailable />
        )}
      </Section>

      <Section title="11. Síntese exegética" eyebrow="Big Idea" open>
        {content.sintese ? (
          <>
            <Field label="Assunto">{content.sintese.assunto}</Field>
            <Field label="Complemento">{content.sintese.complemento}</Field>
            <div
              className="mt-3 rounded-lg p-4"
              style={{
                background: "var(--vox-forest-soft)",
                border: "1px solid var(--vox-forest-tint)",
              }}
            >
              <p
                className="vox-mono text-[10px] uppercase tracking-wider mb-1"
                style={{ color: "var(--vox-forest)" }}
              >
                Big Idea
              </p>
              <p
                className="vox-body text-[15px] leading-relaxed"
                style={{ color: "var(--vox-ink)" }}
              >
                {content.sintese.big_idea}
              </p>
            </div>
          </>
        ) : (
          <Unavailable />
        )}
      </Section>

      <Section title="12. Princípios atemporais" eyebrow="Transculturais">
        {content.principios_atemporais &&
        content.principios_atemporais.length > 0 ? (
          <ul className="space-y-2 list-disc pl-5 marker:text-vox-muted">
            {content.principios_atemporais.map((p, i) => (
              <li
                key={i}
                className="text-[14px] leading-relaxed text-vox-prose"
              >
                {p}
              </li>
            ))}
          </ul>
        ) : (
          <Unavailable />
        )}
      </Section>

      <Section title="13. Aplicação" eyebrow="Do então para o agora">
        {content.aplicacao ? (
          <>
            <Field label="Individual">{content.aplicacao.individual}</Field>
            <Field label="Eclesial">{content.aplicacao.eclesial}</Field>
            <Field label="Social">{content.aplicacao.social}</Field>
          </>
        ) : (
          <Unavailable />
        )}
      </Section>

      <Section title="14. Metadados" eyebrow="Aparato crítico">
        {content.metadados ? (
          <>
            <Field label="Escola interpretativa">
              {content.metadados.escola_interpretativa}
            </Field>
            {content.metadados.pressuposicoes.length > 0 ? (
              <div className="mt-2">
                <p className="vox-mono text-[10px] uppercase tracking-wider text-vox-muted mb-1">
                  Pressuposições
                </p>
                <ul className="space-y-1 list-disc pl-5 marker:text-vox-muted">
                  {content.metadados.pressuposicoes.map((p, i) => (
                    <li
                      key={i}
                      className="text-[13px] leading-relaxed text-vox-prose"
                    >
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {content.metadados.obras_sugeridas.length > 0 ? (
              <div className="mt-3">
                <p className="vox-mono text-[10px] uppercase tracking-wider text-vox-muted mb-1">
                  Obras sugeridas
                </p>
                <ul className="space-y-1 list-disc pl-5 marker:text-vox-muted">
                  {content.metadados.obras_sugeridas.map((o, i) => (
                    <li
                      key={i}
                      className="text-[13px] leading-relaxed text-vox-prose"
                    >
                      {o}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </>
        ) : (
          <Unavailable />
        )}
      </Section>
    </div>
  );
}

// === Sub-componentes ===

function Section({
  title,
  eyebrow,
  open,
  children,
}: {
  title: string;
  eyebrow: string;
  open?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details
      className="group rounded-lg"
      style={{
        background: "var(--vox-surface)",
        border: "1px solid var(--vox-whisper)",
      }}
      open={open}
    >
      <summary className="px-4 py-3 cursor-pointer list-none [&::-webkit-details-marker]:hidden flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            className="vox-mono text-[10px] uppercase tracking-wider"
            style={{ color: "var(--vox-muted)" }}
          >
            {eyebrow}
          </p>
          <h4
            className="vox-h3 mt-0.5 text-[14px]"
            style={{ color: "var(--vox-ink)" }}
          >
            {title}
          </h4>
        </div>
        <span
          aria-hidden
          className="vox-mono text-xl shrink-0 transition-transform group-open:rotate-45"
          style={{ color: "var(--vox-forest)", lineHeight: 1 }}
        >
          +
        </span>
      </summary>
      <div className="px-4 pb-4 pt-1">{children}</div>
    </details>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-3 first:mt-2">
      <p className="vox-mono text-[10px] uppercase tracking-wider text-vox-muted mb-1">
        {label}
      </p>
      <p className="text-[13px] leading-relaxed text-vox-prose whitespace-pre-line">
        {children}
      </p>
    </div>
  );
}

function Paragraph({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[13px] leading-relaxed text-vox-prose whitespace-pre-line mt-1">
      {children}
    </p>
  );
}

function Unavailable() {
  return (
    <p className="vox-mono text-[11px] uppercase tracking-wider text-vox-muted py-2">
      Não disponível · esta seção falhou na geração
    </p>
  );
}

function LexicalCard({ term }: { term: LexicalEntry }) {
  return (
    <li
      className="rounded-md p-3"
      style={{
        background: "var(--vox-surface-deep)",
        border: "1px solid var(--vox-whisper)",
      }}
    >
      <div className="flex items-baseline gap-2 flex-wrap">
        <span
          className="vox-ref text-[15px]"
          style={{ color: "var(--vox-gold)" }}
        >
          {term.termo_original}
        </span>
        <span className="vox-mono text-xs italic text-vox-muted">
          {term.transliteracao}
        </span>
      </div>
      <p className="text-[12px] text-vox-muted mt-1">
        <strong className="text-vox-ink not-italic">Campo semântico:</strong>{" "}
        {term.campo_semantico}
      </p>
      <p className="text-[13px] text-vox-prose mt-1.5 leading-relaxed">
        <strong className="text-vox-ink">Uso no autor.</strong>{" "}
        {term.uso_no_autor}
      </p>
      <p className="text-[13px] text-vox-prose mt-1 leading-relaxed">
        <strong className="text-vox-ink">Nuance.</strong> {term.nuance}
      </p>
    </li>
  );
}
