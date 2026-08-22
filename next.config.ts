import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@interledger/open-payments"],
  // Vercel's serverless file-tracing can't detect that this package reads
  // its .yaml spec files at runtime (fs.readFileSync, not a static import),
  // so it doesn't include them in the deployed function by default. This
  // forces them in explicitly for the routes that need them.
  outputFileTracingIncludes: {
    "/api/ilp/initiate": ["./node_modules/@interledger/open-payments/dist/openapi/specs/**/*"],
    "/api/ilp/complete": ["./node_modules/@interledger/open-payments/dist/openapi/specs/**/*"],
  },
};

export default nextConfig;
