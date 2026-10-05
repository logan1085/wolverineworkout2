import { validateActivityRef, assertUniqueActivityRefs, type TrainingActivityRef } from "./training-activity-ref";
import type { TrainingAdjustment } from "./training-adjustments";
import { validateSessionFeedback, type SessionFeedback } from "./training-feedback";
import { validateMarathonTraining } from "./marathon-training";
import type { MarathonDraft } from "./marathon-progression";
import { displayDistance } from "./running-baseline";
import { addDays, calendarDate } from "./calendar-date";
export { addDays, calendarDate } from "./calendar-date";
export type TrainingKind = "run" | "strength" | "recovery";
export type TrainingSession = {id:string;date:string;kind:TrainingKind;minutes?:number;distanceKm?:number;runType?:"easy"|"long"|"race";status:"planned"|"completed"|"skipped";feedback?:SessionFeedback;activityRef?:TrainingActivityRef};
export type TrainingPlan = {id:string;start:string;experience:"starting"|"regular";minutes?:number;mode?:"marathon";marathon?:MarathonDraft;adjustments?:TrainingAdjustment[];days:number[];strength:boolean;sessions:TrainingSession[]};
export function validateTraining(value:unknown):TrainingPlan {
  if(!value||typeof value!=="object")throw new Error("Invalid training plan.");
  const p=value as TrainingPlan;
  if(p.mode==="marathon")return validateMarathonTraining(value);
  if(p.mode!==undefined||p.marathon!==undefined||p.adjustments!==undefined)throw new Error("Unsupported training mode.");
  if(typeof p.id!=="string"||!/^plan-[a-zA-Z0-9-]{1,60}$/.test(p.id)||!calendarDate(p.start)||!["starting","regular"].includes(p.experience)||!Number.isInteger(p.minutes)||(p.minutes??0)<15||(p.minutes??0)>60||typeof p.strength!=="boolean"||!Array.isArray(p.days)||p.days.length<2||p.days.length>3||new Set(p.days).size!==p.days.length||!p.days.every(d=>Number.isInteger(d)&&d>=0&&d<=6)||p.days.some(d=>p.days.includes((d+1)%7)))throw new Error("Choose two or three run days with a day between, and 15–60 comfortable minutes.");
  if(!Array.isArray(p.sessions)||p.sessions.length<8||p.sessions.length>16)throw new Error("Invalid session count.");
  const ids=new Set<string>();const dates=new Set<string>();
  for(const s of p.sessions){if(!s||typeof s.id!=="string"||!/^session-\d{1,2}$/.test(s.id)||ids.has(s.id)||!calendarDate(s.date)||s.date<p.start||s.date>addDays(p.start,34)||dates.has(s.date)||!["run","strength","recovery"].includes(s.kind)||!["planned","completed","skipped"].includes(s.status)||!Number.isInteger(s.minutes)||(s.minutes??0)<5||(s.minutes??0)>60)throw new Error("Invalid scheduled session.");ids.add(s.id);dates.add(s.date);}
  assertUniqueActivityRefs([p]);
  const runs=p.sessions.filter(s=>s.kind==="run"&&s.status!=="skipped").map(s=>s.date).sort();
  if(runs.some((d,i)=>i>0&&addDays(runs[i-1],1)===d))throw new Error("Keep a recovery day between runs.");
  return {id:p.id,start:p.start,experience:p.experience,minutes:p.minutes,days:[...p.days].sort(),strength:p.strength,sessions:p.sessions.map(({id,date,kind,minutes,status,feedback,activityRef})=>({id,date,kind,minutes,status,...(feedback!==undefined?{feedback:validateSessionFeedback(feedback,status,date)}:{}),...(activityRef!==undefined?{activityRef:validateActivityRef(activityRef,status,kind,date)}:{})})).sort((a,b)=>a.date.localeCompare(b.date))};
}
export function createTraining(input:Omit<TrainingPlan,"sessions"|"minutes"|"mode"|"marathon">&{minutes:number}):TrainingPlan {
  if(!calendarDate(input.start))throw new Error("Choose a valid start date.");
  const sessions:TrainingSession[]=[];
  for(let i=0;i<28;i++) {const date=addDays(input.start,i);const weekday=new Date(date+"T12:00:00Z").getUTCDay();if(input.days.includes(weekday))sessions.push({id:`session-${sessions.length}`,date,kind:"run",minutes:input.experience==="starting"?Math.min(input.minutes,20):input.minutes,status:"planned"});}
  if(input.strength)for(let week=0;week<4;week++){for(let i=0;i<7;i++){const date=addDays(input.start,week*7+i);if(!sessions.some(s=>s.date===date)){sessions.push({id:`session-${sessions.length}`,date,kind:"strength",minutes:15,status:"planned"});break;}}}
  return validateTraining({...input,sessions});
}
export function updateTraining(plan:TrainingPlan,id:string,change:Partial<Pick<TrainingSession,"date"|"status"|"kind"|"feedback"|"activityRef">>,today:string) {
  if(!calendarDate(today))throw new Error("Invalid update date.");
  if(change.activityRef&&change.activityRef.linkedOn!==today)throw new Error("Activity links must use today’s date.");
  if(change.feedback&&change.feedback.updatedOn!==today)throw new Error("Feedback must use today’s date.");
  const current=plan.sessions.find(s=>s.id===id);if(!current)throw new Error("Session not found.");
  if(plan.mode==="marathon"&&current.runType==="race"&&(change.date||change.kind))throw new Error("Race day stays on the saved race date.");
  if(change.date&&plan.sessions.some(s=>s.id!==id&&s.date===change.date))throw new Error("That day already has a session. Choose an empty day.");
  if(change.date&&(current.status!=="planned"||change.date<today))throw new Error("Only upcoming, unfinished sessions can move.");
  if(change.status==="completed"&&(change.date??current.date)>today)throw new Error("Complete a session on the day or afterward.");
  if(change.kind&&current.status!=="planned")throw new Error("Reopen the session before changing it.");
  return validateTraining({...plan,sessions:plan.sessions.map(s=>s.id===id?{...s,...change,...(change.status&&change.status!=="completed"?{feedback:undefined,activityRef:undefined}:{}),...(change.kind==="recovery"?{minutes:10,distanceKm:undefined}:{})}:s)});
}
export function sessionTitle(session:TrainingSession,plan:TrainingPlan){if(plan.mode==="marathon"&&session.kind==="run")return session.runType==="race"?"Marathon":session.runType==="long"?"Long easy run":"Easy run";return session.kind==="recovery"?"Recovery & reset":session.kind==="strength"?"Familiar strength":plan.experience==="starting"?"Easy walk / jog":"Comfortable run";}
export function sessionSteps(session:TrainingSession,plan:TrainingPlan):string[]{
  if(session.kind==="recovery")return ["Take a rest day, or choose up to 10 minutes of comfortable walking or gentle mobility.","No missed workout to make up. Resume when you feel ready."];
  if(session.kind==="strength")return ["Use a familiar strength routine at an easy effort for up to 15 minutes.","Choose movements you already know. Take breaks and leave energy in reserve."];
  if(plan.mode==="marathon")return session.runType==="race"?["Your marathon is scheduled on this date. The event distance does not predict readiness or a finish time."]:[`${sessionTarget(session,plan)} · Run at a comfortable conversational effort. Walk or stop when needed.`,"Warm up and cool down comfortably. No target pace or duration is inferred.","If you feel pain or unwell, stop. A recovery day is always an option."];
  return ["5 min · Walk comfortably to warm up.",plan.experience==="starting"?`${(session.minutes??10)-10} min · Walk at a comfortable effort; add short easy jogs only if they feel comfortable. Walking the whole session counts.`:`${(session.minutes??10)-10} min · Run at an effort where you can talk comfortably. Walk whenever you need to.`,"5 min · Easy walk to finish.","Stop if you feel pain or unwell; a recovery day is always an option."];
}

