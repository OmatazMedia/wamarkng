/**
 * Built by Omataz Media — Web Development & Design
 * Website   : https://www.omatazmedia.com.ng
 * Email     : hello@omatazmedia.com.ng
 * Phone     : +234 9024599289, +234 7037373304
 * WhatsApp  : https://wa.me/message/M3QUHNVONY6NK1
 * Social    : @omatazmedia — Facebook · Instagram · X · YouTube
 * GitHub    : https://github.com/omatazmedia
 * Contact   : Johnson Toluwani
 *
 * Contact form (client) wired to the WAMARK PHP API:
 * CSRF token + honeypot + human-proof sum question. Messages are stored
 * in SQLite and emailed from no-reply@<site-domain> — zero configuration.
 */

"use client";

import { useEffect, useRef, useState } from "react";

const API = "/api/index.php";

type Captcha = { a: number; b: number };

export default function ContactForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [note, setNote] = useState("");
  const [csrf, setCsrf] = useState("");
  const [captcha, setCaptcha] = useState<Captcha | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function refreshProtection() {
    fetch(`${API}?route=csrf`, { credentials: "same-origin" })
      .then((r) => r.json())
      .then((d) => {
        if (d?.ok) {
          setCsrf(d.csrf);
          setCaptcha(d.captcha);
        }
      })
      .catch(() => setNote("Could not load the form protection. Refresh the page."));
  }

  // Pull a fresh CSRF token + human-proof question when the form mounts.
  useEffect(refreshProtection, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!formRef.current) return;
    const fd = new FormData(formRef.current);
    setStatus("sending");
    setNote("");

    const payload: Record<string, unknown> = {
      csrf,
      name: fd.get("name") ?? "",
      email: fd.get("email") ?? "",
      phone: fd.get("phone") ?? "",
      subject: fd.get("subject") ?? "",
      message: fd.get("message") ?? "",
      captcha_answer: Number(fd.get("captcha_answer") ?? -1),
      _hp: fd.get("_hp") ?? "", // honeypot — must stay empty
    };

    try {
      const res = await fetch(`${API}?route=contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data?.ok) {
        setStatus("done");
        setNote(data.message ?? "Thank you! Your message has been sent to our team.");
        formRef.current.reset();
      } else {
        setStatus("error");
        setNote(data?.message ?? data?.error ?? "Something went wrong. Please try again.");
        if (data?.error === "captcha_failed") refreshProtection();
      }
    } catch {
      setStatus("error");
      setNote("Network error — please check your connection and try again.");
    }
  }

  if (status === "done") {
    return (
      <div className="form-success" role="status">
        ✅ {note}
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={onSubmit}>
      {/* Honeypot — invisible to humans, catnip for bots */}
      <input
        type="text"
        name="_hp"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style={{ position: "absolute", left: "-9999px", height: 0, width: 0, opacity: 0 }}
      />
      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="name">Full Name</label>
          <input id="name" name="name" type="text" placeholder="Your name" required />
        </div>
        <div className="form-field">
          <label htmlFor="email">Email Address</label>
          <input id="email" name="email" type="email" placeholder="you@company.com" required />
        </div>
        <div className="form-field">
          <label htmlFor="phone">Phone Number</label>
          <input id="phone" name="phone" type="tel" placeholder="+234 ..." />
        </div>
        <div className="form-field">
          <label htmlFor="subject">Subject</label>
          <input id="subject" name="subject" type="text" placeholder="How can we help?" />
        </div>
        <div className="form-field full">
          <label htmlFor="message">Message</label>
          <textarea id="message" name="message" placeholder="Write your message..." required />
        </div>
        <div className="form-field full">
          <label htmlFor="captcha_answer">
            Human check: what is {captcha ? `${captcha.a} + ${captcha.b}` : "…"}?
          </label>
          <input
            id="captcha_answer"
            name="captcha_answer"
            type="number"
            inputMode="numeric"
            placeholder="Your answer"
            required
          />
        </div>
        {status === "error" && note && (
          <div className="form-field full">
            <div className="form-error" role="alert">⚠ {note}</div>
          </div>
        )}
        <div className="form-field full">
          <button className="btn btn-green" type="submit" disabled={status === "sending"}>
            {status === "sending" ? "Sending…" : "Send Message"}
          </button>
        </div>
      </div>
    </form>
  );
}
