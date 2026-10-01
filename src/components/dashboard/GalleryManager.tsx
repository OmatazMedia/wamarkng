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
 * Dashboard — gallery manager: upload images/videos (file or URL),
 * edit title/category/caption, hide/show, reorder, delete. Every action
 * hits the live PHP API and refreshes the list in place.
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { jget, jpost, jupload } from "./api";

type Item = {
  id: number;
  title: string;
  category: string;
  media_type: string;
  src: string;
  poster: string;
  caption: string;
  sort: number;
  active: boolean;
};

type Draft = {
  title: string;
  category: string;
  caption: string;
  src: string;
  poster: string;
};

const emptyDraft: Draft = { title: "", category: "", caption: "", src: "", poster: "" };

export default function GalleryManager() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);

  // Add form state
  const [showAdd, setShowAdd] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [file, setFile] = useState<File | null>(null);
  const [mediaKind, setMediaKind] = useState<"image" | "video">("image");
  const [sourceMode, setSourceMode] = useState<"upload" | "url">("upload");
  const fileRef = useRef<HTMLInputElement>(null);

  // Edit state (one item at a time)
  const [editId, setEditId] = useState<number | null>(null);
  const [edit, setEdit] = useState<Draft>(emptyDraft);

  async function load() {
    setLoading(true);
    const d = await jget("admin/gallery");
    if (d?.ok) setItems((d.items as Item[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function flash(kind: "ok" | "err", text: string) {
    setBanner({ kind, text });
    setTimeout(() => setBanner(null), 3200);
  }

  function note(d: Record<string, unknown>, okText: string) {
    if (d?.ok) {
      flash("ok", okText);
      return true;
    }
    const map: Record<string, string> = {
      bad_type: "That file type is not allowed (images: webp/jpg/png/gif/avif; video: mp4/webm/mov).",
      bad_mime: "The file content does not look like a real image or video.",
      too_large: "File is larger than the 8 MB limit.",
      bad_src: "That media path/URL is not allowed.",
      bad_src_url: "Only direct media files or YouTube/Vimeo links are accepted.",
      upload_failed: "The upload failed — check the file and try again.",
      storage_unavailable: "The uploads folder is not writable on the server.",
    };
    flash("err", (d?.message as string) ?? map[String(d?.error)] ?? "Action failed. Try again.");
    return false;
  }

  /* ---------------- upload / create ---------------- */

  async function submitAdd(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      let d: Record<string, unknown>;
      if (sourceMode === "upload") {
        if (!file) {
          flash("err", "Choose a file first.");
          return;
        }
        const fd = new FormData();
        fd.set("file", file);
        fd.set("media_type", mediaKind);
        fd.set("title", draft.title);
        fd.set("category", draft.category || "General");
        fd.set("caption", draft.caption);
        d = (await jupload("gallery", fd)) as Record<string, unknown>;
      } else {
        if (!draft.src.trim()) {
          flash("err", "Paste a media URL first.");
          return;
        }
        const isImage = /\.(webp|jpe?g|png|gif|avif)(\?|$)/i.test(draft.src);
        d = (await jpost("gallery", {
          media_type: isImage ? "image" : "video",
          src: draft.src.trim(),
          title: draft.title,
          category: draft.category || "General",
          caption: draft.caption,
        })) as Record<string, unknown>;
      }
      if (note(d, "Added to the gallery.")) {
        setDraft(emptyDraft);
        setFile(null);
        if (fileRef.current) fileRef.current.value = "";
        setShowAdd(false);
        await load();
      }
    } catch {
      flash("err", "Network error — try again.");
    } finally {
      setBusy(false);
    }
  }

  /* ---------------- edit ---------------- */

  function startEdit(it: Item) {
    setEditId(it.id);
    setEdit({
      title: it.title,
      category: it.category,
      caption: it.caption,
      src: it.src,
      poster: it.poster,
    });
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (editId === null) return;
    setBusy(true);
    try {
      const d = await jpost("gallery/update", { id: editId, ...edit });
      if (note(d, "Changes saved.")) {
        setEditId(null);
        await load();
      }
    } finally {
      setBusy(false);
    }
  }

  /* ---------------- visibility / delete / reorder ---------------- */

  async function toggle(it: Item) {
    setBusy(true);
    try {
      const d = await jpost("gallery/update", { id: it.id, active: !it.active });
      if (note(d, it.active ? "Item hidden from the website." : "Item is now visible.")) await load();
    } finally {
      setBusy(false);
    }
  }

  async function doDelete(id: number) {
    setBusy(true);
    setConfirmId(null);
    try {
      const d = await jpost("gallery/delete", { id });
      if (note(d, "Item deleted.")) await load();
    } finally {
      setBusy(false);
    }
  }

  async function move(it: Item, dir: -1 | 1) {
    setBusy(true);
    try {
      const d = await jpost("gallery/update", { id: it.id, sort: it.sort + dir * 5 });
      if (note(d, "Order updated.")) await load();
    } finally {
      setBusy(false);
    }
  }

  /* ---------------- render ---------------- */

  if (loading) return <p className="dash-note">Loading gallery…</p>;

  return (
    <div>
      {banner && (
        <div className={banner.kind === "ok" ? "form-success" : "form-error"} role="status">
          {banner.kind === "ok" ? "✔ " : "⚠ "}
          {banner.text}
        </div>
      )}

      <div className="gm-toolbar">
        <span>
          {items.length} item{items.length === 1 ? "" : "s"} · {items.filter((i) => i.active).length} visible
        </span>
        <button className="btn btn-green gm-btn" onClick={() => setShowAdd((v) => !v)}>
          {showAdd ? "Close" : "+ Add media"}
        </button>
      </div>

      {showAdd && (
        <form className="gm-add" onSubmit={submitAdd}>
          <div className="gm-modes">
            <label className={sourceMode === "upload" ? "gm-mode active" : "gm-mode"}>
              <input
                type="radio"
                name="srcmode"
                checked={sourceMode === "upload"}
                onChange={() => setSourceMode("upload")}
              />
              Upload file
            </label>
            <label className={sourceMode === "url" ? "gm-mode active" : "gm-mode"}>
              <input
                type="radio"
                name="srcmode"
                checked={sourceMode === "url"}
                onChange={() => setSourceMode("url")}
              />
              From URL
            </label>
            <label className="gm-kind">
              <input
                type="checkbox"
                checked={mediaKind === "video"}
                onChange={(e) => setMediaKind(e.target.checked ? "video" : "image")}
              />
              This is a video
            </label>
          </div>

          {sourceMode === "upload" ? (
            <div className="form-field">
              <label htmlFor="gm-file">Media file</label>
              <input
                id="gm-file"
                ref={fileRef}
                type="file"
                accept="image/*,video/mp4,video/webm,video/quicktime"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                required
              />
            </div>
          ) : (
            <div className="form-field">
              <label htmlFor="gm-src">Media URL</label>
              <input
                id="gm-src"
                type="url"
                value={draft.src}
                onChange={(e) => setDraft({ ...draft, src: e.target.value })}
                placeholder="https://…/photo.webp or a YouTube/Vimeo link"
              />
            </div>
          )}

          <div className="gm-fields">
            <div className="form-field">
              <label htmlFor="gm-title">Title</label>
              <input
                id="gm-title"
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                placeholder="e.g. CCTV Installation — Lagos"
              />
            </div>
            <div className="form-field">
              <label htmlFor="gm-cat">Category</label>
              <input
                id="gm-cat"
                value={draft.category}
                onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                placeholder="e.g. Surveillance"
              />
            </div>
          </div>
          <div className="form-field">
            <label htmlFor="gm-cap">Caption</label>
            <input
              id="gm-cap"
              value={draft.caption}
              onChange={(e) => setDraft({ ...draft, caption: e.target.value })}
              placeholder="Short caption shown under the item"
            />
          </div>

          <button className="btn btn-green gm-btn" type="submit" disabled={busy}>
            {busy ? "Saving…" : "Add to gallery"}
          </button>
        </form>
      )}

      <div className="gm-list">
        {items.map((it) => (
          <div key={it.id} className={it.active ? "gm-row" : "gm-row gm-hidden"}>
            <div className="gm-thumb">
              {it.media_type === "video" ? (
                it.poster ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={it.poster} alt="" />
                ) : (
                  <span className="gm-video-badge">▶</span>
                )
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={it.src} alt="" />
              )}
            </div>

            {editId === it.id ? (
              <form className="gm-edit" onSubmit={saveEdit}>
                <div className="gm-fields">
                  <input
                    aria-label="Title"
                    value={edit.title}
                    onChange={(e) => setEdit({ ...edit, title: e.target.value })}
                    placeholder="Title"
                  />
                  <input
                    aria-label="Category"
                    value={edit.category}
                    onChange={(e) => setEdit({ ...edit, category: e.target.value })}
                    placeholder="Category"
                  />
                </div>
                <input
                  aria-label="Caption"
                  value={edit.caption}
                  onChange={(e) => setEdit({ ...edit, caption: e.target.value })}
                  placeholder="Caption"
                />
                <div className="gm-actions">
                  <button className="btn btn-green gm-btn" type="submit" disabled={busy}>Save</button>
                  <button className="gm-ghost" type="button" onClick={() => setEditId(null)}>Cancel</button>
                </div>
              </form>
            ) : (
              <div className="gm-meta">
                <strong>{it.title || "(untitled)"}</strong>
                <small>
                  {it.category} · {it.media_type}
                  {it.active ? "" : " · hidden"}
                </small>
                {it.caption && <p>{it.caption}</p>}
                <small className="gm-src">{it.src}</small>
              </div>
            )}

            {editId !== it.id && (
              <div className="gm-actions">
                <button className="gm-ghost" title="Move up" onClick={() => move(it, 1)} disabled={busy}>↑</button>
                <button className="gm-ghost" title="Move down" onClick={() => move(it, -1)} disabled={busy}>↓</button>
                <button className="gm-ghost" onClick={() => startEdit(it)} disabled={busy}>Edit</button>
                <button className="gm-ghost" onClick={() => toggle(it)} disabled={busy}>
                  {it.active ? "Hide" : "Show"}
                </button>
                {confirmId === it.id ? (
                  <>
                    <button
                      className="gm-danger"
                      onClick={() => doDelete(it.id)}
                      disabled={busy}
                    >
                      Confirm delete
                    </button>
                    <button className="gm-ghost" onClick={() => setConfirmId(null)}>Keep</button>
                  </>
                ) : (
                  <button className="gm-ghost gm-del" onClick={() => setConfirmId(it.id)} disabled={busy}>
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
        {items.length === 0 && <p className="dash-note">No gallery items yet — add your first one above.</p>}
      </div>
    </div>
  );
}
