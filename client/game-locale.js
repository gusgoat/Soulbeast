(() => {
 'use strict';
 const script=document.currentScript;
 const base=new URL('../',script.src);
 const key='sealbeast_language_v1';
 const previousKey='soulbeast_supabase_test_language_v1';
 const locales=['th','en','zh-CN'];
 const thai=/[\u0e00-\u0e7f]/u;
 const segmenter=typeof Intl.Segmenter==='function'?new Intl.Segmenter('th',{granularity:'word'}):null;
 const extras=window.SoulbeastExtraTranslations||{};
 const attrs=['title','placeholder','aria-label','alt'];
 const excluded='script,style,textarea,option[translate="no"],[translate="no"],[data-user-content],[contenteditable="true"]';
 const textNodes=new WeakMap(),elements=new WeakMap();
 let lang=get(),lookup,pattern,loading,ready=false;

 function get(){
  try{
   const saved=localStorage.getItem(key)||localStorage.getItem(previousKey);
   if(locales.includes(saved))return saved;
  }catch{}
  return 'th';
 }
 function set(next){
  if(!locales.includes(next))return false;
  try{if(localStorage.getItem(key)!==next)localStorage.setItem(key,next);}catch{}
  update(next);
  return true;
 }
 function extend(dict){
  for(const [source,[en,zh]] of Object.entries(extras)){
   dict.en[source]=en;
   dict['zh-CN'][source]=zh;
  }
  return dict;
 }
 function update(next){
  if(next===lang)return;
  lang=next;
  window.dispatchEvent(new CustomEvent('soulbeast-language-change',{detail:lang}));
 }
 function compile(dict){
  lookup=dict;
  const keys=[...new Set(Object.values(dict).flatMap(Object.keys))].sort((a,b)=>b.length-a.length);
  pattern=new RegExp(keys.map(s=>s.replace(/[.*+?^$${}()|[\]\\]/g,'\\$&')).join('|'),'g');
 }
 function replaceKnown(original,table,matcher,language){
  const exact=original.trim();
  if(Object.hasOwn(table,exact))return original.replace(exact,()=>table[exact]);
  const boundaries=segmenter?new Set([...segmenter.segment(original)].map(word=>word.index).concat(original.length)):null;
  const output=original.replace(matcher,(part,index)=>{
   if(!Object.hasOwn(table,part)||(boundaries&&(!boundaries.has(index)||!boundaries.has(index+part.length))))return part;
   return language==='en'?' '+table[part]+' ':table[part];
  });
  return language==='en'?original.replace(exact,()=>output.replace(/[^\S\n]+/g,' ').replace(/[ \t]+([,.:!?])/g,'$1').trim()):output;
 }
 const cache=new Map();
 function text(value){
  const original=String(value??'');
  if(lang==='th'||!lookup||!thai.test(original))return original;
  const cacheKey=lang+'\n'+original;
  if(cache.has(cacheKey))return cache.get(cacheKey);
  const translated=replaceKnown(original,lookup[lang],pattern,lang);
  if(cache.size>2500)cache.clear();
  cache.set(cacheKey,translated);
  return translated;
 }
 function localizeValue(current,previous){
  const source=previous?.translated===current?previous.source:current;
  return {source,translated:text(source)};
 }
 function localizeNode(node){
  if(!node.parentElement||node.parentElement.closest(excluded)||!node.data.trim())return;
  const value=localizeValue(node.data,textNodes.get(node));
  textNodes.set(node,value);
  if(node.data!==value.translated)node.data=value.translated;
 }
 function localizeElement(el){
  if(el.closest(excluded))return;
  const state=elements.get(el)||{};
  for(const attr of attrs){
   const current=el.getAttribute(attr);
   if(current===null)continue;
   const value=localizeValue(current,state[attr]);
   state[attr]=value;
   if(current!==value.translated)el.setAttribute(attr,value.translated);
  }
  elements.set(el,state);
 }
 function scan(root){
  if(root.nodeType===Node.TEXT_NODE){localizeNode(root);return;}
  if(root.nodeType!==Node.ELEMENT_NODE||root.closest(excluded))return;
  localizeElement(root);
  root.querySelectorAll('[title],[placeholder],[aria-label],[alt]').forEach(localizeElement);
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
  while(walker.nextNode())localizeNode(walker.currentNode);
 }
 function loadScript(path){
  return new Promise((resolve,reject)=>{
   const element=document.createElement('script');
   element.src=new URL(path,base);
   element.onload=resolve;
   element.onerror=reject;
   document.head.append(element);
  });
 }
 function refresh(){
  if(!ready)return;
  document.documentElement.lang=lang;
  scan(document.documentElement);
  if(lang==='th'||loading)return;
  loading=(async()=>{
   if(typeof SoulbeastContent==='undefined')await loadScript('game-data-registry.5350fd57c39d09dd.js');
   if(!SoulbeastContent.GAME_TRANSLATIONS)await loadScript('game-data-localization.4e97f22b85950411.js');
   compile(extend(SoulbeastContent.GAME_TRANSLATIONS()));
   cache.clear();
   scan(document.documentElement);
  })().catch(()=>{loading=null;});
 }
 function mount(){
  if(ready)return;
  ready=true;
  compile(extend({en:{},'zh-CN':{}}));
  const observer=new MutationObserver(changes=>{
   if(lang==='th')return;
   for(const change of changes){
    if(change.type==='attributes')localizeElement(change.target);
    else if(change.type==='characterData')localizeNode(change.target);
    else for(const node of change.addedNodes)scan(node);
   }
  });
  observer.observe(document.documentElement,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:attrs});
  addEventListener('soulbeast-language-change',refresh);
  refresh();
 }
 addEventListener('storage',event=>{if(event.key===key||event.key===previousKey||event.key===null)update(get());});
 window.SoulbeastLocale={get,set,text,extend,replaceKnown,key};
 if(script.hasAttribute('data-translate-page')){
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});
  else mount();
 }
})();