export type TrainingArchive = { plan: TrainingPlan; archivedAt: string };
export const MAX_TRAINING_ARCHIVES = 52;
export function validateTrainingHistory(value:unknown,activeId?:string):TrainingArchive[] {
  if(!Array.isArray(value)||value.length>MAX_TRAINING_ARCHIVES)throw new Error(`Training history supports up to ${MAX_TRAINING_ARCHIVES} blocks.`);
  const ids=new Set(activeId?[activeId]:[]);
  return value.map(item=>{
    if(!item||typeof item!=='object'||!calendarDate(item.archivedAt))throw new Error('Invalid training archive.');
    const plan=validateTraining(item.plan);
    if(ids.has(plan.id))throw new Error('A training block cannot appear twice.');
    ids.add(plan.id);
    return {plan,archivedAt:item.archivedAt};
  });
}
/** Archive and activate in one profile save; never trim or reset completed work. */
export function saveTrainingBlock(current:TrainingPlan|undefined,history:TrainingArchive[],next:TrainingPlan,today:string) {
  if(!calendarDate(today))throw new Error('Invalid save date.');
  const training=validateTraining(next);
  const previous=validateTrainingHistory(history,current?.id);
  if(current?.id===training.id)return {training,trainingHistory:previous};
  if(previous.some(entry=>entry.plan.id===training.id))throw new Error('An archived block cannot replace the active plan. Create a new block.');
  if(current&&previous.length>=MAX_TRAINING_ARCHIVES)throw new Error('Training history is full. Your current plan has not been replaced.');
  const trainingHistory=current?[{plan:validateTraining(current),archivedAt:today},...previous]:previous;
  return {training,trainingHistory};
}

export function sessionTarget(session:TrainingSession,plan:TrainingPlan){
 return session.distanceKm!==undefined?`${displayDistance(session.distanceKm,plan.marathon?.inputs.baseline.unit??'km')} ${plan.marathon?.inputs.baseline.unit??'km'}`:`${session.minutes} min`;
}
export function trainingEnd(plan:TrainingPlan){return plan.marathon?.inputs.raceDate??addDays(plan.start,27);}
