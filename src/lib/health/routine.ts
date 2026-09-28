import type { HealthState, RoutineGoal } from "./model";
export type DailyTask = { id:RoutineGoal; title:string; detail:string; action:string; done:boolean; automatic:boolean };
const key=(d:Date)=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
export function dailyTasks(state:HealthState,today:string):DailyTask[] {
  const routine=state.profile.routine;
  if(!routine) return [];
  const check=state.checkIns.find(c=>c.date===today);
  const easy=routine.pace==="gentle" || !!check && (check.energy<=2 || check.soreness>=4);
  const minutes=easy ? Math.min(state.profile.minutes,10) : state.profile.minutes;
  const definitions:Record<RoutineGoal,{title:string;detail:string;action:string;automatic:boolean}>={
    movement:{title:easy ? "Choose comfortable movement or rest" : `${minutes} minutes of movement`,detail:easy ? "Keep it comfortable. Choosing rest counts too." : "A walk, a workout, or movement you enjoy.",action:"Log movement",automatic:state.activities.some(a=>a.date===today)},
    rest:{title:"Make space to wind down",detail:routine.pace==="gentle" ? "Take two quiet minutes away from your screen." : "Set aside ten quiet minutes before bed.",action:"Plan my wind-down",automatic:false},
    reflection:{title:"Check in with yourself",detail:"Notice your sleep, energy and how today feels.",action:"Open check-in",automatic:!!check},
  };
  return routine.goals.map(id=>({...definitions[id],id,done:definitions[id].automatic || state.completed.includes(`${today}:routine-${id}`)}));
}
/** A meaningful action earns a day. Yesterday's streak stays active until today ends. */
export function routineStreak(state:HealthState,today:string) {
  const start=state.profile.routine?.startedAt;
  if(!start) return {current:0,best:0,days:[] as string[]};
  const days=new Set<string>();
  const add=(date:string)=>{if(date>=start && date<=today) days.add(date);};
  // Recorded meaningful actions preserve earned days even when goals change.
  state.completed.forEach(c=>{if(/^\d{4}-\d{2}-\d{2}:routine-(movement|rest|reflection)$/.test(c)) add(c.slice(0,10));});
  state.checkIns.forEach(c=>add(c.date));
  state.activities.forEach(a=>add(a.date));
  const ordered=[...days].sort();let best=0,run=0,previous="";
  for(const day of ordered){const d=new Date(day+"T12:00:00");d.setDate(d.getDate()-1);run=key(d)===previous ? run+1 : 1;best=Math.max(best,run);previous=day;}
  const cursor=new Date(today+"T12:00:00");if(!days.has(today))cursor.setDate(cursor.getDate()-1);
  let current=0;while(days.has(key(cursor))){current++;cursor.setDate(cursor.getDate()-1);}
  return {current,best,days:ordered};
}
