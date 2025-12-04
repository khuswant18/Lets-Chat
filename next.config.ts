import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: false,
  assetPrefix: process.env.NODE_ENV === 'production' ? undefined : '',
  poweredByHeader: false,
  images: {
    unoptimized: false,
  },

  // 👇 Force Next.js to use server runtime on Vercel
  output: "standalone",
  experimental: {
    serverActions: {
      allowedOrigins: ["*"],
    }
  }
};

export default nextConfig;

