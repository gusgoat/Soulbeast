import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {dirname, resolve, sep} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
export const media = JSON.parse(readFileSync(new URL('./media-storage.json', import.meta.url), 'utf8'));
const storage = 'https://zycmmtvubzyxduxqpuzl.supabase.co/storage/v1/object/public/soulbeast-game-assets/repository-media/v1/';
const cache = process.env.SOULBEAST_MEDIA_CACHE;
export const directMediaRoot = storage + 'direct/e5b24ec8115c3bebe1b3c33a298a71d47c91c782/';
export function mediaSize(path) {
 return media.objects[media.paths[path]][2];
}

async function fetchPack(id) {
 const verified = bytes => bytes.length===media.packs[id] && createHash('sha256').update(bytes).digest('hex')===id;
 const cached = cache && resolve(cache,id+'.bin');
 if(cached && existsSync(cached)){
  const bytes=readFileSync(cached);
  if(verified(bytes))return bytes;
 }
 for (let attempt = 1; ; attempt++) {
  try {
   const response = await fetch(storage+'packs/'+id+'.bin', {signal: AbortSignal.timeout(120000)});
   if (!response.ok) throw new Error('Storage HTTP '+response.status);
   const bytes = Buffer.from(await response.arrayBuffer());
   if (!verified(bytes))
    throw new Error('Storage pack verification failed '+id);
   if(cached){mkdirSync(cache,{recursive:true});writeFileSync(cached,bytes);}
   return bytes;
  } catch(error) {
   if (attempt === 3) throw error;
   await new Promise(resolve => setTimeout(resolve, attempt * 1000));
  }
 }
}

// The Pages artifact keeps the original paths for HTML, Canvas, audio, and cached clients.
export async function restoreMedia(paths, destination, getPack = fetchPack, missingOnly = false) {
 const groups = new Map();
 const base = resolve(destination);
 for (const path of paths) {
  const target = resolve(base, path);
  if (!target.startsWith(base+sep) || !/^(assets|tools|outputs)\//.test(path))
   throw new Error('Unexpected media path '+path);
  if (missingOnly && existsSync(target)) continue;
  const oid = media.paths[path];
  const [pack, start, length] = media.objects[oid];
  if (!groups.has(pack)) groups.set(pack, []);
  groups.get(pack).push({target, start, length, oid});
 }
 const jobs = groups.entries();
 async function worker() {
  for (const [pack, entries] of jobs) {
   const data = await getPack(pack);
   for (const {target, start, length, oid} of entries) {
    const bytes = data.subarray(start, start+length);
    const id = createHash('sha1').update('blob '+length+'\0').update(bytes).digest('hex');
    if (bytes.length !== length || id !== oid) throw new Error('Media verification failed '+target);
    mkdirSync(dirname(target), {recursive:true});
    if (missingOnly) {
     try { writeFileSync(target, bytes, {flag:'wx'}); }
     catch(error) { if(error.code!=='EEXIST') throw error; }
    } else writeFileSync(target, bytes);
   }
  }
 }
 await Promise.all(Array.from({length:4}, worker));
}

// Restore missing local assets without overwriting a developer's work.
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
 const directory=process.argv[2]==='--checkout'?root:process.argv[2];
 if (!directory) throw new Error('Supply an output directory or --checkout');
 if (resolve(directory)===resolve(root)) {
  const exclude=execFileSync('git',['rev-parse','--path-format=absolute','--git-path','info/exclude'],{cwd:root,encoding:'utf8'}).trim();
  const existing=new Set(existsSync(exclude)?readFileSync(exclude,'utf8').split(/\r?\n/):[]);
  const missing=Object.keys(media.paths).map(p=>'/'+p).filter(p=>!existing.has(p));
  if(missing.length){
   mkdirSync(dirname(exclude),{recursive:true});
   appendFileSync(exclude,'\n# Restored copies of Supabase media\n'+missing.join('\n')+'\n');
  }
 }
 await restoreMedia(Object.keys(media.paths), directory, fetchPack, true);
}
