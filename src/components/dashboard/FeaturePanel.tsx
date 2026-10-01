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
 * Dashboard — homepage feature-card images: the image sets shown
 * in the detail modals that open when a visitor clicks one of
 * the three homepage feature cards. Reorder, remove, add by URL,
 * pick from the gallery, or reset to the built-in defaults.
 * Every change is served live through the API — no rebuild.
 */

"use client";

import { useEffect, useState } from "react";
import { jget, jpost } from "./api";

type Set = { no: string; title: string; images: string[] };

/** Card titles, matching the modal headings on the homepage. */
const TITLES: Record<string, string> = {
  "01": "Security System Installations",
  "02": "Technical Surveillance",
  "03": "Oil & Gas Solutions",
};

type GalleryItem = { media_type: string; src: string; active: boolean };

export default function FeaturePanel() {
  const [sets, setSets] = useState<Set[]>([]);
  const [defaults, setDefaults] = useState<Record<string, string[]>>({});
  const [library, setLibrary] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [picks, setPicks] = useState<Record<string, string>>({});

  async function load() {
    setLoading(true);
    const [d, g] = await Promise.all([jget("admin/feature"), jget("admin/gallery")]);
    if (d?.ok) {
      const eff = (d.features as Record<string, string[]>) ?? {};
      setSets(
        Object.keys(eff).map((no) => ({
          no,
          title: TITLES[no] ?? `Feature ${no}`,
          images: eff[no] ?? [],
        }))
      );
      setDefaults((d.defaults as Record<string, string[]>) ?? {});
    }
    if (g?.ok) {
      setLibrary(
        ((g.items as GalleryItem[]) ?? [])
          .filter((it) => it.media_type === "image" && it.active && it.src)
          .map((it) => it.src)
      );
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function flash(kind: "ok" | "err", text: string) {
    setBanner({ kind, text });
    setTimeout(() => setBanner(null), 3600);
  }

  /** Replace one feature's image set on the server. */
  async function save(no: string, images: string[], okText: string) {
    setBusy(true);
    const d = await jpost("admin/feature/update", { no, images });
    if (d?.ok) {
      flash("ok", okText);
      setSets((prev) =>
        prev.map((s) => (s.no === no ? { ...s, images: (d.images as string[]) ?? [] } : s))
      );
    } else {
      flash("err", String(d?.message ?? d?.error ?? "Could not update the images."));
    }
    setBusy(false);
  }

  function addImage(no: string) {
    const src = (urls[no] ?? "").trim();
    const set = sets.find((s) => s.no === no);
    if (!set) return;
    if (!src) {
      flash("err", "Paste an image path or URL first.");
      return;
    }
    if (set.images.includes(src)) {
      flash("err", "That image is already in the set.");
      return;
    }
    save(no, [...set.images, src], "Image added.");
    setUrls((u) => ({ ...u, [no]: "" }));
  }

  function pickGallery(no: string, src: string) {
    const set = sets.find((s) => s.no === no);
    if (!set || !src) return;
    if (set.images.includes(src)) {
      flash("err", "That image is already in the set.");
      return;
    }
    save(no, [...set.images, src], "Image added from the gallery.");
    setPicks((p) => ({ ...p, [no]: "" }));
  }

  function remove(no: string, idx: number) {
    const set = sets.find((s) => s.no === no);
    if (!set) return;
    save(no, set.images.filter((_, i) => i !== idx), "Image removed.");
  }

  function move(no: string, idx: number, dir: -1 | 1) {
    const set = sets.find((s) => s.no === no);
    if (!set) return;
    const j = idx + dir;
    if (j < 0 || j >= set.images.length) return;
    const next = [...set.images];
    [next[idx], next[j]] = [next[j], next[idx]];
    save(no, next, "Order updated.");
  }

  function reset(no: string) {
    save(no, [], "Reset to the default images.");
  }

  if (loading) return <p className="dash-note">Loading feature images…</p>;

  return (
    <div>
      {banner && (
        <div className={banner.kind === "ok" ? "form-success" : "form-error"} role="status">
          {banner.kind === "ok" ? "✔ " : "⚠ "}
          {banner.text}
        </div>
      )}

      <p className="dash-note">
        These are the images shown in the detail box that opens when a
        visitor clicks one of the three homepage feature cards. Changes
        go live immediately — no rebuild needed.
      </p>

      <div className="feat-list">
        {sets.map((s) => {
          const isDefault =
            JSON.stringify(s.images) === JSON.stringify(defaults[s.no] ?? []);
          return (
            <div className="usr-row feat-set" key={s.no}>
              <div className="usr-main" style={{ marginBottom: 12 }}>
                <strong>
                  {s.no} — {s.title}
                </strong>
                <small className="usr-meta">
                  {s.images.length} image{s.images.length === 1 ? "" : "s"}
                  {isDefault ? " · default set" : " · customized"}
                </small>
              </div>

              <div className="feat-imgs">
                {s.images.map((src, i) => (
                  <div className="feat-thumb" key={`${src}-${i}`}>
                    <div className="gm-thumb">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt="" />
                    </div>
                    <small className="gm-src" title={src}>
                      {src}
                    </small>
                    <div className="gm-actions">
                      <button
                        className="gm-ghost"
                        title="Move left"
                        onClick={() => move(s.no, i, -1)}
                        disabled={busy || i === 0}
                      >
                        ←
                      </button>
                      <button
                        className="gm-ghost"
                        title="Move right"
                        onClick={() => move(s.no, i, 1)}
                        disabled={busy || i === s.images.length - 1}
                      >
                        →
                      </button>
                      <button
                        className="gm-ghost gm-del"
                        title="Remove image"
                        onClick={() => remove(s.no, i)}
                        disabled={busy}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
                {s.images.length === 0 && (
                  <p className="dash-note">No images — the default set will be shown.</p>
                )}
              </div>

              <div className="feat-add">
                <div className="form-field" style={{ flex: "1 1 260px" }}>
                  <label htmlFor={`feat-url-${s.no}`}>Add by path or URL</label>
                  <input
                    id={`feat-url-${s.no}`}
                    value={urls[s.no] ?? ""}
                    onChange={(e) => setUrls((u) => ({ ...u, [s.no]: e.target.value }))}
                    placeholder="/images/cctv.webp or https://…/photo.webp"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addImage(s.no);
                      }
                    }}
                  />
                </div>
                <button
                  className="btn btn-green gm-btn"
                  type="button"
                  onClick={() => addImage(s.no)}
                  disabled={busy}
                >
                  Add
                </button>
                <div className="form-field" style={{ flex: "1 1 200px" }}>
                  <label htmlFor={`feat-pick-${s.no}`}>From gallery</label>
                  <select
                    id={`feat-pick-${s.no}`}
                    value={picks[s.no] ?? ""}
                    onChange={(e) => pickGallery(s.no, e.target.value)}
                    disabled={busy || library.length === 0}
                  >
                    <option value="">
                      {library.length === 0 ? "Gallery has no images" : "Pick an image…"}
                    </option>
                    {library.map((src) => (
                      <option key={src} value={src}>
                        {src.split("/").pop()}
                      </option>
                    ))}
                  </select>
                </div>
                {!isDefault && (
                  <button
                    className="gm-linkbtn"
                    type="button"
                    onClick={() => reset(s.no)}
                    disabled={busy}
                  >
                    Reset to defaults
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
