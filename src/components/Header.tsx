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

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  IconEnvelope,
  IconPhone,
  IconClock,
  IconFacebook,
  IconXTwitter,
  IconInstagram,
  IconBars,
} from "./icons";

export default function Header() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const close = () => setOpen(false);
    window.addEventListener("resize", close);
    return () => window.removeEventListener("resize", close);
  }, []);

  return (
    <>
      {/* ---- Topbar ---- */}
      <div className="topbar">
        <div className="container topbar-inner">
          <div className="topbar-left">
            <div className="topbar-item">
              <span className="topbar-icon">
                <IconEnvelope />
              </span>
              <div>
                <small>For any enquiry:</small>
                <a href="mailto:info@wamarkng.com">info@wamarkng.com</a>
              </div>
            </div>
            <div className="topbar-item">
              <span className="topbar-icon">
                <IconPhone />
              </span>
              <div>
                <small>Have any question?</small>
                <a href="tel:+2348037650357">+234 803 7650 357</a>
              </div>
            </div>
          </div>
          <div className="topbar-right">
            <span className="topbar-hours">Mon to Fri: 09:00AM - 05:00PM</span>
            <Link className="btn btn-green" href="/contact-us/">
              Contact Us
            </Link>
            <div className="topbar-socials">
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
        </div>
      </div>

      {/* ---- Navbar ---- */}
      <header className="header">
        <div className="container nav">
          <Link href="/" className="brand" aria-label="WAMARK Nigeria Limited">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/wamark-logo-white.webp" alt="WAMARK Nigeria Limited" />
          </Link>

          <ul className={`nav-links${open ? " open" : ""}`}>
            <li>
              <Link href="/">Home</Link>
            </li>
            <li>
              <Link href="/about-us/">About</Link>
            </li>
            <li>
              <Link href="/services/">Services</Link>
            </li>
            <li>
              <Link href="/projects/">Projects</Link>
            </li>
            <li>
              <Link href="/contact-us/">Contact Us</Link>
            </li>
            <li>
              <Link className="nav-cta" href="/contact-us/">
                Contact Us
              </Link>
            </li>
          </ul>

          <button
            className="nav-toggle"
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <IconBars />
          </button>
        </div>
      </header>
    </>
  );
}
