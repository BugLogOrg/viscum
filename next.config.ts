import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/me", destination: "/dashboard", permanent: false },
      { source: "/me/:path*", destination: "/dashboard/:path*", permanent: false },
    ];
  },
};

export default nextConfig;
