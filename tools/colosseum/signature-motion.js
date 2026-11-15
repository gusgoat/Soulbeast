(() => {
 // Each row defines the movement, palette and ordered motifs for one skill.
 const recipes = new Map(`
 sw_whirl orbit steel blade gust blade
 sa_iai cross steel blade spark
 ke_thousand barrage steel blade blade spark
 sh_army rise gold banner banner shield
 sb_thunder cross electric blade bolt
 sbs_unite converge violet spirit paw rune
 sbw_doom rain void blade crack flare
 gl_roar burst amber roar shield
 pa_holy rise gold shield wing cross
 te_judge rain gold beam scales flare
 et_bastion converge gold shield wall cross
 be_frenzy orbit blood flame claw roar
 wl_split impact stone axe crack shard
 bw_drain drain blood blade drop
 ar_pierce thrust steel arrow spark
 ra_falcon dive sky wing claw
 sn_heart thrust blood arrow heart
 wd_storm spiral leaf arrow leaf gust
 bd_rally rise gold note banner
 ma_heal orbit gold harp note cross
 di_requiem drain violet note spirit
 mg_thunderstorm rain electric bolt cloud
 sg_barrier converge sky rune shield
 am_meteor rain fire meteor meteor crack
 el_omni orbit prism flame drop bolt shard
 wk_curse converge void chain eye skull
 ne_soul drain spirit spirit chain
 en_mind spiral violet eye prism ring
 me_coinbomb burst gold coin coin flare
 bs_hammer impact stone hammer crack ring
 ms_godhammer dive gold hammer star spark
 mc_cannon thrust amber cannon cloud flare
 al_acid dive poison vial drop bubble
 bc_elixir rise green vial cross bubble
 ga_transmute rise gold prism coin coin
 gn_execute thrust ember bullet flare
 mk_bullseye converge amber sight bullet
 gs_infinite barrage sky bullet bullet star
 bh_bounty cross gold sight bullet coin
 at_grenade dive ember bomb spark cloud
 cn_barrage rain amber cannon bomb cloud
 dm_blast burst fire bomb crack flare
 dr_treant rise leaf root leaf bark
 fe_saber converge sand claw fang paw
 wg_dragon spiral leaf wing scale root
 pk_howl burst sand paw roar ring
 gv_rain rain green drop leaf cross
 ad_moon orbit moon moon spirit leaf
 sc_tempest spiral electric cloud bolt gust
 th_back cross void dagger spark
 ro_mug drain amber dagger coin
 mt_plunder burst gold dagger coin bag
 tr_trick orbit violet mask mask prism
 as_sonic cross electric dagger bolt blade
 nj_shuriken barrage void shuriken gust
 rn_wander sweep steel blade gust leaf
 su_command thrust gold rune paw banner
 tm_double converge sky rune rune chain
 bk_order burst gold crown paw roar
 sm_bind converge violet chain seal spirit
 sl_share orbit rose heart thread cross
 ss_rebirth rise spirit spirit cross wing
 sp_storm spiral rose wing spirit star
 s_kappa impact water paw wave drop
 s_wisp orbit spirit flame spirit
 s_mandrake burst leaf root roar leaf
 s_tanuki spiral rose mask leaf mask
 s_raiju thrust electric bolt paw spark
 s_pixie orbit rose ring wing cross
 s_kodama rise green bark note leaf
 s_redcap dive blood fang drop flare
 s_kitsune spiral fire flame flame spirit
 s_tengu sweep leaf gust leaf wing
 s_griffin dive sky wing claw wind
 s_nil sweep water wave scale banner
 s_joro converge moon web thread fangs
 s_kelpie drain water wave chain drop
 s_nue rain violet cloud eye bolt
 s_basilisk thrust green eye scale shard
 s_cerberus converge fire fang fang fang
 s_yeti rain ice shard cloud paw
 s_golem impact steel fist shard crack
 s_scarab orbit gold sun scale flame
 s_dragon thrust fire wing flame scale
 s_naga sweep water wave bubble fang
 s_tbird cross electric wing bolt wing
 s_gargoyle dive stone wing crack shard
 s_jiangshi dive spirit seal fist cloud
 s_qilin rise gold antler cross cloud
 s_unicorn thrust moon horn star ring
 s_pegasus sweep electric wing wing bolt
 s_erawan barrage gold tusk tusk tusk
 s_baihu cross steel paw claw gust
 s_lamassu rise sand wall wing shield
 s_fenrir converge void sun fang moon
 s_kraken converge water tentacle tentacle drop
 s_phoenix rise fire flame wing cross
 s_garuda dive gold wing claw flare
 s_neko cross spirit claw spirit paw
 s_amabie rise water wave cross seal
 s_kinnaree orbit gold wing note feather
 s_salam impact ember flame crack bubble
 s_cyclops dive electric hammer bolt eye
 s_wendigo converge ice antler fang vapor
 s_bunyip drain green bubble tentacle wave
 s_wyvern dive sky scale wing gust
 s_roc sweep sky wing gust feather
 s_rajasi burst gold crown roar paw
 s_demon rain blood skull chain flame
 mist_sig_jade_moon_hare rise green moon cross leaf
 mist_sig_tempest_lynx barrage electric paw bolt gust
 mist_sig_bloom_jade_mare rise rose leaf flower shield
 mist_sig_obsidian_scarab thrust stone scale fang crack
 mist_sig_aurora_whale sweep ice wave star cross
 mist_sig_ember_jackal cross ember fang cloud flame
 mist_sig_prism_owl thrust prism eye prism feather
 mist_sig_dusk_panther barrage void claw claw paw
 mist_sig_primordial_ouroboros orbit prism scale ring clock
 mist_sig_dawn_valkyrie rise gold wing horn cross
 mist_sig_astral_dragon rain violet star meteor wing
 mist_sig_cosmic_tortoise converge sky shell star shield
 mist_sig_solar_sovereign impact gold sun paw flame
 mist_sig_infinite_sea_serpent sweep ice scale wave shard
 mist_sig_void_phoenix spiral void wing flame star
 mist_sig_eclipse_wolf converge void moon fang claw
 mist_sig_legend2_aegis_dragon converge electric wing shield scale
 mist_sig_legend2_tricephalos barrage ember fang flame bolt shard
 mist_sig_legend2_aurorion rain ice wing shard star
 mist_sig_legend2_abyssarch drain void crown tentacle chain
 mist_sig_legend2_selestia rise violet moon cross wing
 mist_sig_legend2_aerelion spiral violet rune star prism
 mist_sig_legend2_myriapod impact stone crack scale fang
 mist_sig_legend2_yggwarden rise green root bark cross
 solar_pentadrake_s6 barrage fire flame flame flame flame flame
 solar_mortivar_s6 rain poison crown skull vapor chain
 solar_aureolith_s6 rise electric wall shield bolt star
 solar_heliotheon_s6 rise gold crown horn blade sun
 solar_ferroth_s6 cross blood crown chain blade moon
 solar_cryostag_s6 rise ice antler crown shard cross
 solar_raijaku_s6 spiral electric feather feather eye bolt
 solar_thalassyr_s6 orbit water wave scale wave star
 `.trim().split('\n').map(line=>{
  const [id,movement,palette,...motifs]=line.trim().split(/\s+/);
  return [id,{movement,palette,motifs}];
 }));
 const colors={
  steel:['#ecf7ff','#70badc'],gold:['#fff8bd','#ffac45'],electric:['#e2ffff','#6ea6ff'],
  violet:['#f2c7ff','#a77add'],void:['#f3a8ff','#7b5bde'],amber:['#fff0a5','#de8b46'],
  blood:['#ffd1c2','#ff4c59'],stone:['#f1d7ae','#bc8861'],sky:['#d9faff','#47cbec'],
  leaf:['#efffb1','#85b94d'],fire:['#fff3a0','#ff742c'],spirit:['#d2fffa','#46e4c3'],
  green:['#d9ffcd','#75e19c'],poison:['#f0ff9c','#8cc948'],ember:['#ffd28a','#ff5b3d'],
  sand:['#fff3ca','#e4ae70'],moon:['#eef6ff','#a89bff'],rose:['#fff0fd','#f283c9'],
  water:['#cffbff','#459bff'],ice:['#efffff','#62d7ff'],prism:['#c8fbff','#f597ff'],
 };
 const symbols={
  blade:'M3 42Q35 36 58 4Q52 32 20 49L3 42Z',
  gust:'M4 39Q28 19 61 26M8 49Q29 34 56 39M18 22Q37 9 57 15',
  wind:'M4 39Q34 20 61 26M12 18Q43 4 57 16M14 48Q38 42 57 49',
  spark:'M32 3L37 25L60 32L37 39L32 61L27 39L4 32L27 25Z',
  star:'M32 3L40 23L61 24L46 39L50 59L32 49L14 59L18 39L3 24L24 23Z',
  banner:'M13 61V5L48 10L58 3V36L43 44L13 38M22 17L42 23L22 30Z',
  shield:'M32 5L55 14V33Q53 50 32 60Q11 50 9 33V14Z M32 13V50M17 27H47',
  bolt:'M36 2L10 34H28L21 62L55 24H36L44 7Z',
  spirit:'M11 45Q3 17 26 8Q49 1 54 25Q62 46 30 58L39 45Q25 58 11 45Z M24 28H25M40 27H41',
  paw:'M15 48Q18 36 32 36Q45 36 49 48Q49 55 33 53Q16 58 15 48Z M11 29Q4 17 13 15Q23 16 20 28Z M25 21Q19 8 27 5Q37 5 36 20Z M43 25Q38 12 48 11Q58 12 53 25Z M52 39Q50 28 60 28Q65 34 58 40Z',
  rune:'M32 4L59 32L32 60L5 32Z M19 44L32 17L45 44M22 36H42',
  crack:'M4 39L18 33L27 40L35 21L43 33L60 19M18 33L13 22M35 21L30 8M43 33L48 56',
  flare:'M32 1L37 22L53 12L46 29L63 32L44 39L54 54L36 47L31 63L25 45L10 55L17 39L1 32L20 26L11 11L28 22Z',
  roar:'M13 13Q32 31 13 53M30 9Q52 31 30 55M46 5Q71 31 46 60',
  wing:'M5 54Q18 26 58 7L49 26L58 22L47 38L54 35Q39 57 5 54Z M13 49L46 24',
  cross:'M26 7H38V25H56V38H38V56H26V38H8V25H26Z',
  beam:'M5 55L56 7L60 14L14 60Z M11 38L42 7M29 56L60 27',
  scales:'M32 4V53M21 57H43M8 22H56M14 22L6 40H22Z M50 22L42 40H58Z',
  wall:'M5 57V16H18V7H29V16H37V7H48V16H59V57Z M24 57V40Q33 29 40 40V57',
  flame:'M30 61Q2 53 15 31L20 41Q18 21 39 4Q30 23 45 32L48 20Q67 46 49 57Q42 63 30 61Z M26 56Q24 47 34 38Q43 44 41 53',
  claw:'M6 39Q21 7 40 5Q25 19 12 46Z M19 49Q34 15 55 11Q41 23 26 55Z M35 57Q49 31 62 24L43 59Z',
  axe:'M14 59L36 31M29 35Q20 19 30 10Q43 14 57 4Q63 19 51 32Q42 35 29 35Z',
  shard:'M24 60L16 28L42 4L50 27L42 49Z M16 28L43 26L42 4M43 26L24 60',
  drop:'M32 4Q38 17 49 34Q61 57 32 61Q3 57 15 34Q24 19 32 4Z M20 46Q20 52 27 55',
  arrow:'M7 48L55 12M42 13L56 11L52 25M6 50L17 49L21 35L11 36Z',
  heart:'M32 55L10 35Q-1 20 11 13Q22 6 32 20Q44 5 55 14Q66 25 54 37Z',
  leaf:'M7 56Q9 14 57 7Q57 48 18 48M8 57L47 17M22 41L22 28M34 31L47 33',
  note:'M26 47V11L53 5V39M26 48Q13 38 8 51Q6 61 18 58Q25 57 26 48Z M53 39Q40 29 35 42Q33 52 45 49Q52 48 53 39Z',
  harp:'M19 52Q6 38 13 16Q43 19 52 7L44 46Q36 61 19 52Z M21 20V46M29 20V50M37 18V47M45 15V41',
  cloud:'M13 48Q1 47 5 35Q8 27 17 28Q17 14 30 12Q44 10 50 25Q60 24 62 37Q63 47 51 49Z',
  meteor:'M38 22L10 3L23 28L4 21L24 48Q25 61 41 61Q61 59 60 43Q58 30 48 27Z M38 37L48 42L42 52L32 47Z',
  chain:'M7 46L21 32Q28 26 35 32Q41 38 35 45L21 58Q14 64 7 58Q2 53 7 46Z M29 20L43 6Q50 0 57 6Q63 12 57 19L43 32Q36 38 29 32Q24 27 29 20Z M21 43L44 20',
  eye:'M4 32Q32 5 60 32Q32 59 4 32Z M39 32A7 10 0 1 1 25 32A7 10 0 1 1 39 32Z',
  skull:'M10 26Q10 5 32 5Q56 5 55 28L50 45L43 47V58H21V47L14 43Z M19 29H25M39 29H45M29 43L32 37L35 43M28 50V58M36 50V58',
  prism:'M32 5L59 45L32 60L5 45Z M32 5V60M5 45L32 33L59 45',
  ring:'M61 32A29 22 0 1 1 3 32A29 22 0 1 1 61 32Z M54 32A22 15 0 1 1 10 32A22 15 0 1 1 54 32Z',
  coin:'M57 32A25 25 0 1 1 7 32A25 25 0 1 1 57 32Z M20 32L32 20L44 32L32 44Z',
  hammer:'M12 58L37 29M25 22L38 8L62 28L49 43Z',
  cannon:'M6 48L18 35L45 18L56 29L30 47Z M15 49A7 7 0 1 0 29 49M46 19L50 11L62 24L56 30',
  vial:'M22 11H43M27 12V25L13 46Q8 56 20 59H45Q57 56 51 46L37 25V12M18 43Q31 39 45 44',
  bubble:'M57 32A25 25 0 1 1 7 32A25 25 0 1 1 57 32Z M17 27Q19 17 30 16',
  bullet:'M5 42L38 17Q49 12 60 14Q59 25 50 34L16 57Z M12 38L25 50',
  sight:'M53 32A21 21 0 1 1 11 32A21 21 0 1 1 53 32Z M32 3V19M32 45V61M3 32H19M45 32H61',
  bomb:'M48 39A22 22 0 1 1 4 39A22 22 0 1 1 48 39Z M35 17L42 10L47 13L52 4M48 9L58 11',
  root:'M32 61V19M32 35L15 14M32 30L48 9M32 50L51 41M32 50L12 42M15 14L6 12M51 41L59 26',
  bark:'M18 60L22 41L20 10L34 5L43 12L40 41L47 60ZM29 18L27 46M37 29L34 53',
  fang:'M9 12Q35 22 55 12Q47 47 24 60Q36 36 23 22Z',
  moon:'M48 5Q21 13 22 36Q25 55 51 53Q30 69 13 51Q-5 33 14 13Q26 2 48 5Z',
  dagger:'M10 56L25 41M16 36L28 48M23 40L40 13L60 4L53 25L29 45Z',
  mask:'M6 14Q32 24 58 14L53 39L32 54L11 39Z M14 27L27 33L16 35Z M50 27L37 33L48 35Z',
  shuriken:'M32 24L49 4L44 25L61 41L41 39L24 60L25 42L3 25L24 27Z M37 32A5 5 0 1 1 27 32A5 5 0 1 1 37 32Z',
  crown:'M8 17L20 27L32 9L44 27L56 17L50 50H14Z M14 43H50',
  seal:'M32 3L57 17V47L32 61L7 47V17Z M19 24H45M32 16V47M22 41H42',
  thread:'M4 10Q34 7 32 33Q30 54 60 56M5 55Q34 55 32 33Q31 12 60 9',
  wave:'M4 51Q15 18 35 16Q53 17 56 30Q50 25 39 31Q26 40 58 52Z M5 57H58',
  scale:'M32 4L53 19V43L32 60L11 43V19Z M11 19L32 36L53 19M32 36V60',
  web:'M32 2V62M2 32H62M10 10L54 54M54 10L10 54M32 11L48 16L53 32L48 48L32 53L16 48L11 32L16 16Z M32 22L42 32L32 42L22 32Z',
  fangs:'M8 10Q20 19 26 10Q25 40 14 54L16 29Z M38 10Q48 19 57 10Q54 40 44 54L46 29Z',
  fist:'M8 55V27Q8 19 16 22V14Q16 5 24 9Q29 0 36 8Q44 3 48 12Q57 10 58 23L50 48L38 57Z M16 22L25 36H39',
  sun:'M48 32A16 16 0 1 1 16 32A16 16 0 1 1 48 32Z M32 3V12M32 52V61M3 32H12M52 32H61M11 11L18 18M46 46L53 53M53 11L46 18M18 46L11 53',
  antler:'M16 60Q23 37 10 18L5 4M19 35L26 21L23 7M14 24L3 20M48 60Q41 37 54 18L59 4M45 35L38 21L41 7M50 24L61 20',
  horn:'M12 58Q26 40 54 6L41 49L29 59Z M25 43L39 48M33 33L44 37M42 22L49 26',
  tusk:'M4 44Q35 46 53 6Q59 42 34 53Q23 59 4 44Z',
  tentacle:'M4 53Q36 63 48 36Q63 2 39 7Q26 9 33 19Q39 24 43 16Q46 28 34 40Q21 52 4 53Z M27 48L29 45M38 41L40 38',
  feather:'M8 58L54 8M16 48Q15 21 58 5Q57 32 31 43L23 43M22 39L25 25M34 26L49 25',
  vapor:'M7 42Q16 32 31 39Q51 50 60 35M12 29Q25 19 40 30Q53 35 61 24M16 17Q28 11 40 16',
  shell:'M5 49Q8 14 32 12Q56 14 59 49Z M15 47L22 23L41 23L49 47M22 23L32 12L41 23M22 23L32 47L41 23',
  clock:'M59 32A27 27 0 1 1 5 32A27 27 0 1 1 59 32Z M32 13V32L47 40',
  flower:'M32 20Q20 1 15 17Q0 20 14 32Q1 44 17 47Q22 61 32 46Q43 61 49 47Q64 44 50 31Q64 20 48 17Q43 1 32 20Z M38 33A6 6 0 1 1 26 33A6 6 0 1 1 38 33Z',
  bag:'M24 20L18 7H46L40 20Q59 29 59 49Q55 60 32 60Q9 60 5 49Q5 29 24 20Z M24 20H40M22 39H43',
 };
 const ns='http://www.w3.org/2000/svg';
 const pose=(x,y,angle,size)=>({transform:'translate(calc(-50% + '+x+'px),calc(-50% + '+y+'px)) rotate('+angle+'deg) scale('+size+')'});
 function motion(movement,index,count){
  const lane=index%2?-1:1,offset=index-(count-1)/2;
  switch(movement){
   case 'orbit':return [pose(-57,13,0,.6),pose(0,-45,80,1),pose(58,14,145,.86)];
   case 'spiral':return [pose(lane*70,-42,0,.6),pose(-lane*38,14,120,1.05),pose(0,-5,232,.68)];
   case 'rain':return [pose(offset*33-18,-102,-22,.66),pose(offset*28,0,0,1),pose(offset*34,30,18,1.05)];
   case 'cross':return [pose(lane*69,-45,lane*25,.55),pose(0,-3,lane*-48,1.28),pose(-lane*61,31,lane*-68,.65)];
   case 'barrage':return [pose(-83,offset*15-24,-32,.45),pose(4,offset*11,-3,1.04),pose(53,offset*18+14,32,.58)];
   case 'rise':return [pose(offset*28,38,0,.4),pose(offset*31,-9,0,1.07),pose(offset*42,-65,0,.73)];
   case 'converge':return [pose(lane*73,offset*33,lane*27,.67),pose(offset*17,-4,0,1.1),pose(offset*12,-12,0,.84)];
   case 'drain':return [pose(offset*27,12,0,.85),pose(-30,-31,-26,1.18),pose(-100,-12,-65,.45)];
   case 'sweep':return [pose(-97,offset*24-8,-18,.65),pose(0,offset*15-14,0,1.2),pose(98,offset*24+13,18,.7)];
   case 'dive':return [pose(-49+offset*21,-100,-35,.52),pose(0,0,9,1.27),pose(30+offset*24,37,41,.7)];
   case 'impact':return [pose(0,-60,index*22,.56),pose(0,19,index*12,1.14),pose(offset*45,-24,45+index*22,.68)];
   case 'burst':return [pose(0,0,0,.28),pose(offset*36,lane*-27,13*index,1.14),pose(offset*62,lane*-55,36*index,.66)];
   case 'thrust':return [pose(-90,offset*14+21,-26,.5),pose(0,0,8,1.12),pose(72,offset*19-17,30,.65)];
  }
 }
 function play(container,anchor,id,rate,phase){
  const recipe=recipes.get(id);
  if(!recipe||globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches)return;
  const [color,glow]=colors[recipe.palette];
  const effect=document.createElement('div');
  effect.dataset.signatureMotion=id;
  effect.dataset.phase=phase;
  effect.setAttribute('aria-hidden','true');
  Object.assign(effect.style,{position:'absolute',pointerEvents:'none',zIndex:5,left:anchor.x+'px',top:anchor.y+'px'});
  const count=phase==='cast'?1:recipe.motifs.length;
  for(const [index,key]of recipe.motifs.slice(0,count).entries()){
   const svg=document.createElementNS(ns,'svg');
   svg.dataset.motif=key;
   svg.setAttribute('viewBox','0 0 64 64');
   const size=Math.min(108,Math.max(48,(anchor.size||42)*1.55))*(phase==='cast'?.72:1-index*.09);
   Object.assign(svg.style,{position:'absolute',width:size+'px',height:size+'px',overflow:'visible',filter:'drop-shadow(0 0 7px '+glow+')'});
   const path=document.createElementNS(ns,'path');
   path.setAttribute('d',symbols[key]);
   path.setAttribute('fill',glow+'32');
   path.setAttribute('stroke',color);
   path.setAttribute('stroke-width','2.4');
   path.setAttribute('stroke-linejoin','round');
   path.setAttribute('stroke-linecap','round');
   svg.append(path);effect.append(svg);
   const [first,middle,last]=motion(phase==='cast'?'rise':recipe.movement,index,count);
   const duration=phase==='cast'?460:recipe.movement==='barrage'?530:690;
   const animation=svg.animate([{...first,opacity:0},{...middle,opacity:1,offset:.36},{...middle,opacity:.92,offset:.55},{...last,opacity:0}],
    {duration,delay:index*(recipe.movement==='barrage'?105:57),easing:'cubic-bezier(.2,.53,.33,1)',fill:'both'});
   animation.playbackRate=rate;
  }
  container.append(effect);
  return effect;
 }
 const careers={"swordsman":"sw_whirl","samurai":"sa_iai","kensei":"ke_thousand","shogun":"sh_army","spellblade":"sb_thunder","sbsummon":"sbs_unite","sbwar":"sbw_doom","gladiator":"gl_roar","paladin":"pa_holy","templar":"te_judge","eternal":"et_bastion","berserker":"be_frenzy","warlord":"wl_split","bloodwar":"bw_drain","archer":"ar_pierce","ranger":"ra_falcon","sniper":"sn_heart","wildlord":"wd_storm","bard":"bd_rally","maestro":"ma_heal","dirge":"di_requiem","mage":"mg_thunderstorm","sage":"sg_barrier","archmage":"am_meteor","elementalist":"el_omni","warlock":"wk_curse","necro":"ne_soul","enchanter":"en_mind","merchant":"me_coinbomb","blacksmith":"bs_hammer","mastersmith":"ms_godhammer","mechanic":"mc_cannon","alchemist":"al_acid","biochem":"bc_elixir","goldalch":"ga_transmute","gunner":"gn_execute","marksman":"mk_bullseye","gunsaint":"gs_infinite","bounty":"bh_bounty","artillery":"at_grenade","cannoneer":"cn_barrage","demolisher":"dm_blast","druid":"dr_treant","feral":"fe_saber","wildgod":"wg_dragon","packlord":"pk_howl","grove":"gv_rain","archdruid":"ad_moon","stormcaller":"sc_tempest","thief":"th_back","rogue":"ro_mug","masterthief":"mt_plunder","trickster":"tr_trick","assassin":"as_sonic","ninja":"nj_shuriken","ronin":"rn_wander","summoner":"su_command","tamer":"tm_double","beastking":"bk_order","sealmaster":"sm_bind","soullink":"sl_share","soulsage":"ss_rebirth","spiritlord":"sp_storm"};
 const beasts={"kappa":"s_kappa","wisp":"s_wisp","mandrake":"s_mandrake","tanuki":"s_tanuki","raiju":"s_raiju","pixie":"s_pixie","kodama":"s_kodama","redcap":"s_redcap","kitsune":"s_kitsune","tengu":"s_tengu","griffin":"s_griffin","nilmangkorn":"s_nil","jorogumo":"s_joro","kelpie":"s_kelpie","nue":"s_nue","basilisk":"s_basilisk","cerberus":"s_cerberus","yeti":"s_yeti","golem":"s_golem","scarab":"s_scarab","dragon":"s_dragon","naga":"s_naga","thunderbird":"s_tbird","gargoyle":"s_gargoyle","jiangshi":"s_jiangshi","qilin":"s_qilin","unicorn":"s_unicorn","pegasus":"s_pegasus","erawan":"s_erawan","baihu":"s_baihu","lamassu":"s_lamassu","fenrir":"s_fenrir","kraken":"s_kraken","phoenix":"s_phoenix","garuda":"s_garuda","nekomata":"s_neko","amabie":"s_amabie","kinnaree":"s_kinnaree","salamander":"s_salam","cyclops":"s_cyclops","wendigo":"s_wendigo","bunyip":"s_bunyip","wyvern":"s_wyvern","roc":"s_roc","rajasi":"s_rajasi","demonlord":"s_demon","jade_moon_hare":"mist_sig_jade_moon_hare","tempest_lynx":"mist_sig_tempest_lynx","bloom_jade_mare":"mist_sig_bloom_jade_mare","obsidian_scarab":"mist_sig_obsidian_scarab","aurora_whale":"mist_sig_aurora_whale","ember_jackal":"mist_sig_ember_jackal","prism_owl":"mist_sig_prism_owl","dusk_panther":"mist_sig_dusk_panther","primordial_ouroboros":"mist_sig_primordial_ouroboros","dawn_valkyrie":"mist_sig_dawn_valkyrie","astral_dragon":"mist_sig_astral_dragon","cosmic_tortoise":"mist_sig_cosmic_tortoise","solar_sovereign":"mist_sig_solar_sovereign","infinite_sea_serpent":"mist_sig_infinite_sea_serpent","void_phoenix":"mist_sig_void_phoenix","eclipse_wolf":"mist_sig_eclipse_wolf","legend2_aegis_dragon":"mist_sig_legend2_aegis_dragon","legend2_tricephalos":"mist_sig_legend2_tricephalos","legend2_aurorion":"mist_sig_legend2_aurorion","legend2_abyssarch":"mist_sig_legend2_abyssarch","legend2_selestia":"mist_sig_legend2_selestia","legend2_aerelion":"mist_sig_legend2_aerelion","legend2_myriapod":"mist_sig_legend2_myriapod","legend2_yggwarden":"mist_sig_legend2_yggwarden","solar_pentadrake":"solar_pentadrake_s6","solar_mortivar":"solar_mortivar_s6","solar_aureolith":"solar_aureolith_s6","solar_heliotheon":"solar_heliotheon_s6","solar_ferroth":"solar_ferroth_s6","solar_cryostag":"solar_cryostag_s6","solar_raijaku":"solar_raijaku_s6","solar_thalassyr":"solar_thalassyr_s6"};
 function portraitPath(actor){
  const id=actor?.sp?beasts[actor.sp]:careers[actor?.cls];
  if(!id)return null;
  const gender=actor.sp?'':actor.gender==='female'?'-female':'-male';
  const key=id+gender;
  if(key==='am_meteor-male'||key==='solar_raijaku_s6'){
   return 'assets/vfx/signature-portraits-v7/'+key+'-expanded.png';
  }
  const expanded=globalThis.SoulbeastExpandedPortraits?.includes(key);
  const folder=expanded?'signature-portraits-v9':'signature-portraits-v7';
  return 'assets/vfx/'+folder+'/'+key+(expanded?'.png':'.webp');
 }
 function bannerDuration(){
  return globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches?550:1000;
 }
 function portraitUrl(actor, localUrl){
  const path=portraitPath(actor);
  if(!path)return null;
  const root=globalThis.SoulbeastSignaturePortraitRoot;
  return root&&path.endsWith('.png')?new URL(path,root).href:localUrl(path);
 }
 function reveal(container,anchor,id,name,rate,duration,portraitStrip){
  const recipe=recipes.get(id);
  if(!recipe||!name)return;
  const [highlight,accent]=colors[recipe.palette];
  const reducedMotion=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const expanded=portraitStrip?.endsWith('-expanded.png');
  const cutout=expanded||portraitStrip?.includes('/signature-portraits-v9/');
  const wide=cutout||portraitStrip?.includes('/signature-portraits-v7/');
  const banner=document.createElement('div');
  banner.dataset.signatureBanner=id;
  banner.setAttribute('aria-hidden','true');
  Object.assign(banner.style,{position:'absolute',zIndex:12,pointerEvents:'none',top:'42%',left:'50%',
   width:wide?'min(90%, 590px, 96dvh)':'min(92%, 590px)',transform:'translate(-50%, -50%)',textAlign:'center',isolation:'isolate'});
  const angle='rotate(-4deg)';
  const lightningEdge='polygon(0 27%, 5% 10%, 18% 10%, 22% 0, 27% 10%, 54% 10%, 58% 2%, 61% 10%, 81% 10%, 87% 0, 91% 11%, 100% 11%, 96% 37%, 100% 47%, 95% 81%, 88% 88%, 74% 88%, 69% 100%, 65% 88%, 44% 88%, 39% 98%, 35% 88%, 17% 88%, 12% 100%, 8% 88%, 0 88%, 4% 54%)';
  const portraitEdge=lightningEdge.replace('27% 10%, 54% 10%, 58% 2%, 61% 10%, 81% 10%', '25% 10%, 26% 0, 74% 0, 75% 10%, 81% 10%');
  const raisedPortraitEdge=portraitEdge.replace('26% 0, 74% 0', '26% -8%, 74% -8%');
  const strip=document.createElement('div');
  const artwork=document.createElement('div');
  Object.assign(strip.style,{position:'relative',height:'clamp(72px, 17vw, 108px)',overflow:'hidden',
   transform:angle+' skewX(-10deg)',filter:'drop-shadow(0 0 8px '+accent+'bb) drop-shadow(0 5px 6px #000b)'});
  if(wide)Object.assign(strip.style,{height:'auto',aspectRatio:'5 / 2'});
  if(cutout)strip.style.overflow='visible';
  const edge=document.createElement('div');
  Object.assign(edge.style,{position:'absolute',inset:'0',clipPath:lightningEdge,
   background:'linear-gradient(115deg,'+accent+' 4%, '+highlight+' 21%, #fff3ce 23%, '+accent+' 42%, '+highlight+' 71%, #fff3ce 74%, '+accent+' 95%)'});
  const bevel=document.createElement('div');
  Object.assign(bevel.style,{position:'absolute',inset:'1px 2px',clipPath:lightningEdge,
   background:'linear-gradient(160deg,#101829 5%, '+accent+' 29%, '+highlight+' 51%, #101829 75%, '+accent+')'});
  const shimmer=document.createElement('div');
  Object.assign(shimmer.style,{position:'absolute',inset:'0',
   background:'linear-gradient(108deg, transparent 35%, '+highlight+'77 43%, #fff8dc 49%, white 50%, '+highlight+'77 57%, transparent 65%)',
   opacity:'0'});
  const glints=document.createElement('div');
  Object.assign(glints.style,{position:'absolute',inset:'0',opacity:'.65',
   background:'radial-gradient(circle at 22% 1%, white, '+highlight+' 2%, transparent 8%), radial-gradient(circle at 87% 1%, #fff3ce, '+highlight+' 2%, transparent 8%), radial-gradient(circle at 12% 99%, white, '+highlight+' 2%, transparent 7%), radial-gradient(circle at 95% 81%, white, '+highlight+' 2%, transparent 7%)'});
  edge.append(bevel,shimmer,glints);
  if(!reducedMotion){
   const sweep=shimmer.animate([
    {transform:'translateX(-100%)',opacity:0},
    {transform:'translateX(-65%)',opacity:.95,offset:.19},
    {transform:'translateX(65%)',opacity:.95,offset:.82},
    {transform:'translateX(100%)',opacity:0}
   ],{duration,easing:'linear'});
   const sparkle=glints.animate([{opacity:.4},{opacity:1,offset:.45},{opacity:.65}],{duration,easing:'ease-in-out'});
   sweep.playbackRate=sparkle.playbackRate=rate;
  }
  Object.assign(artwork.style,{position:'absolute',inset:'3px 5px',clipPath:lightningEdge,overflow:'hidden',
   background:'linear-gradient(100deg,#09101d 3%, '+accent+' 53%, #09101d 97%)'});
  const portrait=anchor.art||anchor.node.querySelector('img');
  const source=portrait?.dataset.idle||portrait?.currentSrc||portrait?.getAttribute('src');
  const portraitLayer=wide?document.createElement('div'):artwork;
  if(wide)Object.assign(portraitLayer.style,{position:'absolute',inset:'3px 5px',
   clipPath:cutout?raisedPortraitEdge:portraitEdge});
  if(portraitStrip){
   const face=document.createElement('div');
   face.dataset.signaturePortrait=portraitStrip;
   Object.assign(face.style,{position:'absolute',left:'50%',top:'50%',height:'98%',aspectRatio:'240 / 112',
    transform:'translate(-50%,-50%) skewX(10deg) rotate(4deg)',backgroundImage:'url("'+portraitStrip+'")',
    backgroundSize:'400% 100%',backgroundPosition:'0% 50%',filter:'drop-shadow(0 0 8px #09101d)'});
   if(wide)Object.assign(face.style,{inset:'0',width:'100%',height:'100%',aspectRatio:'auto',transform:'none',
    backgroundRepeat:'no-repeat',filter:'none',
    maskImage:'linear-gradient(90deg,transparent 0%,black 9%,black 91%,transparent 100%)'});
   if(cutout)Object.assign(face.style,{maskImage:'none',transformOrigin:'center top',
    transform:expanded?'translateY(-8%) scale(1.18, '+(id==='solar_raijaku_s6'?'1.33':'1.30')+')':
     'translateY(-6%) scale(1.04)'});
   portraitLayer.append(face);
   if(duration===1000){
    const animation=face.animate([{backgroundPosition:'0% 50%'},{backgroundPosition:'133.333333% 50%'}],
     {duration,easing:'steps(4,end)',fill:'none'});
    animation.playbackRate=rate;
   }
  }else if(source){
   const face=document.createElement('img');
   face.src=source;face.alt='';
   Object.assign(face.style,{position:'absolute',left:'50%',top:'-7%',width:'min(54%, 290px)',
    height:'265%',objectFit:'cover',objectPosition:'50% 10%',transform:'translateX(-50%) skewX(10deg) rotate(4deg)',
    filter:'drop-shadow(0 0 13px #09101d)'});
   artwork.append(face);
  }
  const rim=document.createElement('div');
  Object.assign(rim.style,{position:'absolute',inset:'0',background:'linear-gradient(90deg,#060a15bd,transparent 34% 66%,#060a15bd)'});
  artwork.append(rim);
  strip.append(edge,artwork);
  if(wide)strip.append(portraitLayer);
  const title=document.createElement('span');
  title.textContent=name;
  Object.assign(title.style,{position:'absolute',top:'88%',left:'50%',width:'max-content',maxWidth:'94%',
   transform:'translate(-50%, -50%) '+angle,color:'#fff0ce',overflowWrap:'anywhere',textWrap:'balance',
   font:'700 clamp(18px, 5.1vw, 30px)/1.35 Georgia, "Leelawadee UI", "Noto Sans Thai", serif',
   textShadow:'0 1px 1px #120a06, 0 2px 3px #000, 0 0 5px #000, 0 0 10px '+accent+'aa'});
  banner.append(strip,title);
  container.querySelector('[data-signature-banner]')?.remove();
  container.append(banner);
  if(!reducedMotion){
   const animation=banner.animate([
    {opacity:0,translate:'-20% 0'},{opacity:1,translate:'0 0',offset:.16},
    {opacity:1,translate:'0 0',offset:.87},{opacity:0,translate:'16% 0'}
   ],{duration,fill:'both',easing:'ease-out'});
   animation.playbackRate=rate;
  }
  return banner;
 }
 globalThis.SoulbeastSignatureMotion={recipes,play,reveal,bannerDuration,portraitPath,portraitUrl};
})();
