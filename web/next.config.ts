import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export. The site has no server-side needs, so this keeps the same
  // deploy model as before: Netlify serves plain files, nothing to run.
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
