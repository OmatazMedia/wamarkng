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
  title: "Management — WAMARK Nigeria Limited",
  description:
    "Meet the leadership team driving growth, innovation and operational excellence at WAMARK Nigeria Limited.",
};

const leaders = [
  {
    title: "Chief Executive Officer (CEO)",
    text: "Provides strategic direction and oversight, driving innovation and growth across our core areas. Our CEO brings extensive experience in leadership and innovation, guiding our team towards achieving exceptional results.",
    name: "Engr Markson Ogbeide",
    tag: "CEO",
  },
  {
    title: "Chief Operations Officer (COO)",
    text: "Oversees day-to-day operations, ensuring seamless delivery of services in security, surveillance, and oil and gas. Our COO is responsible for implementing operational strategies that drive efficiency and effectiveness.",
    name: "Wasiu Agbaje",
    tag: "COO",
  },
  {
    title: "Project Manager",
    text: "Leads project planning and execution, ensuring timely and effective delivery of projects in our core areas. Our Project Manager is skilled in managing complex projects, ensuring client satisfaction and operational excellence.",
    name: "Gabriel Momoh",
    tag: "Project Manager",
    photo: "/images/team-gabriel-momoh.webp",
  },
  {
    title: "Operations Manager",
    text: "Manages and optimizes business operations, prioritizing client satisfaction and operational excellence. Our Operations Manager is responsible for streamlining processes, reducing costs, and improving overall efficiency.",
    name: "Babajide Hammed",
    tag: "Operations Manager",
    photo: "/images/team-babajide-hammed.webp",
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
];

export default function ManagementPage() {
  return (
    <main>
      <PageHero title="Management" crumb="Our Managment" />

      {/* -------- Intro -------- */}
      <section className="section">
        <div className="container" style={{ maxWidth: 900, textAlign: "center" }}>
          <span className="sec-tag">Our Management</span>
          <h2 className="sec-title">Meet Our Management</h2>
          <p style={{ marginTop: 28, color: "#475467", fontSize: 16 }}>
            At Wamark Nigeria Limited, we pride ourselves on our team&apos;s
            expertise and commitment to delivering innovative solutions in
            security, strategic technical surveillance systems, oil and gas,
            and more. Our leadership team is dedicated to driving growth,
            innovation, and operational excellence, ensuring our clients
            receive top-notch services.
          </p>
        </div>
      </section>

      {/* -------- Leadership team -------- */}
      <section style={{ paddingBottom: 90 }}>
        <div className="container">
          <span className="sec-tag">Leadership</span>
          <h2 className="sec-title">Our Leadership Team</h2>
          <div className="leaders-grid">
            {leaders.map((l) => (
              <article className="leader-card" key={l.name}>
                {l.photo ? (
                  <div className="leader-photo">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={l.photo} alt={l.name} />
                  </div>
                ) : (
                  <div className="leader-photo leader-monogram" aria-hidden="true">
                    <span>
                      {l.name
                        .replace("Engr ", "")
                        .split(" ")
                        .map((w) => w[0])
                        .join("")}
                    </span>
                  </div>
                )}
                <div className="leader-body">
                  <span className="leader-role">{l.title}</span>
                  <h3>{l.name}</h3>
                  <p>{l.text}</p>
                </div>
              </article>
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
            Contact Us
          </Link>
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
    </main>
  );
}
