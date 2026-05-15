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
