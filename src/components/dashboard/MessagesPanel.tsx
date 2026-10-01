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
 * Dashboard — contact messages: read, mark read, delete.
 */

"use client";

import { useEffect, useState } from "react";
import { jget, jpost } from "./api";

type Message = {
  id: number;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  ip: string;
  created_at: number;
  read_at: number | null;
};

export default function MessagesPanel() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [confirmId, setConfirmId] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    const d = await jget("admin/messages");
    if (d?.ok) setMessages((d.messages as Message[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function markRead(id: number) {
    setBusy(true);
    const d = await jpost("admin/messages/read", { id });
    if (d?.ok) await load();
    setBusy(false);
  }

  async function doDelete(id: number) {
    setBusy(true);
    setConfirmId(null);
    const d = await jpost("admin/messages/delete", { id });
    if (d?.ok) await load();
    setBusy(false);
  }

  if (loading) return <p className="dash-note">Loading messages…</p>;

  const unread = messages.filter((m) => !m.read_at).length;

  return (
    <div>
      {messages.length > 0 && (
        <p className="dash-note">
          {messages.length} message{messages.length === 1 ? "" : "s"} · {unread} unread
        </p>
      )}

      <div className="dash-list">
        {messages.map((m) => (
          <div key={m.id} className={m.read_at ? "dash-msg" : "dash-msg dash-msg-unread"}>
            <div className="dash-msg-head">
              <strong>
                {m.name}
                {!m.read_at && <span className="gm-dot" aria-label="unread" />}
              </strong>
              <span>{new Date(m.created_at * 1000).toLocaleString()}</span>
            </div>
            <small>
              <a href={`mailto:${m.email}`}>{m.email}</a>
              {m.phone ? ` · ${m.phone}` : ""}
              {m.ip ? ` · ${m.ip}` : ""}
            </small>
            {m.subject && <em>{m.subject}</em>}
            <p>{m.message}</p>
            <div className="gm-actions gm-actions-left">
              {!m.read_at && (
                <button className="gm-ghost" onClick={() => markRead(m.id)} disabled={busy}>
                  Mark read
                </button>
              )}
              {confirmId === m.id ? (
                <>
                  <button className="gm-danger" onClick={() => doDelete(m.id)} disabled={busy}>
                    Confirm delete
                  </button>
                  <button className="gm-ghost" onClick={() => setConfirmId(null)}>Keep</button>
                </>
              ) : (
                <button className="gm-ghost gm-del" onClick={() => setConfirmId(m.id)} disabled={busy}>
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}
        {messages.length === 0 && <p className="dash-note">No contact messages yet.</p>}
      </div>
    </div>
  );
}
