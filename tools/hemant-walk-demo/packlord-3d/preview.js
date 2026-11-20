(()=>{
 'use strict';
 const params=new URLSearchParams(location.search);
 if(params.get('packlord3d')!=='1')return;
 document.documentElement.dataset.packlordPreview='1';
 const rosterMode=params.get('roster')==='1';
 let selection={key:'packlord-female',cls:'packlord',gender:'female'};
 let status,model=null,activeEntry=selection,revision=0,released=false,catalog=null;
 let availability='กำลังโหลดโมเดล 3D…';
 function update(message){availability=message;if(status)status.textContent=message;}
 async function select(entry){
  selection=entry;
  const token=++revision;

  update('กำลังโหลดโมเดล 3D…');
  try{
   catalog??=await import('./actor-catalog.mjs?v=beasts-3d-six-20261121');
   const loaded=await catalog.loadActor(entry.key,{beast:entry.beast,primary:true});
   if(released||token!==revision){loaded.dispose();return;}
   model?.dispose();
   model=loaded;
   activeEntry=entry;
   update('ตัวละคร 3D');
  }catch(error){
   if(released||token!==revision)return;
   console.warn('3D walking preview:',error);
   if(rosterMode)update('โหลดตัวที่เลือกไม่ได้ ลองเลือกใหม่');
   else update('โหลดโมเดลไม่ได้ กำลังใช้ภาพตัวละคร');
  }
 }

 function mount(){
  const panel=document.createElement('section');
  panel.className='packlord-preview-panel';
  const name=document.createElement('strong');
  name.textContent=rosterMode?'ทดลองตัวละคร 3D':'จ้าวแห่งฝูงหญิง';
  status=document.createElement('span');
  status.setAttribute('role','status');
  update(availability);
  const hint=document.createElement('small');
  hint.textContent='เอียงจอยเบาเพื่อเดิน เอียงมากเพื่อวิ่ง';
  panel.append(name,status,hint);
  document.body.append(panel);
  if(rosterMode)mountRoster(panel,status);
 }
 async function mountRoster(panel,before){
  try{
   catalog??=await import('./actor-catalog.mjs?v=beasts-3d-six-20261121');
   const entries=catalog.roster(window.sealerSpriteCatalog);
   const picker=document.createElement('select');
   picker.setAttribute('aria-label','เลือกตัวละคร 3D');
   const people=document.createElement('optgroup'),beasts=document.createElement('optgroup');
   people.label='ผู้ผนึก';beasts.label='อสูร';
   for(const entry of entries){
    const option=new Option(entry.label,entry.key);
    (entry.beast?beasts:people).append(option);
   }
   picker.append(people,beasts);
   panel.insertBefore(picker,before);
   picker.value=entries.find(entry=>entry.key===params.get('model'))?.key||selection.key;
   const load=()=>{const entry=entries.find(entry=>entry.key===picker.value);if(entry)select(entry);};
   picker.onchange=load;
   load();
  }catch(error){console.warn('3D roster:',error);update('เปิดรายชื่อตัวละครไม่ได้');}
 }
 addEventListener('DOMContentLoaded',mount,{once:true});
 window.SoulbeastPacklordPreview={
  get avatar(){return selection.beast?null:selection;},
  load(){if(!rosterMode)return select(selection);},
  draw(ctx,x,y,width,dir,moving,running,time){
   if(!model)return false;
   return model.draw(ctx,x,y,activeEntry.beast?width*1.3:width,dir,moving,running,time);
  },
  get motion(){return model?.motion||'';},
  get angle(){return model?.angle;},
  release(){released=true;revision++;model?.dispose();model=null;}
 };
})();
