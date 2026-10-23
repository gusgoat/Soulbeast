// Vector edge motifs: the transparent center of each card stays entirely clear.
const fs=require('fs');
const motifs={
 sword:['#c7b47d','<path d="M5 3L17 16M3 7L7 3M13 18L18 13M16 16L20 21M18 18L21 19L19 21ZM20 3L8 16M17 3L21 7M6 13L11 18M7 17L3 21"/>'],
 shield:['#cabd8e','<path d="M4 4L12 1L20 4V12Q19 18 12 23Q5 18 4 12ZM12 5V18M7 10H17"/><path d="M12 5L15 10L12 15L9 10Z"/>'],
 bow:['#a9c99d','<path d="M5 2Q27 12 5 22L5 2M2 18L22 6M16 5L22 6L20 12M5 15L8 18"/>'],
 arcane:['#b7aff1','<circle cx="11" cy="8" r="6"/><path d="M11 1L16 8L11 15L6 8ZM11 14V23M6 20H16M1 8H4M18 8H22"/><circle cx="11" cy="8" r="2"/>'],
 summon:['#a3d5d2','<circle cx="12" cy="12" r="9"/><path d="M12 2L21 17H3ZM12 5V18M5 12H19M1 3L4 6M20 18L23 21"/><circle cx="12" cy="12" r="3"/>'],
 grove:['#9ec598','<path d="M2 22Q7 9 22 2M7 16Q1 11 4 6Q13 7 7 16M12 10Q9 0 17 2Q20 8 12 10M11 13Q22 9 22 17Q17 22 11 13M3 21L13 21"/>'],
 shuriken:['#becbd6','<path d="M12 1L15 8L23 6L16 13L21 22L12 17L3 22L8 13L1 6L9 8ZM12 9L15 12L12 15L9 12Z"/>'],
 daggers:['#b1adc9','<path d="M3 2L8 4L20 18L17 21L4 8ZM2 16L6 21M3 20L17 5L22 2L20 8L7 21M15 4L20 9"/>'],
 gun:['#c3b1a0','<path d="M2 6H21V11H13L10 14L9 21H3L5 11H2ZM14 11V16H10M17 6V3H20M5 9H19"/>'],
 coin:['#dec58b','<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="7"/><path d="M12 5V19M16 8H10Q6 11 11 12Q18 13 14 16H8"/>'],
 hammer:['#bea992','<path d="M3 3H15V7H21V13H9V9H3ZM12 13L5 22L2 19L9 11M17 3L20 1"/>'],
 flask:['#a8cdb1','<path d="M8 2H16M9 2V9L3 18Q1 23 7 23H18Q23 23 21 18L15 9V2M6 15H18"/><circle cx="10" cy="18" r="1"/><circle cx="15" cy="19" r="1"/>'],
 lyre:['#d7b3bd','<path d="M3 3Q2 13 7 17H17Q22 13 21 3M6 3H18M7 3V17M12 3V17M17 3V17M12 17V22M7 22H17"/>'],
 normal:['#b3b28a','<circle cx="12" cy="12" r="8"/><path d="M12 1V4M12 20V23M1 12H4M20 12H23M5 5L7 7M17 17L19 19"/>'],
 fire:['#ee8130','<path d="M13 1Q17 7 14 10Q21 8 21 15Q21 23 12 23Q3 23 3 15Q3 10 8 6Q6 15 11 15Q16 11 13 1ZM12 16Q6 23 13 22Q17 21 12 16Z"/>'],
 water:['#83b9ee','<path d="M1 10Q7 4 12 10T23 10M1 16Q7 10 12 16T23 16M3 22Q7 18 11 21T22 21M14 2Q8 7 12 10Q18 11 14 2Z"/>'],
 grass:['#7ac74c','<path d="M3 22Q5 3 22 2Q23 21 3 22ZM3 22L19 5M8 16L7 9M12 12L18 13"/>'],
 electric:['#f7d02c','<path d="M15 1L3 14H11L8 23L22 9H14ZM2 3L5 6M20 19L23 22"/>'],
 ice:['#96d9d6','<path d="M12 1V23M2 6L22 18M2 18L22 6M8 3L12 6L16 3M8 21L12 18L16 21M2 10L6 8L6 4M18 20V16L22 14M2 14L6 16V20M18 4V8L22 10"/>'],
 fighting:['#e0564e','<path d="M4 11V7L7 5L10 7V3H14V6H18V9H21V16L17 22H7L3 17V12ZM7 10L8 16H16M14 6V12M18 9V13"/>'],
 poison:['#c060be','<path d="M12 1Q22 12 22 16Q22 23 12 23Q2 23 2 16Q2 12 12 1Z"/><circle cx="8" cy="15" r="2"/><circle cx="16" cy="15" r="2"/><path d="M8 20L12 18L16 20"/>'],
 ground:['#e2bf65','<path d="M1 20L8 5L13 12L18 2L23 20ZM4 21H21M7 12H11M16 8L20 13"/>'],
 flying:['#a98ff3','<path d="M2 22Q4 4 23 2L19 10L16 8L15 14L12 12L10 19L7 17ZM2 22L17 7"/>'],
 psychic:['#f95587','<path d="M1 12Q12-2 23 12Q12 26 1 12Z"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/><path d="M12 1V4M12 20V23"/>'],
 bug:['#a6b91a','<path d="M8 7L4 2M16 7L20 2M5 11L1 9M5 16L1 19M19 11L23 9M19 16L23 19M12 6V22"/><ellipse cx="12" cy="14" rx="7" ry="9"/><path d="M6 11H18M12 11V22"/>'],
 rock:['#c4ad4a','<path d="M3 18L5 7L13 2L21 9L22 20L12 23ZM5 7L12 11L21 9M12 11V23M3 18L12 11"/>'],
 ghost:['#9a7cc4','<path d="M3 22V12Q3 1 12 1Q22 1 22 12V22L17 19L12 23L7 19Z"/><ellipse cx="8" cy="11" rx="2" ry="3"/><ellipse cx="16" cy="11" rx="2" ry="3"/>'],
 dragon:['#ab8aef','<path d="M2 23L5 4L10 9L16 1L17 8L23 4L20 18L16 13L12 19L9 14ZM4 21Q22 25 22 17Q22 13 18 16M6 11L8 14L15 8"/>'],
 dark:['#b4a0bf','<path d="M18 2A11 11 0 1 0 21 20A12 12 0 0 1 18 2Z"/><path d="M18 8L20 12L23 13L20 15L18 19L16 15L13 13L16 12Z"/>'],
 steel:['#b7b7ce','<path d="M12 1L22 7V18L12 23L2 18V7ZM12 6L17 9V15L12 18L7 15V9Z"/><path d="M3 7L7 9M17 15L22 18"/>'],
 fairy:['#e58fbc','<path d="M12 1L15 9L23 12L15 15L12 23L9 15L1 12L9 9ZM12 7L17 12L12 17L7 12Z"/><circle cx="3" cy="3" r="1"/><circle cx="21" cy="21" r="1"/>'],
 bone:['#8b96a2','<path d="M4 9Q4 1 12 1Q21 1 21 9V13L17 16V21H8V16L4 13Z" fill="#080b10"/><path d="M6 21L2 23M20 20L23 23M10 17V21M14 17V21"/><ellipse cx="8" cy="10" rx="2" ry="3" fill="#000"/><ellipse cx="16" cy="10" rx="2" ry="3" fill="#000"/><path d="M12 12L10 15H14Z" fill="#000"/><path d="M27 5L35 11L42 6M27 16L35 11L42 18M33 9V14"/>']
};
fs.mkdirSync('assets/ui/unit-frames',{recursive:true});
for(const [key,[ink,shape]]of Object.entries(motifs)){
 const flourish=key==='bone'?'M42 12H55L60 8L66 12H80':'M25 12H34L39 8L44 12H55L60 10L65 12H80';
 fs.writeFileSync('assets/ui/unit-frames/'+key+'.svg',`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 84 24" fill="none"><g stroke="#03080e" stroke-width="3.5" stroke-linejoin="round">${shape}</g><g stroke="${ink}" stroke-width="1.1" stroke-linejoin="round" stroke-linecap="round" fill="${key==='bone'?'#080b10':'#10212c'}">${shape}</g><path d="${flourish}" stroke="${ink}" stroke-width=".8"/><circle cx="72" cy="12" r="1" fill="${ink}"/></svg>\n`);
}
console.log('Built '+Object.keys(motifs).length+' profession/element/black-bone vector ornaments');
