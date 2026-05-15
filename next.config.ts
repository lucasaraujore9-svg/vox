import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Packages que precisam ser tratados como externos pelo bundler (binários nativos)
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

export default nextConfig;
