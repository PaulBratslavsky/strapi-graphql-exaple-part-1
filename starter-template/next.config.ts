import type { NextConfig } from "next";

// Tell Turbopack that this directory is the workspace root. Without this,
// Next.js picks the repo-level package-lock.json (which locks `concurrently`
// for the monorepo's dev script) and fails to resolve dependencies like
// tailwindcss that are installed in frontend/node_modules.
const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
