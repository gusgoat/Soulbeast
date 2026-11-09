// Verify ownership and load the combat profile through the existing accounts service.
export function createAccountLoader(url,key,fetcher=fetch){
 return async (token,code)=>{
  if(typeof token!=='string'||token.length>4096||typeof code!=='string'||!code||code.length>80)throw Error('กรุณาเข้าสู่ระบบและเลือกตัวละคร');
  const response=await fetcher(url,{
   method:'POST',
   headers:{apikey:key,Authorization:'Bearer '+token,'Content-Type':'application/json','x-soulbeast-environment':'live'},
   body:JSON.stringify({action:'load',code}),
   signal:AbortSignal.timeout(10_000),
  });
  const result=await response.json();
  if(!response.ok||!result.ok)throw Error('ตรวจสอบตัวละครกับระบบบัญชีไม่สำเร็จ');
  const character=JSON.parse(result.data).P;
  if(character?.code!==code)throw Error('กรุณาเลือกตัวละครจากบัญชีของคุณ');
  return character;
 };
}
