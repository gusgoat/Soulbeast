import {distance} from './arena.mjs';

export const SIGHT_RANGE=3000;
export const inSight=(observer,subject)=>distance(observer,subject)<=SIGHT_RANGE;
