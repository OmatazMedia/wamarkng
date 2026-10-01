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
 * Dashboard — blog manager: write, edit, publish/unpublish and delete
 * posts. Publishing is instant on the public /blog/ pages (they fetch
 * the API live) — no rebuild of the static export needed.
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { jget, jpost } from "./api";

type Post = {
  id: number;
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  body: string;
  cover: string;
  author: string;
  status: "draft" | "published" | string;
  published_at: number | null;
  updated_at: number;
};

type Draft = {
  title: string;
  category: string;
  excerpt: string;
  body: string;
  cover: string;
  slug: string;
};

const emptyDraft: Draft = { title: "", category: "", excerpt: "", body: "", cover: "", slug: "" };

function fmtDate(ts: number | null): string {
  if (!ts) return "—";
  return new Date(ts * 1000).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function BlogPanel() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);

  const [showAdd, setShowAdd] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [publishNow, setPublishNow] = useState(true);

  const [editId, setEditId] = useState<number | null>(null);
  const [edit, setEdit] = useState<Draft>(emptyDraft);
  const titleRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    const d = await jget("admin/blog");
    if (d?.ok) setPosts((d.posts as Post[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function flash(kind: "ok" | "err", text: string) {
    setBanner({ kind, text });
    setTimeout(() => setBanner(null), 3600);
  }

  /* ---------------- create ---------------- */

  async function submitAdd(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const d = await jpost("admin/blog/create", { ...draft, status: publishNow ? "published" : "draft" });
    if (d?.ok) {
      flash("ok", publishNow ? "Post published — live on the blog now." : "Draft saved.");
      setDraft(emptyDraft);
      setShowAdd(false);
      await load();
    } else {
      flash("err", String(d?.message ?? d?.error ?? "Could not save the post."));
    }
    setBusy(false);
  }

  /* ---------------- edit ---------------- */

  function startEdit(p: Post) {
    setConfirmId(null);
    setEditId(p.id);
    setEdit({
      title: p.title,
      category: p.category,
      excerpt: p.excerpt,
      body: p.body,
      cover: p.cover,
      slug: "",
    });
    setTimeout(() => titleRef.current?.focus(), 30);
  }

  async function submitEdit(e: React.FormEvent) {
    e.preventDefault();
    if (editId === null) return;
    setBusy(true);
    const d = await jpost("admin/blog/update", { id: editId, ...edit });
    if (d?.ok) {
      flash("ok", "Post updated.");
      setEditId(null);
      await load();
    } else {
      flash("err", String(d?.message ?? d?.error ?? "Could not update the post."));
    }
    setBusy(false);
  }

  /* ---------------- publish / unpublish / delete ---------------- */

  async function setStatus(p: Post, status: "draft" | "published") {
    setBusy(true);
    const d = await jpost("admin/blog/update", { id: p.id, status });
    setConfirmId(null);
    if (d?.ok) {
      flash("ok", status === "published" ? "Post published — live on the blog now." : "Post unpublished (back to draft).");
      await load();
    } else {
      flash("err", String(d?.message ?? d?.error ?? "Could not change the post status."));
    }
    setBusy(false);
  }

  async function doDelete(p: Post) {
    setBusy(true);
    const d = await jpost("admin/blog/delete", { id: p.id });
    setConfirmId(null);
    if (d?.ok) {
      flash("ok", "Post deleted.");
      await load();
    } else {
      flash("err", String(d?.message ?? d?.error ?? "Could not delete the post."));
    }
    setBusy(false);
  }

  if (loading) return <p className="dash-note">Loading posts…</p>;

  return (
    <div>
      {banner && (
        <div className={banner.kind === "ok" ? "form-success" : "form-error"} role="status">
          {banner.kind === "ok" ? "✔ " : "⚠ "}
          {banner.text}
        </div>
      )}

      {/* -------- toolbar -------- */}
      <div className="gm-toolbar">
        <span className="gm-count">
          {posts.length} post{posts.length === 1 ? "" : "s"} ·{" "}
          {posts.filter((p) => p.status === "published").length} published
        </span>
        <button className="btn btn-green gm-btn" onClick={() => setShowAdd((v) => !v)}>
          {showAdd ? "Close" : "+ NEW POST"}
        </button>
      </div>

      {/* -------- add form -------- */}
      {showAdd && (
        <form className="gm-add" onSubmit={submitAdd}>
          <div className="gm-fields">
            <div className="form-field">
              <label htmlFor="np-title">Title</label>
              <input
                id="np-title"
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                placeholder="e.g. WAMARK completes CCTV rollout in Lekki"
                required
              />
            </div>
            <div className="form-field">
              <label htmlFor="np-cat">Category</label>
              <input
                id="np-cat"
                value={draft.category}
                onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                placeholder="e.g. News, Security Tips, Projects"
              />
            </div>
          </div>
          <div className="form-field">
            <label htmlFor="np-excerpt">Short excerpt (shown in the blog list)</label>
            <input
              id="np-excerpt"
              value={draft.excerpt}
              onChange={(e) => setDraft({ ...draft, excerpt: e.target.value })}
              placeholder="One or two sentences summarising the post"
            />
          </div>
          <div className="form-field">
            <label htmlFor="np-cover">Cover image URL (optional)</label>
            <input
              id="np-cover"
              value={draft.cover}
              onChange={(e) => setDraft({ ...draft, cover: e.target.value })}
              placeholder="/images/project-3.webp or https://…/photo.jpg"
            />
          </div>
          <div className="form-field">
            <label htmlFor="np-body">Body (blank line = new paragraph)</label>
            <textarea
              id="np-body"
              rows={9}
              value={draft.body}
              onChange={(e) => setDraft({ ...draft, body: e.target.value })}
              placeholder="Write the post…"
              required
            />
          </div>
          <label className="usr-check">
            <input
              type="checkbox"
              checked={publishNow}
              onChange={(e) => setPublishNow(e.target.checked)}
            />
            Publish immediately (untick to save as a private draft)
          </label>
          <div className="gm-actions" style={{ marginTop: 12 }}>
            <button className="btn btn-green gm-btn" type="submit" disabled={busy}>
              {busy ? "Saving…" : publishNow ? "Publish post" : "Save draft"}
            </button>
            <button className="gm-linkbtn" type="button" onClick={() => setShowAdd(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* -------- list -------- */}
      <div className="usr-list">
        {posts.map((p) => {
          const published = p.status === "published";
          const confirming = confirmId === p.id;

          if (editId === p.id) {
            return (
              <form className="usr-row usr-editing" key={p.id} onSubmit={submitEdit}>
                <div className="gm-fields" style={{ width: "100%" }}>
                  <div className="form-field">
                    <label htmlFor={`ep-title-${p.id}`}>Title</label>
                    <input
                      id={`ep-title-${p.id}`}
                      ref={titleRef}
                      value={edit.title}
                      onChange={(e) => setEdit({ ...edit, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="gm-fields">
                    <div className="form-field">
                      <label htmlFor={`ep-cat-${p.id}`}>Category</label>
                      <input
                        id={`ep-cat-${p.id}`}
                        value={edit.category}
                        onChange={(e) => setEdit({ ...edit, category: e.target.value })}
                      />
                    </div>
                    <div className="form-field">
                      <label htmlFor={`ep-cover-${p.id}`}>Cover image URL</label>
                      <input
                        id={`ep-cover-${p.id}`}
                        value={edit.cover}
                        onChange={(e) => setEdit({ ...edit, cover: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="form-field">
                    <label htmlFor={`ep-excerpt-${p.id}`}>Short excerpt</label>
                    <input
                      id={`ep-excerpt-${p.id}`}
                      value={edit.excerpt}
                      onChange={(e) => setEdit({ ...edit, excerpt: e.target.value })}
                    />
                  </div>
                  <div className="form-field">
                    <label htmlFor={`ep-body-${p.id}`}>Body</label>
                    <textarea
                      id={`ep-body-${p.id}`}
                      rows={9}
                      value={edit.body}
                      onChange={(e) => setEdit({ ...edit, body: e.target.value })}
                    />
                  </div>
                </div>
                <div className="gm-actions">
                  <button className="btn btn-green gm-btn" type="submit" disabled={busy}>
                    Save
                  </button>
                  <button className="gm-linkbtn" type="button" onClick={() => setEditId(null)}>
                    Cancel
                  </button>
                </div>
              </form>
            );
          }

          return (
            <div className={published ? "usr-row" : "usr-row gm-hidden"} key={p.id}>
              <div className="usr-main">
                <strong>{p.title}</strong>
                <span className="usr-email">/blog/post/?slug={p.slug}</span>
                <small className="usr-meta">
                  {p.category} · {p.author || "—"} · updated {fmtDate(p.updated_at)}
                  {published && p.published_at ? ` · published ${fmtDate(p.published_at)}` : ""}
                </small>
              </div>
              <span className={published ? "usr-badge" : "usr-badge suspended"}>
                {published ? "Published" : "Draft"}
              </span>
              <div className="gm-actions">
                {confirming ? (
                  <>
                    <button className="gm-linkbtn danger" disabled={busy} onClick={() => doDelete(p)}>
                      Confirm delete
                    </button>
                    <button className="gm-linkbtn" disabled={busy} onClick={() => setConfirmId(null)}>
                      Keep
                    </button>
                  </>
                ) : (
                  <>
                    <button className="gm-linkbtn" disabled={busy} onClick={() => startEdit(p)}>
                      Edit
                    </button>
                    <button
                      className="gm-linkbtn"
                      disabled={busy}
                      onClick={() => setStatus(p, published ? "draft" : "published")}
                    >
                      {published ? "Unpublish" : "Publish"}
                    </button>
                    <button
                      className="gm-linkbtn danger"
                      disabled={busy}
                      onClick={() => setConfirmId(p.id)}
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
