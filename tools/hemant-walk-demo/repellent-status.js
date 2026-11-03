(()=>{'use strict';
const rules=window.walkRepellent,badge=document.createElement('div');badge.id='repellentStatus';badge.setAttribute('role','timer');badge.setAttribute('aria-live','off');badge.hidden=true;document.body.append(badge);let player=null;
function refresh(){try{player=JSON.parse(sessionStorage.getItem(rules.STORE_KEY)||'null')}catch{player=null}const left=rules.remaining(player);badge.hidden=!left;badge.textContent='✦ ไล่อสูร · '+rules.format(left);badge.dataset.remainingMs=left}
window.walkRepellentActive=()=>rules.remaining(player)>0;
addEventListener('message',e=>{if(e.origin===location.origin&&e.data?.type==='town-return')refresh()});addEventListener('pageshow',refresh);setInterval(refresh,500);refresh();
})();
