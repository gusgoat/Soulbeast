import {connectAccounts,accountRealtimeConfig} from './account-client.mjs?v=walk-realtime-test-1';

const contextKey = 'soulbeast-online-walk-v1';
const playerKey = 'soulbeast-walk-preview-player-v1';

function saveComparable(player) {
 const canonical = value => Array.isArray(value) ? value.map(canonical) :
  value && typeof value === 'object'
   ? Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])]))
   : value;
 const {gsAt, cpin, walkId, ...data} = player;
 return JSON.stringify(canonical(data));
}

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
  let request = context.request || {serialized, id: crypto.randomUUID()};
  let snapshot = {...context.snapshot, P: JSON.parse(request.serialized)};
  const commit = () => {
   context.request = request;
   sessionStorage.setItem(contextKey, JSON.stringify(context));
   return client.game('save', {
    code: context.code, expectedSaveAt: context.revision,
    data: JSON.stringify(snapshot), _sbRequest: request.id
   }, context.environment);
  };
  try {
    let response;
    try {
     response = await commit();
    } catch (error) {
     if ((error.code || error.message) !== 'save_conflict') throw error;
     const latest = await client.game('load', {code:context.code}, context.environment);
     const server = JSON.parse(latest.data);
     const revision = Number(latest.accountSaveAt || latest.at);
     if (server.P?.code !== context.code || revision <= context.revision ||
         !Number.isFinite(revision) || saveComparable(server.P) !== saveComparable(context.snapshot.P)) throw error;
     // Only the revision changed. Preserve the server snapshot and retry this exact player update once.
     context.revision = revision;
     context.snapshot = {...server, P:context.snapshot.P};
     snapshot = {...server, P:snapshot.P};
     request = {...request, id:crypto.randomUUID()};
     response = await commit();
    }
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
  if(!strict)return pending.catch(()=>{});
  // An autosave already in flight may contain the inventory before a purchase.
  return pending.then(()=>lock(async()=>{
   while(true){
    syncRevision();
    const player=JSON.parse(sessionStorage.getItem(playerKey)||'null');
    if(player?.code!==context.code)throw Error('character_not_owned');
    if(!context.request&&JSON.stringify(player)===JSON.stringify(context.snapshot.P))return;
    await saveWalk();
   }
  }));
 }

 let appearanceKey='', appearanceAt=0, nextAppearanceAttempt=0, appearancePending=null;
 async function heartbeat(scene, position, moving, running) {
  const rows=await client.request('/rest/v1/rpc/sb_walk_heartbeat', {
   p_env: context.environment, p_code: context.code, p_scene: scene,
   p_x: position.x, p_y: position.y, p_direction: position.dir || 0,
   p_moving: !!moving, p_running: !!running
  }, await client.sessions.token());
  const p=JSON.parse(sessionStorage.getItem(playerKey)||'null');
  const signature=JSON.stringify([p?.walkFusion||null,p?.entitlements,p?.carried,p?.party,p?.pets?.map(v=>[v.uid,v.sp])]);
  if(!appearancePending&&Date.now()>=nextAppearanceAttempt&&(signature!==appearanceKey||Date.now()-appearanceAt>60000)){
   appearancePending=(async()=>{
    // Appearance is validated against server ownership independently of full-save revisions.
    // A save conflict must not prevent owned cosmetic forms from reaching other players.
    const result=await client.request('/rest/v1/rpc/sb_walk_appearance',{p_env:context.environment,p_code:context.code,p_fusion:p?.walkFusion||null},await client.sessions.token());
    if((result?.walkFusion||null)!==(p?.walkFusion||null)){nextAppearanceAttempt=Date.now()+3000;return;}
    appearanceKey=signature;appearanceAt=Date.now();nextAppearanceAttempt=0;
   })().catch(error=>{console.warn('Appearance sync failed',error.code||error.message);nextAppearanceAttempt=Date.now()+10000;}).finally(()=>{appearancePending=null;});
  }
  return rows;
 }

 async function invitations(action, {target = null, invite = null} = {}) {
  return client.request('/rest/v1/rpc/sb_dungeon_invitation', {
   p_env: context.environment, p_code: context.code, p_action: action,
   p_target: target, p_invite: invite
  }, await client.sessions.token());
 }

 const send = (action, extra) => client.game(action, {...extra, code: context.code}, context.environment);
 const social = (action, extra = {}) => {
  const draw = action === 'gacha_draw';
  const towerMutation = action.startsWith('tower_') && action !== 'tower_status';
  if (!draw && !towerMutation) return send(action, extra);
  return lock(async () => {
   if (draw) syncRevision();
   else await saveWalk();
   const result = await send(action, extra);
   if (draw) {
    const snapshot = JSON.parse(result.data);
    if (snapshot.P?.code !== context.code || !result.accountSaveAt) throw Error('bad data');
    context.snapshot = snapshot;
    sessionStorage.setItem(playerKey, JSON.stringify(snapshot.P));
   }
   if (result.accountSaveAt) {
    context.revision = result.accountSaveAt;
    sessionStorage.setItem(contextKey, JSON.stringify(context));
   }
   return result;
  });
 };
 const socialTarget = async peer => client.request('/rest/v1/rpc/sb_walk_social_target', {
  p_env: context.environment, p_code: context.code, p_peer: peer
 }, await client.sessions.token());
 const walkRealtimeTest = context.environment==='live' || (context.environment==='test' && new URLSearchParams(location.search).get('realtimeWalk')==='1');
 const openWalkRealtime = async () => {
  const {connectWalkRealtime}=await import('./walk-realtime-test.mjs?v=live-1');
  return connectWalkRealtime({...accountRealtimeConfig,environment:context.environment,token:()=>client.sessions.token(),
   identity:async()=>client.request('/rest/v1/rpc/'+(context.environment==='live'?'sb_walk_live_identity':'sb_walk_test_identity'),{p_code:context.code},await client.sessions.token())
  });
 };
 return {flush, heartbeat, invitations, social, socialTarget, walkRealtimeTest, openWalkRealtime};
}

export function mountDungeonInvitations(connection, peers) {
 const button = document.createElement('button');
 button.textContent = 'ทีมดันเจี้ยน';
 button.style.cssText = 'position:fixed;bottom:calc(var(--walk-bottom, 0px) + 14px);right:58px;z-index:90;transform:scale(.5);transform-origin:right bottom;padding:9px;color:#fff0be;background:#162d3c;border:1px solid #b89860;border-radius:8px';
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
