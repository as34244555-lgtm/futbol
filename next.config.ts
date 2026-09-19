import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["three"],
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
