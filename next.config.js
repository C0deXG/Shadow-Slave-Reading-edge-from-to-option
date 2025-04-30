/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  images: {
    unoptimized: true,
  },
  // Remove standalone output as it's causing issues with Vercel deployment
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
};

module.exports = nextConfig; 