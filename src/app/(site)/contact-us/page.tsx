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
import PageHero from "@/components/PageHero";
import ContactForm from "@/components/ContactForm";
import {
  IconMapMarker,
  IconPhone,
  IconEnvelope,
  IconArrowRight,
} from "@/components/icons";

export const metadata: Metadata = {
  title: "Contact Us — WAMARK Nigeria Limited",
  description:
    "Contact WAMARK Nigeria Limited — Plot 1909, Cadastral Zone E27, Apo Resettlement, Abuja-FCT. Call +234 803 7650 357 or email info@wamarkng.com.",
};

export default function ContactPage() {
  return (
    <main>
      <PageHero title="Contact Us" crumb="Contact Us" />

      <section className="section">
        <div className="container contact-page-grid">
          {/* -------- Form -------- */}
          <div className="contact-form-card">
            <span className="form-tag">Drop Us A Line</span>
            <h2>Send Your Message</h2>
            <p className="form-note">
              Fill the form below and our team will get back to you shortly.
            </p>
            <ContactForm />
          </div>

          {/* -------- Info cards -------- */}
          <div className="info-cards">
            <div className="info-card">
              <span className="info-card-icon">
                <IconMapMarker />
              </span>
              <div>
                <small>Our Location</small>
                <strong>
                  Head Office: Plot 1909, Cadastral Zone E27, Apo Resettlement,
                  Abuja- FCT, Nigeria.
                </strong>
                <a
                  href="https://www.google.com/maps/search/?api=1&query=Plot+1909+Cadastral+Zone+E27+Apo+Resettlement+Abuja"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Get Direction →
                </a>
              </div>
            </div>

            <div className="info-card">
              <span className="info-card-icon">
                <IconPhone />
              </span>
              <div>
                <small>Phone Number</small>
                <a href="tel:+2348037650357">
                  <strong>+234 803 7650 357</strong>
                </a>
                <a href="tel:+2348186318527">
                  <strong>+234 818 6318 527</strong>
                </a>
                <a href="tel:+2346037017392">
                  <strong>+234 603 7017 392</strong>
                </a>
              </div>
            </div>

            <div className="info-card">
              <span className="info-card-icon">
                <IconEnvelope />
              </span>
              <div>
                <small>Email Address</small>
                <a href="mailto:info@wamarkng.com">
                  <strong>info@wamarkng.com</strong>
                </a>
              </div>
            </div>
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
          <a className="btn btn-outline" href="tel:+2348037650357">
            Call Us Now <IconArrowRight />
          </a>
        </div>
      </section>
    </main>
  );
}
