import {distance} from './arena.mjs';

export const SIGHT_RANGE=300;
export const inSight=(observer,subject)=>distance(observer,subject)<=SIGHT_RANGE;
