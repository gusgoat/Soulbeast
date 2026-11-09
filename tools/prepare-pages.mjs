import {execFileSync} from 'node:child_process';
import {copyFileSync, mkdirSync, readFileSync, statSync, writeFileSync} from 'node:fs';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url));
const destination=process.argv[2];
if(!destination)throw new Error('Usage: node tools/prepare-pages.mjs <new output directory>');
const output=resolve(destination);
const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8'});
const revision=git('rev-parse','HEAD').trim();
const files=new Set(git('ls-files','--cached','-z').split('\0').filter(Boolean));

// Editing inputs. The game loads the processed tiles, props and sprites.
const sourceArt=new Set([
 'assets/dungeon-mine-v1/floor-source.png.webp',
 'assets/dungeon-mine-v1/gates-source.png.webp',
 'assets/dungeon-mine-v1/props-padded-source.png.webp',
 'assets/dungeon-mine-v1/props-source.png.webp',
 'assets/dungeon-mine-v1/water-source.png.webp',
 'assets/town-walk-preview/coupon-building-source-v1.png.webp',
 'assets/town-walk-preview/gacha-building-source-v1.png.webp',
 'assets/town-walk-preview/library-building-source-v1.png.webp',
 'assets/town-walk-preview/trees-raw-v1.png.webp',
 'assets/town-walk-preview/wall-h-raw-v1.png.webp',
 'assets/town-walk-preview/wall-v-raw-v1.png.webp',
]);
const catalog='tools/rare-beast-walk-demo/catalog.js';
const originals=new Set();
const publishedCatalog=readFileSync(resolve(root,catalog),'utf8').replace(
 /("png":\s*")\/Soulbeast\/(assets\/rare-beast-walk-20261103\/[a-z0-9_]+-walk-v\d+\.png)(")/g,
 (entry,start,path,end)=>{
  if(!files.has(path)||!files.has(path.replace(/\.png$/,'.webp')))return entry;
  originals.add(path);
  return start+'https://raw.githubusercontent.com/gusgoat/Soulbeast/'+revision+'/'+path+end;
 },
);

let bytes=0, count=0, omittedBytes=0;
const staged=[];
for(const file of files){
 if(file.startsWith('.github/')||file==='tools/prepare-pages.mjs')continue;
 const source=resolve(root,file);
 const size=statSync(source).size;
 if(sourceArt.has(file)||originals.has(file)){omittedBytes+=size;continue;}
 bytes+=file===catalog?Buffer.byteLength(publishedCatalog):size;
 staged.push({file,source});
 count++;
}
if(bytes>=1_000_000_000)throw new Error(`Pages would publish ${bytes} bytes. The site must be smaller than 1 GB.`);

mkdirSync(output);
for(const {file,source} of staged){
 const target=resolve(output,file);
 mkdirSync(dirname(target),{recursive:true});
 if(file===catalog)writeFileSync(target,publishedCatalog);
 else copyFileSync(source,target);
}
console.log(`Pages site: ${bytes} bytes in ${count} files. Excluded ${omittedBytes} bytes of source art.`);
