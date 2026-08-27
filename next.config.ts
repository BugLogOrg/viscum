import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/me", destination: "/dashboard", permanent: false },
      { source: "/me/:path*", destination: "/dashboard/:path*", permanent: false },
    ];
  },
  async headers() {
    const ogCache = [
      {
        key: "Cache-Control",
        value: "public, s-maxage=86400, stale-while-revalidate=604800",
      },
      {
        key: "CDN-Cache-Control",
        value: "public, s-maxage=86400, stale-while-revalidate=604800",
      },
    ];
    const thumbCache = [
      {
        key: "Cache-Control",
        value: "public, max-age=31536000, immutable",
      },
      {
        key: "CDN-Cache-Control",
        value: "public, s-maxage=31536000",
      },
    ];
    return [
      { source: "/opengraph-image", headers: ogCache },
      { source: "/w/:id/opengraph-image", headers: ogCache },
      { source: "/thumbs/:path*", headers: thumbCache },
    ];
  },
};

export default nextConfig;
