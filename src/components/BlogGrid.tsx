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
 * Blog grid — fetches published posts from the PHP API at runtime and
 * re-fetches when the tab regains focus, so dashboard publishing shows
 * up on the static site the moment a visitor loads or returns here.
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import { IconArrowRight } from "@/components/icons";

type Post = {
  id: number;
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  cover: string;
  author: string;
  published_at: number | null;
};

const API = "/api/index.php";

function fmtDate(ts: number | null): string {
  if (!ts) return "";
  return new Date(ts * 1000).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function BlogGrid() {
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [cat, setCat] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async (category: string) => {
    try {
      const res = await fetch(
        `${API}?route=blog${category ? `&category=${encodeURIComponent(category)}` : ""}`,
        { cache: "no-store" }
      );
      const d = await res.json();
      if (d?.ok) {
        setPosts((d.posts as Post[]) ?? []);
        setCategories((d.categories as string[]) ?? []);
        setError("");
      } else {
        setError("Could not load posts right now.");
      }
    } catch {
      setError("Could not reach the news service. Check your connection.");
    }
  }, []);

  useEffect(() => {
    load(cat);
  }, [cat, load]);

  // Pick up posts published after this page was sitting open.
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible") load(cat);
    };
    const t = setInterval(() => load(cat), 120000);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [cat, load]);

  return (
    <section className="section">
      <div className="container">
        <span className="sec-tag">News &amp; Insights</span>
        <h2 className="sec-title">Latest From Our Blog</h2>

        {categories.length > 0 && (
          <div className="blog-filters" role="tablist" aria-label="Filter by category">
            <button
              className={cat === "" ? "blog-chip active" : "blog-chip"}
              onClick={() => setCat("")}
            >
              All
            </button>
            {categories.map((c) => (
              <button
                key={c}
                className={cat === c ? "blog-chip active" : "blog-chip"}
                onClick={() => setCat(c)}
              >
                {c}
              </button>
            ))}
          </div>
        )}

        {error && <p className="form-error" style={{ marginTop: 24 }}>{error}</p>}

        {posts === null && !error && (
          <p style={{ marginTop: 28, color: "var(--muted)" }}>Loading posts…</p>
        )}

        {posts !== null && posts.length === 0 && !error && (
          <p style={{ marginTop: 28, color: "var(--muted)" }}>
            No posts published yet — check back soon.
          </p>
        )}

        <div className="blog-grid">
          {(posts ?? []).map((p) => (
            <article className="blog-card" key={p.id}>
              <a className="blog-thumb" href={`/blog/post/?slug=${encodeURIComponent(p.slug)}`}>
                {p.cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.cover} alt={p.title} />
                ) : (
                  <span className="blog-thumb-fallback" aria-hidden="true">
                    {p.category}
                  </span>
                )}
                {p.published_at && <span className="blog-date">{fmtDate(p.published_at)}</span>}
              </a>
              <div className="blog-body">
                <h3>
                  <a href={`/blog/post/?slug=${encodeURIComponent(p.slug)}`}>{p.title}</a>
                </h3>
                <p>{p.excerpt}</p>
                <a
                  className="link-more"
                  href={`/blog/post/?slug=${encodeURIComponent(p.slug)}`}
                >
                  Read More <IconArrowRight />
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
