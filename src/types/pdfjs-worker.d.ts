// O pdfjs-dist não publica tipos para o bundle do worker, só para `pdf.mjs`.
// Importamos o worker explicitamente no /api/sermons/slides/upload para que o
// tracer do Next inclua o arquivo no pacote da função (ver next.config.ts).
declare module "pdfjs-dist/legacy/build/pdf.worker.mjs" {
  export const WorkerMessageHandler: unknown;
}
