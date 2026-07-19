/** @type {import('next').NextConfig} */
const nextConfig = {
  // Railway deployment — standalone output
  output: "standalone",
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  },
};

module.exports = nextConfig;
