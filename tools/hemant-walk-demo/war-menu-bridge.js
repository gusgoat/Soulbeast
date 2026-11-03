/* Inside the existing game bootstrap: original war UI, combat and rewards. */
if(screen==='countrywar'){
 window.CW_PREVIEW_MODE=true;window.CW_PHYSICAL_CONTEXT=window.walkWar.visit(params.get('visit'));
 lbPost=async packet=>{const result=await window.walkWarEngine.dispatch(S.P,packet);if(result.ok&&packet.action==='country_action'){const target=packet.target||packet.id;if(packet.kind==='defend'&&/-village-|-city-|-capital/.test(result.me?.location||''))questEmit('defend');if(packet.kind==='attack'&&String(target).includes('-village-')&&result.map?.locations?.some(n=>n.id===target&&n.owner===S.P.country))questEmit('captureVillage')}if(result.me?.country){S.P.country=result.me.country;save()}if(result.countryWarVersion){window.walkWar.update(result);parent.postMessage({type:'walk-war-updated'},location.origin)}return result};
 countryReset();COUNTRY_WAR.selected=params.get('target')||'';COUNTRY_WAR.data=null;
 countryCall('country_status').then(()=>{if(params.get('target'))COUNTRY_WAR.selected=params.get('target');render()});
}
