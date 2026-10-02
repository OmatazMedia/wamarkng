import { NextRequest, NextResponse } from "next/server";
import {
  store,
  User,
  generateSlug,
  validateEmail,
  humanSeconds,
} from "@/lib/server-api";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";

// Upload directory path
const UPLOAD_DIR = path.join(process.cwd(), "public", "api", "data", "uploads");

function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

function getSession(req: NextRequest) {
  let sid = req.cookies.get("wamark_sid")?.value;
  if (!sid) {
    sid = crypto.randomBytes(16).toString("hex");
  }
  const session = store.getSession(sid);
  return { sid, session };
}

function jsonResponse(data: unknown, status = 200, sid?: string) {
  const res = NextResponse.json(data, { status });
  if (sid) {
    res.cookies.set("wamark_sid", sid, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
    });
  }
  return res;
}

function checkCsrf(
  req: NextRequest,
  session: { csrf: string },
  body?: Record<string, unknown>
): boolean {
  const headerToken = req.headers.get("x-csrf-token");
  const bodyToken = typeof body?.csrf === "string" ? body.csrf : null;
  const token = headerToken || bodyToken;
  if (!token || !session.csrf) return false;
  return token === session.csrf;
}

function getAuthUser(session: { uid?: number }) {
  if (!session.uid) return null;
  const user = store.users.find((u) => u.id === session.uid);
  if (!user) return null;
  if (user.status === "suspended") {
    session.uid = undefined;
    return null;
  }
  return user;
}

