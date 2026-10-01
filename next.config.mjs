/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Tree-shake lucide-react and framer-motion to reduce JS bundle size
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },

  // Compress responses with gzip
  compress: true,

  // Allow Firebase Storage + common image CDNs
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
      { protocol: 'https', hostname: '*.firebasestorage.app' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '*.googleusercontent.com' },
    ],
    // Serve modern formats for smaller file sizes
    formats: ['image/avif', 'image/webp'],
  },

  // Aggressive HTTP caching for static assets (JS/CSS/fonts)
  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/manifest.json',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400' },
        ],
      },
    ];
  },
};

export default nextConfig;
