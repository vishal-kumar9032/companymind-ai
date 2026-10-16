import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["falkordb", "@redis/client", "redis"],
};

export default nextConfig;
