const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),port=Number(process.env.PORT||8792);
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.glb':'model/gltf-binary','.mp3':'audio/mpeg','.woff2':'font/woff2'};
http.createServer((req,res)=>{
 try{
  const u=new URL(req.url,'http://localhost');if(u.pathname==='/'){res.writeHead(302,{Location:'/Soulbeast/tools/hemant-walk-demo/regions-preview.html'});return res.end();}
  if(!u.pathname.startsWith('/Soulbeast/')){res.writeHead(404);return res.end();}
  let file=path.resolve(root,decodeURIComponent(u.pathname.slice(11)));
  if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
  if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');
  if(!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);return res.end();}
  res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache'});fs.createReadStream(file).pipe(res);
 }catch{res.writeHead(400);res.end();}
}).listen(port,'127.0.0.1',()=>console.log('Preview: http://127.0.0.1:'+port+'/Soulbeast/tools/hemant-walk-demo/regions-preview.html'));
