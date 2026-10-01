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
 * WAMARK dashboard shell: auth gate, sidebar, top bar with avatar
 * dropdown (profile / sign out), and the four screens — overview,
 * gallery manager, messages and site settings. The screens live in
 * src/components/dashboard/* and talk to the PHP API via api.ts.
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { jget, jpost, resetCsrf } from "@/components/dashboard/api";
import GalleryManager from "@/components/dashboard/GalleryManager";
import MessagesPanel from "@/components/dashboard/MessagesPanel";
import SettingsPanel from "@/components/dashboard/SettingsPanel";
import UsersPanel from "@/components/dashboard/UsersPanel";

type User = { email: string; name: string; must_change: boolean; role?: string };
type Summary = { messages: number; gallery: number; users: number; mail_from: string };

type Tab = "overview" | "gallery" | "messages" | "users" | "settings";

const TAB_TITLES: Record<Tab, string> = {
  overview: "Dashboard",
  gallery: "Gallery Projects",
  messages: "Messages",
  users: "User Management",
  settings: "Site Settings",
};

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [menuOpen, setMenuOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Auth gate: bounce to /login/ unless a valid session exists.
  useEffect(() => {
    jget("auth/me").then((d) => {
      if (d?.ok) {
        setUser(d.user as User);
        setReady(true);
      }
    });
  }, []);

  // Live summary for the overview cards (refreshed on tab switch too).
  useEffect(() => {
    if (!user) return;
    jget("admin/summary").then((d) => {
      if (d?.ok) setSummary(d.data as Summary);
    });
  }, [user, tab]);

  // Close the avatar dropdown on outside clicks.
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  async function signOut() {
    await jpost("auth/logout").catch(() => undefined);
    resetCsrf();
    window.location.href = "/login/";
  }

  if (!ready || !user) {
    return (
      <main style={{ minHeight: "60vh", display: "grid", placeItems: "center" }}>
        <p style={{ color: "var(--muted)" }}>Checking your session…</p>
      </main>
    );
  }

  const initials = (user.name || user.email).slice(0, 2).toUpperCase();

  return (
    <main className="dash">
      <div className="dash-layout">
        {/* -------- Sidebar -------- */}
        <aside className="dash-side">
          <div className="dash-brand">WAMARK</div>
          <nav>
            {([
              "overview",
              "gallery",
              "messages",
              ...(user.role === "admin" ? (["users"] as Tab[]) : []),
              "settings",
            ] as Tab[]).map((t) => (
              <button
                key={t}
                className={tab === t ? "dash-link active" : "dash-link"}
                onClick={() => setTab(t)}
              >
                {t === "overview"
                  ? "Dashboard"
                  : t === "gallery"
                    ? "Gallery Projects"
                    : t === "messages"
                      ? `Messages${summary ? ` (${summary.messages})` : ""}`
                      : TAB_TITLES[t]}
              </button>
            ))}
          </nav>
          <div className="dash-side-foot">
            Mail identity: <code>{summary?.mail_from ?? "—"}</code>
          </div>
        </aside>

        {/* -------- Main column -------- */}
        <div className="dash-main">
          <header className="dash-top">
            <strong>{TAB_TITLES[tab]}</strong>
            <div className="dash-avatar-wrap" ref={menuRef}>
              <button
                className="dash-avatar"
                onClick={() => setMenuOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                {initials}
              </button>
              {menuOpen && (
                <div className="dash-menu" role="menu">
                  <div className="dash-menu-head">
                    <strong>{user.name || "Administrator"}</strong>
                    <small>{user.email}</small>
                  </div>
                  <button
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      setTab("settings");
                    }}
                  >
                    Profile &amp; settings
                  </button>
                  <button role="menuitem" className="danger" onClick={signOut}>
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </header>

          <div className="dash-content">
            {tab === "overview" && (
              <>
                <div className="dash-cards">
                  <div className="dash-card">
                    <small>Gallery items</small>
                    <strong>{summary?.gallery ?? "—"}</strong>
                  </div>
                  <div className="dash-card">
                    <small>Contact messages</small>
                    <strong>{summary?.messages ?? "—"}</strong>
                  </div>
                  <div className="dash-card">
                    <small>Dashboard users</small>
                    <strong>{summary?.users ?? "—"}</strong>
                  </div>
                  <div className="dash-card">
                    <small>Outgoing mail</small>
                    <strong>{summary?.mail_from ?? "—"}</strong>
                  </div>
                </div>
                <p className="dash-note">
                  Upload and manage the Projects gallery, read website enquiries
                  and update the site's contact details — all changes go live
                  immediately through the API.
                </p>
              </>
            )}

            {tab === "gallery" && <GalleryManager />}
            {tab === "messages" && <MessagesPanel />}
            {tab === "users" && <UsersPanel />}
            {tab === "settings" && <SettingsPanel />}
          </div>
        </div>
      </div>
    </main>
  );
}
