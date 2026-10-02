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
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  IconEnvelope,
  IconPhone,
  IconFacebook,
  IconXTwitter,
  IconInstagram,
  IconBars,
} from "./icons";

export default function Header() {
  const [open, setOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  const isHome = pathname === "/" || pathname === "";
  const isAbout =
    pathname?.startsWith("/about-us") || pathname?.startsWith("/management");
  const isServices = pathname?.startsWith("/services");
  const isProjects = pathname?.startsWith("/projects");
  const isContact = pathname?.startsWith("/contact-us");

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 25);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const close = () => {
      setOpen(false);
      setAboutOpen(false);
    };
    window.addEventListener("resize", close);
    return () => window.removeEventListener("resize", close);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setOpen(false);
    setAboutOpen(false);
  }, [pathname]);

  return (
    <div
      className={`header-wrapper ${
        scrolled ? "header-scrolled" : "header-transparent"
      } ${!isHome ? "header-inner-page" : ""}`}
    >
      {/* ---- Topbar only on Homepage (Hides on Scroll) ---- */}
      {isHome && (
        <div className={`topbar-glass ${scrolled ? "topbar-hidden" : ""}`}>
          <div className="topbar-inner">
            {/* Left: Two Glassmorphic Cards */}
            <div className="topbar-left">
              <a
                href="mailto:info@wamarkng.com"
                className="glass-pill-card"
                title="Send email to info@wamarkng.com"
              >
                <span className="glass-pill-icon">
                  <IconEnvelope />
                </span>
                <div className="glass-pill-text">
                  <small>For any enquiry:</small>
                  <strong>info@wamarkng.com</strong>
                </div>
              </a>

              <a
                href="tel:+2348037650357"
                className="glass-pill-card"
                title="Call +234 803 7650 357"
              >
                <span className="glass-pill-icon">
                  <IconPhone />
                </span>
                <div className="glass-pill-text">
                  <small>Have any question?</small>
                  <strong>+234 803 7650 357</strong>
                </div>
              </a>
            </div>

            {/* Right: Working hours & Contact Us button */}
            <div className="topbar-right">
              <span className="topbar-hours">Mon to Fri: 09:00AM - 05:00PM</span>
              <Link className="topbar-btn-contact" href="/contact-us/">
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ---- Main Navbar ---- */}
      <header className="navbar-glass">
        <div className="navbar-inner">
          {/* Brand Logo */}
          <Link href="/" className="brand" aria-label="WAMARK Nigeria Limited">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/wamark-logo-white.webp"
              alt="WAMARK Nigeria Limited"
              className="brand-logo"
            />
          </Link>

          {/* Nav links & Socials on the right */}
          <div className="navbar-right-group">
            <ul className={`nav-links${open ? " open" : ""}`}>
              <li>
                <Link
                  href="/"
                  className={isHome ? "nav-link active" : "nav-link"}
                >
                  Home
                </Link>
              </li>

              <li
                className={`nav-has-drop${aboutOpen ? " drop-open" : ""}`}
                onMouseEnter={() => setAboutOpen(true)}
                onMouseLeave={() => setAboutOpen(false)}
              >
                <button
                  type="button"
                  className={`nav-link nav-drop-btn ${isAbout ? "active" : ""}`}
                  aria-haspopup="true"
                  aria-expanded={aboutOpen}
                  onClick={() => setAboutOpen((v) => !v)}
                >
                  About
                  <svg
                    className="nav-caret"
                    width="10"
                    height="6"
                    viewBox="0 0 10 6"
                    aria-hidden="true"
                  >
                    <path
                      d="M1 1l4 4 4-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
                <ul className="nav-drop">
                  <li>
                    <Link href="/about-us/" onClick={() => setAboutOpen(false)}>
                      About Wamarkng
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/management/"
                      onClick={() => setAboutOpen(false)}
                    >
                      Our Management
                    </Link>
                  </li>
                </ul>
              </li>

              <li>
                <Link
                  href="/services/"
                  className={isServices ? "nav-link active" : "nav-link"}
                >
                  Services
                </Link>
              </li>

              <li>
                <Link
                  href="/projects/"
                  className={isProjects ? "nav-link active" : "nav-link"}
                >
                  Projects
                </Link>
              </li>

              <li>
                <Link
                  href="/contact-us/"
                  className={isContact ? "nav-link active" : "nav-link"}
                >
                  Contact Us
                </Link>
              </li>

              {/* Mobile CTA inside menu */}
              <li className="mobile-only-item">
                <Link
                  className="mobile-cta-btn"
                  href="/contact-us/"
                  onClick={() => setOpen(false)}
                >
                  Contact Us
                </Link>
              </li>
            </ul>

            {/* Social media icons (Facebook, Instagram, X) beside links */}
            <div className="navbar-socials">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="social-circle-btn"
              >
                <IconFacebook />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="social-circle-btn"
              >
                <IconInstagram />
              </a>
              <a
                href="https://x.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="X (Twitter)"
                className="social-circle-btn"
              >
                <IconXTwitter />
              </a>
            </div>

            {/* Mobile hamburger button */}
            <button
              className="nav-toggle"
              aria-label="Toggle menu"
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
            >
              <IconBars />
            </button>
          </div>
        </div>
      </header>
    </div>
  );
}
