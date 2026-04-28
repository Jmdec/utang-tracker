import type { NextConfig } from "next";
import withPWA from "@ducanh2912/next-pwa";

const nextConfig: NextConfig = {
  turbopack: {},
};

export default withPWA({
  dest: "public",
  register: true,
  disable: false,
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  workboxOptions: {
    skipWaiting: true,
    clientsClaim: true,
    // Explicitly exclude your logo from SW cache interference
    exclude: [/tracker-logo\.png$/],
  },
})(nextConfig);
