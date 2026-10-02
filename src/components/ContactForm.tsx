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
 * Contact form wired to native PHP mailer API:
 * CSRF token + honeypot + spam scrutiny + rate limiting + WhatsApp fallback on spam flag.
 */

"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

const API = "/api/index.php";
const WHATSAPP_SUPPORT = "2348031124296";

type Captcha = { a: number; b: number };

function ContactFormContent() {
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error" | "spam_error">("idle");
  const [note, setNote] = useState("");
  const [csrf, setCsrf] = useState("");
  const [captcha, setCaptcha] = useState<Captcha | null>(null);
  const [nameVal, setNameVal] = useState("");
  const [emailVal, setEmailVal] = useState("");
  const [phoneVal, setPhoneVal] = useState("");
  const [subjectVal, setSubjectVal] = useState("");
  const [messageVal, setMessageVal] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  const searchParams = useSearchParams();
  const serviceParam = searchParams.get("service");

  // Pre-fill subject and message when coming from "Engage Service"
  useEffect(() => {
    if (serviceParam) {
      setSubjectVal(`Engage Service: ${serviceParam}`);
      setMessageVal(
        `Hello WAMARK Team,\n\nI would like to engage your "${serviceParam}" services for our organization. Please provide further consultation, scope, and quotation details.`
      );
    }
  }, [serviceParam]);

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

    const name = (fd.get("name") as string) || nameVal;
    const email = (fd.get("email") as string) || emailVal;
    const phone = (fd.get("phone") as string) || phoneVal;
    const subject = (fd.get("subject") as string) || subjectVal;
    const message = (fd.get("message") as string) || messageVal;

    const payload: Record<string, unknown> = {
      csrf,
      name,
      email,
      phone,
      subject,
      message,
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
        setNote(data.message ?? "Thank you! Your message has been sent to info@wamarkng.com.");
        formRef.current.reset();
        setNameVal("");
        setEmailVal("");
        setPhoneVal("");
        setSubjectVal("");
        setMessageVal("");
      } else if (data?.error === "spam_detected") {
        setStatus("spam_error");
        setNote("Such messages are not allowed here.");
        refreshProtection();
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

  const prefilledWhatsAppText = `Hello WAMARK Support, my contact form message on your website was flagged. I would like to submit my inquiry directly:\n\n• Name: ${nameVal || "Client"}\n• Email: ${emailVal || "Not provided"}\n• Phone: ${phoneVal || "Not provided"}\n• Subject: ${subjectVal || "Service Inquiry"}\n• Message:\n${messageVal || "Inquiry details"}`;
  const whatsappUrl = `https://wa.me/${WHATSAPP_SUPPORT}?text=${encodeURIComponent(prefilledWhatsAppText)}`;

  return (
    <form ref={formRef} onSubmit={onSubmit} suppressHydrationWarning data-lpignore="true">
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
          <input
            id="name"
            name="name"
            type="text"
            placeholder="Your name"
            value={nameVal}
            onChange={(e) => setNameVal(e.target.value)}
            required
          />
        </div>
        <div className="form-field">
          <label htmlFor="email">Email Address</label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="you@company.com"
            value={emailVal}
            onChange={(e) => setEmailVal(e.target.value)}
            required
          />
        </div>
        <div className="form-field">
          <label htmlFor="phone">Phone Number</label>
          <input
            id="phone"
            name="phone"
            type="tel"
            placeholder="+234 ..."
            value={phoneVal}
            onChange={(e) => setPhoneVal(e.target.value)}
          />
        </div>
        <div className="form-field">
          <label htmlFor="subject">Subject</label>
          <input
            id="subject"
            name="subject"
            type="text"
            placeholder="How can we help?"
            value={subjectVal}
            onChange={(e) => setSubjectVal(e.target.value)}
          />
        </div>
        <div className="form-field full">
          <label htmlFor="message">Message</label>
          <textarea
            id="message"
            name="message"
            placeholder="Write your message..."
            value={messageVal}
            onChange={(e) => setMessageVal(e.target.value)}
            required
            rows={5}
          />
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

        {/* Spam warning banner with WhatsApp "click here" link */}
        {status === "spam_error" && (
          <div className="form-field full">
            <div className="form-spam-warning" role="alert">
              <div className="spam-warning-header">
                <span className="spam-warning-icon">⛔</span>
                <strong>Such messages are not allowed here.</strong>
              </div>
              <p className="spam-warning-desc">
                If you think this is an error,{" "}
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="spam-whatsapp-link"
                >
                  click here
                </a>{" "}
                to reach our support directly on WhatsApp with your pre-filled message.
              </p>
            </div>
          </div>
        )}

        {/* Standard error banner */}
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

export default function ContactForm() {
  return (
    <Suspense fallback={<div>Loading form...</div>}>
      <ContactFormContent />
    </Suspense>
  );
}
