import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compress: true,          // gzip/brotli das respostas
  poweredByHeader: false,  // remove header X-Powered-By

  async headers() {
    const securityHeaders = [
      // Bloqueia clickjacking
      { key: 'X-Frame-Options', value: 'DENY' },
      // Impede MIME sniffing
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      // Força HTTPS por 1 ano, inclui subdomínios
      { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
      // Controla referrer em links externos
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      // Desativa features sensíveis não usadas no app
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      // CSP: restringe origens de scripts, estilos e conexões
      {
        key: 'Content-Security-Policy',
        value: [
          "default-src 'self'",
          // Next.js precisa de 'unsafe-inline' para estilos injetados em runtime;
          // nonces requerem server-side rendering de cada página — custo alto para
          // pouco ganho neste app SPA onde não há inputs de usuário em scripts
          "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: blob: https:",
          // Supabase (auth + DB), Pagar.me (checkout), ViaCEP, Nominatim (geocoding)
          [
            "connect-src 'self'",
            process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
            'https://*.supabase.co',
            'https://api.pagar.me',
            'https://viacep.com.br',
            'https://nominatim.openstreetmap.org',
          ].filter(Boolean).join(' '),
          "font-src 'self'",
          "object-src 'none'",
          "base-uri 'self'",
          "form-action 'self'",
          "frame-ancestors 'none'",
        ].join('; '),
      },
    ]

    return [
      // Segurança em todas as rotas
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
      // Cache longo para assets estáticos do Next.js
      {
        source: '/_next/static/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/icons/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=86400' }],
      },
    ]
  },
};

export default nextConfig;
