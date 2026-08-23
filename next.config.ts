import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pub-034b5a34c49448b3af55d494308bdcdb.r2.dev",
      }
    ]
  },
  outputFileTracingIncludes: {
    "/*": ["./lib/generated/prisma/**/*"],
  }
};

export default nextConfig;
