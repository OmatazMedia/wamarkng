import type { Metadata } from "next";
import { Fira_Sans, Roboto } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
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

const display = Fira_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const body = Roboto({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-body",
  display: "swap",
});

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

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <meta
          name="generator"
          content="Built by Omataz Media — Web Development & Design | https://www.omatazmedia.com.ng | hello@omatazmedia.com.ng | +234 9024599289, +234 7037373304 | Johnson Toluwani"
        />
        <script dangerouslySetInnerHTML={{ __html: creditScript }} />
      </head>
      <body className={`${display.variable} ${body.variable}`}>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
