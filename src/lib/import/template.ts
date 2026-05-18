// Gera o "Modelo de Importação VOX": um .txt comentado que o usuário baixa,
// preenche e reenviavia em /import. Mantém a referência das tags suportadas
// alinhada com VOX_BLOCK_TYPES — assim, novo tipo de bloco já aparece aqui.

import { VOX_BLOCK_TYPES } from "@/lib/mocks/blocks";

export const TEMPLATE_FILENAME = "modelo-manuscrito-vox.txt";

/** Lista das tags `@tipo` documentadas, em ordem canônica do design. */
export function listBlockTags(): Array<{ tag: string; label: string; hint: string }> {
  return VOX_BLOCK_TYPES.map((b) => ({
    tag: `@${b.id}`,
    label: b.label,
    hint: b.hint,
  }));
}

/** Pequeno snippet pra pré-preencher o textarea no modo "Colar texto". */
export const QUICK_TEMPLATE = `## Introdução

@texto_biblico
Cole aqui a passagem.

@introducao
Como o sermão começa.

## Primeiro Ponto

@ponto_principal
A ideia central deste tópico.

@ilustracao
Uma história ou analogia.

@aplicacao
O que essa verdade pede da congregação.

## Conclusão

@conclusao
Recapitulação e chamado.
`;

function pad(s: string, n: number): string {
  return s.length >= n ? s : s + " ".repeat(n - s.length);
}

/** Texto completo do modelo: instruções no topo + exemplo trabalhado abaixo. */
export function buildImportTemplate(): string {
  const tagWidth = Math.max(...listBlockTags().map((t) => t.tag.length)) + 2;
  const tagLines = listBlockTags()
    .map((t) => `// ${pad(t.tag, tagWidth)}— ${t.label}: ${t.hint}`)
    .join("\n");

  return `// =====================================================================
// MODELO DE IMPORTAÇÃO VOX
// =====================================================================
//
// Como funciona:
//   - Linhas começando com "##" abrem uma SESSÃO (Introdução, Ponto, Conclusão).
//   - Linhas começando com "@" abrem um BLOCO de conteúdo.
//   - Tudo entre uma tag "@" e a próxima vira o conteúdo do bloco.
//   - Linhas começando com "//" ou "#" (um só) são comentários e são ignoradas.
//
// Tags de bloco disponíveis:
${tagLines}
//
// Dicas:
//   - O título da sessão depois de "##" pode ser livre. Se contiver as
//     palavras "Introdução" ou "Conclusão", o papel da sessão é detectado
//     automaticamente; o resto vira "Tópico".
//   - Você pode colocar conteúdo curto na MESMA linha da tag:
//         @texto_biblico Romanos 5:1-11
//   - Apague tudo abaixo e comece a escrever, ou edite o exemplo.
//
// =====================================================================


## Introdução

@texto_biblico
Romanos 5:1-11

@introducao
A justificação pela fé é o coração do evangelho. Nesta passagem, Paulo
desenvolve uma consequência prática dessa doutrina: a paz com Deus, que
nasce não dos méritos próprios, mas da obra de Cristo.

@proposicao
Quem é justificado pela fé recebe três presentes que ninguém pode tirar:
paz, acesso e esperança.


## Primeiro Ponto: Temos paz com Deus

@ponto_principal
A primeira consequência da justificação pela fé é a paz com Deus.

@ilustracao
Pense num soldado em terra estrangeira que ouve, no rádio, o anúncio
de que a guerra acabou. A guerra continuou enquanto ele não sabia, mas
no instante em que recebe a notícia, tudo muda.

@aplicacao
Você não precisa lutar para ser aceito. A paz já foi feita.


## Conclusão

@conclusao
Justificados pela fé, temos paz, temos acesso, temos esperança.
Nenhuma dessas três coisas vem de você — todas vêm de Cristo.

@oracao
Pai, recebe a nossa gratidão pela paz que nos deste em Cristo. Amém.
`;
}
