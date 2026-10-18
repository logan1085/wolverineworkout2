import type { Activity } from './model';
import { addDays, calendarDate } from './training';
/** Rolling seven-day periods; incomplete/unknown distances never become zero-pace runs. */
export function runningHistory(activities: Activity[], today: string) {
  const start=addDays(today,-27);
  const runs=activities.filter(a=>/^(running|run|trailrun|virtualrun)$/i.test(a.type)&&calendarDate(a.date)&&a.date>=start&&a.date<=today);
  const weeks=Array.from({length:4},(_,i)=>{
    const from=addDays(today,-27+i*7),to=addDays(from,6),items=runs.filter(a=>a.date>=from&&a.date<=to);
    const measured=items.filter(a=>Number.isFinite(a.distanceKm)&&a.distanceKm!>0);
    const paced=measured.filter(a=>Number.isFinite(a.minutes)&&a.minutes>0);
    return {from,to,count:items.length,days:new Set(items.map(a=>a.date)).size,km:measured.reduce((s,a)=>s+a.distanceKm!,0),longest:measured.length?Math.max(...measured.map(a=>a.distanceKm!)):null,pace:paced.length?paced.reduce((s,a)=>s+a.minutes,0)/paced.reduce((s,a)=>s+a.distanceKm!,0):null,missing:items.length-measured.length};
  });
  return {weeks,count:runs.length,days:new Set(runs.map(a=>a.date)).size,km:weeks.reduce((s,w)=>s+w.km,0),longest:Math.max(0,...weeks.map(w=>w.longest??0)),missing:weeks.reduce((s,w)=>s+w.missing,0),manual:runs.filter(a=>a.source==='manual').length,garmin:runs.filter(a=>a.source==='garmin').length};
}
export function demoRunningHistory(today:string):Activity[]{return [5,6,9,5,7,11,6,8,13,5,7,10].map((km,i)=>({id:`demo-run-${i}`,date:addDays(today,-27+Math.floor(i/3)*7+(i%3)*2),name:'Synthetic example run',type:'Running',minutes:km*(6.4-Math.floor(i/3)*.1),distanceKm:km,source:'manual'}));}
