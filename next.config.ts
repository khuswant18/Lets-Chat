import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  trailingSlash: false,
  assetPrefix: process.env.NODE_ENV === 'production' ? undefined : '',
  poweredByHeader: false,
  images: { unoptimized: false },

  // 🚀 Correct location for Next.js 15+ (NOT in experimental)
  outputFileTracingRoot: path.join(__dirname, "../"),

  // 🚀 Force server runtime
  output: "standalone",

  experimental: {
    serverActions: { allowedOrigins: ["*"] }
  }
};

export default nextConfig;
