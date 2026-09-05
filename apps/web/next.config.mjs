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
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: blob: https://api.maptiler.com https://*.supabase.co;
      connect-src 'self' ${apiOrigin} https://api.maptiler.com https://*.supabase.co;
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
  }
};

export default nextConfig;
