import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  cacheOnNavigation: true,
  reloadOnOnline: true,
  // Em dev o SW dá ruído (refresh constante). Liga só em prod.
  disable: process.env.NODE_ENV !== "production",
});

const nextConfig: NextConfig = {
  serverExternalPackages: ["@napi-rs/canvas", "sharp", "pdfjs-dist"],
  // O pdfjs carrega worker, fontes, cmaps e wasm do disco em runtime, e resolve
  // o @napi-rs/canvas por um require() dinâmico dentro do próprio pacote —
  // caminhos que o tracer do Next não consegue deduzir. Sem isso o upload de
  // PDF quebra na Vercel com "Cannot find module …/pdf.worker.mjs".
  outputFileTracingIncludes: {
    "/api/sermons/slides/**": [
      "./node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs",
      "./node_modules/pdfjs-dist/standard_fonts/**",
      "./node_modules/pdfjs-dist/cmaps/**",
      "./node_modules/pdfjs-dist/wasm/**",
      "./node_modules/@napi-rs/**",
    ],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        protocol: "https",
        hostname: "docs.google.com",
      },
    ],
  },
};

export default withSerwist(nextConfig);
