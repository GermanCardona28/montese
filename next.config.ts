import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  // Probar desde el celular en desarrollo: IP del PC en la red Wi-Fi y túneles HTTPS (cloudflared).
  allowedDevOrigins: ["192.168.1.5", "10.153.58.230", "*.trycloudflare.com"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
