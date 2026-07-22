import type { NextConfig } from "next";

const cspInlineScriptHash = "'sha256-jzhhfa/YKySB2ZPkQ8cO6mDDtSL/1BxCFk49eLZGkS0='";
const isDev = process.env.NODE_ENV === "development";
const scriptSrc = isDev
  ? "'self' 'unsafe-inline' 'unsafe-eval'"
  : `'self' 'unsafe-eval' ${cspInlineScriptHash} https://va.vercel-scripts.com https://vercel.live https://js.stripe.com`;

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "framer-motion",
      "leaflet",
      "react-leaflet",
      "@supabase/ssr",

      "react-webcam",
    ],
  },
  images: {
    formats: ["image/avif", "image/webp"],
  },
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-XSS-Protection", value: "1; mode=block" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        {
          key: "Content-Security-Policy",
          value: [
            "default-src 'self'",
            `script-src ${scriptSrc}`,
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",
            "img-src 'self' data: blob: https://hqydwwfulatawjpottlf.supabase.co https://*.tile.openstreetmap.org https://*.basemaps.cartocdn.com https://cdn-icons-png.flaticon.com https://unpkg.com",
            "font-src 'self' https://fonts.gstatic.com",
            "connect-src 'self' https://hqydwwfulatawjpottlf.supabase.co wss://hqydwwfulatawjpottlf.supabase.co https://usable-drake-68824.upstash.io https://nominatim.openstreetmap.org https://api.stripe.com",
            "frame-src 'self' https://js.stripe.com",
            "worker-src 'self'",
            "manifest-src 'self'",
            "base-uri 'self'",
            "form-action 'self'",
            "upgrade-insecure-requests",
          ].join("; "),
        },
      ],
    },
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
    "@simplewebauthn/browser",
    "@simplewebauthn/server",
  ],
  async rewrites() {
    return [
      { source: "/sw.js", destination: "/service-worker.js" },
    ];
  },
};

export default nextConfig;
