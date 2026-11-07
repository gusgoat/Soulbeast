/* Country-map shortcuts reuse the inventory's item rules and online save event. */
(()=>{'use strict';
 const rules=window.walkRepellent,bar=document.createElement('div');
 bar.className='country-quick-items';bar.setAttribute('role','group');bar.setAttribute('aria-label','ไอเท่มลัด');
 const style=document.createElement('style');style.textContent=`
 .country-quick-items{position:fixed;right:12px;bottom:calc(var(--walk-bottom, 96px) + 14px);display:flex;flex-direction:column;align-items:center;gap:10px;z-index:6}
 .country-quick-items button{box-sizing:border-box;width:38px;height:38px;padding:5px;border:2px solid #dab966;border-radius:50%;background:radial-gradient(circle,#214c59,#061f2c);box-shadow:0 1px 4px #0009,inset 0 0 0 1px #7e5b2b;touch-action:manipulation;cursor:pointer}
 .country-quick-items [data-quick-item="teleportScroll"]{width:34px;height:34px;align-self:flex-end}
 .country-quick-items button:active{transform:scale(.94)}
 .country-quick-items button:focus-visible{outline:2px solid #9cecff;outline-offset:3px}
 .country-quick-items img{display:block;width:100%;height:100%;object-fit:contain;border-radius:50%;pointer-events:none}
 .country-item-notice{position:fixed;left:50%;bottom:180px;transform:translateX(-50%);max-width:80vw;background:#102c39f5;color:#ffe9af;border:1px solid #c9a453;border-radius:12px;padding:12px 16px;z-index:10002;font:14px Tahoma;pointer-events:none}
 `;document.head.append(style);
 function read(){try{return JSON.parse(sessionStorage.getItem(rules.STORE_KEY)||'null')}catch{return null}}
 let noticeTimer;function notice(text){let box=document.querySelector('.country-item-notice');if(!box){box=document.createElement('div');box.className='country-item-notice';box.setAttribute('role','status');document.body.append(box)}box.textContent=text;clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>box.remove(),3000)}
 function blocked(){return !!document.querySelector('dialog[open],#regionMenu')||document.hidden}
 function add(id,label,art,action){const b=document.createElement('button');b.type='button';b.dataset.quickItem=id;b.setAttribute('aria-label',label);b.title=label;const img=document.createElement('img');img.src='/Soulbeast/'+art;img.alt='';b.append(img);b.onclick=()=>{if(!blocked())action()};bar.append(b)}
 add('beastRepellent','ใช้เครื่องหอมไล่อสูร','assets/media/c5588155d4a8e48cfe54b1e1.webp',()=>{const player=read();if(!rules.activate(player).ok){notice('ไม่มีเครื่องหอมไล่อสูร');return}sessionStorage.setItem(rules.STORE_KEY,JSON.stringify(player));dispatchEvent(new Event('walk-player-saved'));for(const id of ['hudTop','hudBottom'])document.getElementById(id)?.contentWindow.postMessage({type:'walk-hud-refresh'},location.origin);notice('เพิ่มเวลาคุ้มครอง 10 นาที · เหลือ '+rules.format(rules.remaining(player)))});
 add('teleportScroll','ใช้ใบเทเลพอร์ต','assets/world-quests/teleport-scroll-v1.png.webp',()=>{if(!(read()?.items?.teleportScroll>0)){notice('ไม่มีใบเทเลพอร์ต');return}dispatchEvent(new CustomEvent('country-quick-teleport'))});
 document.body.append(bar);
})();
