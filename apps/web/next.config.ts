import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@driving-test-app/shared"],
  output: "standalone",
};

export default nextConfig;
