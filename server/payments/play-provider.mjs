// Server-only Google service account. Never include this module or credential in the app.
export function googlePlayProvider({credentials,packageName,fetcher=fetch,subtle=crypto.subtle,now=()=>Date.now()}){
 let cached=null;
 const b64=bytes=>btoa(String.fromCharCode(...new Uint8Array(bytes))).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');
 const json64=value=>b64(new TextEncoder().encode(JSON.stringify(value)));
 async function accessToken(){
  if(cached&&cached.until>now()+60000)return cached.token;
  if(credentials?.type!=='service_account'||!credentials.client_email||!credentials.private_key)throw Error('play_credentials_missing');
  const issued=Math.floor(now()/1000),header=json64({alg:'RS256',typ:'JWT'}),claims=json64({iss:credentials.client_email,scope:'https://www.googleapis.com/auth/androidpublisher',aud:'https://oauth2.googleapis.com/token',iat:issued,exp:issued+3600});
  const raw=Uint8Array.from(atob(credentials.private_key.replace(/-----[^-]+-----|\s/g,'')),c=>c.charCodeAt(0));
  const key=await subtle.importKey('pkcs8',raw,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['sign']);
  const assertion=header+'.'+claims+'.'+b64(await subtle.sign('RSASSA-PKCS1-v1_5',key,new TextEncoder().encode(header+'.'+claims)));
  const r=await fetcher('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion}),signal:AbortSignal.timeout(20000)});
  if(!r.ok)throw Error('play_authorization_failed');const v=await r.json();if(!v.access_token||!Number.isFinite(v.expires_in))throw Error('play_authorization_failed');cached={token:v.access_token,until:now()+Math.min(v.expires_in,3600)*1000};return cached.token;
 }
 const endpoint=(product,token)=>'https://androidpublisher.googleapis.com/androidpublisher/v3/applications/'+[packageName,'purchases','products',product,'tokens',token].map(encodeURIComponent).join('/');
 return {
  async retrieve(product,token){const r=await fetcher(endpoint(product,token),{headers:{Authorization:'Bearer '+await accessToken()},signal:AbortSignal.timeout(20000)});if(!r.ok)throw Error('google_play_verification_failed');return r.json();},
  async consume(product,token){const r=await fetcher(endpoint(product,token)+':consume',{method:'POST',headers:{Authorization:'Bearer '+await accessToken()},signal:AbortSignal.timeout(20000)});if(!r.ok)throw Error('google_play_consume_failed');}
 };
}
