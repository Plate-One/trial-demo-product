import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

// Vercel では通常の Next ビルドのみ（workerd 未使用）、それ以外で OpenNext を有効化
if (!process.env.VERCEL) {
  initOpenNextCloudflareForDev();
}

export default nextConfig;