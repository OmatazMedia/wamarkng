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

import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/PageHero";

export const metadata: Metadata = {
  title: "Projects — WAMARK Nigeria Limited",
  description:
    "A selection of WAMARK security, surveillance and oil & gas projects across Nigeria.",
};

const projects = [
  { src: "/images/project-3.webp", cap: "Pipeline Maintenance" },
  { src: "/images/project-0011-1.webp", cap: "Flow Station Maintenance" },
  { src: "/images/project-0052.webp", cap: "Security Equipment Installation" },
  { src: "/images/project-0056.webp", cap: "CCTV Surveillance Rollout" },
  { src: "/images/project-at-12-07-55_f4d81555.webp", cap: "Technical Surveillance Countermeasures" },
  { src: "/images/project-0005.webp", cap: "Oil & Gas Measurement" },
  { src: "/images/cctv.webp", cap: "Access Control System" },
  { src: "/images/oilgas.webp", cap: "Plant Installation" },
  { src: "/images/vehicle-tracking.webp", cap: "Vehicle Tracking Deployment" },
];

export default function ProjectsPage() {
  return (
    <main>
      <PageHero title="Projects" crumb="Projects" />

      <section className="section">
        <div className="container">
          <span className="sec-tag">Wamark Projects</span>
          <h2 className="sec-title">Our Projects</h2>
          <div className="gallery-grid">
            {projects.map((p) => (
              <Link
                className="gallery-item"
                href="/contact-us/"
                key={p.src}
                aria-label={p.cap}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.src} alt={p.cap} />
                <span className="gallery-cap">{p.cap}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* -------- CTA -------- */}
      <section className="cta">
        <div className="container cta-inner">
          <h2>
            Let&apos;s secure your future with trusted Oil &amp; Gas and
            Surveillance solutions.
          </h2>
          <Link className="btn btn-outline" href="/contact-us/">
            Contact Us
          </Link>
        </div>
      </section>
    </main>
  );
}
