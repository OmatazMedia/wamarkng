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
import { services } from "@/lib/data";

export const metadata: Metadata = {
  title: "Services — WAMARK Nigeria Limited",
  description:
    "Technical surveillance & countermeasures, oil & gas services, security systems installation, fire & safety, cybersecurity and corporate security planning.",
};

const servicePages: Record<string, string> = {
  "Technical Surveillance & Countermeasures": "/contact-us/",
  "Oil & Gas Services": "/contact-us/",
  "Security Systems Installation": "/contact-us/",
  "Fire & Safety Systems": "/contact-us/",
  "Cybersecurity Services": "/contact-us/",
  "Corporate Security Planning": "/contact-us/",
};

export default function ServicesPage() {
  return (
    <main>
      <PageHero title="Services" crumb="Services" />

      <section className="section">
        <div className="container">
          <span className="sec-tag">What We Do</span>
          <h2 className="sec-title">Our Services</h2>
          <div className="services-grid">
            {services.map((s) => (
              <div className="service-card" key={s.title}>
                <div className="service-thumb">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.image} alt={s.title} />
                  <span className="service-icon">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={s.icon} alt="" aria-hidden="true" />
                  </span>
                </div>
                <div className="service-body">
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                  <Link className="link-more" href={servicePages[s.title] ?? "/contact-us/"}>
                    Read More <svg viewBox="0 0 512 512" fill="currentColor" width="17" height="17" aria-hidden="true"><path d="M256 8c137 0 248 111 248 248S393 504 256 504 8 393 8 256 119 8 256 8zm-28.9 143.6l75.5 72.4H120c-13.3 0-24 10.7-24 24v16c0 13.3 10.7 24 24 24h182.6l-75.5 72.4c-9.7 9.3-9.9 24.8-.4 34.3l11 10.9c9.4 9.4 24.6 9.4 33.9 0L404.3 273c9.4-9.4 9.4-24.6 0-33.9L271.6 106.3c-9.4-9.4-24.6-9.4-33.9 0l-11 10.9c-9.5 9.6-9.3 25.1.4 34.4z" /></svg>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* -------- CTA -------- */}
      <section className="cta">
        <div className="container cta-inner">
          <h2>
            Looking for a trusted partner in Security Installations or Oil
            &amp; Gas? Contact WAMARK today
          </h2>
          <Link className="btn btn-outline" href="/contact-us/">
            Get Started
          </Link>
        </div>
      </section>
    </main>
  );
}
