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
 * Dashboard — site settings: contact details the website shows and the
 * inbox the mailer delivers to. Outgoing mail identity (no-reply@domain)
 * is derived from the host and shown for reference.
 */

"use client";

import { useEffect, useState } from "react";
import { jget, jpost } from "./api";

type Settings = {
  site_name: string;
  site_tagline: string;
  contact_email: string;
  contact_phones: string;
  contact_address: string;
};

const empty: Settings = {
  site_name: "",
  site_tagline: "",
  contact_email: "",
  contact_phones: "",
  contact_address: "",
};

export default function SettingsPanel() {
  const [settings, setSettings] = useState<Settings>(empty);
  const [mailFrom, setMailFrom] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    jget("admin/settings").then((d) => {
      if (d?.ok) {
        setSettings({ ...empty, ...(d.settings as Settings) });
        setMailFrom(String(d.mail_from ?? ""));
      }
      setLoading(false);
    });
  }, []);

  function flash(kind: "ok" | "err", text: string) {
    setBanner({ kind, text });
    setTimeout(() => setBanner(null), 3200);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const d = await jpost("admin/settings", { ...settings });
    if (d?.ok) {
      setSettings({ ...empty, ...(d.settings as Settings) });
      flash("ok", "Settings saved.");
    } else {
      flash("err", String(d?.message ?? d?.error ?? "Could not save settings."));
    }
    setBusy(false);
  }

  if (loading) return <p className="dash-note">Loading settings…</p>;

  const field = (key: keyof Settings, label: string, opts?: { wide?: boolean }) => (
    <div className={opts?.wide ? "form-field full" : "form-field"}>
      <label htmlFor={`st-${key}`}>{label}</label>
      <input
        id={`st-${key}`}
        value={settings[key]}
        onChange={(e) => setSettings({ ...settings, [key]: e.target.value })}
      />
    </div>
  );

  return (
    <div>
      {banner && (
        <div className={banner.kind === "ok" ? "form-success" : "form-error"} role="status">
          {banner.kind === "ok" ? "✔ " : "⚠ "}
          {banner.text}
        </div>
      )}

      <form className="gm-add" onSubmit={save}>
        <div className="gm-fields">
          {field("site_name", "Site name")}
          {field("site_tagline", "Tagline")}
        </div>
        {field("contact_email", "Contact email (enquiries are delivered here)")}
        <div className="gm-fields">
          {field("contact_phones", "Contact phones")}
          {field("contact_address", "Address")}
        </div>

        <p className="dash-note">
          Outgoing mail is sent from <code>{mailFrom || "no-reply@your-domain"}</code>{" "}
          automatically — no email credentials needed on cPanel.
        </p>

        <button className="btn btn-green gm-btn" type="submit" disabled={busy}>
          {busy ? "Saving…" : "Save settings"}
        </button>
      </form>
    </div>
  );
}
