import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {HEAVEN_FRAMES} from '../assets/forest-walk/heaven-frames.js';
import {PUBLISHED_FOREST_MEDIA} from '../assets/forest-walk/published-scene-assets.js';
const root=new URL('../',import.meta.url),output=new URL('../../heaven-waterfall-publish-20261119/',import.meta.url);
const hash=b=>createHash('sha256').update(b).digest('hex'),manifest=[];
for(const id of Object.keys(HEAVEN_FRAMES)){
 const file='assets/forest-walk/generated/heaven/'+id+'.png',bytes=await readFile(new URL(file,root)),sha256=hash(bytes);
 manifest.push({file,key:'heaven/'+id,object:'forest-scenes-v1--heaven--'+id+'--'+sha256.slice(0,16)+'.png',type:'image/png',bytes:bytes.length,sha256});
}
const audioFile='assets/forest-walk/audio/eisenkern1982-waterfall-176958.mp3',audioBytes=await readFile(new URL(audioFile,root)),audioHash=hash(audioBytes);
manifest.push({file:audioFile,key:'audio/waterfall',object:'forest-scenes-v1--audio--waterfall--'+audioHash.slice(0,16)+'.mp3',type:'audio/mpeg',bytes:audioBytes.length,sha256:audioHash});
await mkdir(output,{recursive:true});await writeFile(new URL('media-manifest.json',output),JSON.stringify(manifest,null,2));
if(process.argv.includes('--inventory')){console.log(JSON.stringify({files:manifest.length,bytes:manifest.reduce((n,m)=>n+m.bytes,0)}));process.exit(0);}
let key=process.env.SOULBEAST_STORAGE_UPLOAD_KEY;
if(!key){const env=await readFile('D:/GameDev/soulbeast/private/supabase-storage-upload.env','utf8');key=env.match(/^\s*SOULBEAST_STORAGE_UPLOAD_KEY\s*=\s*["']?([^\r\n"']+)/m)?.[1].trim();}
if(!key||key==='PASTE_YOUR_SECRET_KEY_HERE')throw Error('Storage upload credential missing');
const base='https://zycmmtvubzyxduxqpuzl.supabase.co/storage/v1/object/',bucket='soulbeast-game-assets/';
const headers=key.startsWith('sb_secret_')?{apikey:key}:{apikey:key,Authorization:'Bearer '+key},results=[];
for(const item of manifest){
 const url=base+'public/'+bucket+item.object,check=await fetch(url,{method:'HEAD',signal:AbortSignal.timeout(30000)});
 if(!check.ok){
  if(check.status!==404){
   const probe=await fetch(url,{signal:AbortSignal.timeout(30000)}),detail=await probe.json().catch(()=>({}));
   if(detail.code!=='NoSuchKey'&&detail.error!=='not_found')throw Error(item.object+': preflight HTTP '+check.status);
  }
  const res=await fetch(base+bucket+item.object,{method:'POST',headers:{...headers,'Content-Type':item.type,'x-upsert':'false','cache-control':'31536000'},body:await readFile(new URL(item.file,root)),signal:AbortSignal.timeout(90000)});
  if(!res.ok&&res.status!==409)throw Error(item.object+': upload HTTP '+res.status);
 }
 const res=await fetch(url,{signal:AbortSignal.timeout(90000)});if(!res.ok)throw Error(item.object+': verify HTTP '+res.status);
 if(hash(Buffer.from(await res.arrayBuffer()))!==item.sha256)throw Error(item.object+': hash mismatch; existing object left untouched');
 results.push({...item,url,verified:true});await writeFile(new URL('storage-upload.json',output),JSON.stringify(results,null,2));console.log('VERIFIED '+results.length+'/'+manifest.length+' '+item.key);
}
// Original trail/outside recordings are already in Storage; require exact parity.
for(const name of ['concrete-footsteps','forest-footsteps']){
 const object='forest-y-v1--audio--'+name+'.mp3',res=await fetch(base+'public/'+bucket+object,{signal:AbortSignal.timeout(30000)});
 if(!res.ok||hash(Buffer.from(await res.arrayBuffer()))!==hash(await readFile(new URL('assets/forest-walk/audio/'+name+'.mp3',root))))throw Error(name+': published footsteps differ from tested recording');
 console.log('VERIFIED original '+name);
}
const next={...PUBLISHED_FOREST_MEDIA,...Object.fromEntries(manifest.map(m=>[m.key,m.object]))};
await writeFile(new URL('assets/forest-walk/published-scene-assets.js',root),'// Immutable Supabase objects; generated PNG originals stay out of Git.\nexport const PUBLISHED_FOREST_MEDIA = '+JSON.stringify(next,null,2)+';\n');
console.log('PASS 20 Heaven PNGs and supplied waterfall recording uploaded and SHA-256 verified; original media retained');
