const assert=require('assert/strict');
(async()=>{
 const {startLoading,withLoading}=await import('../client/online-loading.mjs');
 class Element{
  constructor(doc){this.ownerDocument=doc;this.children=[];this.attrs={};this.inert=false;this.events=new Map();}
  append(...els){for(const e of els){e.parent=this;this.children.push(e);}}
  setAttribute(k,v){this.attrs[k]=v;}getAttribute(k){return this.attrs[k]??null;}removeAttribute(k){delete this.attrs[k];}
  addEventListener(k,fn){this.events.set(k,fn);}removeEventListener(k){this.events.delete(k);}
  remove(){this.parent.children=this.parent.children.filter(e=>e!==this);}
 }
 const doc={createElement:()=>new Element(doc)},container=new Element(doc),a=new Element(doc),b=new Element(doc);
 let focusRestored=0;doc.activeElement={isConnected:true,focus:()=>focusRestored++};b.inert=true;container.append(a,b);
 const first=startLoading(container,'Loading'),second=startLoading(container,'Nested');
 assert.equal(container.children.length,3,'Overlapping jobs share one loader');assert(a.inert);assert(b.inert);
 let cancelled=false;container.events.get('cancel')({preventDefault(){cancelled=true;}});assert(cancelled,'Dialog stays open while its operation is running');
 first();first();assert.equal(container.children.length,3,'Double cleanup cannot finish another job');second();
 assert.equal(container.children.length,2);assert.equal(a.inert,false);assert.equal(b.inert,true,'Existing inert state is retained');assert.equal(container.getAttribute('aria-busy'),null);assert.equal(focusRestored,1);
 container.setAttribute('aria-busy','false');
 await assert.rejects(()=>withLoading(container,'Failure',async()=>{throw Error('offline');}),/offline/);
 assert.equal(container.children.length,2,'Failure removes the loader');assert.equal(container.getAttribute('aria-busy'),'false');assert.equal(a.inert,false);
 assert.equal(await withLoading(container,'Success',async()=>42),42);
 assert.equal(await withLoading(null,'No DOM',async()=>7),7);
 console.log('PASS online loading: overlap, duplicate cleanup, error/success cleanup, dialog cancellation, preserved inert/ARIA state and restored focus');
})().catch(e=>{console.error(e);process.exitCode=1;});
