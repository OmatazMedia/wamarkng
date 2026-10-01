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
 * Blog post reader — static shell that fetches the post by ?slug= from
 * the API at runtime. New posts are readable the instant they are
 * published from the dashboard, with no rebuild of the export.
 */

"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import PageHero from "@/components/PageHero";

type Post = {
  id: number;
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  body: string;
  cover: string;
  author: string;
  published_at: number | null;
};

const API = "/api/index.php";

export default function BlogPostPage() {
  return (
    <Suspense fallback={<main><PageHero title="Blog" crumb="Blog" /></main>}>
      <BlogPostInner />
    </Suspense>
  );
}

function BlogPostInner() {
  const params = useSearchParams();
  const slug = params.get("slug") || "";
  const [post, setPost] = useState<Post | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "missing" | "error">("loading");

  useEffect(() => {
    if (!slug) {
      setState("missing");
      return;
    }
    let alive = true;
    fetch(`${API}?route=blog/post&slug=${encodeURIComponent(slug)}`, { cache: "no-store" })
      .then(async (r) => {
        const d = await r.json();
        if (!alive) return;
        if (d?.ok) {
          setPost(d.post as Post);
          setState("ready");
        } else {
          setState(r.status === 404 ? "missing" : "error");
        }
      })
      .catch(() => alive && setState("error"));
    return () => {
      alive = false;
    };
  }, [slug]);

  function fmtDate(ts: number | null): string {
    if (!ts) return "";
    return new Date(ts * 1000).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  return (
    <main>
      <PageHero title="Blog" crumb="Blog" />

      <section className="section">
        <div className="container" style={{ maxWidth: 820 }}>
          {state === "loading" && <p style={{ color: "var(--muted)" }}>Loading…</p>}

          {state === "missing" && (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <h2 className="sec-title">Post not found</h2>
              <p style={{ color: "var(--muted)", margin: "14px 0 26px" }}>
                This post may have been unpublished or the link is incorrect.
              </p>
              <a className="btn btn-green" href="/blog/">
                ← Back to the blog
              </a>
            </div>
          )}

          {state === "error" && (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <h2 className="sec-title">Something went wrong</h2>
              <p style={{ color: "var(--muted)", margin: "14px 0 26px" }}>
                Could not load this post. Please try again.
              </p>
              <a className="btn btn-green" href="/blog/">
                ← Back to the blog
              </a>
            </div>
          )}

          {state === "ready" && post && (
            <article>
              <span className="sec-tag">{post.category}</span>
              <h1 style={{ fontSize: 34, lineHeight: 1.25, margin: "10px 0 14px" }}>
                {post.title}
              </h1>
              <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 22 }}>
                {post.published_at && <>Published {fmtDate(post.published_at)}</>}
                {post.author && <> · By {post.author}</>}
              </p>

              {post.cover && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={post.cover}
                  alt={post.title}
                  style={{ width: "100%", height: 360, objectFit: "cover", borderRadius: 12, marginBottom: 26 }}
                />
              )}

              <div className="post-body">
                {post.body.split(/\n{2,}/).map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>

              <div style={{ marginTop: 42 }}>
                <a className="btn btn-green" href="/blog/">
                  ← Back to the blog
                </a>
              </div>
            </article>
          )}
        </div>
      </section>
    </main>
  );
}
