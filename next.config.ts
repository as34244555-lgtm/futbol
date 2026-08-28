import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "flagcdn.com" },
    ],
  },
  outputFileTracingExcludes: {
    "*": ["./data/**", "./.vercel/**", "./.git/**", "./scripts/**"],
  },
};

export default nextConfig;
