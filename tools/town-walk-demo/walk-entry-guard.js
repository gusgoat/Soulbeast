(() => {
 const {hostname, pathname} = location;
 if (pathname === '/Soulbeast/tools/hemant-walk-demo/index.html' && window.SoulbeastPacklordPreview) return;
 if (hostname !== 'gusgoat.github.io' || !pathname.startsWith('/Soulbeast/')) return;

 function checkSelectedCharacter() {
  try {
   const player = JSON.parse(sessionStorage.getItem('soulbeast-walk-preview-player-v1') || 'null');
   const online = JSON.parse(sessionStorage.getItem('soulbeast-online-walk-v1') || 'null');
   if (online?.owner && online.code && online.code === player?.code && online.code === online.snapshot?.P?.code) return;
   if (!online && player?.walkId && player.code &&
       JSON.parse(localStorage.getItem('soulbeast-walk-save:' + player.walkId) || 'null')?.code === player.code) return;
  } catch {
   // Missing, blocked, or corrupt browser storage cannot establish a selected character.
  }
  document.documentElement.style.visibility = 'hidden';
  let testWorld=new URLSearchParams(location.search).get('world')==='test';try{testWorld=testWorld||JSON.parse(sessionStorage.getItem('soulbeast-online-walk-v1')||'null')?.environment==='test'}catch{}
  location.replace('/Soulbeast/accounts.html'+(testWorld?'?world=test&entry=test-world-entry-20261122-1':''));
 }
 checkSelectedCharacter();
 addEventListener('pageshow', event => {
  if (event.persisted) checkSelectedCharacter();
 });
})();
