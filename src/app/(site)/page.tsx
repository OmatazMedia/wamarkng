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

/* ================= Hero ================= */
function Hero() {
  return (
    <section className="hero">
      <div className="hero-inner">
        <p className="hero-tag">{hero.tag}</p>
        <h1>{hero.title}</h1>
        <p>{hero.text}</p>
        <a className="btn btn-green" href={hero.cta.href}>
          {hero.cta.label}
        </a>
      </div>
    </section>
  );
}

/* ================= Feature cards + detail modal ================= */
function Features() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  // Dashboard-controlled image sets, fetched live so changes to
  // the three feature modals show up without a rebuild.
  const [overrides, setOverrides] = useState<Record<string, string[]> | null>(null);
  const open = openIdx === null ? null : features[openIdx];

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
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={f.icon} alt="" aria-hidden="true" />
            <h3>{f.title}</h3>
            <p>{f.text}</p>
            <span className="link-more">
              Learn More <IconArrowRight />
            </span>
          </button>
        ))}
      </div>

      {open && (
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
        </div>
      )}
    </section>
  );
}

/* ================= About ================= */
function About() {
  return (
    <section className="section">
      <div className="container about-grid">
        <div className="about-collage">
          <div className="about-left">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/cctv.webp" alt="CCTV installation" />
            <div className="about-badge">We&apos;re Trusted by More than 100 Clients.</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/oilgas.webp" alt="Oil & Gas plant maintenance" style={{ height: 190 }} />
            <div style={{ position: "relative", flex: 1 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/imsi-catcher-system.webp" alt="Surveillance tower" style={{ height: "100%" }} />
              <a
                className="btn btn-green"
                href="/services/"
                style={{ position: "absolute", left: "50%", bottom: 18, transform: "translateX(-50%)", padding: "10px 22px", fontSize: 12 }}
              >
                Learn More
              </a>
            </div>
          </div>
        </div>

        <div className="about-text">
          <p className="about-tag">{about.tag}</p>
          <h2 className="about-title">{about.title}</h2>
          {about.paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
          <div className="mv-card">
            <span className="mv-icon">
              <IconCheckSquare />
            </span>
            <div>
              <h3>Our Mission</h3>
              <p>{about.mission}</p>
            </div>
          </div>
          <div className="mv-card">
            <span className="mv-icon">
              <IconCheckSquare />
            </span>
            <div>
              <h3>Our Vision</h3>
              <p>{about.vision}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ================= Clients ================= */
function Clients() {
  return (
    <section className="clients">
      <div className="container">
        <span className="sec-tag">They Trusted Us</span>
        <h2 className="sec-title">Our clients</h2>
        <div className="clients-grid">
          {clients.map((c) => (
            <div className="client-box" key={c.name}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={c.logo} alt={c.name} />
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
function Services() {
  return (
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
                <a className="link-more" href="/services/">
                  Read More <IconArrowRight />
                </a>
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
    <section className="section">
      <div className="container">
        <span className="sec-tag">Portfolio</span>
        <h2 className="sec-title">Our Projects</h2>
        <div className="portfolio-grid">
          {portfolio.map((src) => (
            <a className="portfolio-item" href="/projects/" key={src}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="WAMARK project" />
            </a>
          ))}
        </div>
        <div className="portfolio-center">
          <a className="btn btn-green" href="/projects/">
            See More
          </a>
        </div>
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
  return (
    <section className="section">
      <div className="container">
        <span className="sec-tag">Our Blog</span>
        <h2 className="sec-title">Latest Articles</h2>
        <div className="blog-grid">
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
              </div>
            </article>
          ))}
        </div>
        <div className="blog-nav">
          <button className="blog-dot active" aria-label="Slide 1" />
          <button className="blog-dot" aria-label="Slide 2" />
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

/* ================= Contact bar ================= */
function ContactBar() {
  return (
    <section className="contact-bar">
      <div className="container">
        <div className="contact-card">
          <div className="contact-info">
            <span className="contact-info-icon">
              <IconMapMarker />
            </span>
            <div>
              <small>Location</small>
              <strong>{contactInfo.location}</strong>
            </div>
          </div>
          <div className="contact-info">
            <span className="contact-info-icon">
              <IconHeadset />
            </span>
            <div>
              <small>Call Us</small>
              <strong>{contactInfo.phones}</strong>
            </div>
          </div>
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
      <ContactBar />
    </main>
  );
}
