const fs=require('fs'),path=require('path');
// Resolve only generated local files. Tests exercise exactly the shipped source.
module.exports=function(file){const dir=path.dirname(path.resolve(file)),read=name=>{if(!/^\.\/game-(?:app|styles|data-[a-z-]+)\.[a-f0-9]{16}\.(?:js|css)$/.test(name))throw Error('Unexpected game asset '+name);return fs.readFileSync(path.join(dir,name),'utf8');};
 return fs.readFileSync(file,'utf8').replace(/<link rel="stylesheet" href="([^"]+)">/g,(tag,name)=>name.startsWith('./game-styles.')?'<style>'+read(name)+'</style>':tag).replace(/(?:<script src="\.\/game-(?:app|data-[a-z-]+)\.[a-f0-9]{16}\.js"><\/script>\s*)+/g,block=>'<script>'+[...block.matchAll(/src="([^"]+)"/g)].map(m=>read(m[1])).join('\n')+'</script>');
};
