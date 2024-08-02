/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ['image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'public-content.hackersheet.com',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'hackersheet.test',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
