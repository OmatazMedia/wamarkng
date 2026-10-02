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
 * Public site chrome: topbar + navbar + footer around the six static
 * pages. The login page is intentionally bare (no navbar/footer) and the
 * dashboard has its own shell — handled by the root layout + route groups.
 */

import type { ReactNode } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Preloader from "@/components/Preloader";

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Preloader />
      <Header />
      {children}
      <Footer />
    </>
  );
}
