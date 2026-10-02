import type { Metadata } from "next";
import "./globals.css";

/**
 * Built by Omataz Media — Web Development & Design
 * Website   : https://www.omatazmedia.com.ng
 * Email     : hello@omatazmedia.com.ng
 * Phone     : +234 9024599289, +234 7037373304
 * WhatsApp  : https://wa.me/message/M3QUHNVONY6NK1
 * Social    : @omatazmedia — Facebook · Instagram · X · YouTube
 * GitHub    : https://github.com/omatazmedia
 * Contact   : Johnson Toluwani
 */

export const metadata: Metadata = {
  title: "WAMARK Nigeria Limited — Security, Surveillance & Oil & Gas Services",
  description:
    "WAMARK Nigeria Limited provides cutting-edge security systems, technical surveillance countermeasures, and oil & gas services to corporations, VIPs, and government agencies across Nigeria.",
  icons: { icon: "/images/favicon.webp" },
  openGraph: {
    title: "WAMARK Nigeria Limited",
    description:
      "Advanced Security Systems — CCTV, access control, technical surveillance countermeasures and Oil & Gas services.",
    type: "website",
  },
};

const omatazCredit = [
  "%cOmataz Media — Web Development & Design",
  "Website   : https://www.omatazmedia.com.ng",
  "Email     : hello@omatazmedia.com.ng",
  "Phone     : +234 9024599289, +234 7037373304",
  "WhatsApp  : https://wa.me/message/M3QUHNVONY6NK1",
  "Social    : @omatazmedia — Facebook · Instagram · X · YouTube",
  "GitHub    : https://github.com/omatazmedia",
  "Contact   : Johnson Toluwani",
].join("\n");

const creditScript = `(function(){console.log(${JSON.stringify(
  omatazCredit
)}, "color:#57b960;font-weight:bold;font-size:14px");console.log("%cWebsite built by Omataz Media — https://www.omatazmedia.com.ng","color:#57b960");})();`;

const fetchPolyfillScript = `(function(){try{var _f=window.fetch;Object.defineProperty(window,'fetch',{get:function(){return _f;},set:function(v){_f=v;},configurable:true,enumerable:true});}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta
          name="generator"
          content="Built by Omataz Media — Web Development & Design | https://www.omatazmedia.com.ng | hello@omatazmedia.com.ng | +234 9024599289, +234 7037373304 | Johnson Toluwani"
        />
        <script dangerouslySetInnerHTML={{ __html: fetchPolyfillScript }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Fira+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400;1,600&family=Roboto:wght@300;400;500;700;900&display=swap"
          rel="stylesheet"
        />
        <script dangerouslySetInnerHTML={{ __html: creditScript }} />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
