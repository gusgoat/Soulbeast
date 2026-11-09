export {remoteWalkMotion as remotePartyMotion} from '../../client/remote-walk-motion.mjs?v=1';

export function mountPartyVitals(parent=document.body) {
 const box=document.createElement('section');box.className='online-party-vitals';box.setAttribute('aria-label','HP และ MP ของสมาชิกปาร์ตี้');
 const style=document.createElement('style');style.textContent=`.online-party-vitals{position:fixed;left:6px;top:calc(var(--walk-top,0px) + 70px);width:min(32vw,154px);z-index:12;pointer-events:none}.online-party-member{padding:5px 7px;margin:0 0 5px;background:#071b2ee8;border:1px solid #b99b62;border-radius:7px;font:11px/1.4 Tahoma;color:#f6e6bf}.online-party-member strong{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.online-party-member meter{display:block;width:100%;height:9px;appearance:none;margin:2px 0;background:#03101b;border-radius:4px}.online-party-member meter::-webkit-meter-bar{background:#03101b;border:0}.online-party-member meter::-webkit-meter-optimum-value{background:#52ca8b}.online-party-member .mp::-webkit-meter-optimum-value{background:#54b9ef}.online-party-member meter::-moz-meter-bar{background:#52ca8b}.online-party-member .mp::-moz-meter-bar{background:#54b9ef}`;
 parent.append(style,box);let signature='';
 return {update(members){const values=JSON.stringify(members.map(m=>[m.code,m.name,m.hp,m.mp,m.maxHp,m.maxMp,m.online]));if(values===signature)return;signature=values;box.replaceChildren();
  for(const member of members){const row=document.createElement('div');row.className='online-party-member';const name=document.createElement('strong');name.textContent=member.name+(member.online===false?' · หลุด':'');row.append(name);
   for(const [key,maxKey]of [['hp','maxHp'],['mp','maxMp']]){const bar=document.createElement('meter');bar.className=key;bar.min=0;bar.max=Math.max(1,Number(member[maxKey])||1);bar.value=Math.max(0,Math.min(bar.max,Number(member[key])||0));bar.setAttribute('aria-label',`${member.name} ${key.toUpperCase()} ${bar.value}/${bar.max}`);row.append(bar);}box.append(row);}
 },setHidden(value){box.hidden=!!value;},remove(){box.remove();style.remove();}};
}
