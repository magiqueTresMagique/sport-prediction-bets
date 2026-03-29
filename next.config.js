/** @type {import('next').NextConfig} */
const nextConfig = {
  // Native-ish driver: avoid bundling quirks in serverless
  experimental: {
    serverComponentsExternalPackages: ['pg', 'pg-pool'],
  },
};

module.exports = nextConfig;
