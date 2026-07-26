import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "framer-motion",
      "leaflet",
      "react-leaflet",
      "@supabase/ssr",
    ],
  },
  images: {
    formats: ["image/avif", "image/webp"],
  },
  headers: async () => [
    {
      source: "/service-worker.js",
      headers: [
        { key: "Service-Worker-Allowed", value: "/" },
        { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
      ],
    },
  ],
  transpilePackages: [
    "lucide-react",
    "framer-motion",
    "leaflet",
    "react-leaflet",
  ],
  async rewrites() {
    return [];
  },
};

export default nextConfig;
