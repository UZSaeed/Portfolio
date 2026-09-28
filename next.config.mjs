/** @type {import('next').NextConfig} */

// EasyAllen is a static app in public/easyallen, reachable at
// uzsaeed.com/easyallen. The easyallen.uzsaeed.com subdomain serves the same
// files from the site root; that mapping lives in middleware.ts.
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      { source: "/brainbird", destination: "/brainbird/index.html" },
      { source: "/thelongroad", destination: "/thelongroad/index.html" },
    ];
  },
  async redirects() {
    // EasyAllen loads its scripts with relative paths, so the browser needs a
    // URL that ends inside the folder.
    return [{ source: "/easyallen", destination: "/easyallen/index.html", permanent: false }];
  },
};

export default nextConfig;
