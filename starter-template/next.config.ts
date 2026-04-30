import type { NextConfig } from "next";

// Tell Turbopack that this directory is the workspace root. Without this,
// Next.js picks the repo-level package-lock.json (which locks `concurrently`
// for the monorepo's dev script) and fails to resolve dependencies like
// tailwindcss that are installed in frontend/node_modules.
const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },

  // Server Actions are origin-locked by default. The dev server allows
  // localhost out of the box, so loading the app at http://localhost:3000
  // works without any extra config.
  //
  // If you load the app at any other origin (your LAN IP for testing on a
  // phone, a Codespaces preview URL, an ngrok tunnel, etc.), Server Actions
  // will silently no-op when called from that origin. Symptom: click a Pin
  // or Archive button and nothing happens — no network call, no console
  // error. Add the extra origin(s) to the list below to fix it.
  experimental: {
    serverActions: {
      allowedOrigins: [
        "localhost:3000",
        // "192.168.1.42:3000",   // example LAN IP, replace with yours
        // "<your-tunnel>.ngrok-free.app",
      ],
    },
  },
};

export default nextConfig;
