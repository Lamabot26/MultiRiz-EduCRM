import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'multiriz-educrm-main-cc9b3ae.kuberns.cloud' },
      { protocol: 'https', hostname: 'upload.wikimedia.org' },
    ],
  },
  allowedDevOrigins: ['*.space-z.ai'],
};

export default nextConfig;
