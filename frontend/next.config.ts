import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https:",
              "style-src 'self' 'unsafe-inline' https:",
              "img-src 'self' data: blob: https: http:",
              "font-src 'self' data: https:",
              "frame-src 'self' blob: data: https: http:",
              "object-src 'self' blob: data: https:",
              "connect-src 'self' https: http: ws: wss:",
              "worker-src 'self' blob:",
              "child-src 'self' blob:",
              "media-src 'self' blob: https:",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
