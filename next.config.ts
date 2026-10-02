import type { NextConfig } from "next";

/**
 * Built by Omataz Media — Web Development & Design
 * Website   : https://www.omatazmedia.com.ng
 * Email     : hello@omatazmedia.com.ng
 * Phone     : +234 9024599289, +234 7037373304
 * WhatsApp  : https://wa.me/message/M3QUHNVONY6NK1
 * Social    : @omatazmedia — Facebook · Instagram · X · YouTube
 * GitHub    : https://github.com/omatazmedia
 * Contact   : Johnson Toluwani
 *
 * Static export: `npm run build` emits the deployable site into ./out
 * (upload the contents of ./out to the cPanel public_html directory).
 */
const nextConfig: NextConfig = {
  output: "standalone",
  skipTrailingSlashRedirect: true,
  rewrites: async () => [
    {
      source: "/api/index.php",
      destination: "/api",
    },
    {
      source: "/api/install.php",
      destination: "/api/install",
    },
    {
      source: "/api/install/install.php",
      destination: "/api/install",
    },
  ],
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
