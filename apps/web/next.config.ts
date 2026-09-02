import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@driving-test-app/shared"],
  output: "standalone",
  images: {
    qualities: [75, 85, 92],
  },
};

export default nextConfig;
