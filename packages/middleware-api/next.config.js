/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  // Disable ESLint and TypeScript during build
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  // Custom server configuration
  async rewrites() {
    return [
      {
        source: "/api/docs",
        destination: "/api/docs",
      },
      {
        source: "/docs",
        destination: "/docs",
      },
    ];
  },

  // Custom headers for API
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          {
            key: "X-API-Version",
            value: "1.0.0",
          },
          {
            key: "X-Powered-By",
            value: "SaudeNow Integration Hub",
          },
        ],
      },
    ];
  },

  // Environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // Webpack configuration for API routes
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Exclude client-only modules from server bundle
      config.externals = [...(config.externals || []), "swagger-ui-dist"];
    }
    return config;
  },

  // Experimental features
  experimental: {
    // Enable if needed
    // serverActions: true,
  },

  // Output configuration
  output: "standalone",
};

module.exports = nextConfig;
