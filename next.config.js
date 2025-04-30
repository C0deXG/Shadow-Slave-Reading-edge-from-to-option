/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone',
  experimental: {
    outputFileTracingRoot: process.env.VERCEL ? '/' : undefined,
  },
  // Keep this for handling ePub files in public directory
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(epub)$/,
      use: [
        {
          loader: 'file-loader',
          options: {
            name: '[name].[ext]',
            publicPath: '/_next/static/files',
            outputPath: 'static/files',
          },
        },
      ],
    });
    return config;
  },
};

module.exports = nextConfig; 