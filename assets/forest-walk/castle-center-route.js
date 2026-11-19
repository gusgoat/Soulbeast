// Visual layout and contact placement only. Native service/exit handlers stay intact.
export const CASTLE_CENTER_CONTACT=[0,38];
export const CASTLE_CENTER_DOOR=[0,39.5];
export const CASTLE_CENTER_TRAIL=[[0,-1.75],[0,12],[0,25],[0,38],[0,43]];
export const hasCastleCenterRoute=map=>map==='exit'||map==='village';
