import {PUBLISHED_FOREST_MEDIA} from './published-scene-assets.js?v=heaven-waterfall-release-1';
const root = "https://zycmmtvubzyxduxqpuzl.supabase.co/storage/v1/object/public/soulbeast-game-assets/";

export function forestAssetURL(path) {
  return root + "forest-y-v1--" + path.replaceAll("/", "--");
}

export function forestSceneAssetURL(folder,id){
  const local=['localhost','127.0.0.1','[::1]'].includes(globalThis.location?.hostname);
  if(local&&!new URLSearchParams(globalThis.location?.search).has('storage'))return new URL('./generated/'+folder+'/'+id+'.png',import.meta.url).href;
  const object=PUBLISHED_FOREST_MEDIA[folder+'/'+id];
  if(!object)throw Error('Unpublished forest media: '+folder+'/'+id);
  return root+object;
}
