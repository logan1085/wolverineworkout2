"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
const TrainingWorld = dynamic(() => import("./TrainingWorld"), { ssr: false, loading: () => <p className="track-caption" role="status">Loading the 3D stadium… Day controls remain available.</p> });
import type { HealthState } from "@/lib/health/model";
import { addDays, calendarDate, sessionTitle, sessionTarget, trainingEnd } from "@/lib/health/training";
import { trainingDayMarker, scheduledWeekSummary } from "@/lib/health/training-week-summary";
import { raceCountdown, parseMarathonGoal } from "@/lib/health/marathon-goal";
import { activityDistanceUnit } from "@/lib/health/activity-distance";
import { displayDistance } from "@/lib/health/running-baseline";
import "./track.css";

type Props = { state: HealthState; today: string; disabled: boolean; sample: boolean; cloud: boolean; onPlan: (id?: string) => void; onLog: () => void; onGoal: () => void };
const positions = [[29,23],[50,23],[71,23],[86,50],[71,77],[50,77],[29,77]];
const label = (date: string, long = false) => new Date(date+"T12:00:00").toLocaleDateString(undefined, {month: "short", day: "numeric", ...(long ? {weekday: "long" as const} : {})});

/** A lightweight spatial view of the existing calendar, with no parallel save store. */
export default function TrainingTrack({state,today,disabled,sample,cloud,onPlan,onLog,onGoal}: Props) {
  const [selected,setSelected] = useState(today);
  const [flat,setFlat] = useState(false);
  const [world,setWorld] = useState(false);
  const [worldUnavailable,setWorldUnavailable] = useState(false);
  const dayButtons = useRef<(HTMLButtonElement|null)[]>([]);
  const plan=state.profile.training;
  const min=addDays(today,-56);
  const max=[addDays(today,112), ...(plan?[trainingEnd(plan)]:[]), ...(state.profile.raceDate?[state.profile.raceDate]:[])].sort().at(-1)!;
  const safeDate=(date:string|null)=>date&&calendarDate(date)&&date>=min&&date<=max?date:today;
  useEffect(()=>{
    const restore=()=>setSelected(safeDate(new URLSearchParams(location.search).get("trackDay")));
    restore(); window.addEventListener("popstate",restore);
    return ()=>window.removeEventListener("popstate",restore);
    // Bounds change with the active plan. No saved health data is placed in the URL.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[today,min,max]);
  function select(date:string){
    const next=safeDate(date);setSelected(next);
    const url=new URL(location.href);url.searchParams.set("trackDay",next);
    if(url.href!==location.href)window.history.pushState({},"",url);
  }
  const monday=addDays(selected,-(new Date(selected+"T12:00:00").getDay()+6)%7);
  const days=Array.from({length:7},(_,i)=>addDays(monday,i));
  const selectedSessions=plan?.sessions.filter(s=>s.date===selected)??[];
  const logged=state.activities.filter(a=>a.date===selected&&a.date<=today);
  const totalLogs=state.activities.filter(a=>a.date<=today&&a.type==="Running");
  const distance=totalLogs.reduce((sum,a)=>sum+(a.distanceKm??0),0);
  const progress=scheduledWeekSummary(plan?.sessions??[],monday,days[6],today);
  const race=state.profile.raceDate;
  const raceName=parseMarathonGoal(state.profile.goal)?.race;
  const paused=!!plan?.pausedOn;
  const unit=activityDistanceUnit(state.profile);
  const todaySession=plan?.sessions.find(s=>s.date===today);
  const inPlan=!!plan&&selected>=plan.start&&selected<=trainingEnd(plan);
  return <section className="training-track" aria-labelledby="track-heading" id="run-training" aria-busy={disabled}>
    <header className="track-heading"><div><span className="track-kicker">WOLVERINE RUNNING CLUB / YOUR TRAINING GROUND</span><h1 id="track-heading">A little closer.<br/><em>One run at a time.</em></h1><p>{raceName?`On the way to ${raceName}.`:"Pick your finish line. Find your rhythm. Keep showing up."}</p></div><div className="track-race"><span className="track-kicker">THE FINISH LINE</span><strong>{race?raceCountdown(race,today):"Your race, your pace."}</strong><button onClick={onGoal} disabled={disabled||sample}>{race?"Review race goal":"Set your race goal"} <span aria-hidden="true">↗</span></button>{race&&race>=min&&<button disabled={disabled} onClick={()=>select(race)}>Go to race week →</button>}</div></header>
    <div className="track-toolbar"><div><span className="track-kicker">{sample?"SAMPLE SCHEDULE":"YOUR WEEK ON THE TRACK"}</span><p>{label(monday)} to {label(days[6])}</p></div><div className="track-week-controls"><button aria-label="Previous track week" disabled={disabled||addDays(selected,-7)<min} onClick={()=>select(addDays(selected,-7))}>←</button><button onClick={()=>select(today)} disabled={disabled}>Today</button><button aria-label="Next track week" disabled={disabled||addDays(selected,7)>max} onClick={()=>select(addDays(selected,7))}>→</button></div><button className="track-view-toggle" disabled={disabled} aria-pressed={world} onClick={()=>{setWorld(!world);setFlat(false);setWorldUnavailable(false);}}>{world?"Lightweight track":"Enter 3D world"}</button><button className="track-view-toggle" onClick={()=>{setFlat(!flat);setWorld(false);}} aria-pressed={flat}>{flat?"Track view":"List view"}</button></div>
    {worldUnavailable&&<p className="track-caption" role="status">3D is unavailable on this device. The lightweight track and all your training controls are ready.</p>}
    <div className={`track-layout ${flat||world?"track-flat":""} ${world?"track-world-active":""}`}>
      <div className="track-ground">
        {world&&<TrainingWorld selected={days.indexOf(selected)} completed={progress.completed} total={progress.total} raceLabel={(race?raceCountdown(race,today):null)??"SET YOUR FINISH LINE"} onSelect={index=>{if(!disabled&&days[index])select(days[index]);}} onFallback={()=>{setWorld(false);setFlat(false);setWorldUnavailable(true);}} stations={days.map(date=>{const sessions=plan?.sessions.filter(s=>s.date===date)??[];const count=state.activities.filter(a=>a.date===date&&a.date<=today).length;return {label:new Date(date+"T12:00:00").toLocaleDateString(undefined,{weekday:"short",day:"numeric"}),status:trainingDayMarker(sessions,count,date,today,plan?.pausedOn).label,completed:sessions.length>0&&sessions.every(s=>s.status==="completed"&&date<=today),scheduled:sessions.length>0,logged:count>0};})}/>}
        <div className="track-scene">
          <svg className="track-art" viewBox="0 0 900 520" aria-hidden="true" focusable="false">
            <defs><pattern id="track-turf" width="18" height="18" patternUnits="userSpaceOnUse"><path d="M0 18L18 0" stroke="#d5d7c2" strokeWidth=".6"/></pattern><pattern id="track-checker" width="16" height="16" patternUnits="userSpaceOnUse"><rect width="16" height="16" fill="#f7eee0"/><path d="M0 0h8v8H0zM8 8h8v8H8z" fill="#3e4136"/></pattern></defs>
            <rect x="12" y="12" width="876" height="496" rx="12" fill="#e4e4d3"/>
            <rect x="32" y="32" width="836" height="456" rx="228" fill="#a55038"/>
            {[0,1,2,3,4].map(i=><rect key={i} x={43+i*17} y={43+i*17} width={814-i*34} height={434-i*34} rx={217-i*17} fill="none" stroke="#edb59a" strokeWidth="1.5"/>)}
            <rect x="132" y="132" width="636" height="256" rx="128" fill="#dfe2cd"/>
            <rect x="132" y="132" width="636" height="256" rx="128" fill="url(#track-turf)"/>
            <rect x="168" y="389" width="23" height="96" fill="url(#track-checker)"/>
            <path d="M173 359v-38m0 0h29l-7 9 7 9h-29" fill="#a55038" stroke="#3e4136" strokeWidth="2"/>
            <path d="M48 260h64m-12-7 12 7-12 7M790 260h64m-52-7-12 7 12 7" fill="none" stroke="#f5dfc5" strokeWidth="2"/>
            <text x="228" y="473" fill="#f5dfc5" fontSize="12" letterSpacing="4">START WHERE YOU ARE</text>
          </svg>
          <div className="track-infield" aria-hidden="true"><span>WEEKLY PRACTICE</span><strong>{progress.completed}<i> / {progress.total}</i></strong><p>{plan?"planned sessions done":"Your week starts here"}</p><small>{paused?"SCHEDULE PAUSED":"ROOM FOR REST, TOO"}</small></div>
          <div className="track-stations" role="group" aria-label="Choose a training day. Arrow keys move between days.">
            {days.map((date,i)=>{const sessions=plan?.sessions.filter(s=>s.date===date)??[];const count=state.activities.filter(a=>a.date===date&&a.date<=today).length;const marker=trainingDayMarker(sessions,count,date,today,plan?.pausedOn);return <button key={date} ref={el=>{dayButtons.current[i]=el;}} style={{left:`${positions[i][0]}%`,top:`${positions[i][1]}%`}} className="track-station" disabled={disabled||date<min||date>max} aria-pressed={selected===date} aria-current={date===today?"date":undefined} aria-label={`${label(date,true)}, ${marker.label}, ${count} logged activities${date===today?", today":""}`} onClick={()=>select(date)} onKeyDown={e=>{if(!["ArrowRight","ArrowDown","ArrowLeft","ArrowUp","Home","End"].includes(e.key))return;e.preventDefault();const n=e.key==="Home"?0:e.key==="End"?6:(i+(["ArrowRight","ArrowDown"].includes(e.key)?1:6))%7;dayButtons.current[n]?.focus();}}><span>{new Date(date+"T12:00:00").toLocaleDateString(undefined,{weekday:"short"})}</span><b>{new Date(date+"T12:00:00").getDate()}</b><small>{date===today?"TODAY":marker.symbol}</small></button>;})}
          </div>
        </div>
        <div className="track-legend"><span>○ Scheduled</span><span>✓ Plan done</span><span>● Activity logged</span><span>· Open day</span><span>– Skipped</span></div>
        <p className="track-caption">{plan?`${progress.completed} of ${progress.total} planned sessions completed this week${progress.skipped?` · ${progress.skipped} skipped`:""}.`:"Select a day to see what’s ahead."}</p>
      </div>
      <aside className="track-day" aria-label="Selected training day">
        <div aria-live="polite" aria-atomic="true"><span className="track-kicker">{selected===today?"YOU ARE HERE / TODAY":"SELECTED DAY"}</span><h2>{label(selected,true)}</h2>
        {disabled?<p>Loading your saved training.</p>:<>{paused&&<p className="track-pause">Schedule paused. Review your plan before resuming.</p>}{selected===race&&<p className="track-race-note">Your saved race date{raceName?`: ${raceName}`:""}. The calendar date does not predict race readiness.</p>}{selectedSessions.length?selectedSessions.map(s=><div className="track-session" key={s.id}><span className="track-session-state">{s.status==="completed"&&s.date<=today?"COMPLETED":s.status==="skipped"?"SKIPPED":paused?"PAUSED":"SCHEDULED"}</span><h3>{sessionTitle(s,plan!)}</h3><p className="track-target">{sessionTarget(s,plan!)}</p><button className="track-primary" disabled={sample} onClick={()=>onPlan(s.id)}>Open workout <span aria-hidden="true">↗</span></button></div>):<div className="track-session"><h3>{inPlan?"Room to recover.":plan?"An open day.":raceName?"Find your rhythm.":"Meet your starting line."}</h3><p>{inPlan?"No workout scheduled. Rest is part of your week.":plan?"No workout scheduled for this day.":raceName?"Your race is saved. Now review a training plan around your recent running.":"Set a race goal, then review a plan built around your recent running."}</p><button className="track-primary" disabled={sample} onClick={()=>plan||raceName?onPlan():onGoal()}>{plan?"Explore your plan":raceName?"Build my training":"Set up my race"} <span aria-hidden="true">↗</span></button></div>}
        {logged.length>0&&<div className="track-logged"><h3>Recorded on this day</h3>{logged.map(a=><p key={`${a.source}-${a.id}`}><strong>{a.name}</strong><span>{a.minutes} min{a.distanceKm!==undefined?` · ${displayDistance(a.distanceKm,unit)} ${unit}`:""}</span></p>)}<small>Activity logs and plan completion are tracked separately.</small></div>}</>}
        </div>
        <div className="track-day-actions"><button disabled={disabled||sample} onClick={onLog}>＋ Log a run</button>{selected!==today&&<button disabled={disabled} onClick={()=>select(today)}>Back to today</button>}{selected===today&&todaySession&&<span>Open your workout for instructions and completion.</span>}</div>
      </aside>
    </div>
    <footer className="track-bottom"><div><strong>{totalLogs.length}</strong><span>runs recorded</span></div><div><strong>{displayDistance(distance,unit)} <small>{unit}</small></strong><span>recorded distance</span></div><div className="track-plan-link"><button disabled={disabled||sample} onClick={()=>onPlan()}>{plan?"Explore full training plan":"Build a training plan"} ↗</button><span>{sample?"Sample data only":cloud?"Signed-in training":"Saved on this browser"}. {cloud?"":"AI and cloud access are separate."}</span></div></footer>
  </section>;
}
