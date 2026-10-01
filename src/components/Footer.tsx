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

import Link from "next/link";
import {
  IconFacebook,
  IconXTwitter,
  IconInstagram,
  IconChevronRight,
} from "./icons";

const serviceLinks = [
  "Technical Surveillance & Countermeasures",
  "Oil & Gas Services",
  "Access Control & Security Systems",
  "Fire & Safety Systems",
  "Cybersecurity Training",
  "Corporate Security Planning",
];

const usefulLinks = [
  "Support",
  "Privacy Policy",
  "Terms Of Use",
  "Site Map",
  "Expert Testimony",
];

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/wamark-logo-white.webp" alt="WAMARK Nigeria Limited" />
            <p>
              Nigeria Limited is a foremost company which specializes in Oil and
              Gas Services, Corporate Security Intelligence Operations and
              Training.
            </p>
            <div className="footer-socials">
              <a href="#" aria-label="Facebook">
                <IconFacebook />
              </a>
              <a href="#" aria-label="X (Twitter)">
                <IconXTwitter />
              </a>
              <a href="#" aria-label="Instagram">
                <IconInstagram />
              </a>
            </div>
          </div>

          <div>
            <h4>Our Services</h4>
            <ul className="footer-links">
              {serviceLinks.map((s) => (
                <li key={s}>
                  <Link href="/services/">
                    <IconChevronRight />
                    {s}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4>Useful Links</h4>
            <ul className="footer-links">
              {usefulLinks.map((l) => (
                <li key={l}>
                  <Link href="/">
                    <IconChevronRight />
                    {l}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="footer-sub">
            <h4>Subscribe Us</h4>
            <p>
              Do you want to get the information about our Latest News &amp;
              Updates without delay? Subscribe to our Newsletter and get in
              touch with us.
            </p>
            <form className="footer-form" action="#">
              <input
                type="email"
                name="email"
                placeholder="Email Address"
                aria-label="Email Address"
                required
              />
              <button type="submit">Sign Up</button>
            </form>
          </div>
        </div>

        <div className="footer-bottom">
          <p>
            Copyright © {new Date().getFullYear()} Wamark Nigeria. Dev by{" "}
            <a
              href="https://www.omatazmedia.com.ng"
              target="_blank"
              rel="noopener noreferrer"
            >
              Omataz Media
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
