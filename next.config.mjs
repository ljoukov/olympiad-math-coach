/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // @spark/llm and @spark/schemas export TS source; Next must transpile them.
  transpilePackages: ["@spark/llm", "@spark/schemas"],
  images: {
    unoptimized: true,
  },
}

export default nextConfig
