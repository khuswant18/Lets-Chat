import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: false,
  poweredByHeader: false,
  images: { unoptimized: false },
  
  // Remove standalone output for Vercel compatibility
  // Note: Socket.IO will still not work on Vercel
  // output: "standalone",

  experimental: {
    serverActions: { allowedOrigins: ["*"] }
  }
};

export default nextConfig;
