"use client";
import { useState } from "react";
import { sessionTitle, sessionTarget, trainingEnd } from "@/lib/health/training";
import { dayKey, type HealthState } from "@/lib/health/model";

/** Scheduled sessions and actual history stay distinct within a local calendar week. */
export default function TrainingWeek({state,today,sample,onLog,onSetup,disabled}:{state:HealthState;today:string;sample:boolean;onLog:()=>void;onSetup:(id?:string)=>void;disabled:boolean}) {
  const [weekOffset,setWeekOffset]=useState(0);
  const plan=state.profile.training;
  const [selection,setSelection]=useState<string|null>(null);
  const monday=new Date(today+"T12:00:00");monday.setDate(monday.getDate()-(monday.getDay()+6)%7+weekOffset*7);
  const days=Array.from({length:7},(_,i)=>{const d=new Date(monday);d.setDate(d.getDate()+i);return {date:dayKey(d),label:d.toLocaleDateString(undefined,{weekday:"short"}),number:d.getDate()};});
  const selected=days.some(d=>d.date===selection)?selection!:(days.some(d=>d.date===today)?today:days[0].date);
  const week=state.activities.filter(a=>a.date>=days[0].date&&a.date<=today&&a.date<=days[6].date);
  const planned=plan?.sessions.filter(s=>s.date===selected)??[];
  const sessions=state.activities.filter(a=>a.date===selected&&a.date<=today);
  const minutes=week.reduce((sum,a)=>sum+a.minutes,0);
  return <section className="training-week" aria-label="Your training week">
    <div className="training-week-heading"><div><span className="eyebrow">{sample?"SAMPLE WEEK":weekOffset===0?"THIS WEEK":"YOUR SCHEDULE"}</span><h2>Your training</h2></div><button className="quiet-button" onClick={()=>onSetup()} disabled={disabled||sample}>{plan?"View plan ↗":"Build a plan ↗"}</button></div>
    {!plan&&<p className="training-goal">{state.profile.goal}</p>}
    <div className="plan-week-nav"><button className="quiet-button" disabled={weekOffset<=-8} onClick={()=>{setWeekOffset(weekOffset-1);setSelection(null);}}>← Previous week</button><span>{days[0].date.slice(5)} – {days[6].date.slice(5)}</span><button className="quiet-button" disabled={weekOffset>=Math.max(16,plan?Math.ceil((Date.parse(trainingEnd(plan))-Date.parse(today))/604800000):16)} onClick={()=>{setWeekOffset(weekOffset+1);setSelection(null);}}>Next week →</button></div>
    <div className="training-days" role="group" aria-label="Choose a day this week">{days.map(day=>{const count=state.activities.filter(a=>a.date===day.date&&a.date<=today).length;return <button key={day.date} type="button" onClick={()=>setSelection(day.date)} aria-pressed={selected===day.date} aria-label={`${day.label} ${day.date}${day.date===today?", today":""}, ${count} recorded sessions, ${plan?.sessions.filter(s=>s.date===day.date).length??0} planned sessions`} className={day.date===today?"is-today":""}><span>{day.label}</span><strong>{day.number}</strong><i aria-hidden="true">{count?"●":plan?.sessions.some(s=>s.date===day.date&&s.status==="planned")?"○":"·"}</i></button>;})}</div>
    <div className="training-day-detail" aria-live="polite"><span className="eyebrow">{selected===today?"TODAY":new Date(selected+"T12:00:00").toLocaleDateString(undefined,{weekday:"long",month:"short",day:"numeric"})}</span>{planned.length>0&&<ul>{planned.map(s=><li key={s.id}><button className="quiet-button" onClick={()=>onSetup(s.id)} disabled={disabled}>{sessionTitle(s,plan!)} · {sessionTarget(s,plan!)} ↗</button><span className="training-recorded">{s.status}</span></li>)}</ul>}{sessions.length?<ul>{sessions.map(s=><li key={s.id}><div><strong>{s.name}</strong><span>{s.type} · {s.minutes} min{s.distanceKm!==undefined?` · ${s.distanceKm} km`:""}</span></div><span className="training-recorded">Recorded ✓</span></li>)}</ul>:<p>{planned.length?"Your scheduled session is above. Recorded activity appears here separately.":plan&&selected>=plan.start&&selected<=trainingEnd(plan)?"Recovery day. No session scheduled.":selected>today?"Room for what’s next. No workout scheduled.":selected===today?"Your next step starts here. Log a session when you’re done.":"No session recorded. Rest days belong here, too."}</p>}{selected===today&&!sample&&<button className="quiet-button" disabled={disabled} onClick={onLog}>Log a session <span aria-hidden="true">↗</span></button>}</div>
    <div className="training-totals"><div><strong>{week.length}</strong><span>sessions this week</span></div><div><strong>{minutes}<small> min</small></strong><span>recorded movement</span></div></div>
  </section>;
}
