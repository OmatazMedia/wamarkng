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
 * Shared CSRF-aware API client for the dashboard panels.
 */

"use client";

const API = "/api/index.php";

let csrfToken = "";

/** Fetch (and cache) the CSRF token from the API. */
export async function ensureCsrf(): Promise<string> {
  if (csrfToken) return csrfToken;
  const d = await jget("csrf");
  if (d?.ok && typeof d.csrf === "string") {
    csrfToken = d.csrf;
    return csrfToken;
  }
  throw new Error("Could not obtain a security token. Refresh the page.");
}

/** Drop the cached token (e.g. after logout) so the next call re-fetches. */
export function resetCsrf(): void {
  csrfToken = "";
}

type Json = Record<string, unknown>;

/** GET an API route and return parsed JSON. */
export async function jget(route: string): Promise<Json | null> {
  const res = await fetch(`${API}?route=${route}`, {
    credentials: "same-origin",
  });
  if (res.status === 401) {
    window.location.href = "/login/";
    return null;
  }
  return (await res.json()) as Json;
}

/** POST JSON to an API route with the CSRF token attached. */
export async function jpost(route: string, body: Json = {}): Promise<Json> {
  const first = await jpostOnce(route, body);
  if (first.error === "bad_csrf") {
    resetCsrf();
    return jpostOnce(route, body);
  }
  return first;
}

async function jpostOnce(route: string, body: Json): Promise<Json> {
  const csrf = await ensureCsrf();
  const res = await fetch(`${API}?route=${route}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-CSRF-Token": csrf },
    credentials: "same-origin",
    body: JSON.stringify({ csrf, ...body }),
  });
  if (res.status === 401) {
    window.location.href = "/login/";
    return { ok: false, error: "unauthorized" };
  }
  return (await res.json()) as Json;
}

/** POST multipart form data (uploads) with the CSRF token attached. */
export async function jupload(route: string, form: FormData): Promise<Json> {
  const csrf = await ensureCsrf();
  form.set("csrf", csrf);
  const res = await fetch(`${API}?route=${route}`, {
    method: "POST",
    headers: { "X-CSRF-Token": csrf },
    credentials: "same-origin",
    body: form,
  });
  if (res.status === 401) {
    window.location.href = "/login/";
    return { ok: false, error: "unauthorized" };
  }
  return (await res.json()) as Json;
}

export const apiRoot = API;
