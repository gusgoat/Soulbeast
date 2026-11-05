(() => {
 const {hostname, pathname} = location;
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
  location.replace('/Soulbeast/accounts.html');
 }
 checkSelectedCharacter();
 addEventListener('pageshow', event => {
  if (event.persisted) checkSelectedCharacter();
 });
})();
