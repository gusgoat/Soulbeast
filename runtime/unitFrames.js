// Identity ornamentation is presentation only; do not add fields to units/saves.
// @soulbeast-unit 1092-unitFrames
const UnitFrames={
 roles:{swordsman:'sword',gladiator:'shield',archer:'bow',mage:'arcane',merchant:'coin',gunner:'gun',druid:'grove',thief:'daggers',summoner:'summon'},
 special:{ninja:'shuriken',ronin:'sword',samurai:'sword',kensei:'sword',spellblade:'sword',sbsummon:'sword',sbwar:'sword',bard:'lyre',maestro:'lyre',dirge:'lyre',blacksmith:'hammer',mastersmith:'hammer',mechanic:'hammer',alchemist:'flask',biochem:'flask',goldalch:'flask'},
 colors:{sword:'#c7b47d',shield:'#cabd8e',bow:'#a9c99d',arcane:'#b7aff1',summon:'#a3d5d2',grove:'#9ec598',shuriken:'#becbd6',daggers:'#b1adc9',gun:'#c3b1a0',coin:'#dec58b',hammer:'#bea992',flask:'#a8cdb1',lyre:'#d7b3bd',bone:'#82909b'},
 resolve(u={}){
  if(u.sp==='demonlord'||u.img==='demonlord'||u.immortalWorld||u.id==='worldboss')return {key:'bone',secondary:'bone',color:this.colors.bone};
  const cls=u.cls||(u.kind==='player'||u.img==='player'?S.P?.cls:null);
  if(cls&&CLS[cls]){
   const key=this.special[cls]||this.roles[baseOf(cls)]||'sword';
   const secondary=['spellblade','sbwar'].includes(cls)?'arcane':cls==='sbsummon'?'summon':key;
   return {key,secondary,color:this.colors[key]};
  }
  const species=u.sp||u.img,types=(u.types?.length?u.types:SP[species]?.t||[]).filter(k=>EL[k]);
  const key=types.includes('dragon')?'dragon':types[0]||'normal',secondary=types.find(k=>k!==key)||key;
  return {key,secondary,color:EL[key]?.c||EL.normal.c};
 },
 attributes(u){
  const t=this.resolve(u);
  return 'data-unit-frame="'+t.key+'" data-unit-secondary="'+t.secondary+'" style="--unit-ornament:url(\'assets/ui/unit-frames/'+t.key+'.svg\');--unit-alt-ornament:url(\'assets/ui/unit-frames/'+t.secondary+'.svg\');--unit-tint:'+t.color+'"';
 },
 decoration(){return ['nw','ne','sw','se'].map(k=>'<span class="unit-frame-corner unit-corner-'+k+'" aria-hidden="true"></span>').join('')+'<span class="unit-frame-sprig sprig-nw" aria-hidden="true"></span><span class="unit-frame-sprig sprig-se" aria-hidden="true"></span>';},
 decorate(html,u){
  if(/data-unit-frame=/.test(html.slice(0,html.indexOf('>')+1)))return html;
  return html.replace(/<(button|div|article|section)\b[^>]*>/,tag=>{
   const a=this.attributes(u),style=a.match(/style="([^"]*)"/)[1];
   tag=tag.includes('class="')?tag.replace('class="','class="unit-frame '):tag.replace(/>$/,' class="unit-frame">');
   tag=tag.includes('style="')?tag.replace('style="','style="'+style+';'):tag.replace(/>$/,' style="'+style+'">');
   return tag.replace(/>$/,' '+a.replace(/ style="[^"]*"/,'')+'>')+this.decoration();
  });
 }
};
// @soulbeast-end 1092-unitFrames
