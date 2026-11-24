// Keep one same-document entry above the room so Back can offer a choice.
export function roomBackExit({room, leave, stopMoving = () => {}, prompt = () => 'ออกจากห้องนี้หรือไม่?'}) {
  const key = 'soulbeastRoomBack';
  const host = window.parent !== window && document.referrer && new URL(document.referrer).origin === location.origin ? window.parent : window;
  const history = host.history;
  const dialog = document.createElement('dialog');
  dialog.setAttribute('aria-labelledby', 'partyExitQuestion');
  dialog.style.cssText = 'max-width:min(86vw,24rem);padding:18px;border:1px solid #c29951;border-radius:12px;background:#142a35;color:#fff1cc';
  const question = document.createElement('p');
  question.id = 'partyExitQuestion';
  const translate = text => window.SoulbeastLocale?.text(text) ?? text;
  const stay = document.createElement('button');
  stay.textContent = translate('ยกเลิก');
  stay.autofocus = true;
  const exit = document.createElement('button');
  exit.textContent = translate('ออกจากห้อง');
  exit.style.marginInlineStart = '12px';
  dialog.append(question, stay, exit);
  document.body.append(dialog);
  let pending = false, active = true;
  function arm() {
    if (history.state?.[key] !== room) history.pushState({...history.state, [key]:room}, '');
  }
  function ask() {
    if (!active || pending || dialog.open) return;
    question.textContent = translate(prompt());
    stopMoving();
    dialog.showModal();
    stay.focus();
  }
  function back() {
    if (!active) return;
    // Rearm even if Back traversed to the earlier gesture entry for this room.
    history.pushState({...history.state,[key]:room},'');
    ask();
  }
  stay.onclick = () => dialog.close();
  exit.onclick = async () => {
    if (pending) return;
    pending = true;
    dialog.close();
    try { await leave(); } finally { pending = false; }
  };
  arm();
  // Mobile browsers may skip a history entry created before the first gesture.
  function armOnGesture(){
    if(active && !dialog.open)history.pushState({...history.state,[key]:room},'');
    removeGestureListeners();
  }
  function removeGestureListeners(){
    document.removeEventListener('click',armOnGesture,true);
    document.removeEventListener('touchend',armOnGesture,true);
    document.removeEventListener('keydown',armOnGesture,true);
  }
  if(!host.navigator.userActivation?.isActive){
    for(const event of ['click','touchend','keydown'])document.addEventListener(event,armOnGesture,true);
  }
  host.addEventListener('popstate', back);
  function close() {
    active = false;
    removeGestureListeners();
    host.removeEventListener('popstate', back);
    dialog.remove();
    removeEventListener('pagehide', close);
  }
  addEventListener('pagehide', close);
  return {ask, close};
}
