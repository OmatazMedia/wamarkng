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
import {
  IconArrowRight,
  IconCheckSquare,
  IconMapMarker,
  IconHeadset,
} from "@/components/icons";

export const metadata: Metadata = {
  title: "About Us — WAMARK Nigeria Limited",
  description:
    "WAMARK Nigeria Limited specializes in Corporate Security Intelligence Operations, Oil and Gas Services and Training since 2017.",
};

const offers = [
  {
    icon: "/images/icons/svg-33.svg",
    title: (
      <>
        Security
        <br />
        Systems
      </>
    ),
  },
  {
    icon: "/images/icons/svg-36.svg",
    title: (
      <>
        Technical
        <br />
        Surveillance
      </>
    ),
  },
  {
    icon: "/images/icons/svg-39.svg",
    title: (
      <>
        Oil &amp; Gas
        <br />
        Solutions
      </>
    ),
  },
];

const whyUs = [
  {
    icon: "/images/icons/svg-36.svg",
    title: (
      <>
        Advanced Security &amp;
        <br />
        Surveillance Solutions
      </>
    ),
    text: "Cutting-edge technical surveillance, countermeasures, and security equipment supply for corporations, VIPs, and government agencies.",
  },
  {
    icon: "/images/icons/svg-47.svg",
    title: (
      <>
        Professional Team
        <br />
        &amp; Reliable Delivery
      </>
    ),
    text: "Experienced engineers and security intelligence professionals with a track record of successful projects for government agnecies NNPC, NPDC, and top institutions.",
  },
  {
    icon: "/images/icons/svg-39.svg",
    title: (
      <>
        Integrated Oil
        <br />
        &amp; Gas Expertise
      </>
    ),
    text: "Proven capacity in pipeline maintenance, plant installations, and flow measurement technology. Oil and Gas Measurement/Equipment",
  },
];

const personel = [
  {
    name: "Gabriel Momoh",
    role: "Project Manager",
    photo: "/images/team-gabriel-momoh.webp",
  },
  {
    name: "Babajide Hammed",
    role: "Operations Manager",
    photo: "/images/team-babajide-hammed.webp",
  },
];

