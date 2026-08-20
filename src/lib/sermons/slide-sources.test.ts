// Contrato de rasterização do slide. As duas rotas que geram imagem
// (`/api/sermons/slides/upload` e `/api/sermons/slides/[slideId]`) usam estas
// constantes na mesma cadeia sharp — o teste trava o formato de saída pra que
// baixar a resolução de novo quebre aqui, e não só no projetor.

import { test } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import {
  SLIDE_HEIGHT,
  SLIDE_WEBP_OPTIONS,
  SLIDE_WIDTH,
  sourceExtension,
  isValidSourcePath,
} from "./slide-sources.ts";

/** A mesma cadeia das rotas. Se ela mudar lá, muda aqui. */
function toSlide(input: Buffer) {
  return sharp(input)
    .resize(SLIDE_WIDTH, SLIDE_HEIGHT, { fit: "contain", background: "#ffffff" })
    .webp(SLIDE_WEBP_OPTIONS)
    .toBuffer();
}

function solid(width: number, height: number) {
  return sharp({
    create: { width, height, channels: 3, background: "#166534" },
  })
    .png()
    .toBuffer();
}

test("o slide sai grande o bastante para projeção 1080p", () => {
  // 1920 é o mínimo pra não interpolar num projetor Full HD; abaixo disso o
  // texto vetorial do PDF serrilha.
  assert.ok(
    SLIDE_WIDTH >= 1920,
    `SLIDE_WIDTH=${SLIDE_WIDTH} rasteriza abaixo de 1080p`
  );
  assert.equal(SLIDE_WIDTH / SLIDE_HEIGHT, 16 / 9);
  assert.ok(SLIDE_WEBP_OPTIONS.quality >= 90);
});

test("fonte 16:9 preenche o quadro sem distorcer", async () => {
  const out = await toSlide(await solid(1152, 648)); // tamanho do PDF exportado
  const meta = await sharp(out).metadata();
  assert.equal(meta.format, "webp");
  assert.equal(meta.width, SLIDE_WIDTH);
  assert.equal(meta.height, SLIDE_HEIGHT);
});

test("fonte fora de 16:9 é encaixada com fundo branco, nunca esticada", async () => {
  const out = await toSlide(await solid(600, 800)); // retrato
  const meta = await sharp(out).metadata();
  assert.equal(meta.width, SLIDE_WIDTH);
  assert.equal(meta.height, SLIDE_HEIGHT);

  // Canto superior esquerdo tem que ser a barra branca do letterbox, não a cor
  // da imagem — prova que houve `contain` e não `fill`.
  const corner = await sharp(out)
    .extract({ left: 0, top: 0, width: 8, height: 8 })
    .raw()
    .toBuffer();
  assert.deepEqual([corner[0], corner[1], corner[2]], [255, 255, 255]);
});

test("só aceita extensão de slide conhecida", () => {
  assert.equal(sourceExtension({ name: "aula.PDF", type: "" }), ".pdf");
  assert.equal(sourceExtension({ name: "foto.jpeg", type: "" }), ".jpg");
  assert.equal(sourceExtension({ name: "x", type: "image/webp" }), ".webp");
  assert.equal(sourceExtension({ name: "planilha.xlsx", type: "" }), null);
});

test("caminho de fonte fora da pasta do usuário é recusado", () => {
  const uid = "11111111-1111-1111-1111-111111111111";
  const sid = "22222222-2222-2222-2222-222222222222";
  assert.ok(isValidSourcePath(`${uid}/${sid}/_src/a.pdf`, uid, sid));
  assert.ok(!isValidSourcePath(`outro/${sid}/_src/a.pdf`, uid, sid));
  assert.ok(!isValidSourcePath(`${uid}/${sid}/_src/../../a.pdf`, uid, sid));
  assert.ok(!isValidSourcePath(`${uid}/${sid}/_src/a.exe`, uid, sid));
});
