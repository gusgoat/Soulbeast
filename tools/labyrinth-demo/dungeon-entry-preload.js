// These public files also serve the battle renderer. Warm only the current floor.
(()=>{
 const paths={
 "1": [
  "85330622ca7f65adf942ceba8f4e72ab79e094397af837633a12334b001748fe/assets/roster/wendigo-idle.webp",
  "98890be227e5f4c79346fd2597402bca2699309b1beca7526a4d532ff8fa4f7c/assets/roster/wendigo-windup.webp",
  "3c3607ff7ebfdf189aed497d0265453337711d8a25d08b1b351188c302aaaa6b/assets/roster/wendigo-ranged.webp",
  "fabf521f3f59f6fcbf74d6ce3c49f9fe4d659ae2fdfa8d3cd433b62bf8e976c8/assets/roster/wendigo-melee.webp",
  "bb88276bc699361abcbd7335d0f337e975723b29c90b32d072a487f5a2d93517/assets/roster/wendigo-hit.webp",
  "d28bc96e533b344b25bfcfeb05af4af444a11d865aa326579dce7d1097dd2e6f/assets/roster/wendigo-down.webp",
  "212ba1b793c34f8377eda89855407865f5b17d86f9aced2b81193d8d6f6d14cc/assets/roster/demon-knight-idle.webp",
  "3f98dce0efeba5233cf0bfd11b457104e807a30884beb1a176d11e1fc31f9b64/assets/roster/demon-knight-windup.webp",
  "224b6fc9d786a12db3f8a84631021709ba3b1f556e43e21f054d77adaeb8f280/assets/roster/demon-knight-ranged.webp",
  "3ff5070fe24188649717ddf5a4202a994268bf3539ebd7c7d1e3ba91ddf24e80/assets/roster/demon-knight-melee.webp",
  "977c627b800e08edd06faaa467f0b6100804404306c8a5c2914db9bc7a2195c3/assets/roster/demon-knight-hit.webp",
  "d55289e615ebf99128a189eb050dfa34b377e78864236cec34431a1f003f72fa/assets/roster/demon-knight-down.webp"
 ],
 "2": [
  "5e5f14ba9eeb2ca4a76d746319237c17062aa31f577e893a777d2faeab771aaf/assets/roster/cerberus-idle.webp",
  "3636a4c00beabd961f29c90726248e2646dd696fab5817dcc731212f5c40dec0/assets/roster/cerberus-windup.webp",
  "5d14d19dcfab8a2a5f7dc8d028ab6eecdab0d2ee3ba0d740db287b83a0e47416/assets/roster/cerberus-ranged.webp",
  "ba98ada6c7cb7f822d26f275fe9631ca6e74581c3c462d815a91e9fccdc7a6d0/assets/roster/cerberus-melee.webp",
  "cd5fb37ddea5b1279ff78e34896325072b6ab3ec2c7ecf698c15bd1014fca0c8/assets/roster/cerberus-hit.webp",
  "c3b348ea4a3d158c881e3761b2e43dd1b94f826784c0127479a968ad4adfac8c/assets/roster/cerberus-down.webp",
  "1f50bfdda46214d5ab4a0672b5cfd86484eacba2d584003463634be66888ae1f/assets/roster/manticore-idle.webp",
  "e5087ef7b25759d045915ef22e6efb7e5ae6569a823403bddb9f551857d9d6f5/assets/roster/manticore-windup.webp",
  "7eef7afda2a252bbf4b4d3b16d0d4d2cfd777bd331849279d86adebaa50da12e/assets/roster/manticore-ranged.webp",
  "e52f1c7d4eda0a46cfcda3a587582446d09340b6edfa7f62ecd117ff60aa15d5/assets/roster/manticore-melee.webp",
  "c9955e2bf6b722c4ec223578d47b855ea663d73794ad6db232f31b4b7b73f746/assets/roster/manticore-hit.webp",
  "68fa98b3169d0def1fe0701f63f832d4d4cae1d050deded16e8849ea5a09227a/assets/roster/manticore-down.webp"
 ],
 "3": [
  "f9e26b5fc08af9800e07acadfd5bdc6525ca59a38e467aa76ca0ef6dbaae6191/assets/roster/dragon-idle.webp",
  "4b9771cec52922d2ae3b8137007aae12f8fc54acc51c37b965cc1309a78a38ef/assets/roster/dragon-windup.webp",
  "4ede372356eea921f68d098fa3e12c8a7f4b45bfb5998370008da6270bdf9e33/assets/roster/dragon-ranged.webp",
  "d823ed31ec7cc6122a502e1e11a24e8995695444e3d9e08fad4b562da9c46ee0/assets/roster/dragon-melee.webp",
  "fd5f44aaedb3b5d0dd8c62366e5a9ad6abad6f2d8b71b46e3d05e4569ef15b25/assets/roster/dragon-hit.webp",
  "85f2a3184c776d4ce1877084b00b91aff79bac43872a42422e872bdbb76c0136/assets/roster/dragon-down.webp",
  "11c3ebd0ea8659728c2e168a7ec321720fa20b3f8b8e2fffcb7e98b6ee97386b/assets/roster/storm-wyvern-idle.webp",
  "2de31a996bc281a6ac3d743aba979156b8e02bab991ac573d1b1c9c095a7b42d/assets/roster/storm-wyvern-windup.webp",
  "614cf440d85982b6520cd2fbc1cf5c035b6a90e68ff7d1f369f6ee707575336b/assets/roster/storm-wyvern-ranged.webp",
  "5ea885449f5790b4f3950c8c64f98eac723c494f7465e9064e8fe7e42d710dcf/assets/roster/storm-wyvern-melee.webp",
  "54116bbe472fb0f740eef09d66a0d8849eda2afba581421dcfb74fb050db58d3/assets/roster/storm-wyvern-hit.webp",
  "86b48bb4d0c7666f6a1f54d255b4e2621b1894850c2692c22ac1da6c43ce9f32/assets/roster/storm-wyvern-down.webp"
 ],
 "4": [
  "f28d3122a620266e2ad3bd0919d4e4b72a161c43d10adebb65e3438df21f9b90/assets/roster/frost-lich-idle.webp",
  "ed3ca703f8ed18326828cb8930d8b7cf20f3022c23b6383576e459a2c7f33b07/assets/roster/frost-lich-windup.webp",
  "60f56e25f5b28d3185334c78a3c0bcbfad98b0552572bb680bd547fe8e2c867e/assets/roster/frost-lich-ranged.webp",
  "e2226b414363395ffaeaac286773a76b7e48e31bd60670b3e35ba135ca6a9175/assets/roster/frost-lich-melee.webp",
  "824abb97db0e86e4a1443572309424599f20684929ed52243b5434d2de9a3423/assets/roster/frost-lich-hit.webp",
  "dfa1c9232ceaf37c6084f37142c5f9b84e1ff38824098f795e1aa3c1e538940b/assets/roster/frost-lich-down.webp",
  "0e8fa123f3445027cd1d3f8259ad9c5a64867001be4335b8a322e2358ac727b4/assets/roster/yeti-mountain-idle.webp",
  "d50e1083481a0cbf49212fcd78adf00835a2a71952404a3325215e64e0df9336/assets/roster/yeti-mountain-windup.webp",
  "821771c6bb69062976a8e469e5d9be1b1babff3b7d6bacca549a9590ca984f19/assets/roster/yeti-mountain-ranged.webp",
  "b8f1519b38405fa53c3933d792650669af32681b40ea0a60420264e5f0a3141c/assets/roster/yeti-mountain-melee.webp",
  "7c1bd1d2ea752e95e497020c817862dfede6fee59cd54e92187c3734532f8dba/assets/roster/yeti-mountain-hit.webp",
  "19008ff9570548f4ffeb7362aaf683ca50501bce20f173cc1c46a3f6b3a6c645/assets/roster/yeti-mountain-down.webp"
 ],
 "5": [
  "d3fd4cfa62c672ea8b4d832d8383ae18bf5766133d619508a7502c682ae41271/assets/roster/vampire-queen-idle.webp",
  "e009ad5e71f74d2c976312ede1e8eaae7bbeb50fd8a0147b9081f8b839d50d96/assets/roster/vampire-queen-windup.webp",
  "4a9459dbc00538f913929e1755cc854151f49d62e920a8e0f436b34a43bf562e/assets/roster/vampire-queen-ranged.webp",
  "cead33c3a04385a2851107c537fc0304e1e8e4f2d9ea84541fa09af5b617a1ea/assets/roster/vampire-queen-melee.webp",
  "bcce75834544e538f0ae46f9f3eac8118f2836d5edbbd4c27fe9f1f126db2e75/assets/roster/vampire-queen-hit.webp",
  "d3ce82699f701e226f2d9fc7f9d0e5cf5ed02829dad93a4627e732d57478748a/assets/roster/vampire-queen-down.webp",
  "dbaa3ebe7d20e791790818eb021f65b2ba0611074dce0c48df7de8cc246bbbeb/assets/roster/gargoyle-demon-idle.webp",
  "c9fe555e94c138ef502a84a4ca64f8cc12c37fed06f07b2f03aca3b267a04cf8/assets/roster/gargoyle-demon-windup.webp",
  "df7adfcf4132a6d7f5b787d36d10f014004eb34771b408bb63ed308074cecb3c/assets/roster/gargoyle-demon-ranged.webp",
  "772dd49973649d929d6b13ef3e001f5d265a1448be8fc2ab36a90d83ed211ccb/assets/roster/gargoyle-demon-melee.webp",
  "6d0321aa43e4acce5b50063c415b95041464b0147e71a0088126578fb42a0e91/assets/roster/gargoyle-demon-hit.webp",
  "4ce565ae8c790d57b8ef690975cebb2c01328907d9fef4b0c00406d688a5deab/assets/roster/gargoyle-demon-down.webp"
 ],
 "6": [
  "9cc74ed8fa029813327d1b0e3caf320ae29f523c128b8c83460da081bf8842ed/assets/roster/tricephalos-idle.webp",
  "baeddca75bd3edfc830b869d578d265d56f4fea5ae2c701a891c059ea753083b/assets/roster/tricephalos-windup.webp",
  "598fc8834e136a5693f7231788ee417bf8ff62fd5beee1b76902455da9a89c28/assets/roster/tricephalos-ranged.webp",
  "cca5600b356175a06c1061b014a3e9ea0bcb5fe4575f0a631831b316587b6b09/assets/roster/tricephalos-melee.webp",
  "3ba3f863aa59dd683d148c71f30a00115c1e4b2241bb6d014d45a3508d03f969/assets/roster/tricephalos-hit.webp",
  "cf7d50e33c86b5331073353ac16efa9bbb1ef1bce7a774d206f30e8b3de739ba/assets/roster/tricephalos-down.webp",
  "ccfdad95e18eddd360370cfb856f83488b96bf3babaa8f88fb196761c1f63ebe/assets/roster/phoenix-idle.webp",
  "49fb51169bd7204d88109e7c9a006a9a1a9236072a4b98a7d0ca133634c5640c/assets/roster/phoenix-windup.webp",
  "28f17e72bdb21e4e4cc4b987946c21f3d2d77e9d608176e134447ddd54eebd71/assets/roster/phoenix-ranged.webp",
  "cb861ac4915ad42f2dcc40561e1479a6b8a9cc92f127c5f1a359790bf58399da/assets/roster/phoenix-melee.webp",
  "9631d897b58812edf26e5607ba4f07dfad0752d12e212ff2649d4e1fa3b228ad/assets/roster/phoenix-hit.webp",
  "3ace8332fa18f2df98db5a7dbeba06dc9c86b03598987d8fb9d1b73526530735/assets/roster/phoenix-down.webp"
 ],
 "7": [
  "708814f4c9fca87d53581b846025e62839393a578768f28cde66f91c1b613f8b/assets/roster/solar-pentadrake-idle.webp",
  "2b6c75d8fcad8cb96376ebd24fca75a5ea7f057bb20202f1809c8076dac53fde/assets/roster/solar-pentadrake-windup.webp",
  "384b1f20b3a1ecfdb5cd373a60ec6434d532edf7a57f636f6ec0506c4bcd076a/assets/roster/solar-pentadrake-ranged.webp",
  "7dbf8f6fbe019dc8abf7057971a6e6c9144cdac2044b6ec6e301b95c885b9ec4/assets/roster/solar-pentadrake-melee.webp",
  "586dc3fbf886981198a2b97264074809dc30aed5464c447266bf513656684f58/assets/roster/solar-pentadrake-hit.webp",
  "b478d1aa8419a06ef66cb2fa09ef89a0c3198863f9f86fd56d80c9271ddd7feb/assets/roster/solar-pentadrake-down.webp",
  "aa4df9b248cf470936b36e4e54b84e5d206e02f3bdc6a09311f171ad4ec91783/assets/roster/ember-jackal-idle.webp",
  "b0a7915e430ca84b602b180fa8f1dacebd532d30e1a628ca1c2f557f912ba1e8/assets/roster/ember-jackal-windup.webp",
  "7c18de8e849efc2963206913d03a82b0f5c017aff08f502cfb613bbe57b2589b/assets/roster/ember-jackal-ranged.webp",
  "08088a94d5e9e6936f1df1679ee7c389846c1ccbbc47fabed2f4d81e09a37d9b/assets/roster/ember-jackal-melee.webp",
  "3486afccf4a978ab37a5d9f71eafef7cfd454ed9aabdc5d99563b0ca060f8f91/assets/roster/ember-jackal-hit.webp",
  "b0aa0222cfec598cbabbd868a0bdde0357b7dc5ee1eeacb3bba51ffd70d7a25d/assets/roster/ember-jackal-down.webp"
 ]
},base="https://zycmmtvubzyxduxqpuzl.supabase.co/storage/v1/object/public/soulbeast-game-assets/battle-ui-v1/";
 let current=0;
 function warm(floor,environment){
  if(!(environment==='live'||(environment==='test'&&sessionStorage.getItem('soulbeast-new-battle-test')!=='off'))||!paths[floor]||current===floor)return;
  current=floor;
  const start=async()=>{
   if(navigator.connection?.saveData||/2g/.test(navigator.connection?.effectiveType||''))return;
   const assets=[...paths[floor]];
   async function worker(){
    while(current===floor&&assets.length){
     const image=new Image();image.crossOrigin='anonymous';image.fetchPriority='low';
     image.src=base+assets.shift();
     try{await image.decode();}catch{/* The real encounter retries when needed. */}
    }
   }
   await Promise.all([worker(),worker()]);
  };
  if(window.requestIdleCallback)requestIdleCallback(start,{timeout:3500});else setTimeout(start,1000);
 }
 window.prewarmDungeonBoss=warm;
 const query=new URLSearchParams(location.search);
 if(!query.has('room')){
  let session;try{session=JSON.parse(sessionStorage.getItem('soulbeast-online-walk-v1'));}catch{return;}
  warm(Number(query.get('floor'))||1,session?.environment);
 }
})();