export default function AboutPage() {
  return (
    <main>
      <PageHero title="About Us" crumb="About Us" />

      {/* -------- Company overview -------- */}
      <section className="section">
        <div className="container overview-grid">
          <div className="about-collage">
            <div className="about-left">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/cctv.webp" alt="CCTV installation" />
              <div className="about-badge">
                We&apos;re Trusted by More than 100 Clients.
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/oilgas.webp"
                alt="Oil & Gas plant maintenance"
                style={{ flex: 1.4, minHeight: 0, objectFit: "cover" }}
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/imsi-catcher-system.webp"
                alt="Surveillance mast"
                style={{ flex: 1, minHeight: 0, objectFit: "cover" }}
              />
            </div>
          </div>

          <div className="overview-text">
            <span className="about-tag">Company Overview</span>
            <h1>Wamark Nigeria Limited</h1>
            <p>
              WAMARK Nigeria Limited is a foremost company which specializes in{" "}
              <strong>
                Corporate Security Intelligence Operations,Oil and Gas Services
                and Training
              </strong>
              . WAMARK Nigeria was set up with the objective of the provision of
              highly specialized{" "}
              <strong>
                Mechanical Installation and Services, Pipeline Security and
                Surveillance, Pipeline Maintenance, Technical Surveillance
                Countermeasures (TSCM), Supply and Installation of Security
                Equipment for Multinational Corporations, VIPs and Government
                Agencies and Oil and Gas Installation and Maintenance
              </strong>
              .
            </p>
            <p>
              WAMARK Nigeria Limited was established in <strong>2017</strong>.
              It has in its pool a team of experienced engineers, Project
              Managers and retired security intelligence operatives, with
              special training on sophisticated equipment installation, flow
              measurement technology and usage of security equipment
            </p>
            <p>
              The company also partners with{" "}
              <strong>local and internationally renowned companies</strong>{" "}
              that deal with mechanical engineering projects, flow station
              general maintenance and security equipment.
            </p>
          </div>
        </div>
      </section>

      {/* -------- Mission / Vision band -------- */}
      <section className="mv-band">
        <div className="container mv-band-grid">
          <div className="mv-band-card">
            <span className="mv-band-icon">
              <IconCheckSquare />
            </span>
            <div>
              <h3>Our Mission</h3>
              <p>
                Our mission is to deliver world-class security surveillance
                systems, cutting-edge technical solutions, and oil &amp; gas
                services through a team of experienced professionals—ensuring
                safety, efficiency, and long-term value for our clients.
              </p>
            </div>
          </div>
          <div className="mv-band-card">
            <span className="mv-band-icon">
              <IconCheckSquare />
            </span>
            <div>
              <h3>Our Vision</h3>
              <p>
                To be a leading provider of innovative Security, Technical
                solutions and Oil &amp; Gas sector in Africa, trusted for
                excellence, reliability, and sustainable impact.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* -------- Services & Solutions -------- */}
      <section className="section">
        <div className="container">
          <span className="sec-tag">What We Offer</span>
          <h2 className="sec-title">Services &amp; Solutions</h2>
          <div className="icon-cards">
            {offers.map((o, i) => (
              <div className="icon-card" key={i}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={o.icon} alt="" aria-hidden="true" />
                <h3>{o.title}</h3>
                <Link className="btn-box" href="/services/">
                  Learn More <IconArrowRight />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* -------- Why Choose Us -------- */}
      <section className="offers section">
        <div className="container">
          <span className="sec-tag">Proven Track Records</span>
          <h2 className="sec-title">Why Choose Us</h2>
          <div className="offers-grid">
            {whyUs.map((w, i) => (
              <div className="offer" key={i}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={w.icon} alt="" aria-hidden="true" />
                <h3>{w.title}</h3>
                <p>{w.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* -------- Key Personels -------- */}
      <section className="section">
        <div className="container">
          <span className="sec-tag">Professional Team</span>
          <h2 className="sec-title">Key Personels</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 26,
              maxWidth: 860,
              margin: "46px auto 0",
            }}
          >
            {personel.map((p) => (
              <div className="team-card" key={p.name}>
                <div className="team-photo">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.photo} alt={p.name} />
                </div>
                <div className="team-body">
                  <h3>{p.name}</h3>
                  <span>{p.role}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* -------- Clients -------- */}
      <section className="clients">
        <div className="container">
          <span className="sec-tag">They Trusted Us</span>
          <h2 className="sec-title">Our clients</h2>
          <div className="clients-grid">
            {[
              { src: "/images/azura-power.webp", alt: "Azura Power" },
              { src: "/images/rivers-state-gov-t.webp", alt: "Rivers State Government" },
              { src: "/images/taraba-gov-t.webp", alt: "Taraba State Government" },
              { src: "/images/sokoto-govt.webp", alt: "Government of Sokoto State" },
            ].map((c) => (
              <div className="client-box" key={c.alt}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.src} alt={c.alt} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* -------- CTA -------- */}
      <section className="cta">
        <div className="container cta-inner">
          <h2>
            Partner with WAMARK for reliable Oil &amp; Gas and Security
            Solutions.
          </h2>
          <Link className="btn btn-outline" href="/contact-us/">
            Get Started
          </Link>
        </div>
      </section>

      {/* -------- Contact bar -------- */}
      <section className="contact-bar">
        <div className="container">
          <div className="contact-card">
            <div className="contact-info">
              <span className="contact-info-icon">
                <IconMapMarker />
              </span>
              <div>
                <small>Location</small>
                <strong>
                  Plot 1909, Cadastral Zone E27, Apo Resettlement, Abuja-FCT,
                  Nigeria.
                </strong>
              </div>
            </div>
            <div className="contact-info">
              <span className="contact-info-icon">
                <IconHeadset />
              </span>
              <div>
                <small>Call Us</small>
                <strong>+2348037650357, +2348186318527</strong>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
