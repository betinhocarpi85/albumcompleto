import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compress: true,          // gzip/brotli das respostas
  poweredByHeader: false,  // remove header X-Powered-By

  // Headers de cache longo para assets estáticos do Next.js
  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/icons/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400',
          },
        ],
      },
    ]
  },
};

export default nextConfig;
