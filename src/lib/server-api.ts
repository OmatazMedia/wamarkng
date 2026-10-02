import fs from "fs";
import path from "path";
import crypto from "crypto";
import bcrypt from "bcryptjs";

export interface User {
  id: number;
  email: string;
  name: string;
  password_hash: string;
  must_change: boolean;
  failed_count: number;
  locked_until: number;
  role: "admin" | "editor";
  status: "active" | "suspended";
  created_at: number;
  last_login_at: number | null;
  created_by?: number | null;
}

export interface GalleryItem {
  id: number;
  title: string;
  category: string;
  media_type: "image" | "video";
  src: string;
  poster: string;
  caption: string;
  sort: number;
  active: boolean;
  created_at: number;
}

export interface BlogPost {
  id: number;
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  body: string;
  cover: string;
  author: string;
  status: "published" | "draft";
  published_at: number | null;
  created_at: number;
  updated_at: number;
}

export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  ip: string;
  created_at: number;
  read_at: number | null;
}

export interface SessionData {
  sid: string;
  uid?: number;
  email?: string;
  must_change?: boolean;
  csrf: string;
  captcha_sum?: number;
  created: number;
}

// Global in-memory state (persists as long as Node server runs)
class DataStore {
  public settings: Record<string, string> = {
    site_name: "WAMARK Nigeria Limited",
    site_tagline: "Security, Surveillance & Oil & Gas Services",
    contact_email: "info@wamarkng.com",
    contact_phones: "+234 803 7650 357, +234 818 6318 527",
    contact_address:
      "Plot 1909, Cadastral Zone E27, Apo Resettlement, Abuja-FCT, Nigeria.",
    feature_images_01: "",
    feature_images_02: "",
    feature_images_03: "",
  };

  public users: User[] = [];
  public gallery: GalleryItem[] = [];
  public posts: BlogPost[] = [];
  public messages: ContactMessage[] = [];
  public loginFails: Map<string, number[]> = new Map();
  public sessions: Map<string, SessionData> = new Map();
  public installed: boolean = true;
  private nextUserId: number = 1;
  private nextGalleryId: number = 1;
  private nextPostId: number = 1;
  private nextMessageId: number = 1;

  constructor() {
    this.seed();
  }

  public seed() {
    // 1. Initial admin user
    const adminPw = "Password123!";
    const hashed = bcrypt.hashSync(adminPw, 10);
    this.users = [
      {
        id: 1,
        email: "admin@wamarkng.com",
        name: "Administrator",
        password_hash: hashed,
        must_change: false,
        failed_count: 0,
        locked_until: 0,
        role: "admin",
        status: "active",
        created_at: Math.floor(Date.now() / 1000) - 86400 * 30,
        last_login_at: Math.floor(Date.now() / 1000) - 3600,
        created_by: null,
      },
    ];
    this.nextUserId = 2;

    // 2. Initial gallery items
    const seedGallery: Array<[string, string, string]> = [
      ["Pipeline Maintenance", "Oil & Gas", "/images/project-3.webp"],
      ["Flow Station Maintenance", "Oil & Gas", "/images/project-0011-1.webp"],
      ["Security Equipment Installation", "Security", "/images/project-0052.webp"],
      ["CCTV Surveillance Rollout", "Surveillance", "/images/project-0056.webp"],
      [
        "Technical Surveillance Countermeasures",
        "Surveillance",
        "/images/project-at-12-07-55_f4d81555.webp",
      ],
      ["Oil & Gas Measurement", "Oil & Gas", "/images/project-0005.webp"],
      ["Access Control System", "Security", "/images/cctv.webp"],
      ["Plant Installation", "Oil & Gas", "/images/oilgas.webp"],
      ["Vehicle Tracking Deployment", "Security", "/images/vehicle-tracking.webp"],
    ];

    let sort = seedGallery.length;
    this.gallery = seedGallery.map(([title, cat, src], i) => ({
      id: i + 1,
      title,
      category: cat,
      media_type: "image",
      src,
      poster: "",
      caption: "",
      sort: sort--,
      active: true,
      created_at: Math.floor(Date.now() / 1000) - (seedGallery.length - i) * 3600,
    }));
    this.nextGalleryId = seedGallery.length + 1;

    // 3. Initial published blog posts
    const now = Math.floor(Date.now() / 1000);
    this.posts = [
      {
        id: 1,
        slug: "wamark-completes-cctv-rollout",
        title: "WAMARK Completes Modern CCTV Rollout for Industrial Facility",
        category: "Projects",
        excerpt:
          "High-definition optical zoom and 24/7 AI-assisted perimeter surveillance deployed successfully across key oil facilities.",
        body: "WAMARK Nigeria Limited has completed the turnkey installation and commissioning of a next-generation security surveillance network for a key energy terminal in the Niger Delta.\n\nThe deployment incorporates thermal perimeter sensing, remote PTZ monitoring, and an uninterruptible solar hybrid backup unit to ensure continuous operations under challenging environmental conditions.\n\nOur client commended the project delivery team for strict adherence to HSE standards and zero-downtime integration.",
        cover: "/images/cctv.webp",
        author: "Gabriel Momoh",
        status: "published",
        published_at: now - 86400 * 14,
        created_at: now - 86400 * 15,
        updated_at: now - 86400 * 14,
      },
      {
        id: 2,
        slug: "strategic-technical-surveillance-countermeasures",
        title: "Strategic Technical Surveillance Countermeasures (TSCM) Advisory",
        category: "Security",
        excerpt:
          "Safeguarding boardrooms and high-value government operations from unauthorized eavesdropping and illicit radio transmitters.",
        body: "Modern corporate espionage has evolved beyond physical wiretaps to miniature RF transmitters, covert laser listening, and compromised firmware.\n\nWAMARK's Technical Surveillance Unit (TSU) utilizes advanced multi-spectrum analyzers to sweep corporate headquarters, executive suites, and sensitive meeting spaces.\n\nRoutine audits and counter-surveillance protocols are recommended biannually for organizations handling critical national infrastructure.",
        cover: "/images/imsi-catcher-system.webp",
        author: "Babajide Hammed",
        status: "published",
        published_at: now - 86400 * 7,
        created_at: now - 86400 * 8,
        updated_at: now - 86400 * 7,
      },
      {
        id: 3,
        slug: "oil-gas-flow-measurement-advances",
        title: "Precision Flow Station Maintenance and Metering Solutions",
        category: "Oil & Gas",
        excerpt:
          "Ensuring custody transfer accuracy and minimizing pipeline mechanical fatigue with proactive inspection cycles.",
        body: "In high-throughput oil and gas installations, calibration errors of even 0.1% can translate into significant financial discrepancies.\n\nWAMARK engineers provide specialized calibration, ultrasonic non-destructive testing (NDT), and valve refurbishment across onshore flow stations.\n\nOur certified technicians partner with international technology providers to bring dependable maintenance solutions to Nigeria's leading energy producers.",
        cover: "/images/oilgas.webp",
        author: "Engineering Team",
        status: "published",
        published_at: now - 86400 * 2,
        created_at: now - 86400 * 3,
        updated_at: now - 86400 * 2,
      },
    ];
    this.nextPostId = 4;
  }

