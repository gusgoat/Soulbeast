const fs=require('fs'),b=require('./client-build.cjs').build(null,{write:false});
const guard=`<script>
const introPreviewStore=window.localStorage,introPreviewKey='qa_sealbeast_web_intro_v1';
if(new URLSearchParams(location.search).get('reset')==='1')introPreviewStore.removeItem(introPreviewKey);
Object.defineProperty(window,'localStorage',{value:{getItem:k=>k==='sealbeast_web_intro_v1'?introPreviewStore.getItem(introPreviewKey):null,setItem:(k,v)=>{if(k==='sealbeast_web_intro_v1')introPreviewStore.setItem(introPreviewKey,v);},removeItem:k=>{if(k==='sealbeast_web_intro_v1')introPreviewStore.removeItem(introPreviewKey);}}});window.fetch=()=>Promise.reject(Error('Isolated intro preview: accounts and saves disabled'));
</script>`;
const setup=`<script>
const introQa=document.createElement('aside');introQa.className='intro-qa';introQa.innerHTML='<small>ทดสอบอินโทร · แยกจากเซฟจริง</small> <a href="?reset=1">ครั้งแรก</a> · <a href="?return=1">เข้าซ้ำ</a> · <button type="button" id="introQaReplay">ดูซ้ำ</button>';document.body.appendChild(introQa);document.getElementById('introQaReplay').addEventListener('click',()=>WEB_INTRO.open(()=>render(),true));
if(new URLSearchParams(location.search).get('fail')==='1'&&WEB_INTRO.video){WEB_INTRO.video.src='assets/video/qa-missing.mp4';WEB_INTRO.video.load();}
</script>`;
fs.writeFileSync('intro-preview.html',b.files['staging-index.html'].replace('<head>','<head>'+guard+'<style>.intro-qa{position:fixed;top:76px;left:12px;right:12px;z-index:12000;background:#162636e8;color:#fff;padding:7px;font-size:12px}.intro-qa a{color:#ffda81}.intro-qa button{font:inherit}</style>').replace('</body>',setup+'</body>'));
console.log('Built isolated persistent first-visit/revisit/video-error preview');
