/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    const isProd = process.env.NODE_ENV === 'production';
    // Base API URL for CSP connect-src
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    let apiOrigin = 'http://localhost:8000';
    try {
      apiOrigin = new URL(apiUrl).origin;
    } catch(e) {}

    const csp = `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline';
      style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
      font-src 'self' https://fonts.gstatic.com data:;
      img-src 'self' data: blob: https://api.maptiler.com https://*.supabase.co https://*.cartocdn.com https://basemaps.cartocdn.com https://*.tile.openstreetmap.org https://demotiles.maplibre.org;
      connect-src 'self' ${apiOrigin} https://api.maptiler.com https://*.supabase.co https://*.cartocdn.com https://basemaps.cartocdn.com https://demotiles.maplibre.org;
      worker-src 'self' blob:;
      child-src 'self' blob:;
    `.replace(/\s{2,}/g, ' ').trim();

    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
          { key: 'Content-Security-Policy', value: csp }
        ]
      }
    ]
  },
  async rewrites() {
    const apiUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
    const baseUrl = apiUrl.replace(/\/api\/v1\/?$/, '');
    return [
      {
        source: '/api/v1/:path*',
        destination: `${baseUrl}/api/v1/:path*`,
      },
    ];
  }
};

export default nextConfig;
