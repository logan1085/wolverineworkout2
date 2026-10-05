import { calendarDate } from './calendar-date';

/** Self-reported recent running, not a fitness score or clearance to train. */
export type RunningBaseline = {
  weeklyKm: number;
  longestRunKm: number;
  daysPerWeek: number;
  unit: 'mi' | 'km';
  recordedAt: string;
};
const KM_PER_MILE = 1.609344;
export function toKilometres(value:number,unit:RunningBaseline['unit']) {
  return Math.round(value*(unit==='mi'?KM_PER_MILE:1)*1000)/1000;
}
export function displayDistance(km:number,unit:RunningBaseline['unit']) {
  return Number((km/(unit==='mi'?KM_PER_MILE:1)).toFixed(1));
}
export function validateRunningBaseline(value:unknown):RunningBaseline {
  if(!value||typeof value!=='object')throw new Error('Enter your recent running.');
  const b=value as RunningBaseline;
  if(!['mi','km'].includes(b.unit)||!calendarDate(b.recordedAt))throw new Error('Invalid running assessment.');
  const distance=(x:unknown,max:number)=>typeof x==='number'&&Number.isFinite(x)&&x>=0&&x<=max;
  if(!distance(b.weeklyKm,300)||!distance(b.longestRunKm,150)||!Number.isInteger(b.daysPerWeek)||b.daysPerWeek<0||b.daysPerWeek>7)throw new Error('Check your running distances and days per week.');
  if((b.daysPerWeek===0)!==(b.weeklyKm===0))throw new Error('If you have not been running, enter zero for both weekly distance and running days.');
  if(b.longestRunKm>b.weeklyKm*4)throw new Error('Your longest run cannot exceed your total distance over the last four weeks.');
  if(b.weeklyKm>0&&b.longestRunKm===0)throw new Error('Enter your longest run from the last four weeks.');
  return {weeklyKm:b.weeklyKm,longestRunKm:b.longestRunKm,daysPerWeek:b.daysPerWeek,unit:b.unit,recordedAt:b.recordedAt};
}
export function baselineIsStale(baseline:RunningBaseline,today:string) {
  return calendarDate(today)&&Date.parse(today)-Date.parse(baseline.recordedAt)>28*86400000;
}
