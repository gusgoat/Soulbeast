// Presentation only. The authoritative activity service supplies publish() events.
// Never infer a boss spawn from a device clock or create an activity here.
const phases = { active: 0, expired: 1, defeated: 2 };
const countries = { blue: 'คีรีมรกต', green: 'พนาสมุทร', red: 'อัคนีบรรพต' };
export function normalizeAnnouncement(value) {
 if (!value || !/^[\w-]{1,100}$/.test(value.id || '') || !Object.hasOwn(phases, value.status)) return null;
 const end = Number(value.end);
 if (!Number.isFinite(end) || end <= 0) return null;
 return { id: value.id, status: value.status === 'active' && end <= Date.now() ? 'expired' : value.status,
  end, country: countries[value.country] ? value.country : null,
  name: String(value.name || 'บอสอาณาจักร').slice(0, 80),
  level: Math.max(1, Math.min(999, Number(value.level) || 1)),
  location: String(value.location || '').slice(0, 120),
  winner: String(value.winner || '').slice(0, 80) };
}
export function newerAnnouncement(previous, next) {
 if (!previous) return true;
 if (previous.id === next.id) return phases[next.status] >= phases[previous.status];
 return next.end > previous.end;
}
const asset = name => new URL('../assets/' + name, import.meta.url).href;
function visible(el) {
 if (!el || !el.getClientRects().length) return false;
 for (let node = el; node?.nodeType === 1; node = node.parentElement) {
  const css = getComputedStyle(node);
  if (node.hidden || css.display === 'none' || css.visibility === 'hidden') return false;
 }
 return true;
}
export function mountAnnouncements() {
 if (window.SoulbeastAnnouncements) return window.SoulbeastAnnouncements;
 // The outer scene owns notifications; HUD/menu frames must not duplicate them.
 if (parent !== window) return null;
 const walkingPage = /\/tools\/(?:town|hemant)-walk-demo\/index\.html$/.test(location.pathname);
 const context = (() => { try { return JSON.parse(sessionStorage.getItem('soulbeast-online-walk-v1') || '{}'); } catch { return {}; } })();
 const scope = [context.owner, context.code, context.environment].map(v => String(v || '')).join(':');
 const key = 'soulbeast-event-announcement-v1:' + scope;
 let pending = null, acknowledged = '', manual = false, previousFocus = null, full = false, timer, scheduled = false, content = '';
 try { const stored = JSON.parse(sessionStorage.getItem(key) || '{}'); pending = normalizeAnnouncement(stored.pending); acknowledged = stored.acknowledged || ''; } catch {}
 const host = document.createElement('div'); host.id = 'eventAnnouncements';
 const shadow = host.attachShadow({ mode: 'open' });
 shadow.innerHTML = `<style>
 :host{position:relative;z-index:10025;font-family:Tahoma,sans-serif;color:#ffe9af}
 [hidden]{display:none!important}button{font:inherit;color:inherit;cursor:pointer;border:1px solid #d2ae59;border-radius:12px;background:linear-gradient(#244b56,#092832);padding:10px 16px;min-height:44px}button:focus-visible{outline:3px solid #fff}
 .compact{position:fixed;top:calc(env(safe-area-inset-top,0px) + 100px);left:10px;right:10px;max-width:520px;margin:auto;display:flex;gap:8px;align-items:center;border:1px solid #d2ae59;border-radius:12px;background:#08232ff2;padding:5px 8px;box-shadow:0 4px 14px #0008;font-size:13px}
 .compact .details{flex:1;text-align:left;border:0;background:none;padding:5px;line-height:1.5}.close{padding:5px 12px;font-size:22px}
 .shade{position:fixed;inset:0;background:#0009;display:grid;place-items:center;padding:16px;box-sizing:border-box}
 .card{box-sizing:border-box;position:relative;width:min(440px,100%);max-height:calc(100dvh - 32px);overflow:auto;padding:26px 22px;border:2px solid #d2ae59;border-radius:18px;background:radial-gradient(ellipse at top,#194b58,#061923 80%);box-shadow:0 0 0 4px #132d37,0 15px 50px #000b;text-align:center}
 .logo{width:190px;max-width:70%;height:auto}.card h2{font-size:25px;margin:16px 0}.card p{line-height:1.7}.flag{width:48px;height:34px;object-fit:contain;vertical-align:middle;margin-right:8px}.card .close{position:absolute;right:8px;top:8px}.continue{width:100%;margin-top:12px}
 @media(prefers-reduced-motion:no-preference){.card{animation:appear .15s ease-out}@keyframes appear{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}}
 </style><aside class="compact" hidden aria-label="ประกาศกิจกรรม"><button class="details"></button><button class="close" aria-label="อ่านแล้วและปิดประกาศ">×</button></aside>
 <div class="shade" hidden><section class="card" role="dialog" aria-modal="true" aria-labelledby="eventTitle" tabindex="-1"><button class="close" aria-label="ปิดประกาศ">×</button><img class="logo" alt="SoulBeast"><h2 id="eventTitle"></h2><p class="country"></p><p class="description"></p><p class="location"></p><button class="continue">รับทราบ</button></section></div>`;
 const get = selector => shadow.querySelector(selector);
 get('.logo').src = asset('ui/soulbeast-logo-v2.webp');
 const signature = () => pending ? pending.id + ':' + pending.status : '';
 function persist() { try { sessionStorage.setItem(key, JSON.stringify({ pending, acknowledged })); } catch {} }
 function busy() {
  if (!walkingPage) return true;
  if (window.walkAnnouncementBusy?.() || window.walkSocial?.isOpen || window.walkAtlas?.isOpen?.()) return true;
  return [...document.querySelectorAll('dialog[open],iframe:not(#hudTop):not(#hudBottom),[aria-modal="true"],.quest-art-view,.walk-loading,#worldAtlas')].some(visible);
 }
 function setFull(value) {
  if (full === value) return;
  full = value;
  document.documentElement.toggleAttribute('data-event-announcement-open', value);
  dispatchEvent(new CustomEvent('soulbeast-announcement-visibility', { detail: { open: value } }));
  if (value) { previousFocus = document.activeElement; dispatchEvent(new Event('blur')); get('.card').focus({ preventScroll: true }); }
  else if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
 }
 function render() {
  scheduled = false;
  clearTimeout(timer);
  // Native dialogs occupy the browser top layer. Keep the compact notice in
  // that layer too, rather than hiding it behind a bag or NPC dialog.
  const dialogs = [...document.querySelectorAll('dialog[open]')].filter(visible);
  const container = dialogs.at(-1) || document.body;
  if (host.parentElement !== container) container.append(host);
  if (pending?.status === 'active' && pending.end <= Date.now()) { pending = { ...pending, status: 'expired' }; manual = false; persist(); }
  const show = pending && signature() !== acknowledged && !document.hidden;
  const expanded = !!show && (manual || !busy());
  get('.compact').hidden = !show || expanded;
  get('.shade').hidden = !expanded;
  if (show && content !== JSON.stringify(pending)) {
   content = JSON.stringify(pending);
   const title = pending.status === 'active' ? 'บอสอาณาจักรปรากฏตัว!' : pending.status === 'defeated' ? 'บอสอาณาจักรถูกปราบแล้ว' : 'กิจกรรมบอสอาณาจักรสิ้นสุดแล้ว';
   get('#eventTitle').textContent = title;
   get('.details').textContent = title + ' · แตะดูรายละเอียด';
   const country = get('.country'); country.replaceChildren();
   if (pending.country) { const flag = document.createElement('img'); flag.className = 'flag'; flag.alt = ''; flag.src = asset('ui/country-war/flag-' + pending.country + '-v1.webp'); country.append(flag, document.createTextNode(countries[pending.country])); }
   get('.description').textContent = pending.status === 'active' ? `${pending.name} · Lv ${pending.level}` : pending.status === 'defeated' ? (pending.winner ? 'ผู้ปิดฉาก: ' + pending.winner : 'ขอบคุณผู้ผนึกที่ร่วมต่อสู้') : 'หมดเวลารอบนี้แล้ว ติดตามประกาศรอบต่อไป';
   get('.location').textContent = pending.status === 'active' && pending.location ? 'สถานที่: ' + pending.location : '';
  }
  if (show && pending.status === 'active') timer = setTimeout(schedule, Math.min(2147483647, Math.max(1, pending.end - Date.now())));
  setFull(expanded);
 }
 function schedule() { if (!scheduled) { scheduled = true; requestAnimationFrame(render); } }
 function dismiss() { acknowledged = signature(); manual = false; persist(); schedule(); }
 get('.details').onclick = () => { manual = true; schedule(); };
 shadow.querySelectorAll('.close,.continue').forEach(button => button.onclick = dismiss);
 shadow.addEventListener('keydown', e => {
  e.stopPropagation();
  if (e.key === 'Escape') { e.preventDefault(); dismiss(); }
  if (full && e.key === 'Tab') { const buttons = [...get('.card').querySelectorAll('button')]; const index = buttons.indexOf(shadow.activeElement); e.preventDefault(); buttons[(index + (e.shiftKey ? -1 : 1) + buttons.length) % buttons.length].focus(); }
 });
 addEventListener('keydown', e => { if (full && !e.composedPath().includes(host)) { e.preventDefault(); e.stopImmediatePropagation(); } }, true);
 addEventListener('visibilitychange', schedule);
 addEventListener('soulbeast-activity-changed', schedule);
 addEventListener('click', () => { if (pending && signature() !== acknowledged) schedule(); });
 const observer = new MutationObserver(() => { if (pending && signature() !== acknowledged) schedule(); });
 observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['hidden', 'open', 'class', 'style'] });
 document.body.append(host);
 const api = Object.freeze({
  publish(value) {
   const next = normalizeAnnouncement(value);
   if (!next || !newerAnnouncement(pending, next)) return false;
   if (pending && signature() !== next.id + ':' + next.status) manual = false;
   pending = next; persist(); schedule(); return true;
  }
 });
 window.SoulbeastAnnouncements = api;
 addEventListener('soulbeast-event-announcement', e => api.publish(e.detail));
 schedule(); return api;
}
if (typeof window !== 'undefined') mountAnnouncements();
