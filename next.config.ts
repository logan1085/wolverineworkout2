import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ESLint and TypeScript errors both used to be suppressed here so deploys
  // would never fail. That hid ~50 real type errors, so the checks are back on:
  // a broken build should be caught in CI rather than at runtime in a user's
  // browser.
  reactStrictMode: true,

  // Never leak the framework version in response headers.
  poweredByHeader: false,

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
