const art='https://zycmmtvubzyxduxqpuzl.supabase.co/storage/v1/object/public/soulbeast-game-assets/battle-ui-v1/';
const scenes=[
 [0,'You have fallen...','c3107c36cd1dad09b22dc01f16aeab9d1159a9a44ecd1926d3b0ab54ab6686f2'],
 [1.33,'But fate has not abandoned you.','3000431590c8464ab100cefc76a173a64dc8006cd2273e27556222aa4dbddd04'],
 [2.99,'A group of villagers found your unconscious body and rushed you to the nearest healer.','8e6ca12a4fc2f904bc8f35ddf98e82ad0e91d5c4120808e5571d0e0e3cff0678'],
 [7.74,'Your journey is not over... Not yet.','9328abdbf4fbb945333264d6b5221a17d2fa31c83a775fbf0b9b2cb58951ef0c']
];
let pictures;
export function prepareFallenScenes(){
 if(!pictures)pictures=scenes.map(([, ,hash])=>{
  const image=new Image();image.alt='';image.decoding='async';image.fetchPriority='low';
  image.src=art+hash+'.webp';return image;
 });
 return pictures;
}
export function fallenSequence(){
 let dialog,caption,frame,index=-1;
 function update(seconds){
  const current=scenes.findLastIndex(([start])=>seconds>=start);
  if(current===index||current<0)return;
  if(!dialog){
   dialog=document.createElement('dialog');
   dialog.setAttribute('aria-label','You have fallen');dialog.lang='en';
   dialog.style.cssText='position:fixed;inset:0;margin:auto;width:100%;height:100%;max-width:none;max-height:none;box-sizing:border-box;border:0;padding:0;background:radial-gradient(ellipse at center,#19202a,#090c12 75%);color:#fff1d5;overflow:auto';
   const layout=document.createElement('div');
   layout.style.cssText='min-height:100%;display:grid;align-content:center;justify-items:center;box-sizing:border-box;padding:12px 0';
   frame=document.createElement('div');
   frame.style.cssText='display:grid;width:min(100%,84vh,860px);aspect-ratio:3/2;overflow:hidden;box-shadow:0 0 0 1px #9b7953,0 12px 50px #0009';
   for(const picture of prepareFallenScenes()){
    picture.style.cssText='grid-area:1/1;width:100%;height:100%;object-fit:contain;visibility:hidden';
    frame.append(picture);
   }
   caption=document.createElement('p');caption.setAttribute('aria-live','polite');
   caption.style.cssText='margin:0;box-sizing:border-box;padding:clamp(14px,3vh,32px) 20px 4px;width:min(100%,760px);min-height:5.5em;text-align:center;text-wrap:balance;font:500 clamp(18px,3.8vw,28px)/1.4 Georgia,serif;color:#ffedcd';
   layout.append(frame,caption);dialog.append(layout);document.body.append(dialog);dialog.showModal();
   dialog.addEventListener('cancel',event=>event.preventDefault());
  }
  if(index>=0)frame.children[index].style.visibility='hidden';
  frame.children[current].style.visibility='visible';caption.textContent=scenes[current][1];index=current;
 }
 return {update,close(){if(dialog){dialog.close();dialog.remove();}}};
}
