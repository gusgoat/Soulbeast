// Autoplay and skill selection
// Build-time module: shared legacy scope; execution order is in manifest.json.
// @soulbeast-unit 0280-aiChooseLegacy

/* simple AI for enemies and auto pets */
function aiChooseLegacy(u){const b=B(),mates=sideOf(u).filter(x=>x.hp>0),foes=foesOf(u).filter(x=>x.hp>0);
 const ok=u.skills.filter(id=>{const s=SK[id];return !cooldownOf(u,id)&&costOf(u,s)<=u.mp&&!['form','revert','rest'].includes(s.t)&&!(s.gc&&u.kind==='player')&&!(s.charge&&u.charge)});
 const T=t=>ok.filter(id=>SK[id].t===t);
 let tgt=foes.find(x=>x.taunt>0);
 if(!tgt){if(u.side==='enemy'){const w={};foes.forEach((f,i)=>w[i]=f.kind==='player'?(foes.length>1?40:100):60/(foes.length-1||1));tgt=foes[+wsel(w)]}
  else tgt=foes.slice().sort((a,c)=>a.hp/a.st.hp-c.hp/c.st.hp)[0]}
 const hurtM=mates.slice().sort((a,c)=>a.hp/a.st.hp-c.hp/c.st.hp)[0];
 if(hurtM.hp/hurtM.st.hp<.4&&T('heal').length&&Math.random()<.7){const h=T('heal');return [h.find(id=>SK[id].tg==='team')||h[0],tgt,hurtM]}
 if(T('buff').length&&!u.buffs.some(x=>x.amt>0)&&Math.random()<.22)return [pick(T('buff')),tgt,pick(mates)];
 const sts=ok.filter(id=>['status','debuff'].includes(SK[id].t));
 if(sts.length&&!Object.keys(tgt.status).length&&Math.random()<.22)return [pick(sts),tgt];
 const dmg=ok.filter(id=>['p','m','h','auto'].includes(SK[id].t));
 const score=id=>combatSkillScore(u,id,tgt,foes);
 const best=dmg.slice().sort((a,c)=>score(c)-score(a));
 return [Math.random()<.7?best[0]:pick(dmg),tgt]}
// @soulbeast-end 0280-aiChooseLegacy
// @soulbeast-unit 0282-aiChoose

// Shared by local autoplay and the authoritative online battle engine.
function chooseAutoForm(u){
 if(u.form||u.hp<=0)return null;
 const foes=foesOf(u).filter(x=>x.hp>0);if(!foes.length)return null;
 if(u.hp/u.st.hp<.35&&u.skills.some(id=>SK[id]?.t==='heal'&&!cooldownOf(u,id)&&costOf(u,SK[id])<=u.mp))return null;
 const forms=u.skills.filter(id=>SK[id]?.t==='form'&&FORMS[SK[id].form]&&!cooldownOf(u,id)&&costOf(u,SK[id])<=u.mp);
 const score=id=>{const f=FORMS[SK[id].form],m=f.m;let best=0;for(const key of f.sk){const sk=SK[key];if(!sk||!['p','m','h','auto'].includes(sk.t))continue;const ty=sk.t==='auto'?u.atkType:sk.t,pa=u.st.patk*(m.patk||1),ma=u.st.matk*(m.matk||1),atk=ty==='m'?ma:ty==='h'?(pa+ma)/2:pa;best=Math.max(best,...foes.map(t=>atk*(sk.pw||100)/100*typeMult(sk.el,t.types)*(sk.all?Math.min(1.5,foes.length):1)));}return best+(u.st.pdef*(m.pdef||1)+u.st.mdef*(m.mdef||1))*(u.hp/u.st.hp<.5?.6:.15);};
 return forms.sort((a,b)=>score(b)-score(a))[0]||null;
}

