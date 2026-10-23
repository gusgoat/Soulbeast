// Beast tier budgets shared with the server.
// @soulbeast-unit 1078-beastBudget
// Stat budget at equal level, before allocated points. Roles and accuracy/evasion stay distinct.
const BEAST_TIER_BUDGET=[.70,.82,.96,1.12,1.32,1.56,1.85];
function beastPowerTier(sp,form=0){if(sp.solar)return 7;if(sp.legendary)return 6;if(sp.rare)return 5;const stages=(sp.ev||[]).length+1;if(stages>=3)return form>=2?4:form===1?3:0;if(stages===2)return form>=1?4:1;return 2;}
function beastOriginZone(id){const sp=SP[id];if(sp.mistZone)return sp.mistZone;if(sp.legendary&&sp.rarePair)return beastOriginZone(sp.rarePair);const z=ZN.filter(z=>[...z.sp,...z.rare,...(z.bosses||[z.boss]).map(b=>b.sp)].includes(id));return z.length?Math.min(...z.map(z=>z.id)):1;}
function beastStatPower(s){return s.hp/10+Math.max(s.patk,s.matk)*2+(s.pdef+s.mdef)*.7+s.spd*.4+s.mp*.1;}
function beastBudget(lv,wild=1){const n=(lv-1)*wild;return 50*(1+.2*n)/10+14*(1+.17*n)*2+20*(1+.17*n)*.7+10*(1+.08*n)*.4+20*(1+.12*n)*.1;}
const beastBudgetPrevious=calcPet;
calcPet=function(p,wild=1){if(SP[p.sp].solar){const s=calcPet({...p,sp:SP[p.sp].solarPair,form:0},wild);for(const k of K)s[k]=Math.round(s[k]*1.3);return s;}const result=beastBudgetPrevious(p,wild);if(p.sp==='demonlord')return result;const base=beastBudgetPrevious({...p,pts:{}},wild),tier=beastPowerTier(SP[p.sp],p.form||0),zone=Math.max(1,Math.min(7,beastOriginZone(p.sp))),target=beastBudget(p.lv,wild)*BEAST_TIER_BUDGET[tier]*(1+.012*(zone-1)),scale=target/beastStatPower(base);for(const key of ['hp','mp','patk','matk','pdef','mdef','spd'])result[key]=Math.max(1,Math.round(base[key]*scale+(result[key]-base[key])));return result;};

// @soulbeast-end 1078-beastBudget
