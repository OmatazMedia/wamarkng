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
 * Dashboard — user management: create, edit, suspend/activate and delete
 * dashboard users. Admins only (the API enforces it too). New users get
 * an auto-generated one-time password shown once; they must replace it
 * at first login. Self-protection rules (no self-suspend/demote/delete)
 * are enforced server-side and mirrored in the UI.
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { jget, jpost } from "./api";

type UserRow = {
  id: number;
  email: string;
  name: string;
  role: "admin" | "editor" | string;
  status: "active" | "suspended" | string;
  must_change: boolean | number;
  created_at: number;
  last_login_at: number | null;
};

type EditDraft = { name: string; role: string; password: string };

export default function UsersPanel() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [meId, setMeId] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const [showAdd, setShowAdd] = useState(false);
  const [draft, setDraft] = useState({ name: "", email: "", role: "editor" });
  const [oneTimePw, setOneTimePw] = useState<{ email: string; password: string } | null>(null);

  const [editId, setEditId] = useState<number | null>(null);
  const [edit, setEdit] = useState<EditDraft>({ name: "", role: "editor", password: "" });
  const [confirmId, setConfirmId] = useState<{ id: number; action: "suspend" | "delete" } | null>(null);
  const editNameRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    const d = await jget("admin/users");
    if (d?.ok) {
      setUsers((d.users as UserRow[]) ?? []);
      setMeId(Number(d.me ?? 0));
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function flash(kind: "ok" | "err", text: string) {
    setBanner({ kind, text });
    setTimeout(() => setBanner(null), 4200);
  }

  function fail(d: Record<string, unknown>, fallback: string) {
    flash("err", String(d?.message ?? d?.error ?? fallback));
  }

  function fmtDate(ts: number | null): string {
    if (!ts) return "never";
    return new Date(ts * 1000).toLocaleString();
  }

  /* ---------------- create ---------------- */

  async function submitAdd(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const d = await jpost("admin/users/create", { ...draft });
    if (d?.ok) {
      setOneTimePw({ email: String((d.user as Record<string, unknown>)?.email ?? draft.email), password: String(d.password ?? "") });
      setDraft({ name: "", email: "", role: "editor" });
      setShowAdd(false);
      flash("ok", "User created.");
      await load();
    } else {
      fail(d, "Could not create the user.");
    }
    setBusy(false);
  }

  /* ---------------- edit ---------------- */

  function startEdit(u: UserRow) {
    setConfirmId(null);
    setEditId(u.id);
    setEdit({ name: u.name, role: String(u.role), password: "" });
    setTimeout(() => editNameRef.current?.focus(), 30);
  }

  async function submitEdit(e: React.FormEvent) {
    e.preventDefault();
    if (editId === null) return;
    setBusy(true);
    const body: Record<string, unknown> = { id: editId, name: edit.name, role: edit.role };
    if (edit.password.trim()) body.password = edit.password.trim();
    const d = await jpost("admin/users/update", body);
    if (d?.ok) {
      flash("ok", "User updated.");
      setEditId(null);
      await load();
    } else {
      fail(d, "Could not update the user.");
    }
    setBusy(false);
  }

  /* ---------------- suspend / activate / delete ---------------- */

  async function setStatus(u: UserRow, status: "active" | "suspended") {
    setBusy(true);
    const d = await jpost("admin/users/update", { id: u.id, status });
    setConfirmId(null);
    if (d?.ok) {
      flash("ok", status === "suspended" ? "User suspended." : "User re-activated.");
      await load();
    } else {
      fail(d, "Could not change the user status.");
    }
    setBusy(false);
  }

  async function doDelete(u: UserRow) {
    setBusy(true);
    const d = await jpost("admin/users/delete", { id: u.id });
    setConfirmId(null);
    if (d?.ok) {
      flash("ok", "User deleted.");
      await load();
    } else {
      fail(d, "Could not delete the user.");
    }
    setBusy(false);
  }

  if (loading) return <p className="dash-note">Loading users…</p>;

  return (
    <div>
      {banner && (
        <div className={banner.kind === "ok" ? "form-success" : "form-error"} role="status">
          {banner.kind === "ok" ? "✔ " : "⚠ "}
          {banner.text}
        </div>
      )}

      {oneTimePw && (
        <div className="usr-onetime" role="alert">
          <strong>One-time password for {oneTimePw.email}</strong>
          <div className="usr-pw-row">
            <code>{oneTimePw.password}</code>
            <button
              type="button"
              className="btn btn-green gm-btn"
              onClick={() => {
                navigator.clipboard?.writeText(oneTimePw.password).catch(() => undefined);
                flash("ok", "Password copied to clipboard.");
              }}
            >
              Copy
            </button>
            <button type="button" className="gm-linkbtn" onClick={() => setOneTimePw(null)}>
              Dismiss
            </button>
          </div>
          <small>Shown only once — the user must replace it at first login.</small>
        </div>
      )}

      {/* -------- toolbar -------- */}
      <div className="gm-toolbar">
        <span className="gm-count">
          {users.length} user{users.length === 1 ? "" : "s"} ·{" "}
          {users.filter((u) => u.status === "suspended").length} suspended
        </span>
        <button className="btn btn-green gm-btn" onClick={() => setShowAdd((v) => !v)}>
          {showAdd ? "Close" : "+ ADD USER"}
        </button>
      </div>

      {/* -------- add form -------- */}
      {showAdd && (
        <form className="gm-add" onSubmit={submitAdd}>
          <div className="gm-fields">
            <div className="form-field">
              <label htmlFor="nu-name">Full name</label>
              <input
                id="nu-name"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="e.g. Ayo Balogun"
                required
              />
            </div>
            <div className="form-field">
              <label htmlFor="nu-email">Email</label>
              <input
                id="nu-email"
                type="email"
                value={draft.email}
                onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                placeholder="ayo@wamarkng.com"
                required
              />
            </div>
            <div className="form-field">
              <label htmlFor="nu-role">Role</label>
              <select
                id="nu-role"
                value={draft.role}
                onChange={(e) => setDraft({ ...draft, role: e.target.value })}
              >
                <option value="editor">Editor</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <button className="btn btn-green gm-btn" type="submit" disabled={busy}>
            {busy ? "Creating…" : "Create user"}
          </button>
        </form>
      )}

      {/* -------- list -------- */}
      <div className="usr-list">
        {users.map((u) => {
          const self = u.id === meId;
          const suspended = u.status === "suspended";
          const confirm = confirmId?.id === u.id ? confirmId.action : null;

          if (editId === u.id) {
            return (
              <form className="usr-row usr-editing" key={u.id} onSubmit={submitEdit}>
                <div className="gm-fields">
                  <div className="form-field">
                    <label htmlFor={`ue-name-${u.id}`}>Name</label>
                    <input
                      id={`ue-name-${u.id}`}
                      ref={editNameRef}
                      value={edit.name}
                      onChange={(e) => setEdit({ ...edit, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-field">
                    <label htmlFor={`ue-role-${u.id}`}>Role</label>
                    <select
                      id={`ue-role-${u.id}`}
                      value={edit.role}
                      onChange={(e) => setEdit({ ...edit, role: e.target.value })}
                      disabled={self}
                    >
                      <option value="editor">Editor</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label htmlFor={`ue-pw-${u.id}`}>New password (optional)</label>
                    <input
                      id={`ue-pw-${u.id}`}
                      type="text"
                      value={edit.password}
                      onChange={(e) => setEdit({ ...edit, password: e.target.value })}
                      placeholder="Leave blank to keep current"
                      autoComplete="off"
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
            <div className={suspended ? "usr-row suspended" : "usr-row"} key={u.id}>
              <div className="usr-main">
                <strong>
                  {u.name}
                  {self && <span className="usr-you">you</span>}
                </strong>
                <span className="usr-email">{u.email}</span>
                <small className="usr-meta">
                  {String(u.role)} · last login {fmtDate(u.last_login_at)}
                  {u.must_change ? " · password reset pending" : ""}
                </small>
              </div>
              <span className={suspended ? "usr-badge suspended" : "usr-badge"}>
                {suspended ? "Suspended" : "Active"}
              </span>
              <div className="gm-actions">
                {self ? (
                  <span className="usr-selfnote">—</span>
                ) : confirm === "suspend" ? (
                  <>
                    <button className="gm-linkbtn danger" disabled={busy} onClick={() => setStatus(u, "suspended")}>
                      Confirm suspend
                    </button>
                    <button className="gm-linkbtn" disabled={busy} onClick={() => setConfirmId(null)}>
                      Keep
                    </button>
                  </>
                ) : confirm === "delete" ? (
                  <>
                    <button className="gm-linkbtn danger" disabled={busy} onClick={() => doDelete(u)}>
                      Confirm delete
                    </button>
                    <button className="gm-linkbtn" disabled={busy} onClick={() => setConfirmId(null)}>
                      Keep
                    </button>
                  </>
                ) : (
                  <>
                    <button className="gm-linkbtn" disabled={busy} onClick={() => startEdit(u)}>
                      Edit
                    </button>
                    {suspended ? (
                      <button className="gm-linkbtn" disabled={busy} onClick={() => setStatus(u, "active")}>
                        Activate
                      </button>
                    ) : (
                      <button
                        className="gm-linkbtn"
                        disabled={busy}
                        onClick={() => setConfirmId({ id: u.id, action: "suspend" })}
                      >
                        Suspend
                      </button>
                    )}
                    <button
                      className="gm-linkbtn danger"
                      disabled={busy}
                      onClick={() => setConfirmId({ id: u.id, action: "delete" })}
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