export async function GET(req: NextRequest) {
  const { sid, session } = getSession(req);
  const { searchParams } = new URL(req.url);
  const route = (searchParams.get("route") || "").replace(/^\/+|\/+$/g, "");

  // 1. Service status
  if (route === "") {
    return jsonResponse(
      {
        ok: true,
        service: "wamark-api",
        installed: store.installed,
        version: "1.0.0",
      },
      200,
      sid
    );
  }

  // 2. CSRF + Captcha
  if (route === "csrf") {
    const a = Math.floor(Math.random() * 8) + 2;
    const b = Math.floor(Math.random() * 8) + 2;
    session.captcha_sum = a + b;
    return jsonResponse(
      {
        ok: true,
        csrf: session.csrf,
        captcha: { a, b },
      },
      200,
      sid
    );
  }

  // 3. Public site settings
  if (route === "settings") {
    return jsonResponse(
      {
        ok: true,
        settings: {
          site_name: store.settings.site_name,
          site_tagline: store.settings.site_tagline,
          contact_email: store.settings.contact_email,
          contact_phones: store.settings.contact_phones,
          contact_address: store.settings.contact_address,
        },
      },
      200,
      sid
    );
  }

  // 4. Public gallery
  if (route === "gallery") {
    const items = store.gallery
      .filter((g) => g.active)
      .sort((a, b) => b.sort - a.sort || b.id - a.id)
      .map((g) => ({
        id: g.id,
        title: g.title,
        category: g.category,
        media_type: g.media_type,
        src: g.src,
        poster: g.poster,
        caption: g.caption,
        sort: g.sort,
        active: g.active,
      }));
    return jsonResponse({ ok: true, items }, 200, sid);
  }

  // 5. Public blog
  if (route === "blog") {
    const category = searchParams.get("category") || "";
    let posts = store.posts
      .filter((p) => p.status === "published")
      .sort((a, b) => (b.published_at || 0) - (a.published_at || 0));

    if (category) {
      posts = posts.filter((p) => p.category === category);
    }

    const categories = Array.from(
      new Set(
        store.posts
          .filter((p) => p.status === "published")
          .map((p) => p.category)
      )
    ).sort();

    return jsonResponse(
      {
        ok: true,
        posts,
        categories,
      },
      200,
      sid
    );
  }

  if (route === "blog/post") {
    const slug = searchParams.get("slug") || "";
    const post = store.posts.find(
      (p) => p.slug === slug && p.status === "published"
    );
    if (!post) {
      return jsonResponse({ ok: false, error: "not_found" }, 404, sid);
    }
    return jsonResponse({ ok: true, post }, 200, sid);
  }

  if (route === "blog/categories") {
    const categories = Array.from(
      new Set(
        store.posts
          .filter((p) => p.status === "published")
          .map((p) => p.category)
      )
    ).sort();
    return jsonResponse({ ok: true, categories }, 200, sid);
  }

  // 6. Homepage feature images
  if (route === "feature") {
    return jsonResponse(
      {
        ok: true,
        features: store.getEffectiveFeatures(),
      },
      200,
      sid
    );
  }

  // 7. Auth: me
  if (route === "auth/me") {
    const user = getAuthUser(session);
    if (!user) {
      return jsonResponse({ ok: false, error: "unauthorized" }, 401, sid);
    }
    return jsonResponse(
      {
        ok: true,
        user: {
          email: user.email,
          name: user.name,
          must_change: user.must_change,
          role: user.role,
          status: user.status,
          last_login: user.last_login_at,
        },
      },
      200,
      sid
    );
  }

  // ================= ADMIN ROUTES =================
  const adminUser = getAuthUser(session);
  if (!adminUser) {
    return jsonResponse({ ok: false, error: "unauthorized" }, 401, sid);
  }

  if (adminUser.must_change) {
    return jsonResponse({ ok: false, error: "must_change_password" }, 403, sid);
  }

  if (route === "admin/summary") {
    return jsonResponse(
      {
        ok: true,
        data: {
          messages: store.messages.length,
          gallery: store.gallery.length,
          users: store.users.length,
          posts: store.posts.length,
          domain: "wamarkng.com",
          mail_from: "no-reply@wamarkng.com",
        },
      },
      200,
      sid
    );
  }

  if (route === "admin/messages") {
    return jsonResponse({ ok: true, messages: store.messages }, 200, sid);
  }

  if (route === "admin/settings") {
    return jsonResponse(
      {
        ok: true,
        settings: {
          site_name: store.settings.site_name,
          site_tagline: store.settings.site_tagline,
          contact_email: store.settings.contact_email,
          contact_phones: store.settings.contact_phones,
          contact_address: store.settings.contact_address,
        },
        mail_from: "no-reply@wamarkng.com",
        domain: "wamarkng.com",
      },
      200,
      sid
    );
  }

  if (route === "admin/gallery") {
    const items = store.gallery
      .slice()
      .sort((a, b) => b.sort - a.sort || b.id - a.id);
    return jsonResponse({ ok: true, items }, 200, sid);
  }

  if (route === "admin/blog") {
    const posts = store.posts.slice().sort((a, b) => {
      if (a.status === "published" && b.status !== "published") return -1;
      if (a.status !== "published" && b.status === "published") return 1;
      return b.updated_at - a.updated_at;
    });
    return jsonResponse({ ok: true, posts }, 200, sid);
  }

  if (route === "admin/feature") {
    return jsonResponse(
      {
        ok: true,
        features: store.getEffectiveFeatures(),
        defaults: store.getFeatureDefaults(),
      },
      200,
      sid
    );
  }

  if (route === "admin/users") {
    if (adminUser.role !== "admin") {
      return jsonResponse(
        {
          ok: false,
          error: "forbidden",
          message: "Only administrators can manage users.",
        },
        403,
        sid
      );
    }
    return jsonResponse(
      {
        ok: true,
        users: store.users.map((u) => ({
          id: u.id,
          email: u.email,
          name: u.name,
          role: u.role,
          status: u.status,
          must_change: u.must_change,
          created_at: u.created_at,
          last_login_at: u.last_login_at,
          created_by: u.created_by,
        })),
        me: adminUser.id,
      },
      200,
      sid
    );
  }

  return jsonResponse({ ok: false, error: "not_found" }, 404, sid);
}

// Rate limiter: Max 3 submissions per 10 minutes per IP
const rateLimitMap = new Map<string, number[]>();

