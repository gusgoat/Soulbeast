(()=>{
 'use strict';
 const params=new URLSearchParams(location.search);
 if(params.get('packlord3d')!=='1')return;
 document.documentElement.dataset.packlordPreview='1';
 const avatar={cls:'packlord',gender:'female'};
 let enabled=true,status,control,model=null,released=false,availability='กำลังโหลดโมเดล 3D…';
 function update(message){availability=message;if(status)status.textContent=message;}
 function mount(){
  const panel=document.createElement('section');
  panel.className='packlord-preview-panel';
  const name=document.createElement('strong');
  name.textContent='จ้าวแห่งฝูงหญิง';
  status=document.createElement('span');
  status.setAttribute('role','status');
  update(availability);
  control=document.createElement('button');
  control.type='button';
  control.textContent='ดูภาพเดิม';
  control.onclick=()=>{
   enabled=!enabled;
   control.textContent=enabled?'ดูภาพเดิม':'ดูโมเดล 3D';
   update(enabled?'ตัวละคร 3D':'ภาพตัวละครเดิม');
  };
  const hint=document.createElement('small');
  hint.textContent='เอียงจอยเบาเพื่อเดิน เอียงมากเพื่อวิ่ง';
  panel.append(name,status,control,hint);
  document.body.append(panel);
 }
 addEventListener('DOMContentLoaded',mount,{once:true});
 window.SoulbeastPacklordPreview={
  avatar,
  async load(){
   try{
    const {createAvatar}=await import('./avatar.mjs?v=1');
    const loaded=await createAvatar();
    if(released){loaded.dispose();return;}
    model=loaded;
    update(enabled?'ตัวละคร 3D':'ภาพตัวละครเดิม');
   }catch(error){
    console.warn('Packlord 3D preview:',error);
    if(control)control.disabled=true;
    update('โหลด 3D ไม่ได้ กำลังใช้ภาพเดิม');
   }
  },
  draw(ctx,x,y,width,dir,moving,running,time){
   if(!enabled||!model?.draw(ctx,x,y,width,dir,moving,running,time))return false;
   return true;
  },
  get enabled(){return enabled},
  get motion(){return model?.motion||''},
  get angle(){return model?.angle},
  release(){released=true;model?.dispose();model=null;}
 };
})();
