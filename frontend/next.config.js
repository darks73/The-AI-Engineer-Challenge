/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  async rewrites() {
    // Only proxy in development when NEXT_PUBLIC_API_URL is not set
    if (process.env.NODE_ENV === 'development' && !process.env.NEXT_PUBLIC_API_URL) {
      return [
        {
          source: '/api/:path*',
          destination: 'http://localhost:8000/api/:path*'
        }
      ]
    }
    return []
  }
}

module.exports = nextConfig
