"use client";
import { useEffect, useRef, useState } from "react";
import { addDays, createTraining, sessionSteps, sessionTitle, updateTraining, type TrainingArchive, type TrainingPlan, type TrainingSession } from "@/lib/health/training";
import { raceCountdown } from "@/lib/health/marathon-goal";
import MarathonPreview from "./MarathonPreview";
import RunningAssessment from "./RunningAssessment";
import type { RunningBaseline } from "@/lib/health/running-baseline";
const weekdays=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
export default function TrainingPlanner({goal,plan,history=[],today,busy,onSave,initialSession,raceDate,baseline,onSaveBaseline}:{goal:string;history?:TrainingArchive[];baseline?:RunningBaseline;onSaveBaseline:(baseline:RunningBaseline)=>Promise<void>;raceDate?:string;initialSession?:string;plan?:TrainingPlan;today:string;busy:boolean;onSave:(plan:TrainingPlan)=>Promise<void>}) {
  const [exploring,setExploring]=useState(false);
  const exploreButton=useRef<HTMLButtonElement>(null);
  const [assessing,setAssessing]=useState(false);
  const [experience,setExperience]=useState<"starting"|"regular">("starting");
  const [minutes,setMinutes]=useState(20),[days,setDays]=useState([1,3,5]),[strength,setStrength]=useState(false),[start,setStart]=useState(today);
  const [preview,setPreview]=useState<TrainingPlan|null>(null),[error,setError]=useState("");
  const [selected,setSelected]=useState<string|null>(initialSession??null),[moveDate,setMoveDate]=useState(plan?.sessions.find(s=>s.id===initialSession)?.date??"");
  const [creating,setCreating]=useState(false),[archiveId,setArchiveId]=useState(''),[saving,setSaving]=useState(false);
  const saveLock=useRef(false),locked=busy||saving;
  const archive=history.find(entry=>entry.plan.id===archiveId);
  const active=archive?.plan??(creating?preview:plan??preview);
  const isPreview=!!active&&!archive&&(creating||!plan);
  const isCurrent=!!plan&&!creating&&!archive;
  function resetSelection(){setSelected(null);setError('');}
  function startNew(){setExperience(plan?.experience??'starting');setMinutes(plan?.minutes??20);setDays(plan?.days??[1,3,5]);setStrength(plan?.strength??false);setStart(today);setPreview(null);setCreating(true);setArchiveId('');resetSelection();}
  function cancelNew(){setCreating(false);setPreview(null);resetSelection();}
  const heading=useRef<HTMLHeadingElement>(null), summary=useRef<HTMLButtonElement>(null), alert=useRef<HTMLParagraphElement>(null);
  const phase=archive?`archive-${archive.plan.id}`:isPreview?"preview":active?"saved":"setup";
  useEffect(()=>{heading.current?.focus();},[phase]);
  useEffect(()=>{if(error)alert.current?.focus();},[error]);
  async function persist(next:TrainingPlan){if(locked||saveLock.current)return;saveLock.current=true;setSaving(true);setError("");try{await onSave(next);if(!plan||next.id!==plan.id){setCreating(false);setPreview(null);setArchiveId('');resetSelection();}else summary.current?.focus();}catch(e){setError(e instanceof Error?e.message:"Could not save your plan.");}finally{saveLock.current=false;setSaving(false);}}
  function change(session:TrainingSession,patch:Parameters<typeof updateTraining>[2]){if(!plan||!isCurrent||locked)return;try{void persist(updateTraining(plan,session.id,patch,today));}catch(e){setError((e as Error).message);}}
  if(exploring)return <MarathonPreview goal={goal} raceDate={raceDate} baseline={baseline} today={today} onBack={()=>{setExploring(false);requestAnimationFrame(()=>exploreButton.current?.focus());}}/>;
  return <div className="training-planner">
    {!archive&&<RunningAssessment baseline={baseline} today={today} busy={locked} onSave={onSaveBaseline} onEditingChange={setAssessing}/>}
    {!assessing&&<>
    {!archive&&!creating&&<div className="marathon-preview-entry"><div><span className="eyebrow">LOOK AHEAD</span><p>Explore the weeks to race day.</p></div><button type="button" ref={exploreButton} disabled={locked} className="secondary" onClick={()=>setExploring(true)}>Marathon preview ↗</button></div>}
    {!creating&&history.length>0&&<label className="plan-history-select">Training block<select aria-label="Training block" disabled={locked} value={archiveId} onChange={e=>{setArchiveId(e.target.value);resetSelection();}}><option value="">Current block</option>{history.map((entry,index)=><option key={entry.plan.id} value={entry.plan.id}>Past block {history.length-index} · started {entry.plan.start}</option>)}</select></label>}
    {creating&&<div className="plan-replacement-note"><strong>Your current block stays active until you save.</strong><p>Starting the new block archives every session and its status from the current block. Unfinished sessions won’t carry into your new schedule.</p><button type="button" className="quiet-button" disabled={locked} onClick={cancelNew}>Cancel new block</button></div>}
    {archive&&<p className="plan-hint">Archived {archive.archivedAt}. This is a read-only record. Unfinished sessions are no longer on your active calendar.</p>}
    {!archive&&raceDate&&<div className="marathon-countdown"><strong>{raceCountdown(raceDate,today)}</strong><p>Your race date is saved. This four-week block does not yet adapt to it or include a race taper.</p></div>}
    {error&&<p ref={alert} tabIndex={-1} className="form-error" role="alert">{error}</p>}
    {!active?<form onSubmit={e=>{e.preventDefault();if(locked)return;setError("");try{if(start<today||start>addDays(today,90))throw new Error("Start today or within the next 90 days.");setPreview(createTraining({id:`plan-${crypto.randomUUID()}`,start,experience,minutes,days,strength}));}catch(e){setError((e as Error).message);}}}>
      <p className="eyebrow">FOUR WEEKS · YOUR PACE</p><h3 ref={heading} tabIndex={-1}>Build a rhythm that fits.</h3><p>A consistency block for running, optional strength, and recovery. We hold the workload steady so you can learn what fits.</p>
      <fieldset disabled={locked} className="plan-fields"><label>Where are you starting?<select value={experience} onChange={e=>setExperience(e.target.value as typeof experience)}><option value="starting">New or returning · walk / jog</option><option value="regular">Already running regularly</option></select></label>
      <label>{experience==="starting"?"Comfortable time on your feet":"Comfortable session length, including warm-up"}<select value={minutes} onChange={e=>setMinutes(Number(e.target.value))}>{[15,20,25,30,40,45,60].map(n=><option value={n} key={n}>{n} minutes</option>)}</select></label>
      <p className="plan-hint">{experience==="starting"?"Walk / jog sessions are capped at 20 minutes. Walking the whole session counts.":"Choose a duration you already handle comfortably. This block does not increase it."}</p>
      <span>Which days work for running?</span><div className="plan-day-choices">{[1,2,3,4,5,6,0].map(d=><button key={d} type="button" aria-pressed={days.includes(d)} onClick={()=>setDays(days.includes(d)?days.filter(x=>x!==d):[...days,d])}>{weekdays[d]}</button>)}</div><p className="plan-hint">Pick two or three days, leaving a day between runs.</p>
      <label>First day<input type="date" min={today} max={addDays(today,90)} value={start} required onInput={e=>setStart(e.currentTarget.value)} onChange={e=>setStart(e.target.value)}/></label>
      <label className="plan-strength"><input type="checkbox" checked={strength} onChange={e=>setStrength(e.target.checked)}/> Include one familiar 15-minute strength session each week</label><p className="plan-hint">For a strength routine you already know; no new exercise prescription.</p>
      <button className="primary" type="submit">Preview my four weeks ↗</button></fieldset>
    </form>:<>
      <span className="eyebrow">{archive?"PAST TRAINING BLOCK":isPreview?"PREVIEW · NOT SAVED YET":"YOUR TRAINING BLOCK"}</span><h3 ref={heading} tabIndex={-1}>Four weeks of showing up.</h3><p>{active.days.length} runs per week{active.strength?" + one familiar strength session":""}. Recovery days between runs. No automatic increases.</p>
      {!isPreview&&<div className="plan-progress"><progress aria-label="Training block completion" max={active.sessions.length} value={active.sessions.filter(s=>s.status==="completed").length}/><span>{active.sessions.filter(s=>s.status==="completed").length} of {active.sessions.length} sessions completed · {active.sessions.filter(s=>s.status==="skipped").length} skipped</span></div>}
      {isCurrent&&<div className="plan-actions"><button disabled={locked} className="secondary" onClick={startNew}>Start a new block</button></div>}
      {isPreview&&<div className="plan-actions"><button disabled={locked} className="secondary" onClick={()=>setPreview(null)}>Edit choices</button><button disabled={locked} className="primary" onClick={()=>void persist(active)}>{locked?"Saving…":plan?"Archive current & start this plan":"Start this plan"}</button></div>}
      {[0,1,2,3,4].map(week=>{const list=active.sessions.filter(s=>s.date>=addDays(active.start,week*7)&&s.date<=addDays(active.start,week*7+6));if(!list.length)return null;return <section className="plan-block" key={week}><h4>{week===4?"Rescheduled sessions":`Week ${week+1}`} <span>{addDays(active.start,week*7)}</span></h4>{list.map(s=><article key={s.id} className={`plan-session plan-${s.status}`}><button ref={selected===s.id?summary:undefined} className="plan-session-summary" aria-expanded={selected===s.id} onClick={()=>{setSelected(selected===s.id?null:s.id);setMoveDate(s.date);setError("");}}><span className="plan-session-date">{new Date(s.date+"T12:00:00").toLocaleDateString(undefined,{weekday:"short",month:"short",day:"numeric"})}</span><strong>{sessionTitle(s,active)}</strong><span>{s.minutes} min · {archive&&s.status==="planned"?"Unfinished when archived":s.status==="planned"&&s.date<today?"Not completed":s.status} <b aria-hidden="true">{selected===s.id?"−":"+"}</b></span></button>{selected===s.id&&<div className="plan-session-detail"><ol>{sessionSteps(s,active).map(step=><li key={step}>{step}</li>)}</ol>{isCurrent&&<fieldset disabled={locked} className="plan-fields"><div className="plan-actions">{s.status==="planned"?<><button className="primary" disabled={s.date>today} onClick={()=>change(s,{status:"completed"})}>Mark completed</button><button className="secondary" onClick={()=>change(s,{status:"skipped"})}>Skip session</button>{s.kind!=="recovery"&&<button className="quiet-button" onClick={()=>change(s,{kind:"recovery"})}>Make this a recovery day</button>}</>:<button className="secondary" onClick={()=>change(s,{status:"planned"})}>Reopen session</button>}</div>{s.status==="planned"&&<div className="plan-move"><label>Move to<input aria-label="Move session to" type="date" min={today>active.start?today:active.start} max={addDays(active.start,34)} value={moveDate} onInput={e=>setMoveDate(e.currentTarget.value)} onChange={e=>setMoveDate(e.target.value)}/></label><button className="secondary" onClick={()=>change(s,{date:moveDate})}>Move session</button></div>}<p className="plan-hint">Plan completion is separate from your activity log. Nothing is sent to your watch.</p></fieldset>}</div>}</article>)}</section>;})}
    </>}
    </>}
  </div>;
}
