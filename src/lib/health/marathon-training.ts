import { createMarathonDraft, type MarathonDraft } from './marathon-progression';
import { addDays, calendarDate } from './calendar-date';
import type { TrainingPlan, TrainingSession } from './training';

export function activateMarathonDraft(draft:MarathonDraft,today:string):TrainingPlan {
 if(!calendarDate(today)||draft.inputs.asOf!==today)throw new Error('Refresh this preview before activating it.');
 const canonical=createMarathonDraft(draft.inputs);
 return validateMarathonTraining({id:canonical.inputs.id,mode:'marathon',start:canonical.start,experience:'regular',days:canonical.inputs.runDays,strength:false,marathon:canonical,sessions:canonical.weeks.flatMap(w=>w.sessions.map(s=>({id:s.id,date:s.date,kind:'run',distanceKm:s.distanceKm,runType:s.kind,status:'planned'})))});
}
export function validateMarathonTraining(value:unknown):TrainingPlan {
 const p=value as TrainingPlan;
 if(!p?.marathon||p.mode!=='marathon')throw new Error('Invalid marathon plan.');
 const draft=createMarathonDraft(p.marathon.inputs);
 if(p.id!==draft.inputs.id||p.start!==draft.start)throw new Error('Marathon identity does not match its preview.');
 const expected=draft.weeks.flatMap(w=>w.sessions);
 if(!Array.isArray(p.sessions)||p.sessions.length!==expected.length)throw new Error('Invalid marathon session count.');
 const ids=new Set<string>(),dates=new Set<string>();
 const sessions:TrainingSession[]=p.sessions.map(s=>{
  const original=expected.find(x=>x.id===s?.id);
  if(!original||ids.has(s.id)||!calendarDate(s.date)||dates.has(s.date)||!['planned','completed','skipped'].includes(s.status))throw new Error('Invalid marathon session.');
  ids.add(s.id);dates.add(s.date);
  const week=draft.weeks.find(w=>w.sessions.some(x=>x.id===s.id))!;
  if(s.date<week.start||s.date>week.end)throw new Error('Keep a marathon session in its original week.');
  if(original.kind==='race'&&(s.date!==original.date||s.kind!=='run'))throw new Error('Race day stays on the saved race date.');
  if(s.kind==='recovery'){
   if(s.minutes!==10||s.distanceKm!==undefined)throw new Error('Invalid recovery session.');
   return {id:s.id,date:s.date,kind:'recovery',minutes:10,status:s.status,runType:original.kind};
  }
  if(s.kind!=='run'||s.distanceKm!==original.distanceKm||s.minutes!==undefined||s.runType!==original.kind)throw new Error('Marathon distance does not match its preview.');
  return {id:s.id,date:s.date,kind:'run',distanceKm:original.distanceKm,runType:original.kind,status:s.status};
 });
 const runs=sessions.filter(s=>s.kind==='run'&&s.status!=='skipped'),runDates=new Set(runs.map(s=>s.date));
 for(const run of runs){
  if(run.runType==='long'&&(runDates.has(addDays(run.date,-1))||runDates.has(addDays(run.date,1))))throw new Error('Leave a running-free day before and after the long run.');
  if(run.runType==='race'&&runDates.has(addDays(run.date,-1)))throw new Error('Keep the day before the race free of running.');
  if(runDates.has(addDays(run.date,1))&&runDates.has(addDays(run.date,2)))throw new Error('Avoid three consecutive running days.');
 }
 return {id:draft.inputs.id,mode:'marathon',start:draft.start,experience:'regular',days:draft.inputs.runDays,strength:false,marathon:draft,sessions:sessions.sort((a,b)=>a.date.localeCompare(b.date))};
}
