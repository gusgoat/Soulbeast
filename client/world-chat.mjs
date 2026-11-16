import {accountRealtimeConfig, connectAccounts, gameSessionId} from './account-client.mjs?v=gacha-recovery-1';

const contextKey = 'soulbeast-online-walk-v1';
const playerKey = 'soulbeast-walk-preview-player-v1';
const historyMs = 24 * 60 * 60 * 1000;
const solarNames = {
 solar_pentadrake: ['เพนทาไพโรส มังกรห้าเศียรสุริยัน', 'Pentapyros, Five-Headed Solar Dragon', '彭塔皮洛斯·五首日耀龙'],
 solar_mortivar: ['มอร์ทิวาร์ จอมเวทอันเดดนิรันดร์', 'Mortivar, Eternal Undead Archwizard', '莫提瓦尔·永恒亡灵巫王'],
 solar_aureolith: ['ออรีโอลิธ ปราการศักดิ์สิทธิ์', 'Aureolith, Sacred Bastion', '奥瑞欧利斯·神圣磐垒'],
 solar_heliotheon: ['เฮลิโอธีออน เทพจักรพรรดิเหล็กกล้า', 'Heliotheon, God of Solar Steel', '赫利欧西昂·日钢神皇'],
 solar_ferroth: ['เฟอร์รอธ จักรพรรดิปีศาจเหล็กทมิฬ', 'Ferroth, Blacksteel Demon Emperor', '费洛斯·黑钢魔皇'],
 solar_cryostag: ['คริโอสเทล กวางมงกุฎเหมันต์', 'Cryostel, Wintercrown Stag', '克里欧斯特·冬冠圣鹿'],
 solar_raijaku: ['ไรจาคุ ราชันมยุราวายุ', 'Raijaku, Thunderwind Peacock', '雷雀·风雷孔雀王'],
 solar_thalassyr: ['ธาลัสซีร์ นาคราชมหาสมุทร', 'Thalassyr, Sovereign of the Endless Sea', '塔拉希尔·无尽海龙王']
};
const copy = {
 th: {
  world:'แชทโลก', guild:'แชทกิลด์', personal:'ข้อความส่วนตัว', open:'เปิดแชทโลก', close:'ปิด', send:'ส่ง',
  guildInput:'พิมพ์ข้อความถึงสมาชิกกิลด์', guildEmpty:'ยังไม่มีข้อความในกิลด์',
  noGuild:'เข้าร่วมกิลด์เพื่อใช้แชทกิลด์', ready:'',
  friends:'แชทเพื่อน', friendBack:'รายชื่อเพื่อน', friendInput:'พิมพ์ข้อความถึง {0}',
  noFriends:'ยังไม่มีเพื่อนที่สามารถแชทได้', friendEmpty:'ยังไม่มีข้อความกับเพื่อนคนนี้',
  leftToday:'เหลือ {0}/{1} ข้อความวันนี้', dailyLimit:'ครบโควตาวันนี้แล้ว · ส่งได้อีกครั้งหลังเที่ยงคืน',
  input:'พิมพ์ข้อความถึงผู้เล่นทุกคน', empty:'ยังไม่มีข้อความในแชทโลก', emptyPersonal:'ยังไม่มีข้อความจากระบบ',
  loading:'กำลังโหลดแชท…', error:'เชื่อมต่อแชทไม่ได้ กำลังลองใหม่…', failed:'ยังส่งข้อความไม่ได้ ลองอีกครั้ง',
  invalid:'พิมพ์ข้อความ 1–240 ตัวอักษร', limit:'ส่งได้ 1 ข้อความทุก 2 ชั่วโมง',
  wait:'ส่งได้อีกครั้งใน {0}', system:'ระบบ',
  solar:'{0} สุ่มกาชาได้ {1} (อสูรตำนานสุริยคราส)', camp:'ค่ายของคุณถูกโจมตีโดย {0}',
  war:'ตัวละครของคุณในสงครามอาณาจักรเสียชีวิต',
  friend:'{0} ส่งคำขอเป็นเพื่อน กรุณาตอบรับหรือปฏิเสธในเมนูเพื่อน',
  stats:'คุณมีแต้มค่าสถานะที่ยังไม่ได้อัป {0} แต้ม'
 },
 en: {
  world:'World Chat', guild:'Guild Chat', personal:'Personal Notices', open:'Open world chat', close:'Close', send:'Send',
  guildInput:'Message your guild', guildEmpty:'No guild messages yet',
  noGuild:'Join a guild to use guild chat.', ready:'',
  friends:'Friends Chat', friendBack:'Friends list', friendInput:'Message {0}',
  noFriends:'No friends available to chat.', friendEmpty:'No messages with this friend yet.',
  leftToday:'{0} of {1} messages left today', dailyLimit:'Daily limit reached. Send again after midnight (Bangkok).',
  input:'Message all players', empty:'No world chat messages yet', emptyPersonal:'No system notices yet',
  loading:'Loading chat…', error:'Chat is unavailable. Retrying…', failed:'Message could not be sent. Try again.',
  invalid:'Enter 1–240 characters', limit:'One message every 2 hours', wait:'Send again in {0}', system:'System',
  solar:'{0} drew {1} (Solar Eclipse Legendary Beast)', camp:'Your camp was attacked by {0}',
  war:'Your character died in Kingdom War.',
  friend:'{0} sent you a friend request. Accept or decline it in Friends.',
  stats:'You have {0} unspent stat points.'
 },
 'zh-CN': {
  world:'世界聊天', guild:'公会聊天', personal:'个人通知', open:'打开世界聊天', close:'关闭', send:'发送',
  guildInput:'向公会成员发送消息', guildEmpty:'暂无公会消息',
  noGuild:'加入公会后即可使用公会聊天。', ready:'',
  friends:'好友聊天', friendBack:'好友列表', friendInput:'向 {0} 发送消息',
  noFriends:'暂无可以聊天的好友。', friendEmpty:'你与这位好友还没有消息。',
  leftToday:'今日剩余 {0}/{1} 条消息', dailyLimit:'已达每日上限，曼谷时间午夜后可再次发送。',
  input:'向所有玩家发送消息', empty:'暂无世界聊天消息', emptyPersonal:'暂无系统通知',
  loading:'正在加载聊天…', error:'聊天连接失败，正在重试…', failed:'发送失败，请重试。',
  invalid:'请输入 1–240 个字符', limit:'每两小时可发送一条消息', wait:'{0} 后可再次发送', system:'系统',
  solar:'{0} 抽到了 {1}（日食传说灵兽）', camp:'你的营地遭到 {0} 攻击',
  war:'你的角色在王国战争中阵亡。', friend:'{0} 向你发送了好友请求，请在好友菜单中接受或拒绝。',
  stats:'你有 {0} 点未分配的属性点。'
 }
};

