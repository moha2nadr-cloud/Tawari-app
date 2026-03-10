/*  api.js
 *  عميل HTTP للتواصل مع عقد الطوارئ
 *  جميع العقد تنشر على 192.168.10.1
 */

const GATEWAY = '192.168.10.1';
const BASE    = `http://${GATEWAY}`;
const TIMEOUT = 5000;

async function go(url, opts = {}) {
  const ctrl  = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT);
  try {
    const r = await fetch(url, { ...opts, signal: ctrl.signal });
    clearTimeout(timer);
    return r;
  } catch {
    clearTimeout(timer);
    return null;
  }
}

/* حالة العقدة  →  {node, village, parent, connected, blocked, fw} */
export async function getStatus() {
  try {
    const r = await go(`${BASE}/api/status`);
    if (!r || !r.ok) return null;
    return await r.json();
  } catch { return null; }
}

/* قائمة المحتوى  →  [{kind,title,body,extra}] */
export async function getContent() {
  try {
    const r = await go(`${BASE}/api/content`);
    if (!r || !r.ok) return [];
    return await r.json();
  } catch { return []; }
}

/* قائمة العملاء  →  [{name,status}] */
export async function getAgents() {
  try {
    const r = await go(`${BASE}/api/agents`);
    if (!r || !r.ok) return [];
    return await r.json();
  } catch { return []; }
}

/* إرسال بلاغ  →  {ok, id, synced} */
export async function sendReport({ type, loc, note, lat, lon }) {
  try {
    const r = await go(`${BASE}/api/report`, {
      method : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body   : JSON.stringify({ type, loc, note, lat, lon }),
    });
    if (!r) return { ok: false, error: 'timeout' };
    if (!r.ok) return { ok: false, error: `http_${r.status}` };
    return await r.json();
  } catch { return { ok: false, error: 'exception' }; }
}

/* رسائل المحادثة  →  [{from, text}] */
export async function getChatMsgs(session) {
  try {
    const r = await go(`${BASE}/chat/msgs?session=${encodeURIComponent(session)}`);
    if (!r || !r.ok) return [];
    const d = await r.json();
    return Array.isArray(d) ? d : [];
  } catch { return []; }
}

/* إرسال رسالة محادثة  →  {ok} */
export async function sendChatMsg({ session, from, text }) {
  try {
    const body = new URLSearchParams({ session, from, text }).toString();
    const r = await go(`${BASE}/chat/send-ajax`, {
      method : 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    if (!r || !r.ok) return { ok: false };
    return await r.json();
  } catch { return { ok: false }; }
}
