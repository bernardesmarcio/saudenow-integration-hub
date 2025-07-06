/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@saudenow/middleware-api"],
  experimental: {
    serverActions: true,
  },
}

module.exports = nextConfig