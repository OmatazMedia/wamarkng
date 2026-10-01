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
 * WAMARK admin login — email-first flow with hard lockout:
 *   • 4 wrong attempts on one email → that email is locked for 4 hours
 *     (server-enforced; the client just mirrors the countdown).
 *   • Unknown emails get the exact same response shape as known ones,
 *     so the flow cannot be used to enumerate accounts.
 *   • On success with must_change, the user is forced to set a new
 *     password before the dashboard opens.
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import PageHero from "@/components/PageHero";

const API = "/api/index.php";

type Step = "email" | "password" | "must-change";

export default function LoginPage() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [csrf, setCsrf] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [lockUntil, setLockUntil] = useState<number | null>(null);
  const [nowTs, setNowTs] = useState(() => Date.now() / 1000);
  const pwRef = useRef<HTMLInputElement>(null);

  // Fresh CSRF token on mount.
  useEffect(() => {
    fetch(`${API}?route=csrf`, { credentials: "same-origin" })
      .then((r) => r.json())
      .then((d) => {
        if (d?.ok) setCsrf(d.csrf);
      })
      .catch(() => setError("Could not reach the sign-in service. Refresh the page."));
  }, []);

  // Lockout countdown ticker.
  useEffect(() => {
    if (lockUntil === null) return;
    const t = setInterval(() => setNowTs(Date.now() / 1000), 1000);
    return () => clearInterval(t);
  }, [lockUntil]);

  const applyLock = useCallback((retryIn: number) => {
    setLockUntil(Date.now() / 1000 + Math.max(retryIn, 1));
  }, []);

  function fmt(secs: number): string {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  }

  function post(route: string, body: Record<string, unknown>) {
    return fetch(`${API}?route=${route}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ csrf, ...body }),
    }).then((r) => r.json());
  }

  // Step 1 — verify the email identity and its lock state.
  async function checkEmail(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setNotice("");
    const mail = email.trim().toLowerCase();
    if (!mail || !mail.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }
    setBusy(true);
    try {
      const d = await post("auth/check", { email: mail });
      if (!d?.ok) {
        setError(d?.message ?? "Could not verify the email. Try again.");
        return;
      }
      if (d.locked) {
        applyLock(d.retry_in || 1);
        setError(d.message ?? "This email is temporarily locked. Try again later.");
        return;
      }
      if (!d.exists) {
        // Deliberately identical to a wrong-password response: no user enumeration.
        setError(
          "Incorrect password. 4 attempt(s) left before this email is locked for 4 hours."
        );
        return;
      }
      setStep("password");
      setTimeout(() => pwRef.current?.focus(), 30);
    } catch {
      setError("Network error — please try again.");
    } finally {
      setBusy(false);
    }
  }

  // Step 2 — verify the password.
  async function verifyPassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setNotice("");
    if (!password) {
      setError("Enter your password.");
      return;
    }
    setBusy(true);
    try {
      const d = await post("auth/password", { email: email.trim().toLowerCase(), password });
      if (d?.ok) {
        if (d.user?.must_change) {
          setNotice("Security requirement: set a new password to continue.");
          setStep("must-change");
        } else {
          window.location.href = "/dashboard/";
        }
        return;
      }
      if (d?.error === "locked") {
        applyLock(d.retry_in || Config_LOCK_SECONDS_FALLBACK);
        setError(d.message ?? "This email is locked. Try again later.");
        return;
      }
      setError(d?.message ?? "Incorrect password. Try again.");
    } catch {
      setError("Network error — please try again.");
    } finally {
      setBusy(false);
    }
  }

  // Step 3 — first-login password change.
  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (newPassword.length < 10 || !/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) {
      setError("New password must be at least 10 characters with letters and numbers.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("The two passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const d = await post("auth/change-password", { new_password: newPassword });
      if (d?.ok) {
        window.location.href = "/dashboard/";
        return;
      }
      setError(d?.message ?? "Could not update the password. Try again.");
    } catch {
      setError("Network error — please try again.");
    } finally {
      setBusy(false);
    }
  }

  const remaining = lockUntil ? Math.max(lockUntil - nowTs, 0) : 0;
  const locked = lockUntil !== null && remaining > 0;

  return (
    <main>
      <PageHero title="Sign In" crumb="Sign In" />

      <div className="auth-wrap">
        {/* -------- Photo panel -------- */}
        <div className="auth-photo">
          <span className="auth-badge">Admin Access</span>
          <h2>WAMARK Control Center</h2>
          <p>
            Manage gallery projects, enquiries and site settings from one
            secure place.
          </p>
        </div>

        {/* -------- Form panel -------- */}
        <div className="auth-form-side">
          <div className="auth-card">
            <span className="form-tag">Secure Sign In</span>

            {step === "email" && (
              <>
                <h1>Sign in to your account</h1>
                <p className="auth-sub">
                  Enter your email to continue. After 4 failed attempts the
                  email is locked for 4 hours.
                </p>

                {error && (
                  <div className={locked ? "auth-err locked" : "auth-err"} role="alert">
                    {error}
                    {locked && (
                      <strong style={{ display: "block", marginTop: 6 }}>
                        Locked — retry in {fmt(remaining)}
                      </strong>
                    )}
                  </div>
                )}

                <form onSubmit={checkEmail}>
                  <div className="auth-field">
                    <label htmlFor="email">Email Address</label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@example.com"
                      autoComplete="username"
                      disabled={locked || busy}
                      required
                    />
                  </div>
                  <button className="auth-btn" type="submit" disabled={busy || locked}>
                    {busy ? "Checking…" : locked ? `Locked (${fmt(remaining)})` : "Continue →"}
                  </button>
                </form>
              </>
            )}

            {step === "password" && (
              <>
                <h1>Welcome back</h1>
                <p className="auth-sub">
                  Signing in as <strong>{email}</strong>{" "}
                  <a
                    href="#email"
                    style={{ color: "var(--green-dark)", fontWeight: 600 }}
                    onClick={(e) => {
                      e.preventDefault();
                      setStep("email");
                      setPassword("");
                      setError("");
                    }}
                  >
                    (change)
                  </a>
                </p>

                {error && <div className="auth-err" role="alert">{error}</div>}

                <form onSubmit={verifyPassword}>
                  <div className="auth-field">
                    <label htmlFor="password">Password</label>
                    <input
                      id="password"
                      ref={pwRef}
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Your password"
                      autoComplete="current-password"
                      disabled={busy}
                      required
                    />
                  </div>
                  <button className="auth-btn" type="submit" disabled={busy}>
                    {busy ? "Verifying…" : "Sign In"}
                  </button>
                </form>
              </>
            )}

            {step === "must-change" && (
              <>
                <h1>Set a new password</h1>
                <p className="auth-sub">
                  {notice || "For security, you must replace the generated password before continuing."}
                </p>

                {error && <div className="auth-err" role="alert">{error}</div>}

                <form onSubmit={changePassword}>
                  <div className="auth-field">
                    <label htmlFor="newPassword">New Password</label>
                    <input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 10 characters, letters + numbers"
                      autoComplete="new-password"
                      disabled={busy}
                      required
                    />
                  </div>
                  <div className="auth-field">
                    <label htmlFor="confirmPassword">Confirm New Password</label>
                    <input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat the new password"
                      autoComplete="new-password"
                      disabled={busy}
                      required
                    />
                  </div>
                  <button className="auth-btn" type="submit" disabled={busy}>
                    {busy ? "Saving…" : "Save & Continue"}
                  </button>
                </form>
              </>
            )}

            <a className="auth-back" href="/">
              ← Back to website
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}

// Server enforces the real lockout; this is only a client-side fallback
// if a locked response arrives without retry_in (should not happen).
const Config_LOCK_SECONDS_FALLBACK = 4 * 3600;
