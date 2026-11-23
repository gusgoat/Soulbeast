const fs=require('fs'),vm=require('vm'),crypto=require('crypto');
function callAt(s,start){let depth=0,quote='',escape=false;for(let i=s.indexOf('(',start);i<s.length;i++){const c=s[i];if(quote){if(escape)escape=false;else if(c==='\\')escape=true;else if(c===quote)quote='';continue;}if(c==='"'||c==="'"||c==='`'){quote=c;continue;}if(c==='(')depth++;if(c===')'&&!--depth)return s.slice(start,i+1)+';';}throw Error('Unclosed audio call');}
function extract(main,presentation,beasts,walkingSpecies={}){const context=vm.createContext({SoulbeastContent:{},Math,Date,SP:null,Sound:{},document:{hidden:false},PVP:{},S:{},UploadedAudio:{effect(group){context.capture=group;return true;}}});vm.runInContext(presentation,context);vm.runInContext(beasts,context);context.SP={...context.SoulbeastContent.SP(),...walkingSpecies};context.MUSIC_ASSETS=context.SoulbeastContent.MUSIC_ASSETS();context.SPECIES_VOICE=context.SoulbeastContent.SPECIES_VOICE();
 const start=main.indexOf('const ExtraAudio='),end=main.indexOf('\n};',start);if(start<0||end<0)throw Error('Missing actual cry engine');vm.runInContext(main.slice(start,end+3)+'\nglobalThis.audio=ExtraAudio;',context);const actions=[];
 for(const target of ['Object.assign(MUSIC_ASSETS,','Object.assign(ExtraAudio.groups,'])for(const m of main.matchAll(new RegExp(target.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'g')))actions.push({at:m.index,code:callAt(main,m.index)});
 for(const m of main.matchAll(/^ExtraAudio\.groups\.[^\n]+/gm))actions.push({at:m.index,code:m[0]});
 for(const a of actions.sort((a,b)=>a.at-b.at))vm.runInContext(a.code,context);
 vm.runInContext('ExtraAudio.play=function(group){globalThis.capture=group;};const originalRecordedCry=ExtraAudio.cry.bind(ExtraAudio);',context);
 for(const m of main.matchAll(/ExtraAudio\.cry=function[^\n]+/g)){vm.runInContext('var uploadedCryPrevious=ExtraAudio.cry;'+m[0],context);}
 const species={};for(const sp of Object.keys(context.SP)){context.capture=null;context.audio.cry(sp,false);const group=context.capture,keys=context.audio.groups[group]||[],urls=[...new Set(keys.map(k=>context.MUSIC_ASSETS[k]).filter(Boolean))].map(url=>url.startsWith('assets/')?'/Soulbeast/'+url:url);species[sp]={group,urls};if(!urls.length)throw Error('Missing recorded beast voice '+sp+' '+group);}
 return {species,sourceSha256:crypto.createHash('sha256').update(main).digest('hex')};}
module.exports={extract};
