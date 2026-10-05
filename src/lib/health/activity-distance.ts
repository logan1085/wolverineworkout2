import type { HealthState } from './model';
import { displayDistance, toKilometres, type RunningBaseline } from './running-baseline';
export function activityDistanceUnit(profile:HealthState['profile']):RunningBaseline['unit'] {
  return profile.training?.marathon?.inputs.baseline.unit ?? profile.runningBaseline?.unit ?? 'km';
}
/** Only convert new user input; imported and existing records already use km. */
export function parseActivityDistance(value:string,unit:unknown):number|undefined {
  if(unit!=='mi'&&unit!=='km')throw new Error('Choose miles or kilometres.');
  if(!value.trim())return undefined;
  const distance=Number(value);
  if(!Number.isFinite(distance)||distance<0)throw new Error('Enter a distance of zero or more, or leave it blank.');
  const km=unit==='mi'?toKilometres(distance,unit):distance;
  if(km>1000)throw new Error('Distance must be at most 1,000 km (621.37 mi).');
  return km;
}

/** Preserve full stored precision when a rounded display was not changed. */
export function correctedActivityDistance(value:string,unit:unknown,originalKm:number|undefined,displayUnit:RunningBaseline['unit']):number|undefined {
  const originalText=originalKm===undefined?'':String(displayDistance(originalKm,displayUnit));
  return value===originalText&&unit===displayUnit?originalKm:parseActivityDistance(value,unit);
}
