# WAMARK Nigeria Limited — Website

Advanced Security Systems · Technical Surveillance · Oil & Gas Services

Built with **Next.js (App Router)** and exported as a **fully static website** for
deployment on **cPanel** shared hosting.

---

## Developed by Omataz Media

| | |
|---|---|
| **Company** | Omataz Media — Web Development & Design |
| **Website** | https://www.omatazmedia.com.ng |
| **Email** | hello@omatazmedia.com.ng |
| **Phone** | +234 9024599289, +234 7037373304 |
| **WhatsApp** | https://wa.me/message/M3QUHNVONY6NK1 |
| **Social** | @omatazmedia — Facebook · Instagram · X · YouTube |
| **GitHub** | https://github.com/omatazmedia |
| **Contact** | Johnson Toluwani |

---

## Getting started

```bash
npm install
npm run dev      # local development at http://localhost:3000
```

## Build for cPanel (static export)

```bash
npm run build
```

The complete static website is emitted into the **`out/`** folder
(plain HTML, CSS, JS and images — no Node.js server required).

### Deploy to cPanel

1. Log in to cPanel → **File Manager**.
2. Open the `public_html` directory (or the domain's document root).
3. Upload the **contents** of the `out/` folder (not the folder itself) —
   you can zip `out/*` first and use cPanel's Extract option.
4. Ensure `index.html` sits directly inside `public_html`.
5. Visit your domain — the site is live.

> Tip: because the export uses `trailingSlash: true`, inner pages work as
> plain folders (`/about/` → `/about/index.html`) which is exactly what
> Apache/cPanel expects. No `.htaccess` rewrite rules are required.

## Project structure

```
src/
  app/
    layout.tsx      # fonts, metadata, site chrome
    page.tsx        # homepage (all sections)
    globals.css     # full design system
  components/
    Header.tsx      # topbar + sticky navbar
    Footer.tsx      # footer + newsletter
    icons.tsx       # inline SVG icon set
  lib/
    data.tsx        # all homepage content in one place
public/images/      # optimized webp/jpg assets from the original site
wamarkng-files/     # reference materials (excluded from the build)
```

## Homepage sections

Topbar · Navbar · Hero slider (static) · Feature cards · About (mission &
vision) · Clients · Stats counters · Services · Product strip · Best offers ·
Portfolio · CTA banner · Latest articles · Testimonials slider · Contact bar ·
Footer

---

## PHP backend (public/api) — zero-configuration

The static export ships a small **PHP API** (`out/api/`) that powers the
contact form and the admin dashboard. It stores everything in **SQLite**
(no database credentials needed) and sends mail via PHP's builtin
`mail()` from **no-reply@<your-domain>** — nothing to configure.

### Install (once, on the server)

1. Upload the contents of `out/` to `public_html` as described above.
2. Visit **https://yourdomain.com/api/install/** — the wizard checks the
   host, creates the database, seeds site settings + the starter gallery,
   and **auto-generates the admin email & password**.
3. **Save the generated password** — it is shown only once.
4. Sign in at **https://yourdomain.com/login/**; you will be required to
   set a new password on first login.
5. Manage the site at **https://yourdomain.com/dashboard/**.

### Security model

| Protection | Detail |
|---|---|
| Email-first login | Password is only asked after the email step |
| 4-strike lockout | 4 wrong attempts lock the email for **4 hours** (server-enforced, per-email, survives new sessions) |
| Anti-enumeration | Unknown emails get the same responses as known ones |
| CSRF | Double-submit token on every state-changing route |
| Human proof | Honeypot field + server-issued sum question on the contact form |
| Rate limiting | 3 contact messages / IP / hour |
| Password hashing | `password_hash()` (bcrypt) + forced rotation on first login |
| File safety | Uploads get random names, MIME-sniffed, stored outside the web root's static tree; script execution disabled in the uploads folder |
| Sealed internals | `.htaccess` denies access to `api/lib`, `api/data` (SQLite db, mail spool), config files — only `index.php` and `install.php` are reachable |
| Wizard self-lock | After install, `api/data/installed.lock` makes the wizard refuse to run again |

### API endpoints

`GET ?route=` status · `GET ?route=csrf` token+captcha · `POST ?route=contact` ·
`POST ?route=auth/check` / `auth/password` / `auth/change-password` / `auth/logout` ·
`GET ?route=auth/me` · `GET ?route=gallery` · `GET ?route=settings` ·
admin: `GET admin/summary`, `GET admin/messages`, `POST gallery`,
`POST gallery/update`, `POST gallery/delete`

### Local end-to-end tests

Requires PHP 8+ with pdo_sqlite (CLI). The suite installs fresh, logs in,
exercises the contact + gallery + lockout flows — **46 checks**:

```bash
npm run build
php -S 127.0.0.1:8899 -t out &
npm run api:test
```

> The lockout section intentionally locks the test admin; re-run against a
> fresh install (delete `out/api/data/db` and `out/api/data/installed.lock`).

---

Copyright © 2026 Wamark Nigeria. Dev by Omataz Media.