function aiChoose(u){const form=chooseAutoForm(u);if(form)return [form,foesOf(u).find(x=>x.hp>0),u];if(u.side!=='enemy')return aiChooseLegacy(u);
 const grade=enemyGrade(u),mates=sideOf(u).filter(x=>x.hp>0),dead=sideOf(u).filter(x=>x.hp<=0&&x.kind!=='player'),foes=foesOf(u).filter(x=>x.hp>0);
 if(!foes.length)return ['attack',null];
 const taunt=foes.filter(x=>x.taunt>0),targets=taunt.length?taunt:foes;
 const legal=u.skills.filter(id=>{const s=SK[id];return s&&!cooldownOf(u,id)&&costOf(u,s)<=u.mp&&!['form','revert','rest'].includes(s.t)&&!(s.charge&&u.charge)});
 const options=[];
 const add=(id,t,a,score)=>{if(score>0)options.push({id,t,a,score})};
 for(const id of [...new Set(['attack',...legal])]){const s=SK[id];if(s.summon){if(mates.filter(x=>x.temporary).length<2)add(id,targets[0],null,Math.max(u.st.patk,u.st.matk)*1.4);continue}
  if(s.t==='heal'){const pool=s.tg==='self'?[u]:mates;const wounded=pool.filter(x=>x.hp<x.st.hp).sort((a,b)=>a.hp/a.st.hp-b.hp/b.st.hp);
   if((s.rev||s.revAll)&&dead.length&&s.tg!=='self')add(id,targets[0],dead[0],dead[0].st.hp*.9);
   if(wounded.length){const list=s.tg==='team'?wounded:[wounded[0]];let value=list.reduce((n,x)=>n+Math.min(x.st.hp-x.hp,x.st.hp*(s.pw||0)/100+u.st.matk*.5),0);if(wounded[0].hp/wounded[0].st.hp<.35)value*=1.7;add(id,targets[0],wounded[0],value)}continue}
  if(s.t==='buff'){const pool=s.tg==='self'?[u]:mates,eligible=pool.filter(x=>!x.buffs.some(b=>b.amt>0)&&(s.charge?!x.charge:true));if(eligible.length)add(id,targets[0],pick(eligible),Math.max(u.st.patk,u.st.matk)*(.45+grade*.06)*(s.tg==='team'?mates.length:1));continue}
  for(const t of targets){const ty=s.t==='auto'?u.atkType:s.t;
   if(['p','m','h'].includes(ty)){const atk=ty==='m'?u.st.matk:ty==='h'?(u.st.patk+u.st.matk)/2:u.st.patk;
    const scoreTarget=f=>{const mult=typeMult(s.el,f.types),def=ty==='m'?f.st.mdef:ty==='h'?(f.st.pdef+f.st.mdef)/2:f.st.pdef;return Math.min(f.hp,atk*(s.pw||100)/100*(s.hits||1)*mult/(1+def/50)*(s.el&&u.stab.includes(s.el)?1.25:1))};
    let value=s.all?foes.reduce((n,f)=>n+scoreTarget(f)*areaDamageScale(s,foes.length),0):s.rt?foes.reduce((n,f)=>n+scoreTarget(f),0)/foes.length:scoreTarget(t);
    if(!s.all&&!s.rt&&t.hp/t.st.hp<.3)value*=1.2;if(s.ct)value*=.65;add(id,t,null,value);continue}
   if(s.t==='status'||s.t==='debuff'){const useful=Object.keys(s.st||{}).some(k=>!t.status[k]&&!(IMM[k]&&t.types.some(e=>IMM[k].includes(e))))||Object.keys(s.bf||{}).some(k=>!t.buffs.some(b=>b.st===k&&b.amt<0));if(useful)add(id,t,null,Math.max(u.st.patk,u.st.matk)*(.35+grade*.08))}
  }
 }
 if(grade>=4&&u.st.mp>0&&u.mp/u.st.mp<.2&&u.skills.some(id=>SK[id]&&costOf(u,SK[id])>u.mp))add('rest',targets[0],null,Math.max(u.st.patk,u.st.matk)*.65);
 if(!options.length)return ['attack',targets[0]];
 // Early encounters choose diverse valid skills; later encounters favor effective tactics.
 const smart=[0,.10,.25,.45,.65,.80,.90][grade];let chosen;
 if(Math.random()<smart){const ranked=options.sort((a,b)=>b.score-a.score),top=ranked.filter(x=>x.score>=ranked[0].score*.8);chosen=pick(top)}
 else{const ids=[...new Set(options.map(x=>x.id))],id=pick(ids);chosen=pick(options.filter(x=>x.id===id))}
 if(u.aiLast===chosen.id&&u.aiRepeat>=2&&options.some(x=>x.id!==chosen.id&&x.score>=chosen.score*.2))chosen=pick(options.filter(x=>x.id!==chosen.id&&x.score>=chosen.score*.2));
 u.aiRepeat=u.aiLast===chosen.id?(u.aiRepeat||0)+1:1;u.aiLast=chosen.id;
 return [chosen.id,chosen.t,chosen.a]}
// @soulbeast-end 0282-aiChoose
// @soulbeast-unit 0284-aiAct

function aiAct(){const b=B();if(!b||b.over)return;const u=uById(b.cur);if(!u||u.hp<=0){advance();return}
 if(u.side==='ally'&&!teamAutoUnit(u)){b.menu='main';render();return}const [id,t,a]=aiChoose(u);if(!act(u,id,t,a))act(u,'attack',t);if(checkEnd()){render();return}battleLater(advance,600);render()}
// @soulbeast-end 0284-aiAct
// @soulbeast-unit 0426-teamAutoAllowed



function teamAutoAllowed(){return !!B()&&!['pvp','raid','world'].includes(B().kind)}
// @soulbeast-end 0426-teamAutoAllowed
// @soulbeast-unit 0427-teamAutoUnit

