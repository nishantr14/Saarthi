/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output produces a minimal self-contained server for Cloud Run.
  output: "standalone",
  reactStrictMode: true,
};

module.exports = nextConfig;
