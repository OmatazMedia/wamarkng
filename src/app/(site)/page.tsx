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

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  IconArrowRight,
  IconCheckSquare,
  IconChevronLeft,
  IconChevronRight,
  IconMapMarker,
  IconHeadset,
} from "@/components/icons";
import {
  hero,
  features,
  about,
  clients,
  stats,
  services,
  products,
  offers,
  portfolio,
  posts,
  testimonials,
  contactInfo,
} from "@/lib/data";

/* ================= Hero Slider (3 Slides with Circular Nav Previews) ================= */
const heroSlides = [
  {
    id: 1,
    tag: "SECURITY & SURVEILLANCE",
    title: "ADVANCED SECURITY SYSTEMS",
    text: "From CCTV and access control to technical surveillance countermeasures, WAMARK provides cutting-edge security solutions to safeguard assets and maintain peace of mind for clients.",
    cta: { label: "LEARN MORE", href: "/services/" },
    image: "/images/wig-slider.jpg",
    alt: "Advanced Security Systems and CCTV Surveillance",
  },
  {
    id: 2,
    tag: "DEFENSE & INTELLIGENCE",
    title: "TECHNICAL SURVEILLANCE COUNTERMEASURES",
    text: "Safeguarding boardrooms, executive spaces, and critical infrastructure with state-of-the-art RF detection, non-linear junction evaluation, and signal intelligence.",
    cta: { label: "LEARN MORE", href: "/services/" },
    image: "/images/hero-slide-1.jpg",
    alt: "Technical Surveillance Countermeasures and RF Spectrum Analysis",
  },
  {
    id: 3,
    tag: "OIL & GAS SOLUTIONS",
    title: "PRECISION PIPELINE & PLANT SERVICES",
    text: "Comprehensive flow station maintenance, non-destructive testing, ultrasonic metering, and pipeline integrity assurance for Nigeria's energy leaders.",
    cta: { label: "LEARN MORE", href: "/services/" },
    image: "/images/oilgas.webp",
    alt: "Oil & Gas Pipeline Maintenance and Ultrasonic Metering",
  },
];

type TransitionStyle =
  | "horizontal-push"
  | "curtain-roll"
  | "parallax-split"
  | "shutter-wipe";

const transitionPool: TransitionStyle[] = [
  "horizontal-push",
  "curtain-roll",
  "parallax-split",
  "shutter-wipe",
];

