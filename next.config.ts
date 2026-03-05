import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ads-partners.coupang.com',
      },
      {
        protocol: 'https',
        hostname: 'thumbnail*.coupangcdn.com',
      },
      {
        protocol: 'https',
        hostname: 'image*.coupangcdn.com',
      },
    ],
  },
};

export default nextConfig;
