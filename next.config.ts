import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Proteccion contra clickjacking
          { key: "X-Frame-Options", value: "DENY" },
          // Evitar MIME sniffing
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Control de referrer
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Solo permitir camara (necesaria para QR scanner)
          { key: "Permissions-Policy", value: "camera=(self)" },
          // Forzar HTTPS en produccion
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        // Hostname especifico del proyecto (no wildcard)
        hostname: "mhewguufhtdinryeukbe.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