  public resetToFreshInstall() {
    this.installed = false;
    this.users = [];
    this.gallery = [];
    this.posts = [];
    this.messages = [];
    this.loginFails.clear();
    this.nextUserId = 1;
    this.nextGalleryId = 1;
    this.nextPostId = 1;
    this.nextMessageId = 1;
  }

  public performInstall(email?: string, password?: string) {
    this.seed();
    this.installed = true;
    if (email && password) {
      const hashed = bcrypt.hashSync(password, 10);
      this.users[0] = {
        id: 1,
        email: email.toLowerCase().trim(),
        name: "Administrator",
        password_hash: hashed,
        must_change: true,
        failed_count: 0,
        locked_until: 0,
        role: "admin",
        status: "active",
        created_at: Math.floor(Date.now() / 1000),
        last_login_at: null,
        created_by: null,
      };
    }
  }

  // Session
  public getSession(sid: string): SessionData {
    let s = this.sessions.get(sid);
    if (!s) {
      s = {
        sid,
        csrf: crypto.randomBytes(16).toString("hex"),
        created: Date.now(),
      };
      this.sessions.set(sid, s);
    }
    return s;
  }

  public deleteSession(sid: string) {
    this.sessions.delete(sid);
  }

  // Lockout logic (4 strikes in 4 hours)
  public getFailState(ident: string): {
    locked: boolean;
    retry_in: number;
    fails: number;
  } {
    const key = ident.toLowerCase().trim();
    const now = Math.floor(Date.now() / 1000);
    const window = 4 * 3600; // 4 hours

    const user = this.users.find((u) => u.email.toLowerCase() === key);
    let userLock = user?.locked_until ?? 0;

    let failsList = this.loginFails.get(key) || [];
    failsList = failsList.filter((t) => t > now - window);
    this.loginFails.set(key, failsList);

    const fails = failsList.length;
    const isLocked = fails >= 4 || userLock > now;

    let retryIn = Math.max(userLock - now, 0);
    if (isLocked && retryIn === 0 && failsList.length > 0) {
      const oldest = Math.min(...failsList);
      retryIn = Math.max(oldest + window - now, 0);
    }

    return {
      locked: isLocked,
      retry_in: retryIn,
      fails,
    };
  }

