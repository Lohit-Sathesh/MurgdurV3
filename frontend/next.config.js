/** @type {import('next').Config} */
const nextConfig = {
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/backend-api/:path*',
        destination: `${process.env.INTERNAL_API_URL ?? 'http://localhost:3001'}/:path*`,
      },
    ]
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'media.murgdur.com',
      },
      {
        protocol: 'https',
        hostname: '*.r2.dev',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },
}

module.exports = nextConfig