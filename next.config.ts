import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["three"],
  // Hide the floating Next.js "N" badge in the bottom-left corner.
  devIndicators: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "flagcdn.com" },
    ],
  },
  outputFileTracingExcludes: {
    "*": ["./data/**", "./.vercel/**", "./.git/**", "./scripts/**", "./**/*.tsbuildinfo"],
  },
};

export default nextConfig;
