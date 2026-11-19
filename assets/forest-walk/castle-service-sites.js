import {CASTLE_CENTER_CONTACT,CASTLE_CENTER_DOOR} from './castle-center-route.js?v=demon-castle-release-1';
// Bounds of real alpha in services-v2.png, measured without modifying pixels.
export const CASTLE_SERVICE_FRAMES=[
 [61,54,410,386],[695,63,166,371],[1092,47,376,391],
 [66,561,378,386],[625,557,286,389],[1084,589,382,340]
];
// Service/search anchors. Exit and village now deliberately use the central door;
// their original native service and country-return handlers remain unchanged.
export const CASTLE_SERVICE_SITES={
 exit:{label:'ประตูทางออกกลับเมือง',contact:CASTLE_CENTER_CONTACT,asset:'town-exit-v1',frames:[[29,53,1253,1109]],pieces:[[0,...CASTLE_CENTER_DOOR,15,{townExitDoor:true}]]},
 hospital:{label:'จุดรักษา',contact:[2.05,-12.8],pieces:[[0,-4,-9.5,10],[1,2.05,-11.2,0,{height:6.8}]]},
 village:{label:'เขตพักอาศัย · หมู่บ้าน',contact:CASTLE_CENTER_CONTACT,asset:'village-front-v1',frames:[[293,32,950,956]],pieces:[[0,...CASTLE_CENTER_DOOR,13]]},
 ruins:{label:'ซากโบราณ',contact:[1.05,-10.1],pieces:[[3,1.05,-8.4,13]]},
 shrine:{label:'ศาลเจ้า',contact:[1.05,-11.9],pieces:[[4,1.05,-7.8,10]]},
 bush:{label:'จุดค้นหา · พุ่มไม้',contact:[1.05,-11.9],pieces:[[5,1.05,-10.4,9]]},
 mist:{label:'จุดค้นหาในหมอก',contact:[1.05,-11.9],pieces:[[5,1.05,-10.4,8]]}
};