function teamAutoUnit(u){return !!u&&u.side==='ally'&&((teamAutoAllowed()&&S.ui.autoTeam)||(u.kind==='pet'&&S.ui.autoPet)||(u.kind==='summon'&&u.name.startsWith('ทหาร')))}
// @soulbeast-end 0427-teamAutoUnit
// @soulbeast-unit 0753-balanceBossAI


const balanceBossAI=aiAct;
// @soulbeast-end 0753-balanceBossAI
// @soulbeast-unit 0754-aiAct
aiAct=function(){const b=B(),u=b&&uById(b.cur);if(u?.side==='enemy'&&u.sp==='demonlord'&&u.boss&&!u.immortalWorld&&u.hp>0&&bossSummonDue(u)){act(u,'boss_legend_call',u,u);endUnitTurn(u);render();battleLater(advance,600);return;}return balanceBossAI();};
// @soulbeast-end 0754-aiAct
// @soulbeast-unit 0764-demonAiChooseBase


// Summon timing is owned by aiAct/bossSummonDue, never the generic random-skill AI.
const demonAiChooseBase=aiChoose;
// @soulbeast-end 0764-demonAiChooseBase
// @soulbeast-unit 0765-aiChoose
aiChoose=function(u){if(u.sp!=='demonlord')return demonAiChooseBase(u);const original=u.skills;u.skills=original.filter(id=>id!=='boss_legend_call');try{return demonAiChooseBase(u);}finally{u.skills=original;}};
// @soulbeast-end 0765-aiChoose
// @soulbeast-unit 0981-forestAutoAllowed

const forestAutoAllowed=teamAutoAllowed;
// @soulbeast-end 0981-forestAutoAllowed
// @soulbeast-unit 0982-teamAutoAllowed
teamAutoAllowed=function(){return !forestAutoLocked()&&forestAutoAllowed();};
// @soulbeast-end 0982-teamAutoAllowed
// @soulbeast-unit 0983-forestAutoUnit

const forestAutoUnit=teamAutoUnit;
// @soulbeast-end 0983-forestAutoUnit
// @soulbeast-unit 0984-teamAutoUnit
teamAutoUnit=function(u){return forestAutoLocked()&&u?.side==='ally'?false:forestAutoUnit(u);};
// @soulbeast-end 0984-teamAutoUnit
// @soulbeast-unit 1060-combatSkillScore

// Deterministic pressure estimate: autoplay respects armor elements and the same area budget.
function combatSkillScore(u,id,target,targets=foesOf(u).filter(x=>x.hp>0)){
 const sk=pvpSkill(id);if(!sk||!['p','m','h','auto'].includes(sk.t)||!targets.length)return 0;
 const type=sk.t==='auto'?u.atkType:sk.t,atk=type==='h'?(eff(u,'patk')+eff(u,'matk'))/2:eff(u,type==='m'?'matk':'patk'),list=sk.all?targets:sk.rt?targets:[target||targets[0]];
 let score=0;for(const t of list){if(type===t.immune&&type!=='h')continue;const m=typeMult(effectiveElement(u,sk),t.types)*(sk.el==='ground'&&hasPas(t,'levitate')?0:1);if(!m)continue;let def=type==='h'?(eff(t,'pdef')+eff(t,'mdef'))/2:eff(t,type==='m'?'mdef':'pdef');if(sk.trueD)def=0;def*=1-Math.min(.8,(sk.pi||0)+(hasPas(u,'pierce')?.25:0)+frontlinePierce(u,t));const stab=sk.el&&(hasPas(u,'omni')||u.stab.includes(sk.el)||u.types.includes(sk.el)||u.form&&FORMS[u.form].t.includes(sk.el))?(hasPas(u,'adapt')?1.5:1.25):1,crit=hasPas(t,'nocrit')||rogueCritBlocked(u,t)?0:Math.min(isBalancedPvp()?65:100,eff(u,'crit')+(sk.cb||0))/100;let d=1.4*atk*(sk.pw/100)*atk/(atk+def)*m*stab*(sk.all?areaDamageScale(sk,targets.length):1)*(sk.hits||1)*(u.charge||1)*(1+crit*((hasPas(u,'deadly')?(isBalancedPvp()?1.7:2):1.5)-1))*classCombatFactor(u,t,sk)*pvpDamageFactor(u,t);if(type==='h'&&t.immune)d*=.5;if(hasPas(t,'thick')&&['fire','ice'].includes(sk.el))d*=.5;if(sideOf(t).some(x=>x.hp>0&&hasPas(x,'guardian')))d*=.9;d*=sk.acc>=100?1:hitChance(u,t,sk)/100;score+=d;}
 return score/(sk.ct?2:1)/(sk.rt?targets.length:1);
}
// @soulbeast-end 1060-combatSkillScore