function checkRateLimit(ip: string, limit = 3, windowMs = 10 * 60 * 1000): boolean {
  const now = Date.now();
  const timestamps = (rateLimitMap.get(ip) || []).filter((t) => now - t < windowMs);
  if (timestamps.length >= limit) {
    rateLimitMap.set(ip, timestamps);
    return false; // Exceeded
  }
  timestamps.push(now);
  rateLimitMap.set(ip, timestamps);
  return true; // Allowed
}

// Spam content scrutiny
function scrutinizeMessage(text: string, subject: string, name: string): boolean {
  const combined = `${name} ${subject} ${text}`.toLowerCase();

  // 1. Link count check (more than 2 links is typically spam)
  const linkMatches = text.match(/https?:\/\/|www\.|\.com\/|\.xyz|\.ru|\.top|\.click|\[url=/gi);
  if (linkMatches && linkMatches.length >= 2) {
    return true; // Spam
  }

  // 2. High-confidence spam keywords
  const spamRegex = /\b(casino|viagra|cialis|crypto|bitcoin|forex|telegram\s*bot|bulk\s*email|seo\s*ranking|guest\s*post|backlinks?|rank\s*#?1|make\s*money\s*fast|dating\s*service|sex\s*video|porn|erotic|whatsapp\s*blast|lottery\s*winner|wire\s*transfer|bank\s*guarantee|pills\s*online|weight\s*loss\s*secret)\b/i;
  if (spamRegex.test(combined)) {
    return true; // Spam
  }

  // 3. Cyrillic/Russian script link spam detection in English contact forms
  if (/[а-яА-ЯЁё]/.test(text) && /https?:\/\/|www\./i.test(text)) {
    return true; // Spam
  }

  // 4. Obfuscated messaging handles
  if (/t\s*\.\s*m\s*e\s*\//i.test(text) || /w\s*a\s*\.\s*m\s*e\s*\//i.test(text)) {
    return true; // Spam
  }

  return false;
}

export async function POST(req: NextRequest) {
  const { sid, session } = getSession(req);
  const { searchParams } = new URL(req.url);
  const route = (searchParams.get("route") || "").replace(/^\/+|\/+$/g, "");

  const contentType = req.headers.get("content-type") || "";
  let body: Record<string, unknown> = {};
  let uploadFile: File | null = null;

  if (contentType.includes("multipart/form-data")) {
    try {
      const fd = await req.formData();
      const maybeFile = fd.get("file");
      if (maybeFile && typeof maybeFile === "object" && "arrayBuffer" in maybeFile) {
        uploadFile = maybeFile as File;
      }
      for (const [key, value] of fd.entries()) {
        if (typeof value === "string") {
          body[key] = value;
        }
      }
    } catch {
      // parse error
    }
  } else if (contentType.includes("application/json")) {
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      body = {};
    }
  }

  // 1. Contact form
  if (route === "contact") {
    if (!checkCsrf(req, session, body)) {
      return jsonResponse({ ok: false, error: "bad_csrf" }, 403, sid);
    }

    // Honeypot check
    if (typeof body._hp === "string" && body._hp.trim() !== "") {
      return jsonResponse({ ok: true, sent: true }, 200, sid);
    }

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0] ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";

    // Rate limiting check (3 submissions per 10 minutes)
    if (!checkRateLimit(ip, 3, 10 * 60 * 1000)) {
      return jsonResponse(
        {
          ok: false,
          error: "rate_limited",
          message:
            "Sending rate limit exceeded. You can only send up to 3 messages per 10 minutes. Please try again later or reach us on WhatsApp.",
        },
        429,
        sid
      );
    }

    // Captcha proof
    const expected = session.captcha_sum ?? -1;
    session.captcha_sum = undefined;
    const answer = Number(body.captcha_answer);
    if (answer !== expected) {
      return jsonResponse(
        {
          ok: false,
          error: "captcha_failed",
          message: "Human verification failed. Please try the new question.",
        },
        422,
        sid
      );
    }

    const name = String(body.name || "").trim().slice(0, 120);
    const email = String(body.email || "").trim().toLowerCase().slice(0, 254);
    const phone = String(body.phone || "").trim().slice(0, 40);
    const subject = String(body.subject || "").trim().slice(0, 150);
    const message = String(body.message || "").trim().slice(0, 5000);

    if (name.length < 2) {
      return jsonResponse({ ok: false, error: "invalid_name" }, 422, sid);
    }
    if (!validateEmail(email)) {
      return jsonResponse({ ok: false, error: "invalid_email" }, 422, sid);
    }
    if (message.length < 10) {
      return jsonResponse(
        {
          ok: false,
          error: "invalid_message",
          message: "Message must be at least 10 characters.",
        },
        422,
        sid
      );
    }

    // Spam scrutiny check
    if (scrutinizeMessage(message, subject, name)) {
      return jsonResponse(
        {
          ok: false,
          error: "spam_detected",
          message: "Such messages are not allowed here.",
        },
        400,
        sid
      );
    }

    store.addMessage({
      name,
      email,
      phone,
      subject,
      message,
      ip,
    });

    return jsonResponse(
      {
        ok: true,
        sent: true,
        note: null,
        message: "Thank you! Your message has been sent to info@wamarkng.com.",
      },
      200,
      sid
    );
  }

  // 2. Auth: check email
  if (route === "auth/check") {
    if (!checkCsrf(req, session, body)) {
      return jsonResponse({ ok: false, error: "bad_csrf" }, 403, sid);
    }

    const email = String(body.email || "").trim().toLowerCase();
    if (!validateEmail(email)) {
      return jsonResponse({ ok: false, error: "invalid_email" }, 422, sid);
    }

    const state = store.getFailState(email);
    const exists = store.users.some(
      (u) => u.email.toLowerCase() === email
    );

    return jsonResponse(
      {
        ok: true,
        exists,
        locked: state.locked,
        retry_in: state.retry_in,
        fails: state.fails,
        message: state.locked
          ? `Too many failed attempts. Try again in ${humanSeconds(state.retry_in)}.`
          : null,
      },
      200,
      sid
    );
  }

  // 3. Auth: password
  if (route === "auth/password") {
    if (!checkCsrf(req, session, body)) {
      return jsonResponse({ ok: false, error: "bad_csrf" }, 403, sid);
    }

    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    if (!password) {
      return jsonResponse({ ok: false, error: "invalid_password" }, 422, sid);
    }

    const state = store.getFailState(email);
    if (state.locked) {
      return jsonResponse(
        {
          ok: false,
          error: "locked",
          retry_in: state.retry_in,
          message: `This email is locked after too many failed attempts. Try again in ${humanSeconds(state.retry_in)}.`,
        },
        423,
        sid
      );
    }

    const user = store.users.find((u) => u.email.toLowerCase() === email);
    if (user && user.status === "suspended") {
      return jsonResponse(
        {
          ok: false,
          error: "suspended",
          message: "This account has been suspended. Contact an administrator.",
        },
        403,
        sid
      );
    }

    const valid = user && bcrypt.compareSync(password, user.password_hash);

    if (!valid) {
      const fails = store.recordFail(email);
      if (fails >= 4) {
        const lockedState = store.getFailState(email);
        return jsonResponse(
          {
            ok: false,
            error: "locked",
            retry_in: lockedState.retry_in,
            message: `Account locked for ${humanSeconds(lockedState.retry_in)} after 4 failed attempts.`,
          },
          423,
          sid
        );
      }

      return jsonResponse(
        {
          ok: false,
          error: "bad_credentials",
          fails,
          attempts_left: Math.max(4 - fails, 0),
          message: `Incorrect password. ${Math.max(4 - fails, 0)} attempt(s) left before this email is locked for 4 hours.`,
        },
        401,
        sid
      );
    }

    store.clearFails(email);
    session.uid = user.id;
    session.email = user.email;
    session.must_change = user.must_change;
    user.last_login_at = Math.floor(Date.now() / 1000);

    return jsonResponse(
      {
        ok: true,
        user: {
          email: user.email,
          name: user.name,
          must_change: user.must_change,
        },
      },
      200,
      sid
    );
  }

  // 4. Auth: change password
  if (route === "auth/change-password") {
    if (!checkCsrf(req, session, body)) {
      return jsonResponse({ ok: false, error: "bad_csrf" }, 403, sid);
    }

    const user = getAuthUser(session);
    if (!user) {
      return jsonResponse({ ok: false, error: "unauthorized" }, 401, sid);
    }

    const newPass = String(body.new_password || "");
    if (
      newPass.length < 10 ||
      !/[A-Za-z]/.test(newPass) ||
      !/\d/.test(newPass)
    ) {
      return jsonResponse(
        {
          ok: false,
          error: "weak_password",
          message: "Use at least 10 characters including letters and numbers.",
        },
        422,
        sid
      );
    }

    if (!user.must_change) {
      const current = String(body.current_password || "");
      if (current && !bcrypt.compareSync(current, user.password_hash)) {
        return jsonResponse(
          { ok: false, error: "bad_current_password" },
          401,
          sid
        );
      }
    }

    user.password_hash = bcrypt.hashSync(newPass, 10);
    user.must_change = false;
    session.must_change = false;

    return jsonResponse({ ok: true, message: "Password updated." }, 200, sid);
  }

  // 5. Auth: logout
  if (route === "auth/logout") {
    store.deleteSession(sid);
    const res = jsonResponse({ ok: true }, 200, sid);
    res.cookies.delete("wamark_sid");
    return res;
  }

  // ================= ADMIN REQUIRED FOR SUBSEQUENT ROUTES =================
  const adminUser = getAuthUser(session);
  if (!adminUser) {
    return jsonResponse({ ok: false, error: "unauthorized" }, 401, sid);
  }

  if (adminUser.must_change) {
    return jsonResponse({ ok: false, error: "must_change_password" }, 403, sid);
  }

  if (!checkCsrf(req, session, body)) {
    return jsonResponse({ ok: false, error: "bad_csrf" }, 403, sid);
  }

  // Messages: read & delete
  if (route === "admin/messages/read") {
    const id = Number(body.id);
    const msg = store.messages.find((m) => m.id === id);
    if (!msg) {
      return jsonResponse({ ok: false, error: "invalid_id" }, 422, sid);
    }
    msg.read_at = Math.floor(Date.now() / 1000);
    return jsonResponse({ ok: true }, 200, sid);
  }

  if (route === "admin/messages/delete") {
    const id = Number(body.id);
    store.messages = store.messages.filter((m) => m.id !== id);
    return jsonResponse({ ok: true }, 200, sid);
  }

  // Settings update
  if (route === "admin/settings") {
    if (typeof body.site_name === "string") {
      store.settings.site_name = body.site_name.slice(0, 120);
    }
    if (typeof body.site_tagline === "string") {
      store.settings.site_tagline = body.site_tagline.slice(0, 200);
    }
    if (typeof body.contact_email === "string") {
      const em = body.contact_email.trim();
      if (em !== "" && !validateEmail(em)) {
        return jsonResponse(
          {
            ok: false,
            error: "invalid_email",
            message: "The contact email is not a valid address.",
          },
          422,
          sid
        );
      }
      store.settings.contact_email = em.slice(0, 254);
    }
    if (typeof body.contact_phones === "string") {
      store.settings.contact_phones = body.contact_phones.slice(0, 200);
    }
    if (typeof body.contact_address === "string") {
      store.settings.contact_address = body.contact_address.slice(0, 300);
    }

    return jsonResponse(
      {
        ok: true,
        settings: {
          site_name: store.settings.site_name,
          site_tagline: store.settings.site_tagline,
          contact_email: store.settings.contact_email,
          contact_phones: store.settings.contact_phones,
          contact_address: store.settings.contact_address,
        },
      },
      200,
      sid
    );
  }

  // Gallery CRUD
  if (route === "gallery") {
    let src = typeof body.src === "string" ? body.src.trim() : "";
    let mediaType: "image" | "video" =
      body.media_type === "video" ? "video" : "image";

    if (uploadFile) {
      ensureUploadDir();
      const ext = path.extname(uploadFile.name || "").toLowerCase() || ".png";
      const filename = `${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${crypto.randomBytes(8).toString("hex")}${ext}`;
      const destPath = path.join(UPLOAD_DIR, filename);

      const arrayBuffer = await uploadFile.arrayBuffer();
      fs.writeFileSync(destPath, Buffer.from(arrayBuffer));
      src = `/api/data/uploads/${filename}`;
      if (ext.match(/\.(mp4|webm|mov|m4v)$/i)) {
        mediaType = "video";
      }
    } else if (src) {
      const isLocal = /^\/([\w\-.]+\/)*[\w\-. ]+\.(webp|jpe?g|png|gif|avif|mp4|webm|mov|m4v)$/i.test(
        src
      );
      const isUrl = /^https?:\/\/.+/i.test(src);
      if (!isLocal && !isUrl) {
        return jsonResponse({ ok: false, error: "bad_src" }, 422, sid);
      }
      if (isUrl) {
        const isMediaFile = /\.(webp|jpe?g|png|gif|avif|mp4|webm|mov|m4v)(\?.*)?$/i.test(
          src
        );
        const isEmbed = /(youtube\.com|youtu\.be|vimeo\.com)/i.test(src);
        if (!isMediaFile && !isEmbed) {
          return jsonResponse({ ok: false, error: "bad_src_url" }, 422, sid);
        }
        if (isEmbed || /\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(src)) {
          mediaType = "video";
        }
      }
    } else {
      return jsonResponse({ ok: false, error: "missing_media" }, 422, sid);
    }

    const sort =
      store.gallery.reduce((max, g) => Math.max(max, g.sort), 0) + 1;
    const item = store.addGalleryItem({
      title: String(body.title || "").slice(0, 120),
      category: String(body.category || "General").slice(0, 60),
      media_type: mediaType,
      src,
      poster: String(body.poster || "").slice(0, 255),
      caption: String(body.caption || "").slice(0, 400),
      sort,
      active: true,
    });

    return jsonResponse({ ok: true, id: item.id, item }, 200, sid);
  }

  if (route === "gallery/update") {
    const id = Number(body.id);
    const item = store.gallery.find((g) => g.id === id);
    if (!item) {
      return jsonResponse({ ok: false, error: "invalid_id" }, 422, sid);
    }

    if (typeof body.title === "string") item.title = body.title.slice(0, 120);
    if (typeof body.category === "string") item.category = body.category.slice(0, 60);
    if (typeof body.poster === "string") item.poster = body.poster.slice(0, 255);
    if (typeof body.caption === "string") item.caption = body.caption.slice(0, 400);
    if (body.sort !== undefined) item.sort = Number(body.sort);
    if (body.active !== undefined) item.active = Boolean(body.active);
    if (body.media_type === "image" || body.media_type === "video") {
      item.media_type = body.media_type;
    }

    return jsonResponse({ ok: true }, 200, sid);
  }

  if (route === "gallery/delete") {
    const id = Number(body.id);
    const idx = store.gallery.findIndex((g) => g.id === id);
    if (idx !== -1) {
      const item = store.gallery[idx];
      if (item.src.startsWith("/api/data/uploads/")) {
        const filePath = path.join(UPLOAD_DIR, path.basename(item.src));
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
          } catch {
            // ignore
          }
        }
      }
      store.gallery.splice(idx, 1);
    }
    return jsonResponse({ ok: true }, 200, sid);
  }

  // Blog CRUD
  if (route === "admin/blog/create") {
    const title = String(body.title || "").trim();
    if (title.length < 3) {
      return jsonResponse(
        {
          ok: false,
          error: "invalid_post",
          message: "Title must be at least 3 characters.",
        },
        422,
        sid
      );
    }

    const slug = generateSlug(String(body.slug || title));
    const now = Math.floor(Date.now() / 1000);
    const status = body.status === "published" ? "published" : "draft";

    const post = store.addBlogPost({
      title,
      slug,
      category: String(body.category || "News").trim() || "News",
      excerpt: String(body.excerpt || "").trim(),
      body: String(body.body || "").trim(),
      cover: String(body.cover || "").trim(),
      author: adminUser.name || "Staff",
      status,
      published_at: status === "published" ? now : null,
    });

    return jsonResponse({ ok: true, id: post.id, slug: post.slug }, 200, sid);
  }

  if (route === "admin/blog/update") {
    const id = Number(body.id);
    const post = store.posts.find((p) => p.id === id);
    if (!post) {
      return jsonResponse({ ok: false, error: "not_found" }, 404, sid);
    }

    if (typeof body.title === "string") {
      const t = body.title.trim();
      if (t.length < 3) {
        return jsonResponse(
          {
            ok: false,
            error: "invalid_post",
            message: "Title must be at least 3 characters.",
          },
          422,
          sid
        );
      }
      post.title = t;
    }
    if (typeof body.category === "string") post.category = body.category.trim() || "News";
    if (typeof body.excerpt === "string") post.excerpt = body.excerpt.trim();
    if (typeof body.body === "string") post.body = body.body.trim();
    if (typeof body.cover === "string") post.cover = body.cover.trim();
    if (body.status === "published" || body.status === "draft") {
      if (body.status === "published" && post.status !== "published") {
        post.published_at = Math.floor(Date.now() / 1000);
      }
      post.status = body.status;
    }
    if (typeof body.slug === "string" && body.slug.trim()) {
      post.slug = generateSlug(body.slug, id);
    }
    post.updated_at = Math.floor(Date.now() / 1000);

    return jsonResponse({ ok: true }, 200, sid);
  }

  if (route === "admin/blog/delete") {
    const id = Number(body.id);
    store.posts = store.posts.filter((p) => p.id !== id);
    return jsonResponse({ ok: true }, 200, sid);
  }

  // Feature images update
  if (route === "admin/feature/update") {
    const no = String(body.no || "");
    if (!["01", "02", "03"].includes(no)) {
      return jsonResponse(
        {
          ok: false,
          error: "invalid_feature",
          message: "Unknown feature card.",
        },
        422,
        sid
      );
    }

    const rawImages = Array.isArray(body.images) ? body.images : [];
    const images = store.setFeatureImages(no, rawImages);

    return jsonResponse({ ok: true, no, images }, 200, sid);
  }

  // User management (admin only)
  if (route === "admin/users/create") {
    if (adminUser.role !== "admin") {
      return jsonResponse(
        {
          ok: false,
          error: "forbidden",
          message: "Only administrators can create users.",
        },
        403,
        sid
      );
    }

    const email = String(body.email || "").trim().toLowerCase();
    const name = String(body.name || "").trim();
    const role: "admin" | "editor" = body.role === "admin" ? "admin" : "editor";

    if (!validateEmail(email)) {
      return jsonResponse(
        {
          ok: false,
          error: "invalid_email",
          message: "Enter a valid email address.",
        },
        422,
        sid
      );
    }
    if (name.length < 2) {
      return jsonResponse(
        {
          ok: false,
          error: "invalid_name",
          message: "Enter the user's full name.",
        },
        422,
        sid
      );
    }
    if (store.users.some((u) => u.email.toLowerCase() === email)) {
      return jsonResponse(
        {
          ok: false,
          error: "email_taken",
          message: "A user with that email already exists.",
        },
        409,
        sid
      );
    }

    // Auto-generate password
    const alphabet =
      "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    let genPassword = "Wm";
    for (let i = 0; i < 12; i++) {
      genPassword += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    genPassword += Math.floor(Math.random() * 90 + 10);

    const newUser = store.addUser({
      email,
      name,
      password_hash: bcrypt.hashSync(genPassword, 10),
      must_change: true,
      failed_count: 0,
      locked_until: 0,
      role,
      status: "active",
      last_login_at: null,
      created_by: adminUser.id,
    });

    return jsonResponse(
      {
        ok: true,
        id: newUser.id,
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          status: "active",
        },
        password: genPassword,
        message:
          "User created. Copy the password now — it is shown only once and must be changed at first login.",
      },
      200,
      sid
    );
  }

  if (route === "admin/users/update") {
    if (adminUser.role !== "admin") {
      return jsonResponse(
        {
          ok: false,
          error: "forbidden",
          message: "Only administrators can edit users.",
        },
        403,
        sid
      );
    }

    const id = Number(body.id);
    const target = store.users.find((u) => u.id === id);
    if (!target) {
      return jsonResponse({ ok: false, error: "not_found" }, 404, sid);
    }

    if (typeof body.name === "string") {
      const name = body.name.trim();
      if (name.length < 2) {
        return jsonResponse(
          { ok: false, error: "invalid_name", message: "Name is too short." },
          422,
          sid
        );
      }
      target.name = name;
    }

    if (typeof body.role === "string") {
      if (body.role !== "admin" && body.role !== "editor") {
        return jsonResponse(
          {
            ok: false,
            error: "invalid_role",
            message: "Role must be admin or editor.",
          },
          422,
          sid
        );
      }
      if (target.id === adminUser.id && body.role !== "admin") {
        return jsonResponse(
          {
            ok: false,
            error: "self_demote",
            message: "You cannot change your own role.",
          },
          422,
          sid
        );
      }
      target.role = body.role;
    }

    if (typeof body.status === "string") {
      if (body.status !== "active" && body.status !== "suspended") {
        return jsonResponse(
          {
            ok: false,
            error: "invalid_status",
            message: "Status must be active or suspended.",
          },
          422,
          sid
        );
      }
      if (target.id === adminUser.id && body.status !== "active") {
        return jsonResponse(
          {
            ok: false,
            error: "self_suspend",
            message: "You cannot suspend your own account.",
          },
          422,
          sid
        );
      }
      target.status = body.status;
      if (target.status === "active") {
        target.locked_until = 0;
      }
    }

    if (typeof body.password === "string" && body.password.trim() !== "") {
      const newP = body.password.trim();
      if (newP.length < 10 || !/[A-Za-z]/.test(newP) || !/\d/.test(newP)) {
        return jsonResponse(
          {
            ok: false,
            error: "weak_password",
            message:
              "Use at least 10 characters including letters and numbers.",
          },
          422,
          sid
        );
      }
      target.password_hash = bcrypt.hashSync(newP, 10);
      target.must_change = true;
    }

    return jsonResponse(
      {
        ok: true,
        user: {
          id: target.id,
          email: target.email,
          name: target.name,
          role: target.role,
          status: target.status,
          must_change: target.must_change,
        },
      },
      200,
      sid
    );
  }

  if (route === "admin/users/delete") {
    if (adminUser.role !== "admin") {
      return jsonResponse(
        {
          ok: false,
          error: "forbidden",
          message: "Only administrators can delete users.",
        },
        403,
        sid
      );
    }

    const id = Number(body.id);
    if (id === adminUser.id) {
      return jsonResponse(
        {
          ok: false,
          error: "self_delete",
          message: "You cannot delete your own account.",
        },
        422,
        sid
      );
    }

    const idx = store.users.findIndex((u) => u.id === id);
    if (idx === -1) {
      return jsonResponse({ ok: false, error: "not_found" }, 404, sid);
    }

    if (store.users.length <= 1) {
      return jsonResponse(
        {
          ok: false,
          error: "last_admin",
          message: "Cannot delete the only remaining user.",
        },
        422,
        sid
      );
    }

    store.users.splice(idx, 1);
    return jsonResponse({ ok: true }, 200, sid);
  }

  return jsonResponse({ ok: false, error: "not_found" }, 404, sid);
}
