/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove static export to enable API routes
  // output: 'export',
  // trailingSlash: true,
  images: {
    unoptimized: true,
    domains: ['localhost'],
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };
    return config;
  },
}

module.exports = nextConfig 