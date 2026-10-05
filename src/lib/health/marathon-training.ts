import { validatePauseDate } from "./training-pause";
import { validateActivityRef, assertUniqueActivityRefs } from "./training-activity-ref";
import { lighterDistance, validateTrainingAdjustments } from "./training-adjustments";
import { validateSessionFeedback } from "./training-feedback";
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
 const adjustments=validateTrainingAdjustments(p.adjustments,draft);
 const expected=draft.weeks.flatMap(w=>w.sessions);
 if(!Array.isArray(p.sessions)||p.sessions.length!==expected.length)throw new Error('Invalid marathon session count.');
 const ids=new Set<string>(),dates=new Set<string>();
 const sessions:TrainingSession[]=p.sessions.map(s=>{
  const original=expected.find(x=>x.id===s?.id);
  if(!original||ids.has(s.id)||!calendarDate(s.date)||dates.has(s.date)||!['planned','completed','skipped'].includes(s.status))throw new Error('Invalid marathon session.');
  ids.add(s.id);dates.add(s.date);
  const adjustment=adjustments.find(a=>a.sessionIds.includes(s.id));
  if(adjustment&&s.date<adjustment.appliedOn)throw new Error('An adjusted run cannot move before the adjustment date.');
  const distanceKm=adjustment?lighterDistance(original.distanceKm):original.distanceKm;
  const activityRef=s.activityRef!==undefined?{activityRef:validateActivityRef(s.activityRef,s.status,s.kind,s.date)}:{};
  const feedback=s.feedback!==undefined?{feedback:validateSessionFeedback(s.feedback,s.status,s.date)}:{};
  const week=draft.weeks.find(w=>w.sessions.some(x=>x.id===s.id))!;
  if(s.date<week.start||s.date>week.end)throw new Error('Keep a marathon session in its original week.');
  if(original.kind==='race'&&(s.date!==original.date||s.kind!=='run'))throw new Error('Race day stays on the saved race date.');
  if(s.kind==='recovery'){
   if(s.minutes!==10||s.distanceKm!==undefined)throw new Error('Invalid recovery session.');
   return {id:s.id,date:s.date,kind:'recovery',minutes:10,status:s.status,runType:original.kind,...feedback,...activityRef};
  }
  if(s.kind!=='run'||s.distanceKm!==distanceKm||s.minutes!==undefined||s.runType!==original.kind)throw new Error('Marathon distance does not match its preview.');
  return {id:s.id,date:s.date,kind:'run',distanceKm,runType:original.kind,status:s.status,...feedback,...activityRef};
 });
 assertUniqueActivityRefs([{sessions}]);
 const runs=sessions.filter(s=>s.kind==='run'&&s.status!=='skipped'),runDates=new Set(runs.map(s=>s.date));
 for(const run of runs){
  if(run.runType==='long'&&(runDates.has(addDays(run.date,-1))||runDates.has(addDays(run.date,1))))throw new Error('Leave a running-free day before and after the long run.');
  if(run.runType==='race'&&runDates.has(addDays(run.date,-1)))throw new Error('Keep the day before the race free of running.');
  if(runDates.has(addDays(run.date,1))&&runDates.has(addDays(run.date,2)))throw new Error('Avoid three consecutive running days.');
 }
 return {id:draft.inputs.id,...(validatePauseDate(p.pausedOn)?{pausedOn:p.pausedOn}:{}),mode:'marathon',start:draft.start,experience:'regular',days:draft.inputs.runDays,strength:false,marathon:draft,...(adjustments.length?{adjustments}:{}),sessions:sessions.sort((a,b)=>a.date.localeCompare(b.date))};
}

/** Reduce only unfinished runs in one selected week; never rewrite race day or past work. */
export function proposeLighterWeek(value:TrainingPlan,weekIndex:number,today:string):TrainingPlan {
 const plan=validateMarathonTraining(value);
 if(plan.pausedOn)throw new Error("Review the paused schedule before changing targets.");
 const week=plan.marathon!.weeks[weekIndex];
 if(!calendarDate(today)||today<plan.marathon!.inputs.asOf||!week||week.end<today)throw new Error('Choose a current or upcoming week.');
 if(plan.adjustments?.some(a=>a.week===weekIndex))throw new Error('This week already has lighter targets.');
 const ids=week.sessions.map(s=>s.id);
 const eligible=plan.sessions.filter(s=>ids.includes(s.id)&&s.kind==='run'&&s.runType!=='race'&&s.status==='planned'&&s.date>=today);
 if(!eligible.length)throw new Error('No upcoming, unfinished training runs to adjust in this week.');
 const adjustment={week:weekIndex,appliedOn:today,scale:0.8 as const,sessionIds:eligible.map(s=>s.id)};
 return validateMarathonTraining({...plan,adjustments:[...(plan.adjustments??[]),adjustment],sessions:plan.sessions.map(s=>adjustment.sessionIds.includes(s.id)?{...s,distanceKm:lighterDistance(s.distanceKm!)}:s)});
}
export function restoreWeekTargets(value:TrainingPlan,weekIndex:number,today:string):TrainingPlan {
 const plan=validateMarathonTraining(value);
 if(plan.pausedOn)throw new Error("Review the paused schedule before changing targets.");
 const adjustment=plan.adjustments?.find(a=>a.week===weekIndex);
 if(!calendarDate(today)||!adjustment||today<adjustment.appliedOn)throw new Error('No restorable adjustment for this week.');
 const affected=plan.sessions.filter(s=>adjustment.sessionIds.includes(s.id));
 if(affected.some(s=>s.status!=='planned'||s.date<today))throw new Error('Original targets can only be restored before any affected session is completed, skipped or past.');
 const originals=plan.marathon!.weeks[weekIndex].sessions;
 return validateMarathonTraining({...plan,adjustments:plan.adjustments!.filter(a=>a.week!==weekIndex),sessions:plan.sessions.map(s=>adjustment.sessionIds.includes(s.id)&&s.kind==='run'?{...s,distanceKm:originals.find(o=>o.id===s.id)!.distanceKm}:s)});
}
