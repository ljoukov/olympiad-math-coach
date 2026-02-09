/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    // Next ignores route segments that start with "_" in the app router.
    // Firebase Auth helper endpoints must live at "/__/auth/*" and "/__/firebase/*",
    // so we rewrite those public paths to API route handlers that proxy upstream.
    return [
      { source: "/__/auth/:path*", destination: "/api/firebase-auth/:path*" },
      { source: "/__/firebase/:path*", destination: "/api/firebase/:path*" },
    ]
  },
}

export default nextConfig
