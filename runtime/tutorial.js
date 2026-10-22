// First-encounter lessons belong to the character save, never to the device/account.
// @soulbeast-unit 1089-tutorial
const Tutorial={
 pending:null,frame:0,busy:false,practiceBusy:false,
 state(){return S.P?.tutorial?.v===1?S.P.tutorial:null;},
 enabled(){const t=this.state();return !!t&&t.enabled!==false;},
 init(){S.P.tutorial={v:1,enabled:true,done:{},active:'stats',firstBoss:false,raidClaimed:false};},
 store(){save();},
 set(id){const t=this.state();if(t&&t.active!==id){t.active=id;this.store();}},
 finish(key,next=null){const t=this.state();if(!t)return;t.done[key]=true;t.active=next;this.store();},
 online(){return PVP.room?.status==='active'||WORLD.room?.status==='active'||CAMP.room?.status==='active'||GUILD_UI.warRoom?.replaying;},
 forestBattle(){return !!S.zone&&!!S.battle&&!S.battle.over&&!S.battle.towerRun&&!this.online()&&['wild','boss','bandit','traveler','secret','taleTrial'].includes(S.battle.kind);},
 hold(){return this.enabled()&&this.forestBattle()&&['battleIntro','elements','captureIntro'].includes(this.state().active);},
 release(){const p=this.pending;this.pending=null;if(p&&p.battle===S.battle&&!S.battle.over){battleLater(p.fn,100);return;}const b=S.battle;if(!b||b.over||!this.forestBattle())return;if(!b.cur)battleLater(advance,100);},
 free(){return (S.P.free||0)+S.P.pets.reduce((n,p)=>n+(p.free||0),0);},
 ready(){return this.enabled()&&!S.ui.cinema&&!S.ui.confirm&&!this.online()&&!S.zone?.secretSession&&!S.zone?.riddleSession&&!S.zone?.specialSession&&!WorldTales.session();},
 update(){
  if(!this.enabled())return;const t=this.state(),a=t.active,b=S.battle;
  if(a==='stats'&&this.free()===0)this.finish('stats','forest');
  if(t.active==='forest'&&S.screen==='wild')this.finish('forest','training');
  if(t.active==='training'&&S.zone){this.finish('training','fork');}
  if(t.active==='fork'&&S.zone?.depth>0)this.finish('fork');
  if(t.active==='hospital'&&S.screen==='hospital')this.set('heal');
  if(S.screen==='hospital'&&!S.zone&&!b&&!t.active&&t.firstBoss&&!t.done.hospital)this.set('heal');
  if(t.active==='shop'&&S.screen==='shop')this.set('buy');
  if(t.active==='forge'&&S.screen==='forge')this.set('craft');
  if(t.active==='equip'&&S.screen==='hero'&&S.ui.hero==='gear')this.set('wear');
  if(t.active==='tower'&&S.screen==='arena')this.set('towerEnter');
  if(t.active==='guild'&&S.screen==='guild')this.set('guildSearch');
  if(t.active==='promotion'&&S.screen==='hero')this.set('promote');
  if(t.active==='world'&&S.screen==='world')this.set('worldTeam');
  if(t.active==='guildwar'&&S.screen==='guildwar')this.set('warTeam');
  if(b?.towerRun&&['tower','towerEnter'].includes(t.active))this.finish('tower');
  if(this.forestBattle()&&t.done.battle&&!t.done.captureIntro&&uById(b.cur)?.kind==='player'&&b.menu!=='wait'&&b.enemies.some(sealable)&&Object.keys(CON).some(k=>CON[k].seal&&S.P.items[k]>0)&&!t.active)this.set('captureIntro');
  if(this.forestBattle()&&t.done.captureIntro&&!t.done.capture&&t.active==null&&uById(b.cur)?.kind==='player'&&b.menu!=='wait'&&b.enemies.some(e=>sealable(e)&&e.hp/e.st.hp<=.5)&&Object.keys(CON).some(k=>CON[k].seal&&S.P.items[k]>0)){const index=b.enemies.findIndex(e=>sealable(e)&&e.hp/e.st.hp<=.5);b.target=index;this.set('capture');}
  if(S.screen!=='town'||S.zone||b||t.active||S.ui.cinema||this.online())return;
  const d=t.done,lv=S.P.lv;
  if(t.firstBoss&&!d.hospital)return this.set('hospital');
  if(t.firstBoss&&d.hospital&&!d.shop)return this.set('shop');
  if(t.firstBoss&&d.shop&&!d.equip&&S.P.owned.some(id=>EQ[id]&&EQ[id].lv<=lv))return this.set('equip');
  if(t.firstBoss&&d.shop&&!d.forge)return this.set('forge');
  if(lv>=8&&!d.tower)return this.set('tower');
  if(lv>10&&!d.raid&&!t.raidClaimed)return this.set('raid');
  if(lv>20&&!d.guild)return this.set('guild');
  if(lv>25&&!d.promotion){if(tierOf(S.P.cls)>0)this.finish('promotion');else return this.set('promotion');}
  if(lv>=26&&!d.world)return this.set('world');
  if(lv>=30&&!d.guildwar)return this.set('guildwar');
 },
 definition(){
  const t=this.state(),a=t?.active,b=S.battle,u=b&&uById(b.cur),hero='nav [data-a="go"][data-v="hero"]',town='[data-a="go"][data-v="town"]';
  const link=(screen,selector,title,text,extra={})=>({selector:S.screen===screen?selector:town,title,text,...extra});
  switch(a){
   case 'stats':return {selector:S.screen==='town'?'[data-a="autoStatsAll"]':town,title:'เริ่มที่แต้มพลังของทีม',text:'แตะจัดสรรอัตโนมัติได้เลย',note:'ปรับเองได้ที่ ตัวละคร → สถานะ และ อสูร → เลือกตัว',art:'stats'};
   case 'forest':return {selector:'nav [data-a="go"][data-v="wild"]',title:'ออกผจญภัยกัน',text:'แตะเมนูป่าด้านล่าง',art:'forest'};
   case 'training':return {selector:S.ui.confirm?'[data-a="dozone"][data-v="7"]':S.ui.forestChoice===7?'[data-a="zone"][data-v="7"]':'[data-a="forestPick"][data-v="7"]',title:'ป่าฝึกหัด',text:S.ui.forestChoice===7?'แตะเข้าสู่ป่าฝึกหัด':'แตะภาพป่าฝึกหัดเป็นด่านแรก',art:'forest'};
   case 'fork':return S.screen==='zone'&&S.zone?.fork?{selector:'[data-a="fork"]',title:'คุณเลือกเส้นทางเอง',text:'ซ้ายหรือขวาก็ได้ ลองแตะทางที่อยากไป',art:'fork'}:null;
   case 'battleIntro':return {title:'แตะศัตรู → เลือกท่า',text:'ท่าต่าง ๆ อยู่ในเมนูสกิล ดู MP ก่อนใช้',art:'battle',next:true,modal:true};
   case 'elements':return {title:'ธาตุช่วยพลิกการต่อสู้',text:'ดูธาตุขอบรูปอสูร แล้วเลือกธาตุของท่าให้เหมาะ',art:'elements',next:true,modal:true};
   case 'skills':return this.forestBattle()&&u?.side==='ally'&&b.menu!=='wait'?{selector:u.kind==='player'&&b.menu==='main'?'[data-v="menu:skill"]':'[data-a="bt"][data-v^="sk:"]:not(:disabled)',title:'ลองใช้สกิลหนึ่งท่า',text:u.kind==='player'&&b.menu==='main'?'แตะสกิลเพื่อดูท่าที่ใช้ได้':'แตะท่าที่อยากใช้กับเป้าหมาย',art:'battle'}:null;
   case 'captureIntro':return {title:'ผนึกอสูรเป็นคู่หู',text:'โจมตีให้ HP เหลือน้อยก่อน แล้วใช้ปุ่มผนึก',note:'ระวังอย่าโจมตีจนหมดสติ',art:'seal',next:true,modal:true};
   case 'capture':return this.forestBattle()&&u?.kind==='player'&&b.menu!=='wait'?{selector:b.menu==='seal'?'[data-a="bt"][data-v^="seal:"]:not(:disabled)':'[data-v="menu:seal"]',title:b.menu==='seal'?'เลือกผนึกแล้วขว้าง':'ตอนนี้ลองผนึกได้',text:b.menu==='seal'?'แตะขว้างเพื่อผนึกอสูร':'แตะปุ่มผนึกที่กำลังเรืองแสง',art:'seal'}:null;
   case 'hospital':return link('town','[data-a="go"][data-v="hospital"]','ชนะบอสแรกแล้ว!','ไปโรงพยาบาลเพื่อฟื้นฟูทีม', {art:'heal'});
   case 'heal':return {selector:'[data-a="heal"]',title:'รักษาทั้งทีม',text:allFull()?'ตอนนี้ทุกคนพลังเต็มแล้ว พร้อมออกผจญภัย':'ปุ่มเดียวฟื้น HP / MP และรักษาสถานะ',next:allFull(),key:'hospital',art:'heal'};
   case 'shop':return link('town','[data-a="go"][data-v="shop"]','เตรียมอุปกรณ์ใหม่','แตะตลาดช่างตีเหล็ก',{art:'shop'});
   case 'buy':return {selector:'[data-a="buy"]:not(:disabled)',title:'เลือกซื้ออุปกรณ์',text:'ดูค่าสีเขียว/แดงเทียบกับของที่สวม แล้วแตะราคาซื้อ',note:'ซื้อเมื่อพร้อม หรือจำวิธีไว้ก่อน',next:true,key:'shop',art:'shop'};
   case 'forge':return link('town','[data-a="go"][data-v="forge"]','ชิ้นส่วนอสูรมีประโยชน์','ไปดูสูตรในโรงหลอม',{art:'forge'});
   case 'craft':return {selector:'[data-a="craft"]:not(:disabled), [data-a="craft"]',title:'หลอมจากชิ้นส่วนอสูร',text:'ดูวัตถุดิบใต้สูตร ครบแล้วแตะหลอม',note:'ถ้ายังไม่ครบ ค่อยกลับมาหลังเดินป่า',next:true,key:'forge',art:'forge'};
   case 'equip':return {selector:S.screen==='hero'?'[data-a="herotab"][data-v="gear"]':hero,title:'ซื้อแล้วต้องสวมใส่',text:'ตัวละคร → อุปกรณ์',art:'equip'};
   case 'wear':return {selector:'[data-a="equip"]:not(:disabled)',title:'เลือกชิ้นที่ต้องการสวม',text:'แตะสวมใส่ แล้วค่าสถานะจะเปลี่ยนตามอุปกรณ์',next:true,key:'equip',art:'equip'};
   case 'tower':return link('town','[data-a="go"][data-v="arena"]','Lv 8 · หอคอยประลองยุทธ','ลองท้าทายคู่ประลองทีละชั้น',{art:'tower'});
   case 'towerEnter':return {selector:'[data-a="towerConfirm"]',title:'เริ่มหอคอยชั้นแรก',text:'เข้าวันละครั้ง สู้ต่อเนื่องจนจบหรือแพ้',note:TOWER_UI.error||'พร้อมแล้วแตะเข้าหอคอย หรือกลับมาลองภายหลัง',art:'tower',next:true,key:'tower'};
   case 'raid':return link('town','[data-a="camp"]','Lv 11 · ทดลองจู่โจมค่าย','ตั้งทีมรับก่อน แล้วลองค่ายครูฝึก',{art:'raid'});
   case 'raidDefense':return {selector:'#tutorialDefense',title:'เลือกอสูรตั้งรับก่อน',text:'ติ๊กเลือกอสูร แล้วกดลงทะเบียนทีมตั้งรับ',note:t.raidError||'',art:'raid',strict:true};
   case 'raidPractice':return {selector:'[data-a="tutorialRaidStrike"]',title:'ค่ายจำลองของครูฝึก',text:'แตะจู่โจมเพื่อทดลอง ไม่ใช้สิทธิ์ค่ายจริง',art:'raid',strict:true};
   case 'raidResult':return {selector:'[data-a="tutorialRaidDone"]',title:'จู่โจมสำเร็จ',text:'รับเงินฝึก 200 เหรียญแล้ว · ได้ครั้งเดียว',art:'raid',strict:true};
   case 'guild':return link('town','[data-a="go"][data-v="guild"]','Lv 21 · พบเพื่อนร่วมกิล','ไปหน้ากิลเพื่อค้นหาและสมัคร',{art:'guild'});
   case 'guildSearch':return {selector:'#guildSearch',title:'ค้นหากิลที่อยากเข้าร่วม',text:'ค้นหา → สมัคร → รอหัวหน้ากิลอนุมัติ',note:'ไม่ต้องสร้างกิลใหม่เพื่อเข้าร่วม',next:true,key:'guild',art:'guild'};
   case 'promotion':return {selector:hero,title:'Lv 26 · เลื่อนอาชีพได้แล้ว','text':'ไปหน้าตัวละครเพื่อดูสายขั้นต่อไป',art:'promotion'};
   case 'promote':return {selector:'[data-a="promote"]',title:'เลือกอาชีพขั้นต่อไป',text:'อ่านสกิลของแต่ละสายก่อนเลือก',note:'คุณเป็นคนเลือกสายอาชีพเอง',next:true,key:'promotion',art:'promotion'};
   case 'world':return link('town','[data-a="go"][data-v="world"]','Lv 26 · ร่วมทีมสู้บอสโลก','ไปดูกิจกรรมบอสโลก',{art:'world'});
   case 'worldTeam':return {selector:'input[name="wbPet"], [data-a="wbCreate"]',title:'จัดทีมร่วมสู้บอสโลก',text:'เลือกอสูร → สร้างปาร์ตี้ หรือเข้าด้วยรหัสเพื่อน',note:'บทสอนไม่สร้างห้องหรือใช้สิทธิ์ให้อัตโนมัติ',next:true,key:'world',art:'world'};
   case 'guildwar':return {selector:S.screen==='guild'?'[data-a="go"][data-v="guildwar"]':'[data-a="go"][data-v="guild"]',title:'Lv 30 · สงครามกิล',text:'เข้าหน้ากิล แล้วเปิดสงครามกิล',art:'guild'};
   case 'warTeam':return {selector:'[data-a="guildDefenseSave"]',title:'พร้อมร่วมสงครามกิล',text:'ตั้งทีมรับก่อนโจมตี · กิจกรรมเปิดวันเสาร์',note:GUILD_UI.data?.guild?'รอช่วงเปิดกิจกรรมเพื่อโจมตี':'เข้าร่วมกิลก่อน แล้วกลับมาร่วมสงคราม',next:true,key:'guildwar',art:'guild'};
  }return null;
 },
 next(){const t=this.state();if(!t)return;const a=t.active,d=this.definition();if(a==='battleIntro'){t.done.battle=true;this.set('elements');}else if(a==='elements'){t.done.elements=true;this.set('skills');this.release();}else if(a==='captureIntro'){this.finish('captureIntro');this.release();}else if(d?.key)this.finish(d.key);render();},
 skip(){const t=this.state(),d=this.definition();if(!t||d?.strict)return;const map={stats:'stats',forest:'forest',training:'training',fork:'fork',skills:'skills',capture:'capture',hospital:'hospital',heal:'hospital',shop:'shop',buy:'shop',forge:'forge',craft:'forge',equip:'equip',wear:'equip',tower:'tower',towerEnter:'tower',raid:'raid',guild:'guild',guildSearch:'guild',promotion:'promotion',promote:'promotion',world:'world',worldTeam:'world',guildwar:'guildwar',warTeam:'guildwar'};if(['battleIntro','elements','captureIntro'].includes(t.active))return this.next();this.finish(map[t.active]||t.active);this.release();render();},
 observe(a,v,before){
  const t=this.state();if(!t)return;const b=S.battle;
  if(a==='autoStatsAll'&&this.free()<before.free)this.finish('stats','forest');
  if(a==='fork'&&before.active==='fork'&&S.zone?.depth>before.depth)this.finish('fork');
  if(a==='bt'&&String(v).startsWith('sk:')&&before.active==='skills'&&b?.menu==='wait')this.finish('skills');
  if(a==='bt'&&String(v).startsWith('seal:')&&before.items>Object.values(S.P.items).reduce((n,v)=>n+v,0)){this.finish('capture');}
  if(a==='heal'&&allFull()&&['heal','hospital'].includes(t.active))this.finish('hospital');
  if(a==='buy'&&S.P.owned.length>before.owned&&t.active==='buy'){t.done.shop=true;this.set('equip');}
  if(a==='equip'&&before.equip!==JSON.stringify(S.P.eq)&&['wear','equip'].includes(t.active))this.finish('equip');
  if(a==='craft'&&S.P.owned.length>before.owned&&t.active==='craft')this.finish('forge');
  if(a==='dopromote'&&before.cls!==S.P.cls)this.finish('promotion');
  if(['skills','capture','captureIntro','battleIntro','elements'].includes(t.active)&&(!b||b.over)){this.finish(t.active==='skills'?'skills':t.active==='capture'?'capture':'battle');this.pending=null;}
  this.update();this.store();this.mount();
 },
 illustration(kind){
  if(kind==='elements')return '<div class="tutorial-element-demo">'+elementIcon('fire')+'<b>→</b>'+elementIcon('grass')+'<strong>×'+typeMult('fire',['grass'])+'</strong><span class="tutorial-element-caption">โจมตีธาตุที่แพ้ทาง</span>'+elementIcon('grass')+'<b>→</b>'+elementIcon('fire')+'<strong>×'+typeMult('grass',['fire'])+'</strong></div>';
  const art={forest:TOWN_ART.wild||BUILTIN_SCENES[8],tower:TOWN_ART.arena,raid:TOWN_ART.camp,guild:'assets/ui/guild-menu.webp',world:'assets/media/1620b9ca7d9052245fe7d7a1.webp',heal:TOWN_ART.hospital,shop:TOWN_ART.shop,forge:TOWN_ART.shop};
  if(kind==='battle'||kind==='seal')return '<div class="tutorial-duel">'+portrait('player',50)+'<span class="tutorial-motion-arrow">➜</span>'+portrait(S.battle?.enemies.find(e=>e.hp>0)?.img||'tanuki',50)+'<span class="tutorial-mini-command">'+(kind==='seal'?itemIcon('seal1',30)+' ผนึก':'✦ สกิล')+'</span></div>';
  return art[kind]?'<img class="tutorial-scene" src="'+art[kind]+'" alt="" loading="lazy">':'<div class="tutorial-symbols">'+({stats:'✦ ➜ ↑',fork:'↖　↗',equip:'⚔ ➜ ◈',promotion:'✦ ➜ ✧'}[kind]||'✦ ➜ ✧')+'</div>';
 },
 clear(){document.getElementById('tutorialCoach')?.remove();document.querySelectorAll('.tutorial-target').forEach(el=>{el.classList.remove('tutorial-target');el.removeAttribute('data-tutorial-target');});},
 mount(){
  this.clear();if(!document.getElementById('app')?.appendChild||!this.ready())return;const d=this.definition();if(!d)return;const step=this.state().active;const nodes=d.selector?[...document.querySelectorAll(d.selector)].filter(el=>!el.closest('#tutorialCoach')):[];
  for(const el of nodes){for(let p=el.parentElement;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;}
  const visible=nodes.filter(el=>el.getClientRects().length),target=visible.find(el=>!el.disabled)||visible[0];
  const root=document.createElement('section');root.id='tutorialCoach';root.className='tutorial-coach'+(d.modal?' tutorial-modal':'');root.setAttribute('role','dialog');root.setAttribute('aria-label',d.title);root.innerHTML='<div class="tutorial-tip card"><small>คู่มือผู้ผนึก · ครั้งแรก</small><h3>'+esc(d.title)+'</h3>'+this.illustration(d.art)+'<p>'+esc(d.text)+'</p>'+(d.note?'<small>'+esc(d.note)+'</small>':'')+'<div class="tutorial-actions">'+(d.next?'<button class="btn pri" data-a="tutorialNext">'+(d.key?'เข้าใจแล้ว':'ถัดไป')+'</button>':'')+(!d.strict?'<button class="btn sm" data-a="tutorialSkip">'+(d.next?'ปิดคำแนะนำ':'จำไว้ก่อน')+'</button>':this.state().raidError||!carriedPets().length?'<button class="btn sm" data-a="tutorialRaidLater">ทำภายหลัง</button>':'')+'</div></div><span class="tutorial-pointer" aria-hidden="true">➜</span>';
  document.body.appendChild(root);visible.forEach(el=>{el.classList.add('tutorial-target');el.dataset.tutorialTarget=step;});
  if(target&&!d.modal){target.scrollIntoView({block:'center',behavior:'instant'});const example=target.cloneNode(true);example.className+=' tutorial-example-copy';[example,...example.querySelectorAll('*')].forEach(el=>{for(const k of ['id','data-a','data-v','name','for','tabindex'])el.removeAttribute(k);if('disabled'in el)el.disabled=true;});const box=document.createElement('div');box.className='tutorial-example';box.setAttribute('aria-hidden','true');box.appendChild(example);root.querySelector('h3').after(box);}
  const layout=()=>{if(!root.isConnected)return;const card=root.querySelector('.tutorial-tip'),arrow=root.querySelector('.tutorial-pointer'),vh=window.innerHeight,vw=window.innerWidth;if(d.modal||!target){card.style.left=Math.max(8,(vw-Math.min(360,vw-24))/2)+'px';card.style.top=Math.max(12,(vh-card.offsetHeight)/2)+'px';arrow.hidden=true;return;}const r=target.getBoundingClientRect(),bottom=r.top+r.height/2<vh/2;card.style.left=Math.max(8,(vw-Math.min(360,vw-24))/2)+'px';card.style.top=(bottom?Math.min(vh-card.offsetHeight-12,Math.max(r.bottom+38,vh-card.offsetHeight-12)):Math.max(12,Math.min(r.top-card.offsetHeight-38,90)))+'px';arrow.style.left=clamp(r.left+r.width/2-18,8,vw-44)+'px';arrow.style.top=clamp(bottom?r.bottom+2:r.top-34,6,vh-40)+'px';arrow.style.transform='rotate('+(bottom?'-90':'90')+'deg)';};
  layout();if(window.requestAnimationFrame)window.requestAnimationFrame(layout);
 },
 defenseView(){const t=this.state(),ids=t.raidPicks||[],cap=baseOf(S.P.cls)==='summoner'?3:1;return '<section class="stack tutorial-camp"><h2>ค่ายครูฝึก · ลงทะเบียนทีมตั้งรับ</h2><p>เลือกอสูรจากกระเป๋า ใช้ทีมนี้เฝ้าค่ายจริงได้ด้วย</p><fieldset class="card stack" id="tutorialDefense"><legend>อสูรตั้งรับ '+ids.length+'/'+cap+'</legend>'+carriedPets().map(p=>'<label class="row">'+portrait(p.sp,42,{form:p.form||0})+'<input type="checkbox" name="tutorialGuard" value="'+p.uid+'" '+(ids.includes(p.uid)?'checked':'')+' '+(!ids.includes(p.uid)&&ids.length>=cap?'disabled':'')+'>'+esc(petName(p))+' Lv '+p.lv+'</label>').join('')+(!carriedPets().length?'<p>ต้องมีอสูรในกระเป๋าก่อน กลับไปผนึกอสูรแล้วเปิดบทนี้อีกครั้งได้</p>':'')+'<button class="btn pri" data-a="tutorialDefenseSave" '+(!ids.length||this.busy?'disabled':'')+'>'+(this.busy?'กำลังลงทะเบียน…':'ลงทะเบียนทีมตั้งรับ')+'</button></fieldset>'+(t.raidError?'<p class="card" role="alert">'+esc(t.raidError)+'</p>':'')+'</section>';},
 practiceView(){const t=this.state(),stage=t.raidStage||0,hp=Math.max(0,100-stage*50);return '<section class="stack tutorial-camp"><h2>ค่ายจำลองของครูฝึก</h2><p>สนามฝึก ไม่มีผู้เล่นจริง ไม่ใช้สิทธิจู่โจมประจำวัน</p><div class="card tutorial-practice-target">'+portrait('npc:swordsman',84)+'<h3>หุ่นเฝ้าค่าย · Lv 1</h3>'+bar(hp,100)+'<small>HP '+hp+'/100</small></div><div class="tutorial-practice-team">'+portrait('player',52)+(t.raidPicks||[]).map(id=>{const p=petBy(id);return p?portrait(p.sp,52,{form:p.form||0}):'';}).join('')+'</div>'+(t.raidClaimed?'<div class="card" role="status"><h3>ชัยชนะ</h3><p>รางวัลฝึกครั้งแรก +200 เหรียญ</p></div><button class="btn pri full" data-a="tutorialRaidDone">กลับเมือง</button>':'<button class="btn pri full" data-a="tutorialRaidStrike">'+(stage?'ใช้สกิลจู่โจม':'เริ่มจู่โจมค่ายจำลอง')+'</button>')+'</section>';},
 async defenseSave(){const t=this.state(),owner=S.P;if(!t||t.active!=='raidDefense'||this.busy)return;const ids=(t.raidPicks||[]).filter(id=>carriedPets().some(p=>p.uid===id)).slice(0,baseOf(S.P.cls)==='summoner'?3:1);if(!ids.length)return;this.busy=true;t.raidError='';render();try{await gsSave(true);if(S.P!==owner)return;const res=await campCall('camp_register',{pets:ids});if(S.P!==owner)return;if(!res?.ok)throw Error(CAMP.error||'ยังลงทะเบียนไม่ได้ ตรวจการเชื่อมต่อแล้วลองอีกครั้ง');CAMP.pets=ids.slice();t.defenseRegistered=true;t.raidPicks=ids;t.raidStage=0;this.set('raidPractice');}catch(e){if(S.P===owner)t.raidError=e.message;}finally{this.busy=false;if(S.P===owner){this.store();render();}}},
 strike(){const t=this.state();if(!t||t.active!=='raidPractice'||!t.defenseRegistered||t.raidClaimed||this.practiceBusy)return;const before=JSON.stringify(S);this.practiceBusy=true;try{t.raidStage=Math.min(2,(t.raidStage||0)+1);if(t.raidStage===2){t.raidClaimed=true;t.active='raidResult';S.P.gold+=200;}localStorage.setItem(SAVE,JSON.stringify(S));}catch(e){S=JSON.parse(before);toast('บันทึกการฝึกไม่ได้ ลองอีกครั้ง');}finally{this.practiceBusy=false;render();}},
 openRaid(){const t=this.state();if(!t||t.active!=='raid'||this.online()||S.zone||S.battle||towerActive())return false;t.raidPicks=[];t.raidError='';S.screen='camp';this.set('raidDefense');render();return true;}
};

const tutorialNewGame=handlers.newgame;
handlers.newgame=function(...args){const old=S.P,out=tutorialNewGame(...args);if(S.P&&S.P!==old){Tutorial.init();save();render();}return out;};
const tutorialRender=render;render=function(){Tutorial.update();const out=tutorialRender();Tutorial.mount();return out;};
const tutorialStartBattle=startBattle;startBattle=function(es,kind,...args){const t=Tutorial.state();if(Tutorial.enabled()&&S.zone&&!t.done.battle&&!Tutorial.online()){t.done.fork=t.done.fork||S.zone.depth>0;t.active='battleIntro';S.ui.battleCommandsHidden=false;}const out=tutorialStartBattle(es,kind,...args);if(S.battle?.towerRun&&t&&['tower','towerEnter'].includes(t.active))Tutorial.finish('tower');return out;};
const tutorialAdvance=advance;advance=function(...args){if(Tutorial.hold()){Tutorial.pending={battle:S.battle,fn:()=>tutorialAdvance(...args)};render();return;}return tutorialAdvance(...args);};
const tutorialBattleLater=battleLater;battleLater=function(fn,ms){if(Tutorial.hold()){Tutorial.pending={battle:S.battle,fn};return;}return tutorialBattleLater(fn,ms);};
const tutorialEndBattle=endBattle;endBattle=function(res){const b=S.battle,t=Tutorial.state(),first=b&&!b.over&&res==='win'&&b.kind==='boss';const out=tutorialEndBattle(res);if(t&&first){t.firstBoss=true;save();}return out;};
const tutorialCamp=vCamp;vCamp=function(){const a=Tutorial.state()?.active;return Tutorial.enabled()&&['raidDefense','raidPractice','raidResult'].includes(a)?activityBackdrop('camp','ค่ายครูฝึก · บทสอนจู่โจม')+(a==='raidDefense'?Tutorial.defenseView():Tutorial.practiceView()):tutorialCamp();};
const tutorialCampHandler=handlers.camp;handlers.camp=function(...a){return Tutorial.openRaid()?undefined:tutorialCampHandler(...a);};
const tutorialSettings=vSettings;vSettings=function(){const t=Tutorial.state();return tutorialSettings()+'<section class="card stack"><h3>บทสอนเล่นด้วยภาพ</h3><p>จำแยกแต่ละบทตามตัวละคร</p><button class="btn" data-a="tutorialToggle">'+(t?.enabled?'พักบทสอน':'เปิดบทสอน')+'</button><button class="btn" data-a="tutorialReview">ทบทวนปุ่มพื้นฐาน</button></section>';};
Object.assign(handlers,{
 tutorialNext:()=>Tutorial.next(),tutorialSkip:()=>Tutorial.skip(),
 tutorialToggle:()=>{const t=Tutorial.state();if(!t)Tutorial.init();else t.enabled=!t.enabled;Tutorial.release();save();render();},
 tutorialReview:()=>{if(!Tutorial.state())Tutorial.init();const t=Tutorial.state();t.enabled=true;t.active=Tutorial.free()?'stats':'forest';S.screen='town';save();render();},
 tutorialDefenseSave:()=>Tutorial.defenseSave(),tutorialRaidStrike:()=>Tutorial.strike(),
 tutorialRaidDone:()=>{if(!Tutorial.state()?.raidClaimed)return;Tutorial.finish('raid');S.screen='town';save();render();gsSave(false);},
 tutorialRaidLater:()=>{const t=Tutorial.state();if(!t||!['raidDefense','raidPractice'].includes(t.active)||(!t.raidError&&carriedPets().length))return;t.active=null;t.enabled=false;S.screen='town';save();render();}
});
// Observe completed handler actions, including promises; no guessed completion on a click.
for(const name of Object.keys(handlers).filter(k=>!k.startsWith('tutorial'))){const old=handlers[name];handlers[name]=function(v,...args){const t=Tutorial.state(),owner=S.P,before={active:t?.active,free:S.P?Tutorial.free():0,depth:S.zone?.depth||0,owned:S.P?.owned.length||0,equip:JSON.stringify(S.P?.eq),cls:S.P?.cls,items:Object.values(S.P?.items||{}).reduce((n,v)=>n+v,0)};const out=old.call(this,v,...args),after=()=>{if(S.P===owner&&Tutorial.enabled())Tutorial.observe(name,v,before);};if(out?.then)return out.then(x=>{after();return x;},e=>{after();throw e;});after();return out;};}
document.addEventListener('change',e=>{if(e.target?.name!=='tutorialGuard')return;const t=Tutorial.state();if(t?.active!=='raidDefense')return;const id=Number(e.target.value),cap=baseOf(S.P.cls)==='summoner'?3:1;let ids=(t.raidPicks||[]).filter(x=>x!==id);if(e.target.checked&&ids.length<cap)ids.push(id);t.raidPicks=ids;save();render();});
document.addEventListener('click',e=>{if(!Tutorial.ready()||!Tutorial.definition()?.strict)return;const el=e.target.closest('[data-a],input,label');if(el?.closest('#tutorialCoach')||el?.closest('#tutorialDefense')||el?.closest('.tutorial-camp')&&['tutorialRaidStrike','tutorialRaidDone'].includes(el.dataset.a))return;e.preventDefault();e.stopImmediatePropagation();},true);
window.addEventListener?.('resize',()=>Tutorial.mount());
// @soulbeast-end 1089-tutorial
