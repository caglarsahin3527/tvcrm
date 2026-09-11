import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: [
        'localhost:3000',
        '127.0.0.1:3000',
        '192.168.1.42:3000',
        '192.168.1.42',
        '192.168.1.*',
        '192.168.*',
        '*',
      ],
    },
  },
};

export default nextConfig;
