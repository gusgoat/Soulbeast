export function createRankingStore(accountUrl,publishableKey,rankKey,fetcher=fetch){
 const rpcRoot=new URL('/rest/v1/rpc/',accountUrl);
 async function rpc(name,args){
  const response=await fetcher(new URL(name,rpcRoot),{
   method:'POST',headers:{apikey:publishableKey,'Content-Type':'application/json'},
   body:JSON.stringify(args),signal:AbortSignal.timeout(8000),
  });
  if(!response.ok)throw Error('Colosseum ranking request failed ('+response.status+')');
  return await response.json();
 }
 return {
  enabled:Boolean(rankKey),
  top:()=>rpc('sb_colosseum_leaderboard',{p_limit:100}),
  rating:async code=>(await rpc('sb_colosseum_rating',{p_code:code}))??0,
  status:code=>rpc('sb_colosseum_rank_status',{p_code:code,p_secret:rankKey}),
  commit:(match,results)=>rpc('sb_colosseum_apply_ranked',{p_match:match,p_results:results,p_secret:rankKey}),
 };
}
