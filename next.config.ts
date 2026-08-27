import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/me", destination: "/dashboard", permanent: false },
      { source: "/me/:path*", destination: "/dashboard/:path*", permanent: false },
    ];
  },
  async headers() {
    // XクローラはOG画像の取得が遅いとカードを諦める。CDNに長く載せる
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
    return [
      { source: "/opengraph-image", headers: ogCache },
      { source: "/w/:id/opengraph-image", headers: ogCache },
    ];
  },
};

export default nextConfig;