  public recordFail(ident: string): number {
    const key = ident.toLowerCase().trim();
    const now = Math.floor(Date.now() / 1000);
    const window = 4 * 3600;

    let failsList = this.loginFails.get(key) || [];
    failsList = failsList.filter((t) => t > now - window);
    failsList.push(now);
    this.loginFails.set(key, failsList);

    if (failsList.length >= 4) {
      const user = this.users.find((u) => u.email.toLowerCase() === key);
      if (user) {
        user.locked_until = now + window;
      }
    }

    return failsList.length;
  }

  public clearFails(ident: string) {
    const key = ident.toLowerCase().trim();
    this.loginFails.delete(key);
    const user = this.users.find((u) => u.email.toLowerCase() === key);
    if (user) {
      user.locked_until = 0;
      user.failed_count = 0;
    }
  }

  // Feature card defaults & overrides
  public getFeatureDefaults(): Record<string, string[]> {
    return {
      "01": [
        "/images/cctv.webp",
        "/images/airport-detector.webp",
        "/images/cybersecurity-1.webp",
      ],
      "02": [
        "/images/imsi-catcher-system.webp",
        "/images/project-at-12-07-55_f4d81555.webp",
        "/images/airport-detector.webp",
      ],
      "03": [
        "/images/oilgas.webp",
        "/images/project-0005.webp",
        "/images/project-3.webp",
      ],
    };
  }

  public getEffectiveFeatures(): Record<string, string[]> {
    const defs = this.getFeatureDefaults();
    const out: Record<string, string[]> = {};
    for (const [no, fallback] of Object.entries(defs)) {
      const raw = this.settings[`feature_images_${no}`] || "";
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            out[no] = parsed;
            continue;
          }
        } catch {
          // fallback
        }
      }
      out[no] = fallback;
    }
    return out;
  }

  public setFeatureImages(no: string, rawImages: unknown[]): string[] {
    const defs = this.getFeatureDefaults();
    if (!defs[no]) {
      throw new Error("invalid_feature");
    }

    const clean: string[] = [];
    const capped = rawImages.slice(0, 6);
    for (const item of capped) {
      if (typeof item !== "string") continue;
      const s = item.trim();
      // Drop directory traversal, dangerous scripts, non-image
      if (
        s.includes("..") ||
        s.toLowerCase().includes("javascript:") ||
        s.toLowerCase().includes("data:") ||
        s.toLowerCase().includes("passwd")
      ) {
        continue;
      }
      if (
        s.startsWith("/") ||
        /^https?:\/\/.*\.(webp|jpe?g|png|gif|avif)(\?.*)?$/i.test(s)
      ) {
        if (!clean.includes(s)) {
          clean.push(s);
        }
      }
    }

    if (clean.length === 0) {
      this.settings[`feature_images_${no}`] = "";
      return defs[no];
    } else {
      this.settings[`feature_images_${no}`] = JSON.stringify(clean);
      return clean;
    }
  }

  // Gallery
  public addGalleryItem(item: Omit<GalleryItem, "id" | "created_at">): GalleryItem {
    const id = this.nextGalleryId++;
    const now = Math.floor(Date.now() / 1000);
    const full: GalleryItem = { ...item, id, created_at: now };
    this.gallery.unshift(full);
    return full;
  }

  // Blog
  public addBlogPost(
    post: Omit<BlogPost, "id" | "created_at" | "updated_at">
  ): BlogPost {
    const id = this.nextPostId++;
    const now = Math.floor(Date.now() / 1000);
    const full: BlogPost = {
      ...post,
      id,
      created_at: now,
      updated_at: now,
    };
    this.posts.unshift(full);
    return full;
  }

  // Users
  public addUser(user: Omit<User, "id" | "created_at">): User {
    const id = this.nextUserId++;
    const now = Math.floor(Date.now() / 1000);
    const full: User = {
      ...user,
      id,
      created_at: now,
    };
    this.users.push(full);
    return full;
  }

  // Messages
  public addMessage(
    msg: Omit<ContactMessage, "id" | "created_at" | "read_at">
  ): ContactMessage {
    const id = this.nextMessageId++;
    const now = Math.floor(Date.now() / 1000);
    const full: ContactMessage = {
      ...msg,
      id,
      created_at: now,
      read_at: null,
    };
    this.messages.unshift(full);
    return full;
  }
}

// Global singleton instance across Next.js dev server hot-reloads
const globalForStore = globalThis as unknown as { __wamark_store?: DataStore };
export const store = globalForStore.__wamark_store ?? new DataStore();
if (process.env.NODE_ENV !== "production") {
  globalForStore.__wamark_store = store;
}

export function generateSlug(base: string, ignoreId = 0): string {
  let cleaned = base
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!cleaned) cleaned = "post";
  cleaned = cleaned.slice(0, 160);

  let candidate = cleaned;
  let counter = 2;
  while (store.posts.some((p) => p.slug === candidate && p.id !== ignoreId)) {
    candidate = `${cleaned}-${counter++}`;
  }
  return candidate;
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function humanSeconds(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}
