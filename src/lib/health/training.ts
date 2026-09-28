export type TrainingKind = "run" | "strength" | "recovery";
export type TrainingSession = {id:string;date:string;kind:TrainingKind;minutes:number;status:"planned"|"completed"|"skipped"};
export type TrainingPlan = {id:string;start:string;experience:"starting"|"regular";minutes:number;days:number[];strength:boolean;sessions:TrainingSession[]};
export const calendarDate=(value:unknown):value is string=>typeof value==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&!Number.isNaN(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value;
export function addDays(date:string,count:number){const d=new Date(date+"T12:00:00Z");d.setUTCDate(d.getUTCDate()+count);return d.toISOString().slice(0,10);}
export function validateTraining(value:unknown):TrainingPlan {
  if(!value||typeof value!=="object")throw new Error("Invalid training plan.");
  const p=value as TrainingPlan;
  if(typeof p.id!=="string"||!/^plan-[a-zA-Z0-9-]{1,60}$/.test(p.id)||!calendarDate(p.start)||!["starting","regular"].includes(p.experience)||!Number.isInteger(p.minutes)||p.minutes<15||p.minutes>60||typeof p.strength!=="boolean"||!Array.isArray(p.days)||p.days.length<2||p.days.length>3||new Set(p.days).size!==p.days.length||!p.days.every(d=>Number.isInteger(d)&&d>=0&&d<=6)||p.days.some(d=>p.days.includes((d+1)%7)))throw new Error("Choose two or three run days with a day between, and 15–60 comfortable minutes.");
  if(!Array.isArray(p.sessions)||p.sessions.length<8||p.sessions.length>16)throw new Error("Invalid session count.");
  const ids=new Set<string>();const dates=new Set<string>();
  for(const s of p.sessions){if(!s||typeof s.id!=="string"||!/^session-\d{1,2}$/.test(s.id)||ids.has(s.id)||!calendarDate(s.date)||s.date<p.start||s.date>addDays(p.start,34)||dates.has(s.date)||!["run","strength","recovery"].includes(s.kind)||!["planned","completed","skipped"].includes(s.status)||!Number.isInteger(s.minutes)||s.minutes<5||s.minutes>60)throw new Error("Invalid scheduled session.");ids.add(s.id);dates.add(s.date);}
  const runs=p.sessions.filter(s=>s.kind==="run"&&s.status!=="skipped").map(s=>s.date).sort();
  if(runs.some((d,i)=>i>0&&addDays(runs[i-1],1)===d))throw new Error("Keep a recovery day between runs.");
  return {id:p.id,start:p.start,experience:p.experience,minutes:p.minutes,days:[...p.days].sort(),strength:p.strength,sessions:p.sessions.map(({id,date,kind,minutes,status})=>({id,date,kind,minutes,status})).sort((a,b)=>a.date.localeCompare(b.date))};
}
export function createTraining(input:Omit<TrainingPlan,"sessions">):TrainingPlan {
  if(!calendarDate(input.start))throw new Error("Choose a valid start date.");
  const sessions:TrainingSession[]=[];
  for(let i=0;i<28;i++) {const date=addDays(input.start,i);const weekday=new Date(date+"T12:00:00Z").getUTCDay();if(input.days.includes(weekday))sessions.push({id:`session-${sessions.length}`,date,kind:"run",minutes:input.experience==="starting"?Math.min(input.minutes,20):input.minutes,status:"planned"});}
  if(input.strength)for(let week=0;week<4;week++){for(let i=0;i<7;i++){const date=addDays(input.start,week*7+i);if(!sessions.some(s=>s.date===date)){sessions.push({id:`session-${sessions.length}`,date,kind:"strength",minutes:15,status:"planned"});break;}}}
  return validateTraining({...input,sessions});
}
export function updateTraining(plan:TrainingPlan,id:string,change:Partial<Pick<TrainingSession,"date"|"status"|"kind">>,today:string) {
  const current=plan.sessions.find(s=>s.id===id);if(!current)throw new Error("Session not found.");
  if(change.date&&plan.sessions.some(s=>s.id!==id&&s.date===change.date))throw new Error("That day already has a session. Choose an empty day.");
  if(change.date&&(current.status!=="planned"||change.date<today))throw new Error("Only upcoming, unfinished sessions can move.");
  if(change.status==="completed"&&(change.date??current.date)>today)throw new Error("Complete a session on the day or afterward.");
  if(change.kind&&current.status!=="planned")throw new Error("Reopen the session before changing it.");
  return validateTraining({...plan,sessions:plan.sessions.map(s=>s.id===id?{...s,...change,...(change.kind==="recovery"?{minutes:10}:{})}:s)});
}
export function sessionTitle(session:TrainingSession,plan:TrainingPlan){return session.kind==="recovery"?"Recovery & reset":session.kind==="strength"?"Familiar strength":plan.experience==="starting"?"Easy walk / jog":"Comfortable run";}
export function sessionSteps(session:TrainingSession,plan:TrainingPlan):string[]{
  if(session.kind==="recovery")return ["Take a rest day, or choose up to 10 minutes of comfortable walking or gentle mobility.","No missed workout to make up. Resume when you feel ready."];
  if(session.kind==="strength")return ["Use a familiar strength routine at an easy effort for up to 15 minutes.","Choose movements you already know. Take breaks and leave energy in reserve."];
  return ["5 min · Walk comfortably to warm up.",plan.experience==="starting"?`${session.minutes-10} min · Walk at a comfortable effort; add short easy jogs only if they feel comfortable. Walking the whole session counts.`:`${session.minutes-10} min · Run at an effort where you can talk comfortably. Walk whenever you need to.`,"5 min · Easy walk to finish.","Stop if you feel pain or unwell; a recovery day is always an option."];
}
