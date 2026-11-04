import {connectAccounts} from './account-client.mjs';

const contextKey = 'soulbeast-online-walk-v1';
const playerKey = 'soulbeast-walk-preview-player-v1';

export function enterOnlineWalk(state, environment, owner) {
 const player = structuredClone(state.P);
 delete player.cpin;
 delete player.walkId;
 const country = ['blue','green','red'].includes(player.country) ? player.country : 'blue';
 sessionStorage.setItem(playerKey, JSON.stringify(player));
 sessionStorage.setItem(contextKey, JSON.stringify({
  code: player.code, environment, owner, revision: player.gsAt, snapshot: {...state, P: player}
 }));
 location.assign('./tools/town-walk-demo/index.html?city=' + country + '-capital');
}

export function connectOnlineWalk(accountStorage) {
 const context = JSON.parse(sessionStorage.getItem(contextKey) || 'null');
 if (!context) return null;
 const client = connectAccounts(() => {}, accountStorage);
 let pending = null;
 const lock = task => navigator.locks?.request('soulbeast-walk-save:' + context.code, task) ?? task();
 function syncRevision() {
  const latest = JSON.parse(sessionStorage.getItem(contextKey) || 'null');
  if (!latest || latest.code !== context.code || latest.environment !== context.environment || latest.owner !== context.owner) throw Error('login_required');
  Object.assign(context, latest);
  if (!latest.request) delete context.request;
 }
 let stopped = false;

 async function saveWalk() {
  syncRevision();
  const player = JSON.parse(sessionStorage.getItem(playerKey) || 'null');
  if (player?.code !== context.code) return;
  const serialized = JSON.stringify(player);
  if (serialized === JSON.stringify(context.snapshot.P) && !context.request) return;
  const request = context.request || {serialized, id: crypto.randomUUID()};
  const snapshot = {...context.snapshot, P: JSON.parse(request.serialized)};
  context.request = request;
  sessionStorage.setItem(contextKey, JSON.stringify(context));
  try {
    const response = await client.game('save', {
     code: context.code, expectedSaveAt: context.revision,
     data: JSON.stringify(snapshot), _sbRequest: request.id
    }, context.environment);
    context.revision = response.accountSaveAt || response.at;
    context.snapshot = snapshot;
    const accountSnapshot = {...snapshot, P: {...snapshot.P, gsAt: context.revision}};
    if (context.owner) {
     try { (accountStorage ?? localStorage).setItem('soulbeast_account_save_v1:' + context.environment + ':' + context.owner + ':' + context.code, JSON.stringify(accountSnapshot)); } catch {}
    }
    delete context.request;
    sessionStorage.setItem(contextKey, JSON.stringify(context));
   } catch (error) {
    if (error.code === 'save_conflict' || error.status === 401 || error.code === 'character_not_owned') stopped = true;
    window.dispatchEvent(new CustomEvent('online-walk-save-error', {detail: error.code || error.message}));
    throw error;
  }
 }

 function flush(strict = false) {
  if (stopped) return strict ? Promise.reject(Error('save_conflict')) : Promise.resolve();
  pending ??= lock(saveWalk).finally(() => { pending = null; });
  return strict ? pending : pending.catch(() => {});
 }

 async function heartbeat(scene, position, moving, running) {
  return client.request('/rest/v1/rpc/sb_walk_heartbeat', {
   p_env: context.environment, p_code: context.code, p_scene: scene,
   p_x: position.x, p_y: position.y, p_direction: position.dir || 0,
   p_moving: !!moving, p_running: !!running
  }, await client.sessions.token());
 }

 async function invitations(action, {target = null, invite = null} = {}) {
  return client.request('/rest/v1/rpc/sb_dungeon_invitation', {
   p_env: context.environment, p_code: context.code, p_action: action,
   p_target: target, p_invite: invite
  }, await client.sessions.token());
 }

 const send = (action, extra) => client.game(action, {...extra, code: context.code}, context.environment);
 const social = (action, extra = {}) => {
  if (!action.startsWith('tower_') || action === 'tower_status') return send(action, extra);
  return lock(async () => {
   await saveWalk();
   const result = await send(action, extra);
   if (result.accountSaveAt) {
    context.revision = result.accountSaveAt;
    sessionStorage.setItem(contextKey, JSON.stringify(context));
   }
   return result;
  });
 };
 return {flush, heartbeat, invitations, social};
}

export function mountDungeonInvitations(connection, peers) {
 const button = document.createElement('button');
 button.textContent = 'ทีมดันเจี้ยน';
 button.style.cssText = 'position:fixed;bottom:76px;right:12px;z-index:90;padding:9px;color:#fff0be;background:#162d3c;border:1px solid #b89860;border-radius:8px';
 const dialog = document.createElement('dialog');
 dialog.style.cssText = 'width:min(90vw,420px);max-height:75vh;overflow:auto;color:#eee1be;background:#102633;border:1px solid #bd9e65;border-radius:12px;padding:16px';
 document.body.append(button, dialog);
 let loading = false;
 function add(label, action) {
  const control = document.createElement('button');
  control.type = 'button';
  control.textContent = label;
  control.style.cssText = 'display:block;margin:8px 0;padding:8px;background:#213f50;color:#fff0be;border:1px solid #b89860;border-radius:6px';
  control.onclick = action;
  dialog.append(control);
 }
 async function update(action, args) {
  if (loading) return;
  loading = true;
  dialog.textContent = 'กำลังโหลดทีม…';
  try {
   if (action) await connection.invitations(action, args);
   const list = await connection.invitations('list');
   dialog.textContent = 'ทีมดันเจี้ยนออนไลน์';
   add('ปิด', () => dialog.close());
   add('ตรวจคำเชิญ', () => update());
   for (const invitation of list) {
    const invite = invitation.id;
    if (invitation.state === 'accepted') {
     add('เข้าห้องดันเจี้ยนกับทีม', async () => {
      await connection.flush();
      sessionStorage.setItem('soulbeast-online-dungeon-v1', invite);
      sessionStorage.removeItem('soulbeast-dungeon-party-v1');
      location.assign(new URL('../tools/labyrinth-demo/index.html?arrival=entrance', import.meta.url));
     });
     add('ออกจากทีม', () => update('leave', {invite}));
    } else if (invitation.incoming) {
     add('ตอบรับคำชวนจาก ' + invitation.host_name, () => update('accept', {invite}));
     add('ปฏิเสธคำชวน', () => update('decline', {invite}));
    } else {
     const status = document.createElement('p');
     status.textContent = 'รออีกฝ่ายตอบรับ';
     dialog.append(status);
    }
   }
   for (const peer of peers.values()) {
    if (peer.player?.id) add('ชวน ' + peer.player.name, () => update('invite', {target: peer.player.id}));
   }
  } catch (error) {
   dialog.textContent = 'เชื่อมต่อทีมไม่ได้ กรุณาลองใหม่';
   add('ลองใหม่', () => update());
   add('ปิด', () => dialog.close());
  } finally {
   loading = false;
  }
 }
 button.onclick = () => { if (!dialog.open) dialog.showModal(); update(); };
}
