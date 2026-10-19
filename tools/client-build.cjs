'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),vm=require('vm');
const repo=path.resolve(__dirname,'..');
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
function build(output,{readFile=file=>fs.readFileSync(file,'utf8'),write=true}={}){
 const read=rel=>readFile(path.join(repo,rel));
 const config=JSON.parse(read('client/build.json'));
 if(config.version!==1||!Array.isArray(config.contentGroups)||new Set(config.contentGroups).size!==config.contentGroups.length||config.contentGroups.some(g=>!/^[a-z]+$/.test(g)))throw Error('Invalid content group configuration');
 const shell=read('client/shell.html'),styles=read('client/styles.css');
 for(const marker of ['<!-- SOULBEAST_STYLES -->','<!-- SOULBEAST_SCRIPTS -->'])if(shell.split(marker).length!==2)throw Error('Expected exactly one '+marker);
 const registry="'use strict';\nconst SoulbeastContent=Object.create(null);\n";
 const packs=config.contentGroups.map(group=>({group,code:read('content/'+group+'.js')}));
 // Factories register without running: their evaluation stays at the original runtime call sites.
 const context=vm.createContext(Object.create(null));vm.runInContext(registry,context);
 for(const pack of packs)new vm.Script(pack.code).runInContext(context,{timeout:3000});
 const keys=vm.runInContext('Object.keys(SoulbeastContent)',context),expected=Object.keys(JSON.parse(read('content/extraction-map.json')).tables);
 if(keys.length!==expected.length||expected.some(k=>!keys.includes(k))||!vm.runInContext('Object.values(SoulbeastContent).every(x=>typeof x==="function")',context))throw Error('Content factory coverage mismatch');
 const files={},result={},emit=(kind,body)=>{const name=`game-${kind}.${sha(body).slice(0,16)}.${kind==='styles'?'css':'js'}`;if(files[name]&&files[name]!==body)throw Error('Asset hash collision');files[name]=body;return name;};
 const css=emit('styles',styles),data=[emit('data-registry',registry),...packs.map(p=>emit('data-'+p.group,p.code))];
 for(const [name,environment]of [['live','live'],['staging','test']]){
 const app=require('./runtime-build/modules.cjs').compile({environment,readFile}),assets=[css,...data,emit('app',app)];
 result[name]=assets;
 files[name+'-index.html']=shell.replace('<!-- SOULBEAST_STYLES -->',`<link rel="stylesheet" href="./${css}">`).replace('<!-- SOULBEAST_SCRIPTS -->',assets.slice(1).map(f=>`<script src="./${f}"></script>`).join('\n'));
 }
 files['client-files.json']=JSON.stringify(result,null,2);
 if(write){if(!output)throw Error('Output directory required');fs.mkdirSync(output,{recursive:true});for(const [file,body]of Object.entries(files))fs.writeFileSync(path.join(output,file),body);}
 return {files,assets:result};
}
module.exports={build};
if(require.main===module){const args=process.argv.slice(2);if(args.length!==2||args[0]!=='--out')throw Error('Usage: node tools/client-build.cjs --out OUTPUT_DIRECTORY');const result=build(path.resolve(args[1]));console.log('Built canonical live/test client:',Object.keys(result.files).length,'files');}
