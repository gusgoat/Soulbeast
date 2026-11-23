(() => {
 const labels=window.BattleStatusLabels;
 const stats={patk:['พลังโจมตีกายภาพ','⚔'],matk:['พลังโจมตีเวท','⚚'],pdef:['เกราะกายภาพ','⬟'],mdef:['เกราะเวท','◇'],acc:['แม่นยำ','⊕'],eva:['หลบหลีก','➶'],spd:['ความเร็ว','➟'],crit:['คริติคอล','✦']};
 const passives={thorns2:9,reflect50:9,counter50:9,omni:10,poisonTouch2:11,mpsave:12,regen:13,guardian:14,defending:22,class10_parry:22,class10_stealth:14};
 const forms={wolf:15,bear:16,hawk:17,treant:18,saber:19,gdragon:20,moon:21};
 const dots={'พายุไฟ':6,'วังน้ำวน':7,'บีบรัด':8};
 const passiveNames={class10_parry:'ตั้งสมาธิปัดป้อง',class10_stealth:'ล่องหน',defending:'ตั้งรับ'};
 const turn=n=>' · เหลือ '+n+' เทิร์น';
 function effects(u){
  const rows=[],push=(art,text,tone='good',color='',symbol='')=>rows.push({art,text,tone,color,symbol});
  for(const [k,n] of Object.entries(u.status||{})){
   const ail=labels.STS[k];
   if(n&&ail)push(k,ail[0]+' · '+ail[1],'bad',ail[2]);
   else if(n>0&&/-(up|down)$/.test(k)&&stats[k.split('-')[0]])push(k,stats[k.split('-')[0]][0]+(k.endsWith('up')?'เพิ่มขึ้น':'ลดลง'),k.endsWith('up')?'good':'bad');
  }
  if(Array.isArray(u.badges)){
   for(const b of u.badges){
    const st=Object.entries(stats).find(([,v])=>b.icon===v[1]+'↑'||b.icon===v[1]+'↓')?.[0];
    const art=st?st+(b.down?'-down':'-up'):Number.isInteger(b.icon)?b.icon:null;
    push(art,b.label,b.down||[6,7,8].includes(art)?'bad':'good','',String(b.icon));
   }
   return rows;
  }
  const sums=new Map(),pas=new Map();
  for(const b of u.buffs||[]){
   if(!(b.tn>0))continue;
   if(stats[b.st]&&Number.isFinite(b.amt))sums.set(b.st,(sums.get(b.st)||0)+b.amt);
   if(b.pas)pas.set(b.pas,Math.max(b.tn,pas.get(b.pas)||0));
  }
  for(const [st,n] of sums)if(Math.abs(n)>1e-8)push(st+(n>0?'-up':'-down'),(n>0?'เพิ่ม':'ลด')+stats[st][0]+' '+Math.round(Math.abs(n)*100)+'%',n>0?'good':'bad');
  if(u.taunt>0)push(0,'ยั่วยุ · ดึงการโจมตีเข้าหาตัว'+turn(u.taunt),'neutral');
  if(u.charging)push(1,'กำลังชาร์จ'+(labels.SK[u.charging.id]?' · '+labels.SK[u.charging.id]:''));
  if(u.charge>1)push(2,'พลังโจมตีครั้งถัดไป ×'+u.charge);
  if(u.immune==='p')push(3,'ป้องกันกายภาพ 100%');
  if(u.immune==='m')push(4,'ป้องกันเวท 100%');
  if(u.enchant)push(5,'ประทับธาตุอาวุธ · '+(labels.EL[u.enchant]||u.enchant));
  for(const d of u.dots||[])if(d.turns>0)push(dots[d.n]??null,d.n+turn(d.turns),'bad','','☄');
  for(const [id,n] of pas)push(passives[id]??null,(labels.PAS[id]||passiveNames[id]||id)+turn(n),'good','','✦');
  if(Object.hasOwn(forms,u.form))push(forms[u.form],labels.FORMS[u.form]||u.form,'neutral');
  if(u.summonLife>0)push(23,'อสูรอัญเชิญชั่วคราว'+turn(u.summonLife),'neutral');
  if(u.class10Barrier>0)push(3,'บาเรียเวทย์ · ป้องกันได้ 1 ท่า');
  if(u.pas?.includes('class10_parry')&&!pas.has('class10_parry'))push(22,'ตั้งสมาธิปัดป้อง · ป้องกันได้ 1 ท่า');
  if(u.archerVeil>0)push(14,'ล่องหน · ลดดาเมจท่าเดี่ยวแรก 50% ได้อีก 1 ครั้ง');
  if(u.elementalBarrierHits>0)push(null,'บาเรียธาตุ · ลดดาเมจบอส 50% เหลือ '+u.elementalBarrierHits+' ฮิต','good','','🛡'+u.elementalBarrierHits);
  return rows;
 }
 const cache=new WeakMap();
 function icon(r){
  const el=document.createElement('span');el.className='effect-badge '+r.tone;el.title=r.text;el.setAttribute('role','img');el.setAttribute('aria-label',r.text);
  if(Number.isInteger(r.art)) {el.classList.add('atlas');el.style.backgroundPosition=(r.art%6*20)+'% '+(Math.floor(r.art/6)*100/3)+'%';}
  else if(r.art){const im=document.createElement('img');im.alt='';im.src='../assets/ui/status/'+r.art+'.webp';el.append(im);}
  else el.textContent=r.symbol;
  return el;
 }
 function render(card,actor){
  const rows=effects(actor.worldUnit||actor),strip=card.querySelector('.card-status'),key=JSON.stringify(rows),saved=cache.get(strip);
  if(saved?.key===key)return;
  cache.set(strip,{key,rows});strip.replaceChildren(...rows.map(icon));
  strip.title=rows.map(r=>r.text).join('\n');
  const colors=rows.filter(r=>r.color).map(r=>r.color);
  card.toggleAttribute('data-ailment-frame',colors.length>0);
  card.style.setProperty('--ailment-colors',colors.length===1?colors[0]+','+colors[0]:colors.join(','));
  if(rows.length){strip.setAttribute('role','button');strip.tabIndex=0;strip.setAttribute('aria-label','รายละเอียดสถานะ '+rows.map(r=>r.text).join(' · '));}
  else{strip.removeAttribute('role');strip.removeAttribute('tabindex');strip.removeAttribute('aria-label');}
 }
 function details(event){
  const strip=event.target.closest?.('.card-status'),saved=cache.get(strip);
  if(!saved?.rows.length||event.type==='keydown'&&!['Enter',' '].includes(event.key))return;
  event.preventDefault();event.stopPropagation();
  const d=document.createElement('dialog');d.className='card-status-details';
  const h=document.createElement('h2');h.textContent='สถานะของ'+(strip.closest('.unit')?.querySelector('.unit-top b')?.textContent||'ตัวละคร');d.append(h);
  for(const row of saved.rows){const p=document.createElement('p');p.append(icon(row),document.createTextNode(row.text));d.append(p);}
  const button=document.createElement('button');button.textContent='ปิด';button.onclick=()=>d.close();d.append(button);
  d.onclose=()=>{d.remove();if(strip.isConnected)strip.focus();};document.body.append(d);d.showModal();
 }
 document.addEventListener('click',details,true);document.addEventListener('keydown',details,true);
 window.BattleCardStatus={effects,render};
})();
