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
import { IconArrowRight } from "@/components/icons";

export const metadata: Metadata = {
  title: "Services — WAMARK Nigeria Limited",
  description:
    "Technical surveillance & countermeasures, oil & gas services, security systems installation, fire & safety, cybersecurity and corporate security planning.",
};

export default function ServicesPage() {
  return (
    <main>
      <PageHero title="Services" crumb="Services" />

      <section className="section services-section">
        <div className="container">
          <span className="sec-tag">What We Do</span>
          <h2 className="sec-title">Our Services</h2>
          <div className="services-grid">
            {services.map((s) => (
              <div className="service-card" key={s.title}>
                <div className="service-thumb">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.image} alt={s.title} />
                </div>
                <span className="service-icon" aria-hidden="true">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.icon} alt="" aria-hidden="true" />
                </span>
                <div className="service-body">
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                  <div className="service-btn-wrap">
                    <Link
                      className="link-more"
                      href={`/contact-us/?service=${encodeURIComponent(s.title)}#contact-form`}
                    >
                      Engage Service <IconArrowRight />
                    </Link>
                  </div>
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
