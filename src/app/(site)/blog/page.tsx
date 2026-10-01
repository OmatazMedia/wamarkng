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
 * Blog — static shell + client-fetched post grid. Posts live in the API
 * database, so publishing from the dashboard is live immediately: no
 * rebuild/re-export of the static site needed.
 */

import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import BlogGrid from "@/components/BlogGrid";

export const metadata: Metadata = {
  title: "Blog — WAMARK Nigeria Limited",
  description:
    "News, security advisories and project updates from WAMARK Nigeria Limited — surveillance, oil & gas and corporate security.",
};

export default function BlogPage() {
  return (
    <main>
      <PageHero title="Blog" crumb="Blog" />
      <BlogGrid />
    </main>
  );
}