function Hero() {
  const [current, setCurrent] = useState(0);
  const [outgoing, setOutgoing] = useState<number | null>(null);
  const [transitionStyle, setTransitionStyle] = useState<TransitionStyle>("horizontal-push");
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const [paused, setPaused] = useState(false);

  // Initial load 3D vertical half-fold animation
  const [isInitialFold, setIsInitialFold] = useState(true);
  const [foldTriggered, setFoldTriggered] = useState(false);

  const total = heroSlides.length;
  const prevIndex = (current - 1 + total) % total;
  const nextIndex = (current + 1) % total;

  // On page load, play the vertical half-fold animation
  useEffect(() => {
    // Start the fold sequence right as the preloader begins fading into the page (at 3.4s)
    const foldStartTimer = setTimeout(() => {
      setFoldTriggered(true);
    }, 3400);

    // Complete the fold sequence and unmount fold layer
    const foldDoneTimer = setTimeout(() => {
      setIsInitialFold(false);
    }, 6900);

    return () => {
      clearTimeout(foldStartTimer);
      clearTimeout(foldDoneTimer);
    };
  }, []);

  const changeSlide = useCallback(
    (newIdx: number, dir: "next" | "prev") => {
      if (newIdx === current) return;
      // Pick a random animation from the 4 requested types
      const available = transitionPool.filter((t) => t !== transitionStyle);
      const chosen =
        available[Math.floor(Math.random() * available.length)] ||
        "horizontal-push";

      setOutgoing(current);
      setDirection(dir);
      setTransitionStyle(chosen);
      setCurrent(newIdx);
    },
    [current, transitionStyle]
  );

  const goToPrev = () => changeSlide(prevIndex, "prev");
  const goToNext = useCallback(() => {
    changeSlide(nextIndex, "next");
  }, [changeSlide, nextIndex]);

  // Clean up outgoing slide after animation finishes
  useEffect(() => {
    if (outgoing === null) return;
    const t = setTimeout(() => {
      setOutgoing(null);
    }, 1100);
    return () => clearTimeout(t);
  }, [outgoing]);

  // Auto advance timer (waits until initial fold finishes on first slide)
  useEffect(() => {
    if (paused) return;
    const intervalTime = isInitialFold ? 10000 : 6500;
    const timer = setTimeout(() => {
      goToNext();
    }, intervalTime);
    return () => clearTimeout(timer);
  }, [paused, current, isInitialFold, goToNext]);

  return (
    <section
      className="hero-slider-section"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-label="Featured Highlights Slider"
    >
      {/* 3D Vertical Half-Fold Intro for Slide 1 on Page Load */}
      {isInitialFold && (
        <div
          className={`hero-intro-fold ${foldTriggered ? "playing" : ""}`}
          aria-hidden="true"
        >
          {/* Entire folding book wrapper that moves off to the left as fold starts */}
          <div className="hero-fold-wrapper">
            {/* Left panel (moves left together with the wrapper) */}
            <div className="hero-fold-left">
              <div className="hero-fold-left-inner">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={heroSlides[0].image} alt="" />
                <div className="hero-slide-overlay" />
              </div>
            </div>

            {/* Right vertical half folding leaf (folds over to left) */}
            <div className="hero-fold-right">
              <div className="hero-fold-right-inner">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={heroSlides[0].image} alt="" />
                <div className="hero-slide-overlay" />
                <div className="hero-fold-shadow-overlay" />
              </div>
            </div>

            {/* Center spine crease line shadow */}
            <div className="hero-fold-spine-shadow" />
          </div>
        </div>
      )}

      {/* Background slide images with dynamic random transition animations */}
      {heroSlides.map((slide, idx) => {
        const isCurrent = idx === current;
        const isOutgoing = idx === outgoing;
        if (!isCurrent && !isOutgoing) return null;

        let slideClass = "hero-slide-bg";
        if (isCurrent) {
          slideClass += ` active active-${transitionStyle} dir-${direction}`;
        } else if (isOutgoing) {
          slideClass += ` outgoing outgoing-${transitionStyle} dir-${direction}`;
        }

        return (
          <div
            key={slide.id}
            className={slideClass}
            aria-hidden={!isCurrent}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={slide.image} alt={slide.alt} />
            <div className="hero-slide-overlay" />
          </div>
        );
      })}

      {/* Left Circular Navigation Arrow with Previous Slide Hover Preview */}
      <button
        type="button"
        onClick={goToPrev}
        className="hero-nav-arrow hero-nav-prev"
        aria-label={`Previous slide: ${heroSlides[prevIndex].title}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={heroSlides[prevIndex].image}
          alt=""
          className="hero-nav-thumb"
          aria-hidden="true"
        />
        <div className="hero-nav-tint" aria-hidden="true" />
        <svg
          className="hero-nav-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>

        {/* Hover preview tooltip badge */}
        <div className="hero-nav-tooltip" aria-hidden="true">
          <small>Previous</small>
          <span>{heroSlides[prevIndex].title}</span>
        </div>
      </button>

      {/* Right Circular Navigation Arrow with Next Slide Hover Preview */}
      <button
        type="button"
        onClick={goToNext}
        className="hero-nav-arrow hero-nav-next"
        aria-label={`Next slide: ${heroSlides[nextIndex].title}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={heroSlides[nextIndex].image}
          alt=""
          className="hero-nav-thumb"
          aria-hidden="true"
        />
        <div className="hero-nav-tint" aria-hidden="true" />
        <svg
          className="hero-nav-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>

        {/* Hover preview tooltip badge */}
        <div className="hero-nav-tooltip" aria-hidden="true">
          <small>Next</small>
          <span>{heroSlides[nextIndex].title}</span>
        </div>
      </button>

      {/* Main Centered Content with Staggered Entrance Animation */}
      <div className="hero-content-wrapper">
        <div key={current} className="hero-content-animated">
          <p className="hero-tagline">{heroSlides[current].tag}</p>
          <h1 className="hero-title">{heroSlides[current].title}</h1>
          <p className="hero-description">{heroSlides[current].text}</p>
          <div className="hero-btn-wrap">
            <a className="hero-btn" href={heroSlides[current].cta.href}>
              {heroSlides[current].cta.label}
            </a>
          </div>
        </div>
      </div>

      {/* Slide Indicators */}
      <div className="hero-indicators" role="tablist" aria-label="Slider pagination">
        {heroSlides.map((slide, idx) => (
          <button
            key={slide.id}
            type="button"
            className={`hero-indicator-dot ${idx === current ? "active" : ""}`}
            onClick={() => changeSlide(idx, idx > current ? "next" : "prev")}
            aria-label={`Slide ${idx + 1}: ${slide.title}`}
            aria-selected={idx === current}
            role="tab"
          />
        ))}
      </div>
    </section>
  );
}

/* ================= Feature cards + detail modal ================= */
function Features() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  // Dashboard-controlled image sets, fetched live so changes to
  // the three feature modals show up without a rebuild.
  const [overrides, setOverrides] = useState<Record<string, string[]> | null>(null);
  const open = openIdx === null ? null : features[openIdx];

  useEffect(() => {
    setMounted(true);
  }, []);

  const loadImages = useCallback(async () => {
    try {
      const res = await fetch("/api/index.php?route=feature", {
        cache: "no-store",
      });
      const d = await res.json();
      if (d?.ok) {
        setOverrides((d.features as Record<string, string[]>) ?? null);
      }
    } catch {
      /* offline: the built-in defaults keep working */
    }
  }, []);

  useEffect(() => {
    loadImages();
    // Pick up image changes made in the dashboard while the page sits open.
    const onVis = () => {
      if (document.visibilityState === "visible") loadImages();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [loadImages]);

  function imagesFor(no: string, fallback: string[]): string[] {
    const over = overrides?.[no];
    return over && over.length > 0 ? over : fallback;
  }

  // Close on Escape and lock page scroll while the modal is up.
  useEffect(() => {
    if (openIdx === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenIdx(null);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [openIdx]);

  return (
    <section className="features">
      <div className="container features-grid">
        {features.map((f, i) => (
          <button
            type="button"
            className="feature-card feature-click"
            key={f.no}
            onClick={() => setOpenIdx(i)}
            aria-haspopup="dialog"
            aria-label={`${f.modalTitle} — view details`}
          >
            <div className="feature-icon-top">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={f.icon} alt="" aria-hidden="true" />
            </div>
            <h3>{f.title}</h3>
            <p>{f.text}</p>
            <span className="link-more">
              Learn More <IconArrowRight />
            </span>
            <span className="feature-watermark" aria-hidden="true">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={f.icon} alt="" />
            </span>
          </button>
        ))}
      </div>

      {open && mounted
        ? createPortal(
            <div className="fmodal-overlay" onClick={() => setOpenIdx(null)}>
              <div
                className="fmodal"
                role="dialog"
                aria-modal="true"
                aria-label={open.modalTitle}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  className="fmodal-close"
                  aria-label="Close dialog"
                  onClick={() => setOpenIdx(null)}
                >
                  ✕
                </button>

                <div className="fmodal-head">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={open.icon} alt="" aria-hidden="true" />
                  <h3>{open.modalTitle}</h3>
                  <span className="fmodal-no" aria-hidden="true">
                    {open.no}
                  </span>
                </div>

                <p className="fmodal-intro">{open.modal.intro}</p>

                <ul className="fmodal-list">
                  {open.modal.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>

                <div className="fmodal-imgs">
                  {imagesFor(open.no, open.modal.images).map((src) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={src} alt="" aria-hidden="true" key={src} />
                  ))}
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </section>
  );
}

/* ================= About ================= */
function About() {
  return (
    <section className="about-section" id="about">
      <div className="container about-grid">
        {/* Left Collage matching reference image */}
        <div className="about-collage">
          {/* Column 1: CCTV (top) + Trusted 100+ Clients badge (middle) + Tower (bottom) */}
          <div className="about-subcol-left">
            <div className="about-img-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/cctv.webp" alt="CCTV Security Installation" />
            </div>

            <div className="about-trusted-badge">
              <h3>We&apos;re Trusted</h3>
              <h3>by More than</h3>
              <h3>100 Clients.</h3>
            </div>

            <div className="about-img-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/imsi-catcher-system.webp"
                alt="Surveillance &amp; Communication Tower"
              />
            </div>
          </div>

          {/* Column 2: Full-height Industrial Oil & Gas technician with Learn More button */}
          <div className="about-subcol-right">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/project-3.webp"
              alt="Oil &amp; Gas Plant Maintenance"
            />
            <a
              href="/services/"
              className="about-learn-more-btn"
              aria-label="Learn more about our services"
            >
              <span className="about-btn-arrow-icon" aria-hidden="true">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 16 16 12 12 8" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                </svg>
              </span>
              <span>Learn More</span>
            </a>
          </div>
        </div>

        {/* Right Content */}
        <div className="about-text">
          <p className="about-tag">ABOUT US</p>
          <h2 className="about-title">Proven Expertise in Serving Agencies</h2>
          <div className="about-title-line" aria-hidden="true" />

          <p>
            WAMARK Nigeria Limited is a foremost company specializing in{" "}
            <strong>
              Corporate Security Intelligence Operations, Training anad Oil &amp; Gas
              Services
            </strong>
            . Established in <strong>2017</strong>, we bring together a team of
            experienced engineers, project managers, and retired security
            intelligence operatives.
          </p>

          <p>
            Our expertise covers{" "}
            <strong>
              mechanical installations, pipeline maintenance, surveillance, and
              security systems
            </strong>
            , delivering reliable solutions to{" "}
            <strong>corporations, VIPs, and government agencies</strong> across
            Nigeria.
          </p>

          <div className="about-mv-stack">
            <div className="about-mv-card">
              <span className="about-mv-icon" aria-hidden="true">
                <IconCheckSquare />
              </span>
              <div className="about-mv-content">
                <h3>Our Mission</h3>
                <p>
                  Our mission is to deliver world-class security surveillance
                  systems, cutting-edge technical solutions, and oil &amp; gas
                  services through a team of experienced professionals—ensuring
                  safety, efficiency, and long-term value for our clients.
                </p>
              </div>
            </div>

            <div className="about-mv-card">
              <span className="about-mv-icon" aria-hidden="true">
                <IconCheckSquare />
              </span>
              <div className="about-mv-content">
                <h3>Our Vision</h3>
                <p>
                  To be a leading provider of innovative Security, Technical
                  solutions and Oil &amp; Gas sector in Africa, trusted for
                  excellence, reliability, and sustainable impact.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ================= Clients ================= */
function Clients() {
  const allLogos = [...clients, ...clients, ...clients];
  return (
    <section className="section clients-section">
      <div className="container">
        <span className="sec-tag">They Trusted Us</span>
        <h2 className="sec-title">Our clients</h2>
      </div>

      <div className="clients-marquee-wrap" aria-label="Clients carousel">
        <div className="clients-marquee-track">
          {allLogos.map((c, i) => (
            <div className="client-box" key={`${c.name}-${i}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={c.logo} alt={c.name} loading="lazy" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ================= Stats ================= */
function StatCounter({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !started.current) {
          started.current = true;
          const dur = 1600;
          const t0 = performance.now();
          const tick = (t: number) => {
            const p = Math.min((t - t0) / dur, 1);
            setDisplay(Math.round(value * (1 - Math.pow(1 - p, 3))));
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [value]);

  return (
    <div className="stat" ref={ref}>
      <div className="stat-num">
        {display}
        <span>{suffix}</span>
      </div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function Stats() {
  return (
    <section className="stats">
      <div className="container stats-grid">
        {stats.map((s) => (
          <StatCounter key={s.label} {...s} />
        ))}
      </div>
    </section>
  );
}

/* ================= Services ================= */
const serviceLinks: Record<string, string> = {
  "Technical Surveillance & Countermeasures": "/services/technical-surveillance-countermeasures/",
  "Security Systems Installation": "/services/security-systems-installation/",
  "Oil & Gas Services": "/services/oil-gas-services/",
};

function Services() {
  return (
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
                  <a className="link-more" href={serviceLinks[s.title] ?? "/services/"}>
                    Read More <IconArrowRight />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ================= Product strip ================= */
function Products() {
  return (
    <section className="products">
      <div className="container products-strip">
        {products.map((p) => (
          <div className="p-item" key={p.image}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.image} alt={p.alt} />
          </div>
        ))}
      </div>
    </section>
  );
}

/* ================= Offers ================= */
function Offers() {
  return (
    <section className="offers section">
      <div className="container">
        <span className="sec-tag">Special Offer</span>
        <h2 className="sec-title">Our Best Offers</h2>
        <div className="offers-grid">
          {offers.map((o, i) => (
            <div className="offer" key={i}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={o.icon} alt="" aria-hidden="true" />
              <h3>{o.title}</h3>
              <p>{o.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ================= Portfolio ================= */
function Portfolio() {
  return (
    <section className="section portfolio-section">
      <div className="container">
        <span className="sec-tag">Portfolio</span>
        <h2 className="sec-title">Our Projects</h2>
      </div>

      {/* Auto-scrolling marquee carousel moving left, pauses on hover for interaction */}
      <div className="portfolio-marquee-wrap" aria-label="Projects carousel">
        <div className="portfolio-marquee-track">
          {[...portfolio, ...portfolio, ...portfolio].map((src, idx) => (
            <a
              className="portfolio-item"
              href="/projects/"
              key={`${src}-${idx}`}
              title="View project details"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="WAMARK project" loading="lazy" />
              <span className="portfolio-hover-overlay">
                <span className="portfolio-hover-btn">
                  View Project <IconArrowRight />
                </span>
              </span>
            </a>
          ))}
        </div>
      </div>

      <div className="container portfolio-center">
        <a className="btn btn-green portfolio-btn" href="/projects/">
          <span>See More</span>
          <span className="btn-arrow-icon" aria-hidden="true">
            <IconArrowRight />
          </span>
        </a>
      </div>
    </section>
  );
}

/* ================= CTA ================= */
function Cta() {
  return (
    <section className="cta">
      <div className="container cta-inner">
        <h2>
          Let&apos;s secure your future with trusted Oil &amp; Gas and
          Surveillance solutions.
        </h2>
        <a className="btn btn-outline" href="/contact-us/">
          Contact Us
        </a>
      </div>
    </section>
  );
}

/* ================= Blog ================= */
function Blog() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Auto-scroll moving smoothly to the left
  useEffect(() => {
    if (isHovered) return;
    const el = scrollRef.current;
    if (!el) return;

    const interval = setInterval(() => {
      if (!el) return;
      const maxScroll = el.scrollWidth - el.clientWidth;
      if (el.scrollLeft >= maxScroll - 10) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        el.scrollBy({ left: 340, behavior: "smooth" });
      }
    }, 3800);

    return () => clearInterval(interval);
  }, [isHovered]);

  const handlePrev = () => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: -360, behavior: "smooth" });
  };

  const handleNext = () => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: 360, behavior: "smooth" });
  };

  return (
    <section className="section blog-section">
      <div className="container">
        <span className="sec-tag">Our Blog</span>
        <h2 className="sec-title">Latest Articles</h2>

        <div
          className="blog-carousel-wrapper"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Navigation Arrows: Reveal on hover to move right or left */}
          <button
            type="button"
            className="blog-arrow prev"
            onClick={handlePrev}
            aria-label="Previous articles"
          >
            <IconChevronLeft />
          </button>
          <button
            type="button"
            className="blog-arrow next"
            onClick={handleNext}
            aria-label="Next articles"
          >
            <IconChevronRight />
          </button>

          <div className="blog-carousel-track" ref={scrollRef}>
            {posts.map((p) => (
              <article className="blog-card" key={p.title}>
                <div className="blog-thumb">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.image} alt={p.title} />
                  <span className="blog-date">{p.date}</span>
                </div>
                <div className="blog-body">
                  <h3>{p.title}</h3>
                  <p>{p.excerpt}</p>
                  <a className="link-more" href="/blog/">
                    Read More <IconArrowRight />
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ================= Testimonials ================= */
function Testimonials() {
  const [index, setIndex] = useState(0);
  const t = testimonials[index];

  return (
    <section className="testimonials section">
      <div className="container">
        <span className="sec-tag">Testimonials</span>
        <h2 className="sec-title">What Our Clients Says</h2>
        <div className="testimonial-slider">
          <blockquote className="testimonial-quote">{t.quote}</blockquote>
          <div className="testimonial-name">{t.name}</div>
          <div className="testimonial-role">{t.role}</div>
          <button
            className="testimonial-arrow prev"
            aria-label="Previous testimonial"
            onClick={() =>
              setIndex((i) => (i - 1 + testimonials.length) % testimonials.length)
            }
          >
            <IconChevronLeft />
          </button>
          <button
            className="testimonial-arrow next"
            aria-label="Next testimonial"
            onClick={() => setIndex((i) => (i + 1) % testimonials.length)}
          >
            <IconChevronRight />
          </button>
        </div>
        <div className="testimonial-dots">
          {testimonials.map((_, i) => (
            <button
              key={i}
              className={`blog-dot${i === index ? " active" : ""}`}
              aria-label={`Testimonial ${i + 1}`}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ================= Page ================= */
export default function Home() {
  return (
    <main>
      <Hero />
      <Features />
      <About />
      <Clients />
      <Stats />
      <Services />
      <Products />
      <Offers />
      <Portfolio />
      <Cta />
      <Blog />
      <Testimonials />
    </main>
  );
}
