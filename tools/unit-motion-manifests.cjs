// Load authored batches only. The full production roster also contains an actors
// array, but pending roster entries must never become playable preview actors.
const fs=require('node:fs'),path=require('node:path');
module.exports=function motionManifests(){
 const root=path.resolve(__dirname,'../content');
 return fs.readdirSync(root).filter(n=>/^unit-motion-(?:batch\d+|dragon|demonlord)\.json$/.test(n)).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true})).map(n=>({file:'content/'+n,...JSON.parse(fs.readFileSync(path.join(root,n),'utf8'))}));
};
