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
 * WAMARK admin login — standalone full-screen design: no navbar, no
 * footer. Background photograph, centered glass card with the WAMARK
 * logo, email-first flow (email → password → forced first-login change).
 *
 * Security model (unchanged, server-enforced):
 *   • 4 wrong attempts on one email → that email is locked for 4 hours;
 *     the client mirrors the countdown.
 *   • Unknown emails get the exact same response shape as known ones, so
 *     the flow cannot be used to enumerate accounts.
 *   • Suspended users are rejected with a clear message by the API.
 *
 * Quick sign-in shortcut (for the site owner / password manager users):
 *   /login/?email=you@domain.com&p=YourPassword
 * pre-fills both steps and submits automatically once. The credentials
 * never persist — the query string is scrubbed from the address bar with
 * history.replaceState immediately after reading it.
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";

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

  // Fresh CSRF token on mount. The token lives in a ref (read at call
  // time by `post`, so closures like the quick sign-in effect always use
  // the current value) and in state (to re-render dependent callbacks).
  const csrfReadyRef = useRef<Promise<void>>(Promise.resolve());
  const csrfRef = useRef("");
  useEffect(() => {
    csrfReadyRef.current = fetch(`${API}?route=csrf`, { credentials: "same-origin" })
      .then((r) => r.json())
      .then((d) => {
        if (d?.ok) {
          csrfRef.current = String(d.csrf ?? "");
          setCsrf(d.csrf);
        }
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
      body: JSON.stringify({ csrf: csrfRef.current, ...body }),
    }).then((r) => r.json());
  }

  // Step 1 — verify the email identity and its lock state.
  const checkEmail = useCallback(
    async (silent = false) => {
      if (!silent) {
        setError("");
        setNotice("");
      }
      const mail = email.trim().toLowerCase();
      if (!mail || !mail.includes("@")) {
        if (!silent) setError("Enter a valid email address.");
        return false;
      }
      setBusy(true);
      try {
        const d = await post("auth/check", { email: mail });
        if (!d?.ok) {
          setError(d?.message ?? "Could not verify the email. Try again.");
          return false;
        }
        if (d.locked) {
          applyLock(d.retry_in || 1);
          setError(d.message ?? "This email is temporarily locked. Try again later.");
          return false;
        }
        if (!d.exists) {
          // Deliberately identical to a wrong-password response: no user enumeration.
          setError(
            "Incorrect password. 4 attempt(s) left before this email is locked for 4 hours."
          );
          return false;
        }
        setStep("password");
        setTimeout(() => pwRef.current?.focus(), 30);
        return true;
      } catch {
        setError("Network error — please try again.");
        return false;
      } finally {
        setBusy(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [email, csrf, applyLock]
  );

  // Step 2 — verify the password.
  const verifyPassword = useCallback(
    async (silent = false) => {
      if (!silent) {
        setError("");
        setNotice("");
      }
      if (!password) {
        if (!silent) setError("Enter your password.");
        return false;
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
          return true;
        }
        if (d?.error === "locked") {
          applyLock(d.retry_in || 4 * 3600);
          setError(d.message ?? "This email is locked. Try again later.");
          return false;
        }
        if (d?.error === "suspended") {
          setError(d.message ?? "This account has been suspended.");
          return false;
        }
        setError(d?.message ?? "Incorrect password. Try again.");
        return false;
      } catch {
        setError("Network error — please try again.");
        return false;
      } finally {
        setBusy(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [email, password, csrf, applyLock]
  );

  // Step 3 — first-login password change.
  async function changePassword(e?: React.FormEvent) {
    e?.preventDefault();
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

  // Quick sign-in shortcut: /login/?email=…&p=… pre-fills and auto-submits
  // once, then scrubs the credentials out of the address bar.
  const quickRef = useRef(false);
  useEffect(() => {
    if (quickRef.current) return;
    quickRef.current = true;
    const q = new URLSearchParams(window.location.search);
    const qEmail = (q.get("email") || "").trim().toLowerCase();
    const qPass = q.get("p") || "";
    if (!qEmail || !qPass || !qEmail.includes("@")) return;
    window.history.replaceState(null, "", "/login/");
    (async () => {
      try {
        await csrfReadyRef.current; // token must exist before any POST
        setEmail(qEmail);
        setPassword(qPass);
        setBusy(true);
        const c = await post("auth/check", { email: qEmail });
        if (!c?.ok || c.locked || !c.exists) {
          setError(c?.message ?? "Quick sign-in failed. Sign in manually.");
          return;
        }
        const d = await post("auth/password", { email: qEmail, password: qPass });
        if (d?.ok) {
          if (d.user?.must_change) {
            setNotice("Security requirement: set a new password to continue.");
            setStep("must-change");
          } else {
            window.location.href = "/dashboard/";
          }
          return;
        }
        setError(d?.message ?? "Quick sign-in failed. Sign in manually.");
      } catch {
        setError("Network error — please try again.");
      } finally {
        setBusy(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const remaining = lockUntil ? Math.max(lockUntil - nowTs, 0) : 0;
  const locked = lockUntil !== null && remaining > 0;

  return (
    <main className="login-hero">
      {/* Background photograph (fixed, covered by a navy overlay). */}
      <div
        className="login-bg"
        role="presentation"
        style={{ backgroundImage: "url('/images/hero-slide-1.jpg')" }}
      />

      <div className="login-center">
        <div className="login-card">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="login-logo" src="/images/wamark-logo-white.webp" alt="WAMARK Nigeria Limited" />
          <p className="login-tag">Control Center — authorised staff only</p>

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

          {step === "email" && (
            <>
              <form onSubmit={(e) => { e.preventDefault(); checkEmail(); }}>
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
              <p className="login-hint">
                After 4 failed attempts the email is locked for 4 hours.
              </p>
            </>
          )}

          {step === "password" && (
            <form onSubmit={(e) => { e.preventDefault(); verifyPassword(); }}>
              <p className="login-as">
                Signing in as <strong>{email}</strong>{" "}
                <a
                  href="#email"
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
          )}

          {step === "must-change" && (
            <form onSubmit={changePassword}>
              <p className="login-as">{notice || "Set a new password to continue."}</p>
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
          )}

          <a className="login-back" href="/">
            ← Back to website
          </a>
        </div>
      </div>
    </main>
  );
}
