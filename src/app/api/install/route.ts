import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/server-api";
import crypto from "crypto";

export async function GET() {
  return NextResponse.json({
    ok: true,
    ready: true,
    checks: {
      php_version: true,
      pdo_sqlite: true,
      data_writable: true,
      install_key: true,
      mail: true,
    },
    details: {
      php: "8.2.0",
      db_exists: true,
      installed: store.installed,
    },
  });
}

export async function POST() {
  if (store.installed) {
    return NextResponse.json({
      ok: true,
      already: true,
      message:
        "WAMARK is already installed. This wizard is locked — delete api/data/installed.lock only if you intend to reinstall from scratch.",
    });
  }

  const alphabet =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";
  let password = "Wm" + crypto.randomBytes(2).toString("hex");
  for (let i = 0; i < 16; i++) {
    password += alphabet[Math.floor(Math.random() * alphabet.length)];
  }

  const email =
    "admin." +
    crypto.randomBytes(4).toString("hex") +
    "@wamarkng.com";

  store.performInstall(email, password);

  return NextResponse.json({
    ok: true,
    admin: {
      email,
      password,
    },
    login: "/login/",
    message:
      "Installation complete. Save the admin password now — it is shown only once and must be changed at first login.",
  });
}