function stored(key) {
 try { return JSON.parse(sessionStorage.getItem(key)); } catch { return null; }
}

function node(tag, className = '') {
 const element = document.createElement(tag);
 if (className) element.className = className;
 element.translate = false;
 return element;
}

function liveRows(rows, time, limit) {
 return rows.filter(row => Date.parse(row.created_at) >= time-historyMs).slice(-limit);
}

function appendPortrait(parent,row) {
 const catalog = window.sealerSpriteCatalog;
 if (row.kind!=='player' || !catalog || !Object.hasOwn(catalog,row.speaker_class)) return;
 const career = catalog[row.speaker_class];
 const asset = career[row.speaker_gender==='female'?'female':'male']?.portrait;
 if (!asset) return;
 const portrait = node('img','sb-chat-portrait');
 portrait.src = asset;
 portrait.alt = career.name;
 portrait.decoding = 'async';
 parent.append(portrait);
}

export function mountWorldChat(anchor, context = stored(contextKey), account) {
 if (!anchor || !context?.owner || !context.code || context.exiting) return;
 account ??= connectAccounts(() => {});
 const preview = node('button','sb-chat-preview');
 const dialog = node('dialog','sb-chat');
 const header = node('header','sb-chat-heading');
 const heading = node('h2');
 heading.id = 'sb-chat-heading';
 dialog.setAttribute('aria-labelledby',heading.id);
 const close = node('button');
 const tabs = node('nav','sb-chat-tabs');
 const worldTab = node('button');
 const guildTab = node('button');
 const friendsTab = node('button');
 const personalTab = node('button');
 const tabButtons = {world:worldTab,guild:guildTab,friends:friendsTab,personal:personalTab};
 const friendBack = node('button','sb-chat-friend-back');
 const panel = node('div','sb-chat-panel');
 const log = node('div','sb-chat-log');
 log.setAttribute('role','log');
 log.tabIndex = 0;
 const form = node('form','sb-chat-form');
 const input = node('input');
 input.type = 'text';
 input.autocomplete = 'off';
 // Allow supplementary Unicode characters; the submission check counts code points.
 input.maxLength = 480;
 const send = node('button');
 const status = node('p','sb-chat-status');
 status.setAttribute('role','status');
 preview.type = close.type = friendBack.type = 'button';
 for (const button of Object.values(tabButtons)) button.type = 'button';
 send.type = 'submit';
 header.append(friendBack,heading,close);
 tabs.append(worldTab,guildTab,friendsTab,personalTab);
 form.append(input,send,status);
 panel.append(log);
 dialog.append(header,tabs,panel,form);
 anchor.append(preview);
 document.body.append(dialog);

 let world = [], personal = [], retryAt = 0, serverOffset = 0;
 let tab = 'world', loaded = false, fullLoaded = false, unavailable = false;
 let messageError = '', submitting = false, disposed = false;
 const drafts = {}, draftRequests = {}, quotas = {};
 let guild = null, guildRows = [], guildRetryAt = 0, guildLoaded = false, guildUnavailable = false;
 let guildLoading, guildRerun = false, guildTimer, lastGuildRefresh = 0;
 let friends = [], selectedFriend = null, friendRows = [], friendRetryAt = 0;
 let friendsLoaded = false, friendsUnavailable = false, friendLoading, friendRerun = false, friendTimer, lastFriendRefresh = 0;
 let connected = false, lastRefresh = 0, loading, rerun = false, refreshTimer, realtime, realtimeToken;
 let logVersion = '', previewVersion = '';
 const params = {p_env:context.environment,p_code:context.code};
 const now = () => Date.now()+serverOffset;
 const language = () => window.SoulbeastLocale?.get() || document.documentElement.lang || 'th';
 const t = (key,...values) => (copy[language()] || copy.th)[key].replace(/\{(\d+)\}/g,(_,i) => values[i] ?? '');
 const updateClock = value => { if (value) serverOffset = Date.parse(value)-Date.now(); };
 const current = () => {
  const active = stored(contextKey);
  return !active?.exiting && active?.owner === context.owner && active?.code === context.code
   && active?.environment === context.environment;
 };
 const token = async () => {
  if (!current()) throw Error('login_required');
  const jwt = await account.sessions.token();
  if (context.sessionId && gameSessionId(jwt) !== context.sessionId) throw Error('session_replaced');
  return jwt;
 };
 const request = async (route, body) => account.request('/rest/v1/rpc/sb_'+route,{...params,...body},await token());
 const draftKey = () => tab==='friends' ? (selectedFriend && 'friend:'+selectedFriend.id) : tab==='personal'?null:tab;
 const storeDraft = () => { const key = draftKey(); if (key) drafts[key] = input.value; };
 const setQuota = (scope,result) => {
  const at = Date.parse(result.serverTime);
  if (Number.isInteger(result.left) && !(at<quotas[scope]?.at)) {
   quotas[scope] = {left:result.left,limit:result.limit,reset:Date.parse(result.resetAt),at};
  }
 };

 function format(row) {
  if (row.kind === 'player') return row.speaker+' · '+row.body;
  const localeIndex = {'th':0,'en':1,'zh-CN':2}[language()] ?? 0;
  const beast = solarNames[row.body]?.[localeIndex] || row.body;
  return t('system')+' · '+t(row.kind,row.speaker,beast);
 }

 function render() {
  const isGuild = tab === 'guild';
  const isFriends = tab === 'friends';
  const retry = isGuild?guildRetryAt:isFriends?friendRetryAt:retryAt;
  const remaining = Math.max(0,Math.ceil((retry-now())/1000));
  const quota = quotas[tab];
  const messagesLeft = quota && (quota.reset>now()?quota.left:quota.limit);
  const clock = [Math.floor(remaining/3600),Math.floor(remaining/60)%60,remaining%60]
   .map(n => String(n).padStart(2,'0')).join(':');
  const entries = liveRows(world,now(),dialog.open?50:3);
  world = entries;
  const overview = entries.slice(-3);
  const previewKey = JSON.stringify([overview,language(),loaded]);
  if (previewVersion !== previewKey) {
   previewVersion = previewKey;
   preview.setAttribute('aria-label',t('open'));
   preview.replaceChildren();
   for (const row of overview.length ? overview : [null]) {
    const line = node('span');
    if (row?.kind==='solar') line.className = 'sb-chat-system';
    if (row) appendPortrait(line,row);
    line.append(document.createTextNode(row?format(row):t(loaded?'empty':'world')));
    preview.append(line);
   }
  }
  if (!dialog.open) return;

  heading.textContent = isGuild && guild ? t('guild')+' · '+guild.name : isFriends && selectedFriend ? selectedFriend.name : t(tab);
  friendBack.hidden = !isFriends || !selectedFriend;
  friendBack.textContent = t('friendBack');
  close.textContent = t('close');
  for (const [name,button] of Object.entries(tabButtons)) {
   button.textContent = t(name);
   button.setAttribute('aria-pressed',String(tab===name));
  }
  input.placeholder = t(isGuild?'guildInput':isFriends?'friendInput':'input',selectedFriend?.name);
  input.setAttribute('aria-label',input.placeholder);
  send.textContent = t('send');
  const tabLoaded = isGuild?guildLoaded:isFriends?friendsLoaded:fullLoaded;
  const tabUnavailable = isGuild?guildUnavailable:isFriends?friendsUnavailable:unavailable;
  const hasRoom = isGuild?Boolean(guild):isFriends?Boolean(selectedFriend):tab==='world';
  send.disabled = submitting || remaining>0 || !tabLoaded || !hasRoom || tabUnavailable || messagesLeft===0;
  input.disabled = submitting;
  form.hidden = !hasRoom;
  const stateText = messageError || (tabUnavailable?'error':!tabLoaded?'loading':messagesLeft===0?'dailyLimit':remaining?'wait':quota?'leftToday':tab==='world'?'limit':'ready');
  status.textContent = stateText==='leftToday' ? t(stateText,messagesLeft,quota.limit) : t(stateText,clock);

  const player = stored(playerKey);
  const points = player?.code === context.code ? Math.max(0,Math.floor(Number(player.free)||0)) : 0;
  const rows = tab==='world' ? entries : liveRows(isGuild?guildRows:isFriends?friendRows:personal,now(),50);
  const choosingFriend = isFriends && !selectedFriend;
  const version = JSON.stringify([tab,language(),rows,tab==='personal'?points:0,tabLoaded,tabUnavailable,guild?.id,
   selectedFriend?.id,choosingFriend?friends:[]]);
  if (version === logVersion) return;
  const follow = log.scrollHeight-log.scrollTop-log.clientHeight<36 || !log.childElementCount;
  const oldScroll = log.scrollTop;
  logVersion = version;
  const items = [];
  log.classList.toggle('sb-chat-directory',choosingFriend && friends.length>0 && tabLoaded && !tabUnavailable);
  if (choosingFriend && tabLoaded && !tabUnavailable) {
   for (const friend of friends) {
    const button = node('button','sb-chat-friend');
    button.type = 'button';
    button.textContent = friend.name;
    button.onclick = () => openFriend(friend);
    items.push(button);
   }
  }
  for (const row of rows) {
   const p = node('p',row.kind==='player'?'sb-chat-message':'sb-chat-message sb-chat-system');
   const content = node('span','sb-chat-message-content');
   const time = node('time');
   time.dateTime = row.created_at;
   time.textContent = new Date(row.created_at).toLocaleTimeString(language(),{hour:'2-digit',minute:'2-digit'});
   appendPortrait(p,row);
   if (row.kind==='player') {
    const speaker = node('strong');
    speaker.textContent = row.speaker;
    content.append(speaker,document.createTextNode(' · '+row.body));
   } else {
    content.textContent = format(row);
   }
   p.append(content,time);
   items.push(p);
  }
  if (tab==='personal' && points>0) {
   const p = node('p','sb-chat-stat');
   p.textContent = t('stats',points);
   items.unshift(p);
  }
  if (!items.length) {
   const state = node('p','sb-chat-empty');
   const empty = isGuild ? (guild?'guildEmpty':'noGuild') : isFriends ? (selectedFriend?'friendEmpty':'noFriends')
    : tab==='world'?'empty':'emptyPersonal';
   state.textContent = t(tabUnavailable?'error':!tabLoaded?'loading':empty);
   items.push(state);
  }
  log.replaceChildren(...items);
  log.scrollTop = choosingFriend ? oldScroll : follow ? log.scrollHeight : oldScroll;
 }

 function refresh() {
  if (disposed || document.hidden) return;
  if (loading) { rerun = true; return loading; }
  const full = dialog.open;
  lastRefresh = Date.now();
  loading = request('world_chat_feed',{p_full:full}).then(result => {
   if (disposed || !current()) return;
   updateClock(result.serverTime);
   world = result.world;
   if (full) {
    personal = result.personal;
    retryAt = Math.max(retryAt,Date.parse(result.retryAt)||0);
    fullLoaded = true;
   }
   loaded = true;
   unavailable = false;
  }).catch(() => {
   unavailable = true;
   if (!current()) clear();
  }).finally(() => {
   loading = null;
   render();
   if (rerun) { rerun = false; refresh(); }
  });
  return loading;
 }

 function scheduleRefresh() {
  clearTimeout(refreshTimer);
  refreshTimer = setTimeout(refresh,300);
 }

 function setGuild(next) {
  if (guild?.id !== next?.id) {
   guildRows = [];
   guildRetryAt = 0;
   drafts.guild = '';
   delete draftRequests.guild;
   if (tab==='guild') input.value = '';
  }
  guild = next;
 }

 function refreshGuild() {
  if (disposed || document.hidden || !dialog.open || tab!=='guild') return;
  if (guildLoading) { guildRerun = true; return; }
  lastGuildRefresh = Date.now();
  guildLoading = request('guild_chat_feed',{}).then(result => {
   if (disposed || !current() || !dialog.open || tab!=='guild') return;
   updateClock(result.serverTime);
   setGuild(result.guild);
   guildRows = result.messages;
   guildRetryAt = Math.max(guildRetryAt,Date.parse(result.retryAt)||0);
   setQuota('guild',result);
   guildLoaded = true;
   guildUnavailable = false;
  }).catch(() => {
   guildRows = [];
   guildUnavailable = true;
  }).finally(() => {
   guildLoading = null;
   render();
   if (guildRerun) { guildRerun = false; refreshGuild(); }
  });
 }

 function scheduleGuildRefresh() {
  clearTimeout(guildTimer);
  guildTimer = setTimeout(refreshGuild,300);
 }

 function openFriend(friend) {
  storeDraft();
  selectedFriend = friend;
  friendRows = [];
  friendsLoaded = false;
  friendsUnavailable = false;
  messageError = '';
  input.value = drafts[draftKey()] || '';
  log.replaceChildren();
  refreshFriends();
  render();
  if (friend) friendBack.focus();
 }

 function refreshFriends() {
  if (disposed || document.hidden || !dialog.open || tab!=='friends') return;
  if (friendLoading) { friendRerun = true; return; }
  const target = selectedFriend?.id ?? null;
  lastFriendRefresh = Date.now();
  friendLoading = request('friend_chat_feed',{p_friend:target}).then(result => {
   if (disposed || !current() || !dialog.open || tab!=='friends' || target!==(selectedFriend?.id ?? null)) return;
   updateClock(result.serverTime);
   friends = result.friends;
   if (target && !result.available) {
    delete drafts['friend:'+target];
    delete draftRequests['friend:'+target];
    selectedFriend = null;
    input.value = '';
   }
   friendRows = result.messages;
   friendRetryAt = Math.max(friendRetryAt,Date.parse(result.retryAt)||0);
   setQuota('friends',result);
   friendsLoaded = true;
   friendsUnavailable = false;
  }).catch(() => {
   friendRows = [];
   friendsUnavailable = true;
  }).finally(() => {
   friendLoading = null;
   render();
   if (friendRerun) { friendRerun = false; refreshFriends(); }
  });
 }

 function scheduleFriendRefresh() {
  clearTimeout(friendTimer);
  friendTimer = setTimeout(refreshFriends,300);
 }

 async function subscribe() {
  const jwt = await token();
  const {createClient} = await import('https://esm.sh/@supabase/supabase-js@2.76.1');
  if (disposed) return;
  realtime = createClient(accountRealtimeConfig.url,accountRealtimeConfig.key,{accessToken:token});
  realtimeToken = jwt;
  await realtime.realtime.setAuth(jwt);
  if (disposed) return;
  const channel = name => realtime.channel('sb-chat:'+context.environment+':'+name,{config:{private:true}});
  channel('world').on('broadcast',{event:'message'},scheduleRefresh).subscribe(state => {
   connected = state === 'SUBSCRIBED';
   if (connected) scheduleRefresh();
  });
  channel(context.owner).on('broadcast',{event:'message'},() => {
   if (dialog.open) scheduleRefresh();
  }).on('broadcast',{event:'guild-message'},scheduleGuildRefresh)
   .on('broadcast',{event:'friend-message'},scheduleFriendRefresh).subscribe();
 }

 function clear() {
  world = []; personal = []; loaded = fullLoaded = false;
  if (dialog.open) dialog.close();
  preview.hidden = true;
  disposed = true;
  clearInterval(interval);
  clearTimeout(refreshTimer);
  clearTimeout(guildTimer);
  clearTimeout(friendTimer);
  friends = []; friendRows = []; selectedFriend = null;
  setGuild(null);
  if (realtime) void realtime.removeAllChannels().catch(() => {});
 }

 const select = next => {
  if (next===tab && dialog.open && (tab==='guild' || tab==='friends')) return;
  storeDraft();
  tab = next;
  if (tab==='friends') {
   selectedFriend = null;
   input.value = '';
   openFriend(null);
   return;
  }
  input.value = drafts[draftKey()] || '';
  messageError = '';
  if (tab==='guild') {
   guildRows = [];
   guildLoaded = false;
   guildUnavailable = false;
   refreshGuild();
  }
  log.replaceChildren();
  render();
 };
 for (const [name,button] of Object.entries(tabButtons)) button.onclick = () => select(name);
 friendBack.onclick = () => { openFriend(null); friendsTab.focus(); };
 close.onclick = () => dialog.close();
 preview.onclick = () => {
  if (disposed || !current()) return;
  fullLoaded = false;
  messageError = '';
  dialog.showModal();
  select('world');
  close.focus();
  refresh();
 };
 dialog.onclose = () => {
  personal = [];
  guildRows = [];
  friendRows = [];
  render();
 };
 dialog.addEventListener('keydown',event => event.stopPropagation());
 dialog.addEventListener('keyup',event => event.stopPropagation());
 input.oninput = () => { if (messageError) { messageError = ''; render(); } };
 form.onsubmit = async event => {
  event.preventDefault();
  if (send.disabled || disposed) return;
  const body = input.value.trim().replace(/[\s\x00-\x1F\x7F]+/gu,' ');
  if (!body || [...body].length>240) { messageError = 'invalid'; render(); return; }
  const target = tab;
  const room = target==='guild'?guild?.id:selectedFriend?.id;
  const key = draftKey();
  if (draftRequests[key]?.body !== body) draftRequests[key] = {body,id:crypto.randomUUID()};
  const payload = {p_body:body,p_request:draftRequests[key].id};
  const activeDraft = () => draftKey()===key;
  submitting = true;
  messageError = '';
  render();
  try {
   const result = target==='guild'
    ? await request('guild_chat_send',{...payload,p_guild:room})
    : target==='friends' ? await request('friend_chat_send',{...payload,p_friend:room}) : await request('world_chat_send',payload);
   updateClock(result.serverTime);
   setQuota(target,result);
   if (result.retryAt) {
    if (target==='guild' && room===guild?.id) guildRetryAt = Math.max(guildRetryAt,Date.parse(result.retryAt));
    if (target==='friends') friendRetryAt = Math.max(friendRetryAt,Date.parse(result.retryAt));
    if (target==='world') retryAt = Date.parse(result.retryAt);
   }
   if (result.status==='sent') {
    drafts[key] = '';
    if (activeDraft()) input.value = '';
    delete draftRequests[key];
    if (target==='guild') scheduleGuildRefresh();
    else if (target==='friends') scheduleFriendRefresh();
    else scheduleRefresh();
   } else if (result.status==='invalid_message') {
    if (activeDraft()) messageError = 'invalid';
    delete draftRequests[key];
   } else if (result.status==='guild_changed') {
    setGuild(null);
    guildLoaded = false;
    refreshGuild();
   } else if (result.status==='friend_changed' && activeDraft()) {
    openFriend(null);
    delete drafts[key];
    delete draftRequests[key];
   }
  } catch {
   if (activeDraft()) messageError = 'failed';
  } finally {
   submitting = false;
   render();
  }
 };

 document.addEventListener('visibilitychange',() => {
  if (!document.hidden) { scheduleRefresh(); scheduleGuildRefresh(); scheduleFriendRefresh(); }
 });
 window.addEventListener('pageshow',scheduleRefresh);
 window.addEventListener('pagehide',event => { if (!event.persisted) clear(); });
 window.addEventListener('soulbeast-language-change',render);
 const interval = setInterval(() => {
  if (!current()) { clear(); return; }
  if (Date.now()-lastGuildRefresh>15000) refreshGuild();
  if (Date.now()-lastFriendRefresh>15000) refreshFriends();
  if (Date.now()-lastRefresh>(connected?90000:15000)) {
   refresh();
   if (realtime) void token().then(jwt => {
    if (jwt === realtimeToken) return;
    return realtime.realtime.setAuth(jwt).then(() => { realtimeToken = jwt; });
   }).catch(() => {});
  }
  render();
 },1000);
 render();
 refresh();
 void subscribe().catch(() => {});
 return {dialog,preview};
}

const anchor = document.querySelector('.location') || document.querySelector('body > header:not(.legacy-walk-header)');
if (anchor && stored(contextKey)?.owner) mountWorldChat(anchor);
