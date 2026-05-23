/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      { source: "/brainbird", destination: "/brainbird/index.html" },
      { source: "/thelongroad", destination: "/thelongroad/index.html" },
    ];
  },
};

export default nextConfig;
