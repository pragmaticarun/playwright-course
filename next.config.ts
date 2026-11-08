import type { NextConfig } from "next";

const raw = process.env.BASE_PATH || "";
const basePath = raw && raw !== "/" ? (raw.startsWith("/") ? raw.replace(/\/$/, "") : `/${raw}`) : "";

const nextConfig: NextConfig = {
  output: process.env.NODE_ENV === "production" ? "export" : undefined,
  trailingSlash: true,
  images: { unoptimized: true },
  allowedDevOrigins: ["127.0.0.1"],
  devIndicators: false,
  ...(basePath ? { basePath } : {}),
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
