import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produces a minimal, self-contained build in .next/standalone —
  // used by the Dockerfile for a small production image.
  output: "standalone",
};

export default nextConfig;
