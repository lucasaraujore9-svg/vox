# VOX — pacote da marca

A identidade visual completa do VOX. Use sempre os arquivos prontos; não recolora nem distorça o wordmark manualmente.

> Para o guia editorial completo (espaço de proteção, mau uso, aplicações), abra `Livro da Marca.html`.

## O que está aqui

```
logo/
├── Livro da Marca.html       ← livro de marca interativo (abra primeiro)
├── README.md                 ← este arquivo
├── svg/                      ← arquivos vetoriais (escaláveis sem perda)
│   ├── vox-wordmark*.svg     (5 variantes)
│   ├── vox-mark*.svg         (monograma V — 4 variantes)
│   ├── vox-lockup-*.svg      (lockups com tagline)
│   ├── vox-favicon-*.svg     (16 e 32 px)
│   ├── vox-app-icon-512.svg
│   └── vox-punctum*.svg      (o ponto solto)
└── png/                      ← exportações rasterizadas
    ├── vox-wordmark-{320,640,1280}.png       + variantes dark, mono, gold
    ├── vox-mark-{forest,parchment,stage,transparent}-{64,128,192,512}.png
    ├── vox-app-icon-{192,512,1024}.png       (com gradiente)
    ├── vox-favicon-{16,32,48,64,128}.png
    └── vox-punctum-{64,128,256}.png          + gold
```

## Variantes oficiais — quando usar qual

| Contexto | Use | Notas |
|---|---|---|
| Header de produto sobre parchment | `vox-wordmark.svg` | Padrão |
| Sobre fundo escuro / Modo Apresentação | `vox-wordmark-dark.svg` | Punctum em sage glow |
| Impressão B&W / fax / 1 cor | `vox-wordmark-mono-ink.svg` | Sem verde |
| Reversa sobre fundo de cor sólida | `vox-wordmark-mono-paper.svg` | Tudo em parchment |
| Capa, dedicatória, certificado | `vox-wordmark-gold.svg` | **Uso cerimonial restrito** |
| App icon (iOS, PWA, Android) | `vox-app-icon-512.png` ou `.svg` | Fundo com gradiente forest |
| Favicon | `vox-favicon-32.png` (ou `.svg`) | Use o de 16 px somente para abas |
| Avatar de usuário / canto de cartão | `vox-mark-forest-128.png` | Monograma padrão |
| Selo de revisão pastoral | `vox-punctum-gold-128.png` | Apenas para certificações |

## Tamanhos mínimos

- **Wordmark:** 16 px de altura na tela · 24 mm de largura em impressão
- **Monograma:** 16 px de altura · 6 mm em impressão
- **Favicon dedicado** a partir de 16 px (sem o punctum, que não registra)

## Cores oficiais

| Token | Hex | Equivalente Pantone (sugestão) |
|---|---|---|
| Forest Deep | `#166534` | Pantone 357 C |
| Charcoal Ink | `#18181B` | Pantone Black 6 C |
| Scripture Gold | `#B45309` | Pantone 1395 C |
| Parchment Canvas | `#F9F7F4` | Pantone 9080 C |
| Sage Glow (stage punctum) | `#86EFAC` | — |

Nunca recolora o punctum para uma cor fora desta lista. Sem roxo, sem azul, sem neon.

## SVGs com texto vivo (Fraunces)

Os SVGs aqui usam `<text>` referenciando a Fraunces. Funcionam em qualquer navegador moderno (a fonte é puxada de Google Fonts via stack), mas em sistemas que não conseguem carregar webfonts (e-mail transacional, alguns CMSs, impressão sem rasterizar) a tipografia pode cair no fallback Georgia.

**Para produção definitiva**, abra cada SVG no Figma ou Illustrator e selecione `Texto → Converter em curvas` (Figma: `Object → Outline Stroke`, depois `Flatten`). Reexporte. Os arquivos ficam ligeiramente maiores mas independem da Fraunces estar instalada.

## PNGs incluídos

Todos os PNGs foram rasterizados em alta qualidade com Fraunces 600/700 propriamente carregada. Use-os direto quando o destino não suportar SVG (ícones de app, favicons, anexos de e-mail).

## Mau uso — proibido

- Esticar, condensar ou rotacionar o wordmark
- Recolorir o punctum para qualquer cor fora da paleta oficial
- Adicionar sombras projetadas, gradientes sobre as letras, efeitos 3D
- Versão outline (contorno) — o wordmark é massa, não traço
- Punctum sem o V/wordmark em contexto onde não está claro que se refere ao VOX

Consulte `Livro da Marca.html` para a galeria completa de exemplos do que não fazer.

---

**v1 · maio de 2026** — Para revisões deste pacote, contate o time de design do VOX.
