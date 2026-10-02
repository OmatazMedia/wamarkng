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
import { useEffect, useRef, useState } from "react";
import {
  IconFacebook,
  IconXTwitter,
  IconInstagram,
  IconMapMarker,
  IconHeadset,
  IconChevronUp,
  IconWhatsApp,
} from "./icons";

import WhatsAppChatModal from "./WhatsAppChatModal";

const serviceLinks = [
  { label: "Technical Surveillance & Countermeasures", href: "/services/technical-surveillance-countermeasures/" },
  { label: "Oil & Gas Services", href: "/services/oil-gas-services/" },
  { label: "Access Control & Security Systems", href: "/services/security-systems-installation/" },
  { label: "Fire & Safety Systems", href: "/services/" },
  { label: "Cybersecurity Training", href: "/services/" },
  { label: "Corporate Security Planning", href: "/services/" },
];

const usefulLinks = [
  { label: "Support", href: "/contact-us/" },
  { label: "Privacy Policy", href: "/about-us/" },
  { label: "Terms Of Use", href: "/about-us/" },
  { label: "Site Map", href: "/services/" },
  { label: "Expert Testimony", href: "/about-us/" },
];

export default function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [barInView, setBarInView] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);

    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });

    const el = barRef.current;
    if (el) {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            setBarInView(true);
          }
        },
        { threshold: 0.15 }
      );
      observer.observe(el);
      return () => {
        observer.disconnect();
        window.removeEventListener("scroll", handleScroll);
      };
    }

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSubscribe = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail("");
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="footer-container" suppressHydrationWarning>
      {/* Floating Animated Green Contact Bar */}
      <div className="container footer-contact-wrapper" ref={barRef}>
        <div className={`footer-contact-bar ${barInView ? "in-view" : ""}`}>
          {/* Left: Location */}
          <div className="footer-contact-item">
            <span className="footer-contact-icon" aria-hidden="true">
              <IconMapMarker />
            </span>
            <div className="footer-contact-content">
              <h4>Location</h4>
              <p>Plot 1909, Cadastral Zone E27, Apo Resettlement, Abuja-FCT, Nigeria.</p>
            </div>
            {/* Faded background watermark icon */}
            <span className="footer-contact-watermark" aria-hidden="true">
              <IconMapMarker />
            </span>
          </div>

          {/* Center Diagonal Divider Slash */}
          <div className="footer-contact-divider" aria-hidden="true">
            /
          </div>

          {/* Right: Call Us */}
          <div className="footer-contact-item">
            <span className="footer-contact-icon" aria-hidden="true">
              <IconHeadset />
            </span>
            <div className="footer-contact-content">
              <h4>Call Us</h4>
              <p>+2348037650357, +2348186318527</p>
            </div>
            {/* Faded background watermark icon */}
            <span className="footer-contact-watermark" aria-hidden="true">
              <IconHeadset />
            </span>
          </div>
        </div>
      </div>

      {/* Main Footer Body */}
      <div className="footer-main">
        <div className="container">
          <div className="footer-grid">
            {/* Col 1: Brand & Bio */}
            <div className="footer-col footer-brand-col">
              <div className="footer-brand-disc">
                <Link href="/" aria-label="WAMARK Home">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/wamark-logo-white.webp"
                    alt="WAMARK Nigeria Limited"
                    className="footer-logo"
                  />
                </Link>
                <p>
                  Nigeria Limited is a foremost company which specializes in Oil
                  and Gas Services, Corporate Security Intelligence Operations
                  and Training.
                </p>
                <div className="footer-socials-white">
                  <a
                    href="https://facebook.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Facebook"
                    className="social-btn-white"
                  >
                    <IconFacebook />
                  </a>
                  <a
                    href="https://x.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="X (Twitter)"
                    className="social-btn-white"
                  >
                    <IconXTwitter />
                  </a>
                  <a
                    href="https://instagram.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                    className="social-btn-white"
                  >
                    <IconInstagram />
                  </a>
                </div>
              </div>
            </div>

            {/* Col 2: Our Services */}
            <div className="footer-col">
              <h3>Our Services</h3>
              <ul className="footer-chevron-links">
                {serviceLinks.map((s) => (
                  <li key={s.label}>
                    <Link href={s.href}>
                      <span className="link-arrow">&gt;</span>
                      <span>{s.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 3: Useful Links */}
            <div className="footer-col">
              <h3>Useful Links</h3>
              <ul className="footer-chevron-links">
                {usefulLinks.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href}>
                      <span className="link-arrow">&gt;</span>
                      <span>{l.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 4: Subscribe Us */}
            <div className="footer-col footer-sub-col">
              <h3>Subscribe Us</h3>
              <p className="footer-sub-text">
                Do you want to get the information about our Latest News &amp;
                Updates without delay? Subscribe to our Newsletter and get in
                touch with us.
              </p>
              <div className="footer-subscribe-box">
                <input
                  type="email"
                  placeholder={
                    subscribed ? "Thank you for subscribing!" : "Email Address"
                  }
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSubscribe();
                    }
                  }}
                  disabled={subscribed}
                  aria-label="Email Address for newsletter"
                />
                <button
                  type="button"
                  className="btn-subscribe-green"
                  onClick={handleSubscribe}
                  disabled={subscribed}
                >
                  {subscribed ? "Subscribed" : "Sign Up"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Bottom Bar */}
        <div className="footer-bottom-bar">
          <div className="container">
            <p>
              Copyright &copy; {mounted ? new Date().getFullYear() : 2026} Wamark
              Nigeria. Dev by{" "}
              <a
                href="https://www.omatazmedia.com.ng"
                target="_blank"
                rel="noopener noreferrer"
                className="author-credit"
              >
                Omataz Media
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Floating Action Buttons */}
      {/* WhatsApp Chat Trigger Button - sits at bottom: 24px and smoothly slides up when BTT appears */}
      <button
        type="button"
        onClick={() => setChatOpen((v) => !v)}
        className={`floating-whatsapp-btn ${showScrollTop ? "btt-active" : ""}`}
        aria-label="Open WhatsApp Chat"
        aria-expanded={chatOpen}
      >
        <IconWhatsApp />
      </button>

      {/* Back to Top [BTT] Button - smoothly slides in at bottom: 24px */}
      <button
        type="button"
        className={`floating-scroll-top-btn ${showScrollTop ? "show" : ""}`}
        onClick={scrollToTop}
        aria-label="Scroll to top"
      >
        <IconChevronUp />
      </button>

      {/* Interactive WhatsApp Chat Widget */}
      <WhatsAppChatModal
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        isBttActive={showScrollTop}
      />
    </footer>
  );
}
