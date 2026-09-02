import type { NextConfig } from "next";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8001/api/v1";

const nextConfig: NextConfig = {
  transpilePackages: ["@driving-test-app/shared"],
  output: "standalone",
  images: {
    qualities: [75, 85, 92],
  },
  // The API server's CORS policy only allows its own origin, so browser calls straight to
  // NEXT_PUBLIC_API_URL from the app's origin are blocked. Client-side requests go to this
  // same-origin path instead (see lib/api.ts), and Next proxies them to the real API from the
  // server, where CORS doesn't apply.
  async rewrites() {
    // MUST be `beforeFiles`: the app has a top-level `[state]/[test-slug]` dynamic route that would
    // otherwise match `/backend-api/<path>` first and 404 it, since default rewrites run *after*
    // filesystem routes. `beforeFiles` proxies the API call before any page route can swallow it.
    return {
      beforeFiles: [
        {
          source: "/backend-api/:path*",
          destination: `${API_URL}/:path*`,
        },
      ],
    };
  },
};

export default nextConfig;
