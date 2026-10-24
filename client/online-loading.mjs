// Scoped loading UI for top-layer shop dialogs and the standalone web shop.
// Nested operations share one indicator; every exit restores the original UI.
const active=new WeakMap();
export function startLoading(container,label){
 if(!container)return ()=>{};
 const existing=active.get(container);
 if(existing){existing.count++;return release;}
 const doc=container.ownerDocument,layer=doc.createElement('div');
 layer.className='request-wait';layer.setAttribute('role','status');layer.setAttribute('aria-live','polite');
 const panel=doc.createElement('div'),art=doc.createElement('div'),img=doc.createElement('img'),message=doc.createElement('p');
 panel.className='request-wait-panel';art.className='request-wait-art';art.setAttribute('aria-hidden','true');
 img.src='./assets/ui/online-hourglass.webp';img.alt='';img.width=160;img.height=160;message.textContent=label;
 art.append(img);panel.append(art,message);layer.append(panel);
 const children=[...container.children].map(el=>({el,inert:el.inert})),focus=doc.activeElement,busy=container.getAttribute('aria-busy');
 const cancel=e=>e.preventDefault();
 active.set(container,{count:1,layer,children,focus,busy,cancel});
 for(const {el} of children)el.inert=true;
 container.setAttribute('aria-busy','true');container.addEventListener('cancel',cancel);container.append(layer);
 return release;
 function release(){
  // Each returned release function is idempotent, including nested callers.
  if(release.done)return;release.done=true;
  const state=active.get(container);if(!state||--state.count)return;
  state.layer.remove();for(const {el,inert} of state.children)el.inert=inert;
  if(state.busy===null)container.removeAttribute('aria-busy');else container.setAttribute('aria-busy',state.busy);
  container.removeEventListener('cancel',state.cancel);active.delete(container);
  if(state.focus?.isConnected&&!state.focus.inert)state.focus.focus?.({preventScroll:true});
 }
}
export async function withLoading(container,label,task){
 const done=startLoading(container,label);try{return await task();}finally{done();}
}
