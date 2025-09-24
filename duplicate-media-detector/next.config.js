/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['sharp', 'jimp'],
  eslint: {
    // Disable ESLint during builds for now
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Allow build to continue with type errors for now
    ignoreBuildErrors: true,
  },
  images: {
    domains: ['localhost'],
    unoptimized: true
  },
  webpack: (config) => {
    // Handle worker files
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
    };
    
    return config;
  }
};

module.exports = nextConfig;