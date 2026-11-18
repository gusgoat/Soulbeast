const root = "https://zycmmtvubzyxduxqpuzl.supabase.co/storage/v1/object/public/soulbeast-game-assets/";

export function forestAssetURL(path) {
  return root + "forest-y-v1--" + path.replaceAll("/", "--");
}
