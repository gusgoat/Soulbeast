// Private inventory requests only when a menu opens; never part of motion broadcasts.
export function partyMenu({request,refresh,picture,onOpen,canOpen}){
 const $=id=>document.getElementById(id),panel=$('partyMenu'),body=$('partyMenuBody');const aux=$('partyAuxMenu'),quest=$('townDialog'),hud=[$('hudTop'),$('hudBottom')];let member=null;
 let tab='bag',data=null,busy=false,pending=null,generation=0;
 const el=(tag,text)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;return e;};
 const button=(text,fn,disabled=false)=>{const b=el('button',text);b.disabled=disabled;b.onclick=fn;return b;};
 function close(){generation++;panel.hidden=true;if(quest.open)quest.close();if(!aux.hidden){aux.hidden=true;aux.removeAttribute('src');}onOpen(false);window.focus();}
 function row(name,image){const r=el('article');r.className='inventory-row';if(image){const i=el('img');i.src=image;i.alt='';i.onerror=()=>i.remove();r.append(i);}r.append(el('strong',name));body.append(r);return r;}
 function draw(){body.replaceChildren();if(!data)return;const d=data;
  $('partyMenuTitle').textContent=tab==='bag'?'กระเป๋าเดินทาง':tab==='team'?'อสูรร่วมต่อสู้':'ตัวละครและอุปกรณ์';
  body.append(el('p','ใช้ข้อมูลบนเซิร์ฟเวอร์ · เปลี่ยนได้เมื่อไม่ได้ต่อสู้'));
  if(tab==='bag'){
   const target=el('select');target.setAttribute('aria-label','เลือกผู้รับยา');target.add(new Option(d.name+' · HP '+d.hp+'/'+d.maxHp+' · MP '+d.mp+'/'+d.maxMp,'P'));
   for(const p of d.pets)target.add(new Option(p.name+' · HP '+p.hp+'/'+p.st.hp+' · MP '+p.mp+'/'+p.st.mp,String(p.uid)));body.append(target);
   for(const it of d.items){const r=row(it.n+' × '+it.count);r.append(button('ใช้',()=>act({op:'use',id:it.id,target:target.value==='P'?'P':Number(target.value)}),!(it.hp||it.mp||it.rev||it.cure)||!!it.seal||busy));}
   if(!d.items.length)body.append(el('p','ไม่มีไอเทมในกระเป๋า'));
  }else if(tab==='team'){
   const selected=new Set(d.party);body.append(el('p','เลือกอสูรที่พกติดตัว · สูงสุด '+d.capacity+' ตัว'));
   for(const p of d.pets){const r=row(p.name+' · Lv '+p.lv,picture(p));r.append(el('small','HP '+p.hp+'/'+p.st.hp+' · MP '+p.mp+'/'+p.st.mp));const input=el('input');input.type='checkbox';input.checked=selected.has(p.uid);input.setAttribute('aria-label',p.name);input.onchange=()=>{if(input.checked)selected.add(p.uid);else selected.delete(p.uid);};r.append(input);}
   body.append(button('ยืนยันทีมอสูร',()=>act({op:'team',ids:[...selected]}),busy));
  }else{
   body.append(el('h3',d.name+' · '+d.cls+' · Lv '+d.lv),el('p','HP '+d.hp+'/'+d.maxHp+' · MP '+d.mp+'/'+d.maxMp));
   body.append(el('h3','สวมใส่อยู่'));for(const g of d.equipment){const r=row(g.n+' · Lv '+g.lv);r.append(el('small',Object.entries(g.st||{}).map(([k,v])=>k+' +'+v).join(' · ')));if(g.slot!=='weapon')r.append(button('ถอด',()=>act({op:'unequip',slot:g.slot}),busy));}
   body.append(el('h3','อุปกรณ์ในกระเป๋า'));for(const g of d.owned){const r=row(g.n+' · Lv '+g.lv);r.append(el('small',Object.entries(g.st||{}).map(([k,v])=>k+' +'+v).join(' · ')),button('สวมใส่',()=>act({op:'equip',id:g.id}),busy||d.lv<g.lv||d.equipment.some(x=>x.id===g.id)));}
  }
 }
 async function load(){const gen=generation;$('partyMenuStatus').textContent='กำลังโหลดข้อมูล…';try{const result=await request({});if(gen!==generation)return;data=result;syncHud();draw();$('partyMenuStatus').textContent='';}catch(e){if(gen===generation)$('partyMenuStatus').textContent='โหลดไม่สำเร็จ · '+e.message;}}
 async function act(command){if(busy)return;busy=true;pending??={...command,requestId:crypto.randomUUID()};draw();$('partyMenuStatus').textContent='กำลังบันทึก…';try{await request(pending);pending=null;await refresh();await load();}catch(e){$('partyMenuStatus').textContent=e.message==='invalid_inventory_action'?'ใช้ไม่ได้: ตรวจจำนวนยา พลังชีวิต เลเวล หรือจำนวนอสูรในทีม':e.message==='already_fighting'?'เริ่มต่อสู้แล้ว กรุณาจัดการหลังจบการต่อสู้':'เชื่อมต่อไม่สำเร็จ กดทำรายการอีกครั้งเพื่อตรวจรายการเดิม';if(['invalid_inventory_action','already_fighting'].includes(e.message))pending=null;}finally{busy=false;draw();}}
 $('partyMenuClose').onclick=close;$('menuReload').onclick=()=>void load();
 const titles={hero:'ตัวละคร',team:'อสูร',bag:'กระเป๋า',friends:'เพื่อน',mail:'จดหมาย',settings:'ตั้งค่า',coupon:'ร้านคูปอง'};
 const inventoryTabs=new Set(['hero','team','bag']);
 function syncHud(){if(!member)return;for(const frame of hud)frame.contentWindow?.postMessage({type:'party-hud-state',member,gold:data?.gold},location.origin);}
 for(const frame of hud)frame.addEventListener('load',syncHud);
 function open(screen){
  if(!canOpen()||busy)return;
  close();
  if(screen==='quests'){window.townQuests.show(true);onOpen(true);return;}
  if(!Object.hasOwn(titles,screen))return;
  tab=screen;generation++;panel.hidden=false;panel.dataset.tab=tab;onOpen(true);
  $('partyMenuTitle').textContent=titles[tab];$('partyMenuStatus').textContent='';
  const inventory=inventoryTabs.has(tab);
  body.hidden=!inventory;$('menuReload').hidden=!inventory;aux.hidden=inventory;
  if(inventory){body.replaceChildren();void load();return;}
  const country=['blue','green','red'].includes(member?.country)?member.country:'blue';
  aux.src=tab==='coupon'?'../town-walk-demo/coupon.html':`../town-walk-demo/menu.html?partyAux=1&screen=${tab}&dungeon=party&country=${country}&city=${country}-capital`;
 }
 quest.addEventListener('close',()=>onOpen(false));
 addEventListener('message',event=>{
  if(event.origin!==location.origin)return;
  if(hud.some(frame=>frame.contentWindow===event.source)&&event.data?.type==='walk-menu')open(event.data.screen);
  if(event.source===aux.contentWindow&&!aux.hidden){
   if(event.data?.type==='town-return')close();
   if(event.data?.type==='town-open-quests')open('quests');
  }
 });
 return {close,get open(){return !panel.hidden||quest.open;},update(m){member=m;syncHud();}};
}
