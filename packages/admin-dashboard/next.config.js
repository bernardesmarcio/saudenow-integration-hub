/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@saudenow/middleware-api"],

  // Disable ESLint during build
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Disable TypeScript errors during build
  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
