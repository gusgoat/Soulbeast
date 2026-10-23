// Uploaded 2026-10-20 originals; scene selection and one-shot effect routing.
// @soulbeast-unit 1079-uploadedAudio
Object.assign(ExtraAudio.groups,{"bgIntroMusic":["upload_eb0e61e3b278"],"bgSuspenseMusic":["upload_ea5165438fef"],"bgBattleMusic":["upload_7a614db3a17f"],"bgViolinMusic":["upload_90b90549e0e6"],"bgInspireMusic":["upload_737ee9690b11","upload_d98d1e57f5f3"],"bgSuccessMusic":["upload_6538f1cf93fe"],"bgSadMusic":["upload_d10a4722ba41","upload_3a6e30249ec4"],"bgDramaMusic":["upload_8de45711bc58"],"bgHorrorMusic":["upload_7a5c276f6f6b","upload_8e33cb7d7bd6"],"bgBossIntroMusic":["upload_c2767908a098"],"bgRallyIntroMusic":["upload_dd0b44348182"],"specialRewardFx":["upload_dbc791784f00"],"swordFx":["upload_c7083078bbdc","upload_e026bc6d36a0"],"swordCriticalFx":["upload_c8a321eff1e5"],"daggerFx":["upload_a072720df2b8"],"daggerCriticalFx":["upload_57a48271daad"],"slashFx":["upload_ca3311db0e99"],"enchantSwordFx":["upload_bdf4191a942e"],"sharpenFx":["upload_baa2246559fd"],"whipFx":["upload_8154d63f83ea"],"whipCriticalFx":["upload_45baf4a0d480"],"gunRapidFx":["upload_1a2c2eb43346"],"gunHeavyFx":["upload_cc7742c998a8","upload_adf5e71838e4"],"gunSingleFx":["upload_cee18db7340c"],"gunThreeFx":["upload_37007fdda99a"],"gunCriticalFx":["upload_305c9fa26618"],"gunPlasmaFx":["upload_fd13f72aea0a"],"reloadFx":["upload_c1acdf3043f5"],"missileFx":["upload_2dbade1bfa8d"],"explosionFx":["upload_288457b2f6f6"],"bigExplosionFx":["upload_1f566cb08b23"],"nuclearFx":["upload_8f2e0648a38b"],"smokeFx":["upload_926be488ffc0"],"ninjaFx":["upload_ae40a3e115b2"],"shurikenFx":["upload_fb5e90512be3"],"reviveFx":["upload_c2ac41c1b294"],"heavenFx":["upload_823ca10d36c3"],"bardHarpFx":["upload_1bd86c22b172"],"bardGuitarFx":["upload_390249728a44"],"requiemFx":["upload_180188c90df5"],"mysteryCryFx":["upload_a010539da803"],"curseFx":["upload_9101017ee2a1","upload_a32ed467cc0d","upload_b89dfba391c8"],"strongCurseFx":["upload_9677fe5bdb10","upload_c165d95dadb0"],"demonLaughFx":["upload_4dd045e1aae3"],"bgPressureMusic":["upload_db080662d0be"],"bgDesertMusic":["upload_b6de92cbbf3d"],"bgDemonCastleMusic":["upload_f34a2c356dbc"],"bgGuildMusic":["upload_d6d1eba3ad02"],"bgWavesMusic":["upload_b19277d276ff"],"bgMysticForestMusic":["upload_575f7581ee84"],"bgDragonPeakMusic":["upload_f2ef4b725655"],"bgHeavenAmbientMusic":["upload_b7dd7f5297a8"],"bgMistValleyMusic":["upload_8c35f0ad34b7"],"bgAdventureMusic":["upload_3cd84beba88a"],"bgWorldTreeMusic":["upload_8a9202270cb1"],"bgDemonBossRoomMusic":["upload_41ac1161c8b2"],"bgGhostAmbientMusic":["upload_ef2b03ffd168"],"bgDragonBossDoorMusic":["upload_8f3321d5c6fa"],"bgMainThemeMusic":["upload_394f1ddfb257"],"bgPuzzleMusic":["upload_76e4f429449a"],"bgDesertBossDoorMusic":["upload_edbfc5290c65"],"bgAnxietyMusic":["upload_ca13cc0ffe40"],"bgBossRoomMusic":["upload_0ec632380285"],"bgMistBossRoomMusic":["upload_0e86c1cf8adc"]});
Object.assign(MUSIC_ASSETS,{"update23_bow_multi":"assets/audio/20261023/bow_multi.mp3","update23_bow_critical":"assets/audio/20261023/bow_critical.mp3","update23_bow_heavy":"assets/audio/20261023/bow_heavy.mp3","update23_demon_threat":"assets/audio/20261023/demon_threat.mp3","update23_demon_roar":"assets/audio/20261023/demon_roar.mp3","update23_demon_laugh":"assets/audio/20261023/demon_laugh.mp3","update23_mermaid":"assets/audio/20261023/mermaid.mp3"});
Object.assign(ExtraAudio.groups,{"bowMultiFx":["update23_bow_multi"],"bowCriticalFx":["update23_bow_critical"],"bowHeavyFx":["update23_bow_heavy"],"demonThreatFx":["update23_demon_threat"],"demonRoarFx":["update23_demon_roar"],"voice_mermaid":["update23_mermaid"]});
ExtraAudio.groups.bowTeam=['update23_bow_multi'];ExtraAudio.groups.bowStrong=['update23_bow_heavy'];
ExtraAudio.groups.demonLaughFx.push('update23_demon_laugh');
ExtraAudio.groups.boss.push(...ExtraAudio.groups.demonLaughFx,'update23_demon_threat','update23_demon_roar');
ExtraAudio.groups.voice_demon.push('update23_demon_roar','update23_demon_threat','update23_demon_laugh');
const UploadedAudio={action:null,serial:0,
 effect(group,critical=false){
  const a=this.action;if(a){if(critical&&a.criticalPlayed)return true;if(!critical&&a.normalPlayed)return true;if(critical&&a.group===group){a.criticalPlayed=true;return true;}if(critical&&a.track){a.track.audio.pause();a.track.audio.currentTime=0;}a[critical?'criticalPlayed':'normalPlayed']=true;a.group=group;}
  if(!Sound.enabled||document.hidden||Sound.ctx?.state!=='running')return true;
  ExtraAudio.play(group);if(a)a.track=ExtraAudio.active[ExtraAudio.active.length-1];return true;
 },
 skillGroup(id,u,strong){const sk=SK[id];if(!sk)return null;const n=sk.n||'',wt=u?.cls?clsWeapon(u.cls):null;
  if(id==='di_requiem')return 'requiemFx';
  if(['bard','maestro','dirge'].some(c=>CLS[c]?.sk.some(([,key])=>key===id)))return sk.t==='heal'||sk.t==='status'?'bardHarpFx':'bardGuitarFx';
  if(/นิวเคลีย|นิวเครีย/.test(n))return 'nuclearFx';
  if(/พลาสม/.test(n))return 'gunPlasmaFx';
  if(/มิสไซ|จรวด/.test(n))return strong?'bigExplosionFx':'missileFx';
  if(/ระเบิดควัน|ระเบิดพลังงาน/.test(n))return 'smokeFx';
  if(/ระเบิด/.test(n))return strong||(sk.pw||0)>=200?'bigExplosionFx':'explosionFx';
  if(/ดาวกระจาย/.test(n))return 'shurikenFx';
  if((u?.cls==='ninja'||/นินจา/.test(n))&&id!=='attack'&&['buff','status','debuff'].includes(sk.t))return 'ninjaFx';
  if(/คำสาป|มรณะ|วันพิพากษาแห่งจอมมาร/.test(n))return strong||(sk.pw||0)>=180?'strongCurseFx':'curseFx';
  if(['p','m','h','auto'].includes(sk.t)&&((sk.el==='fairy'&&((sk.pw||0)>=180||sk.mile))||/ไม้ตายสวรรค์|ศรสวรรค์/.test(n)))return 'heavenFx';
  if(sk.rev||sk.revAll)return 'reviveFx';
  if(sk.t==='rest'&&wt==='gun')return 'reloadFx';
  if(sk.t==='buff'&&wt==='dagger'&&sk.bf?.patk)return 'sharpenFx';
  if(wt==='whip'&&(id==='attack'||/แส้|แซ่/.test(n)))return strong?'whipCriticalFx':'whipFx';
  if(!['p','h','auto'].includes(sk.t)||(sk.t==='auto'&&u?.atkType==='m'))return null;
  if(wt==='bow'){if(strong)return 'bowCriticalFx';if(sk.hits>1||sk.all)return 'bowMultiFx';if(sk.ct||(sk.pw||0)>=160)return 'bowHeavyFx';return null;}
  if(wt==='gun'){if(strong)return 'gunCriticalFx';if(sk.hits>=5)return 'gunHeavyFx';if(sk.hits===3)return 'gunThreeFx';if(sk.hits>1)return 'gunRapidFx';return sk.ct?'gunPlasmaFx':'gunSingleFx';}
  if(wt==='whip')return strong?'whipCriticalFx':'whipFx';
  if(wt==='dagger')return strong?'daggerCriticalFx':(sk.pi||0)>.25?'slashFx':'daggerFx';
  if(wt==='sword')return strong?'swordCriticalFx':sk.el&&sk.el!=='normal'?'enchantSwordFx':'swordFx';
  return null;
 }
};
const uploadedSkillPrevious=ExtraAudio.skill;
ExtraAudio.skill=function(id,u,strong=false){const a=UploadedAudio.action;if(a&&strong&&a.criticalPlayed)return true;const group=UploadedAudio.skillGroup(id,u,strong);if(group)return UploadedAudio.effect(group,strong);if(a&&strong)a.criticalPlayed=true;const result=uploadedSkillPrevious.call(this,id,u,strong);if(a&&!strong){a.normalPlayed=true;a.track=this.active[this.active.length-1];}return result;};
const uploadedActPrevious=act;
act=function(...args){const old=UploadedAudio.action;UploadedAudio.action={serial:++UploadedAudio.serial,u:args[0],id:args[1]};try{return uploadedActPrevious.apply(this,args);}finally{UploadedAudio.action=old;}};
const uploadedCryPrevious=ExtraAudio.cry;
ExtraAudio.cry=function(sp,death){if(!death&&sp==='demonlord')return UploadedAudio.effect('boss');if(!death&&sp==='demon_knight')return UploadedAudio.effect('demonLaughFx');if(!death&&sp==='legend2_abyssarch')return UploadedAudio.effect('voice_demon');const q=SP[sp];if(!death&&!SPECIES_VOICE[sp]&&q&&(q.legendary||q.rare&&q.t.some(t=>['ghost','psychic','fairy','dragon'].includes(t))))return UploadedAudio.effect('mysteryCryFx');return uploadedCryPrevious.call(this,sp,death);};
const uploadedFxPrevious=Sound.fx;
Sound.fx=function(kind,...args){if(kind==='revive')return UploadedAudio.effect('reviveFx');if(kind==='chest')return UploadedAudio.effect('specialRewardFx');if(kind==='charge'&&UploadedAudio.action?.u?.cls&&clsWeapon(UploadedAudio.action.u.cls)==='gun')return UploadedAudio.effect('reloadFx');return uploadedFxPrevious.call(this,kind,...args);};
function uploadedMusicScene(){
 const q=S.ui.cinema||(!S.P&&!S.ui.introSeen?{chapter:0,index:S.ui.introFrame||0}:null);
 if(q){const f=storyFrames(q.chapter,q.after)[q.index||0],key=f?.music||'intro',group=({intro:'bgIntroMusic',sadMusic:'bgSadMusic',hauntMusic:'bgHorrorMusic',battleMusic:'bgDramaMusic',pianoMusic:'bgInspireMusic',peaceMusic:'bgInspireMusic'})[key]||key;const themed=/ต้นไม้โลก|รากโลก/.test(f?.text||f?.t||'')?'bgWorldTreeMusic':/ปราสาทจอมมาร/.test(f?.text||f?.t||'')?'bgDemonCastleMusic':group;return {group:themed,stamp:'cinema:'+q.chapter+':'+!!q.after+':'+group};}
 if(!S.P||S.screen==='start')return {group:'bgIntroMusic',stamp:'start'};
 const b=B(),active=['battle','pvp','world','camp','guildwar'].includes(S.screen)&&b;
 if(active&&b.over){const major=b.kind==='boss'||['pvp','world','guildwar'].includes(S.screen);const group=b.over.res==='lose'?'bgSadMusic':major?'bgSuccessMusic':'';return {group,stamp:'result:'+S.screen+':'+b.over.res};}
 if(active&&S.screen==='battle'&&S.zone)return {group:'bgBattleMusic',stamp:'forest-combat'};
 if(active&&b.enemies?.some(u=>u.sp==='demonlord'))return {group:'bgDemonBossRoomMusic',stamp:'demonlord-combat'};
 if(active&&b.kind==='boss')return {group:({2:'bgMistBossRoomMusic',6:'bgDemonBossRoomMusic'})[S.zone?.id]||'bgBossRoomMusic',stamp:'boss-combat:'+S.zone?.id};
 if(active)return {group:'bgBattleMusic',stamp:'combat:'+S.screen+':'+(b.kind||'')+':'+(S.zone?.id||0)};
 if(S.zone){const type=S.zone.ev?.type||'fork';if(isBossDoorScene())return {group:({2:'bgMistBossRoomMusic',3:'bgDesertBossDoorMusic',4:'bgDragonBossDoorMusic',6:'bgDemonBossRoomMusic'})[S.zone.id]||'bgBossRoomMusic',stamp:'boss-door:'+S.zone.id};if(['spring','revival','cleanse'].includes(type))return {group:'bgWavesMusic',stamp:'forest-water:'+S.zone.id};if(type==='village'||type==='hospital')return {group:'peaceMusic',stamp:'forest-rest:'+type+':'+S.zone.id};if(type==='chest'&&!S.zone.ev.opened)return {group:'bgPuzzleMusic',stamp:'forest-puzzle:'+S.zone.id};if(type==='mist'&&S.zone.id===6)return {group:'bgGhostAmbientMusic',stamp:'ghost-mist'};if(type==='stranger')return {group:'bgAnxietyMusic',stamp:'forest-stranger:'+S.zone.id};if(type==='ruins'&&S.zone.id===5)return {group:'bgWorldTreeMusic',stamp:'world-tree-ruins'};if(['mist','ruins'].includes(type))return {group:'bgPressureMusic',stamp:'forest-mystery:'+type+':'+S.zone.id};return {group:({1:'bgMysticForestMusic',2:'bgMistValleyMusic',3:'bgDesertMusic',4:'bgDragonPeakMusic',5:'bgHeavenAmbientMusic',6:'bgDemonCastleMusic'})[S.zone.id]||'bgAdventureMusic',stamp:'forest:'+S.zone.id};}
 if(S.screen==='guild')return {group:'bgGuildMusic',stamp:'guild'};
 if(S.screen==='hospital')return {group:'peaceMusic',stamp:'hospital'};
 if(S.screen==='story')return {group:'bgAdventureMusic',stamp:'story:'+S.P.zoneMax};
 if(S.screen==='arena'||S.screen==='guildwar')return {group:'bgRallyIntroMusic',next:'bgBattleMusic',stamp:'prepare:'+S.screen};
 if(['world','pvp','camp'].includes(S.screen))return {group:'bgSuspenseMusic',stamp:'lobby:'+S.screen};
 return {group:'bgMainThemeMusic',stamp:'town'};
}
Music.sync=function(){if(!Sound.enabled||document.hidden||Sound.ctx?.state!=='running'){this.stop();return;}const scene=uploadedMusicScene();if(this.current&&this.scene===scene.stamp)return;const old=this.tracks[this.playing];if(old){old.audio.pause();old.audio.currentTime=0;}this.scene=scene.stamp;this.current=scene.group;if(!scene.group){this.playing='';return;}const key=ExtraAudio.groups[scene.group]?ExtraAudio.choose(scene.group):scene.group;this.playing=key;const track=this.play(key,.34);if(track?.audio){track.audio.loop=!scene.next;track.audio.onended=scene.next?()=>{if(!Sound.enabled||document.hidden||this.scene!==scene.stamp)return;const follow=ExtraAudio.choose(scene.next);this.playing=follow;const t=this.play(follow,.34);if(t?.audio){t.audio.loop=true;t.audio.onended=null;}}:null;}};

// @soulbeast-end 1079-uploadedAudio
