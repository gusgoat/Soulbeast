// @soulbeast-unit 1107-deathAudio
// Imported user recordings, rotated deterministically; never consume gameplay RNG.
Object.assign(MUSIC_ASSETS,{"humanoidDeath_male_1":"assets/audio/humanoid-death/male-1.mp3","humanoidDeath_male_2":"assets/audio/humanoid-death/male-2.mp3","humanoidDeath_male_3":"assets/audio/humanoid-death/male-3.mp3","humanoidDeath_male_4":"assets/audio/humanoid-death/male-4.mp3","humanoidDeath_female_1":"assets/audio/humanoid-death/female-1.mp3","humanoidDeath_female_2":"assets/audio/humanoid-death/female-2.mp3","humanoidDeath_female_3":"assets/audio/humanoid-death/female-3.mp3","humanoidDeath_female_4":"assets/audio/humanoid-death/female-4.mp3"});
ExtraAudio.groups.humanoidDeathMale=["humanoidDeath_male_1","humanoidDeath_male_2","humanoidDeath_male_3","humanoidDeath_male_4"];
ExtraAudio.groups.humanoidDeathFemale=["humanoidDeath_female_1","humanoidDeath_female_2","humanoidDeath_female_3","humanoidDeath_female_4"];
Sound.playDeath=function(u){if(!u)return;const human=['player','human'].includes(u.kind)||(!u.sp&&u.cls);if(human){const gender=['male','female'].includes(u.gender)?u.gender:CharacterMotion.resolve(u)?.gender||'male';return ExtraAudio.play(gender==='female'?'humanoidDeathFemale':'humanoidDeathMale');}return Sound.cry(u.sp,true);};
Sound.death=function(u){if(MotionTimeline.active()&&(MotionTimeline.depth||MotionTimeline.held.has(String(u.id))))return;MotionTimeline.death(u);};
// @soulbeast-end 1107-deathAudio
