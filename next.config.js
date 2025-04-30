/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  images: {
    unoptimized: true,
  },
  // Ensure proper static generation
  trailingSlash: true,
  poweredByHeader: false,
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(epub)$/,
      type: 'asset/resource',
      generator: {
        filename: 'static/[name][ext]'
      }
    });
    return config;
  },
  // Add custom headers for Edge compatibility
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Edge-Reading',
            value: 'enabled',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig; 