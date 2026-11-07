const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),port=Number(process.env.ISLAND_PREVIEW_PORT)||8770;
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8',
 '.css':'text/css; charset=utf-8','.json':'application/json','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml',
 '.jpg':'image/jpeg','.mp3':'audio/mpeg','.ogg':'audio/ogg','.mp4':'video/mp4'};
http.createServer((req,res)=>{
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(405).end();return;}
 let url;
 try{url=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400).end();return;}
 if(url==='/'){res.writeHead(302,{Location:'/Soulbeast/tools/island-demo/preview.html'}).end();return;}
 if(!url.startsWith('/Soulbeast/')){res.writeHead(404).end();return;}
 const name=path.resolve(root,url.slice('/Soulbeast/'.length));
 if(!name.startsWith(root+path.sep)||path.relative(root,name).split(path.sep).some(p=>p.startsWith('.'))){res.writeHead(403).end();return;}
 fs.stat(name,(error,stat)=>{
  if(error||!stat.isFile()){res.writeHead(404).end();return;}
  res.writeHead(200,{'Content-Type':mime[path.extname(name)]||'application/octet-stream','Content-Length':stat.size,'Cache-Control':'no-store'});
  if(req.method==='HEAD')res.end();else fs.createReadStream(name).pipe(res);
 });
}).listen(port,'127.0.0.1',()=>console.log('Island preview · http://127.0.0.1:'+port+'/'));
