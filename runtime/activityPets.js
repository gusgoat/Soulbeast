// Shared portrait picker. Selections belong to each activity, never to the travelling party.
// @soulbeast-unit 1111-activityPets
const ActivityPets={
 owner:null,picks:{},
 reset(){const owner=S.P?.code||S.P;if(this.owner!==owner){if(this.owner){CAMP.guardPicks=null;CAMP.raidPicks=null;}this.owner=owner;this.picks={};}},
 cap(mode){return mode==='pvp'?Math.min(3,clsSum(S.P.cls)):baseOf(S.P.cls)==='summoner'?3:1;},
 pets(){return carriedPets().filter(p=>SP[p.sp]&&!SP[p.sp].noseal);},
 locked(mode){return mode==='world'?WORLD.busy||!!WORLD.room:mode==='pvp'?PVP.busy||!!PVP.room:mode==='guildAttack'?GUILD_UI.busy||!!GUILD_UI.confirm||!!GUILD_UI.data?.war?.used||!!GUILD_UI.warRoom?.replaying:CAMP.busy||CAMP.room?.status==='active'||CAMP.room?.replaying||GUILD_UI.busy;},
 ids(mode){
  this.reset();if(mode==='campGuard'||mode==='campRaid')return campSelection(mode==='campGuard'?'campGuardPets':'campRaidPets');
  const cap=this.cap(mode),owned=new Set(this.pets().map(p=>p.uid));
  if(!Array.isArray(this.picks[mode]))this.picks[mode]=(mode==='guildAttack'?[...new Set([...(S.P.party||[]),...owned])]:S.P.party||[]).slice(0,cap);
  return this.picks[mode]=this.picks[mode].filter(id=>owned.has(id)).slice(0,cap);
 },
 toggle(mode,id){
  if(!['world','pvp','guildAttack','campGuard','campRaid'].includes(mode)||this.locked(mode)||!this.pets().some(p=>p.uid===id))return;
  const old=this.ids(mode),cap=this.cap(mode),next=old.includes(id)?old.filter(x=>x!==id):[...old.slice(Math.max(0,old.length-cap+1)),id];
  const field=mode==='world'?'wbRoomCode':mode==='pvp'?'pvpRoomCode':null,value=field?document.getElementById(field)?.value:null;if(mode==='campGuard'||mode==='campRaid')CAMP[mode==='campGuard'?'guardPicks':'raidPicks']=next;else this.picks[mode]=next;render();if(field&&value!=null){const input=document.getElementById(field);if(input)input.value=value;}
 },
 view(mode,label){
  const ids=this.ids(mode),cap=this.cap(mode),locked=this.locked(mode),pets=this.pets();
  return '<fieldset class="card stack activity-pet-picker" data-pet-mode="'+mode+'"><legend>'+esc(label)+' · '+ids.length+'/'+cap+' ตัว</legend><small>เลือกจากอสูรที่พกติดตัว ไม่เปลี่ยนทีมเดินป่า</small><div class="cw-pet-grid">'+pets.map(p=>'<button type="button" class="btn cw-pet-choice" data-a="activityPet" data-v="'+mode+':'+p.uid+'" aria-pressed="'+ids.includes(p.uid)+'" '+(locked?'disabled':'')+'>'+portrait(p.sp,76,{form:p.form||0})+'<b>'+esc(petName(p))+'</b><span>Lv '+p.lv+(ids.includes(p.uid)?' · ✓':'')+'</span></button>').join('')+'</div>'+(!pets.length?'<p>ไม่มีอสูรที่พกติดตัว</p>':'')+'<small>แตะตัวที่เลือกเพื่อยกเลิก เมื่อครบจำนวน แตะตัวใหม่จะแทนตัวที่เลือกก่อนสุด</small></fieldset>';
 }
};
handlers.activityPet=value=>{const [mode,id]=value.split(':');ActivityPets.toggle(mode,Number(id));};
campTeamPicker=function(name,label){return ActivityPets.view(name==='campGuardPets'?'campGuard':'campRaid',label);};
worldPetSelection=function(){return ActivityPets.ids('world').slice();};
const activityPvpView=vPvpBase;
vPvpBase=function(){const html=activityPvpView();return !PVP.room?html.replace('<div class="row wrap"><button class="btn pri" data-a="pvpCreate"',ActivityPets.view('pvp','เลือกอสูรประลอง PVP')+'<div class="row wrap"><button class="btn pri" data-a="pvpCreate"'):html;};
const activityGuildView=vGuildWar;
vGuildWar=function(){const html=activityGuildView();return GUILD_UI.data?.guild&&!GUILD_UI.warRoom?.replaying?html.replace('<h3>เลือกกิลที่ต้องการโจมตี</h3>',ActivityPets.view('guildAttack','เลือกอสูรโจมตีสงครามกิล')+'<h3>เลือกกิลที่ต้องการโจมตี</h3>'):html;};
handlers.guildAttack=id=>{const pets=ActivityPets.ids('guildAttack').slice();if(!pets.length)return toast('เลือกอสูรจู่โจมก่อน');return guildConfirm('guild_war_attack',{guildId:id,pets},'ใช้สิทธิ์สงครามกิลรอบนี้สุ่มคู่ต่อสู้และต่อสู้อัตโนมัติ ยืนยันหรือไม่?');};
// @soulbeast-end 1111-activityPets
