import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configure for Vercel deployment
  trailingSlash: false,
  // Ensure proper asset handling
  assetPrefix: process.env.NODE_ENV === 'production' ? undefined : '',
  // Disable x-powered-by header for security
  poweredByHeader: false,
  // Optimize images
  images: {
    unoptimized: false,
  },
};

export default nextConfig;
