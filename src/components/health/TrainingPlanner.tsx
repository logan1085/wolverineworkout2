"use client";
import { useEffect, useRef, useState } from "react";
import { addDays, createTraining, sessionSteps, sessionTitle, sessionTarget, updateTraining, type TrainingArchive, type TrainingPlan, type TrainingSession } from "@/lib/health/training";
import { raceCountdown } from "@/lib/health/marathon-goal";
import MarathonPreview from "./MarathonPreview";
import RunningAssessment from "./RunningAssessment";
import TrainingFeedback from "./TrainingFeedback";
import TrainingActivityLink from "./TrainingActivityLink";
import type { Activity } from "@/lib/health/model";
import TrainingPause from "./TrainingPause";
import WeekAdjustment from "./WeekAdjustment";
import type { RunningBaseline } from "@/lib/health/running-baseline";
const weekdays=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
export default function TrainingPlanner({goal,plan,activities=[],history=[],today,busy,onSave,initialSession,raceDate,baseline,onSaveBaseline}:{goal:string;activities?:Activity[];history?:TrainingArchive[];baseline?:RunningBaseline;onSaveBaseline:(baseline:RunningBaseline)=>Promise<void>;raceDate?:string;initialSession?:string;plan?:TrainingPlan;today:string;busy:boolean;onSave:(plan:TrainingPlan)=>Promise<void>}) {
  const [exploring,setExploring]=useState(false);
  const [focused,setFocused]=useState(!!initialSession);
  const exploreButton=useRef<HTMLButtonElement>(null);
  const [assessing,setAssessing]=useState(false);
  const [experience,setExperience]=useState<"starting"|"regular">("starting");
  const [minutes,setMinutes]=useState(20),[days,setDays]=useState([1,3,5]),[strength,setStrength]=useState(false),[start,setStart]=useState(today);
  const [preview,setPreview]=useState<TrainingPlan|null>(null),[error,setError]=useState("");
  const [selected,setSelected]=useState<string|null>(initialSession??null),[moveDate,setMoveDate]=useState(plan?.sessions.find(s=>s.id===initialSession)?.date??"");
  const [visibleWeek,setVisibleWeek]=useState(()=>Math.max(0,plan?.marathon?.weeks.findIndex(w=>{const date=plan.sessions.find(s=>s.id===initialSession)?.date??today;return date>=w.start&&date<=w.end;})??0));
  const [creating,setCreating]=useState(false),[archiveId,setArchiveId]=useState(''),[saving,setSaving]=useState(false);
  const saveLock=useRef(false),locked=busy||saving;
  const archive=history.find(entry=>entry.plan.id===archiveId);
  const active=archive?.plan??(creating?preview:plan??preview);
  const isPreview=!!active&&!archive&&(creating||!plan);
  const isCurrent=!!plan&&!creating&&!archive;
  function resetSelection(){setFocused(false);setSelected(null);setVisibleWeek(0);setError('');}
  function startNew(){setExperience(plan?.experience??'starting');setMinutes(plan?.minutes??20);setDays(plan?.mode==='marathon'?[1,3,5]:plan?.days??[1,3,5]);setStrength(plan?.strength??false);setStart(today);setPreview(null);setCreating(true);setArchiveId('');resetSelection();}
  function cancelNew(){setCreating(false);setPreview(null);resetSelection();}
  const heading=useRef<HTMLHeadingElement>(null), summary=useRef<HTMLButtonElement>(null), alert=useRef<HTMLParagraphElement>(null);
  const focusedSession=focused?active?.sessions.find(s=>s.id===selected):undefined;
  const phase=focusedSession?`session-${focusedSession.id}`:archive?`archive-${archive.plan.id}`:isPreview?"preview":active?"saved":"setup";
  useEffect(()=>{heading.current?.focus();},[phase]);
  useEffect(()=>{if(error)alert.current?.focus();},[error]);
  async function persist(next:TrainingPlan){if(locked||saveLock.current)return false;saveLock.current=true;setSaving(true);setError("");try{await onSave(next);if(!plan||next.id!==plan.id){setCreating(false);setPreview(null);setArchiveId('');resetSelection();}else if(focused)heading.current?.focus();else summary.current?.focus();return true;}catch(e){setError(e instanceof Error?e.message:"Could not save your plan.");return false;}finally{saveLock.current=false;setSaving(false);}}
  function change(session:TrainingSession,patch:Parameters<typeof updateTraining>[2]){if(!plan||!isCurrent||locked)return;try{void persist(updateTraining(plan,session.id,patch,today));}catch(e){setError((e as Error).message);}}
  function sessionDetail(s:TrainingSession){
    const week=active!.marathon?.weeks.findIndex(w=>w.sessions.some(original=>original.id===s.id))??Math.floor((Date.parse(s.date)-Date.parse(active!.start))/604800000);
    return <div className="plan-session-detail"><ol>{sessionSteps(s,active!).map(step=><li key={step}>{step}</li>)}</ol>{isCurrent&&<fieldset disabled={locked||!!(active?.pausedOn&&s.date>=active.pausedOn)} className="plan-fields"><div className="plan-actions">{s.status==="planned"?<><button className="primary" aria-describedby={s.date>today?"future-session-hint":undefined} disabled={s.date>today} onClick={()=>change(s,{status:"completed"})}>Mark completed</button><button className="secondary" onClick={()=>change(s,{status:"skipped"})}>Skip session</button>{s.kind!=="recovery"&&s.runType!=="race"&&<button className="quiet-button" onClick={()=>change(s,{kind:"recovery"})}>Make this a recovery day</button>}</>:<button className="secondary" onClick={()=>change(s,{status:"planned"})}>Reopen session</button>}</div>{s.status==="planned"&&s.runType!=="race"&&<div className="plan-move"><label>Move to<input aria-label="Move session to" type="date" min={today>(active!.mode==="marathon"?active!.marathon!.weeks[week].start:active!.start)?today:(active!.mode==="marathon"?active!.marathon!.weeks[week].start:active!.start)} max={active!.mode==="marathon"?active!.marathon!.weeks[week].end:addDays(active!.start,34)} value={moveDate} onInput={e=>setMoveDate(e.currentTarget.value)} onChange={e=>setMoveDate(e.target.value)}/></label><button className="secondary" onClick={()=>change(s,{date:moveDate})}>Move session</button></div>}{s.status==="planned"&&s.date>today&&<p id="future-session-hint" className="plan-hint">You can mark this complete on its scheduled date.</p>}{(s.feedback||s.activityRef)&&<p className="plan-hint">Reopening removes its reflection and activity link. The recorded activity stays in your log.</p>}<p className="plan-hint">Plan completion is separate from your activity log. Nothing is sent to your watch.</p></fieldset>}</div>;
  }
  if(exploring)return <MarathonPreview goal={goal} raceDate={raceDate} baseline={baseline} today={today} busy={locked} replacing={!!plan} onActivate={async next=>{await onSave(next);setExploring(false);resetSelection();requestAnimationFrame(()=>heading.current?.focus());}} onBack={()=>{setExploring(false);requestAnimationFrame(()=>exploreButton.current?.focus());}}/>;
  if(focusedSession&&active)return <div className="training-planner session-focus">
    <button className="quiet-button session-back" disabled={locked} onClick={()=>{setFocused(false);setError("");requestAnimationFrame(()=>summary.current?.focus());}}>← Back to training plan</button>
    <span className="eyebrow">{new Date(focusedSession.date+"T12:00:00").toLocaleDateString(undefined,{weekday:"long",month:"long",day:"numeric"})}</span>
    <h3 ref={heading} tabIndex={-1}>{sessionTitle(focusedSession,active)}</h3>
    <div className="session-focus-target"><strong>{sessionTarget(focusedSession,active)}</strong><span role="status">{archive&&focusedSession.status==="planned"?"Unfinished when archived":focusedSession.status==="planned"&&active.pausedOn&&focusedSession.date>=active.pausedOn?"Paused":focusedSession.status==="planned"&&focusedSession.date<today?"Not completed":focusedSession.status}</span></div>
    {archive&&<p className="plan-hint">Archived session · read-only</p>}
    {isPreview&&<p className="plan-hint">Preview only · not saved. Return to the plan to review and activate it.</p>}
    {error&&<p ref={alert} tabIndex={-1} className="form-error" role="alert">{error}</p>}
    {focusedSession.status==="completed"&&<TrainingFeedback key={focusedSession.id} feedback={focusedSession.feedback} today={today} busy={locked} readOnly={!isCurrent} onSave={async feedback=>{try{return await persist(updateTraining(plan!,focusedSession.id,{feedback},today));}catch(e){setError((e as Error).message);return false;}}}/> }
    {active.pausedOn&&<p className="plan-hint">Schedule paused since {active.pausedOn}. Return to the plan to review before continuing.</p>}
    {!isPreview&&<TrainingActivityLink key={`${active.id}-${focusedSession.id}`} plan={active} history={history.filter(entry=>entry.plan.id!==active.id)} session={focusedSession} activities={activities} today={today} busy={locked} readOnly={!isCurrent} onSave={persist}/>}
    {sessionDetail(focusedSession)}
  </div>;
  return <div className="training-planner">
    {isCurrent&&plan&&<TrainingPause plan={plan} today={today} busy={locked} onSave={persist} onReplan={()=>{setExploring(true);}}/>}
    {!archive&&<RunningAssessment baseline={baseline} today={today} busy={locked} onSave={onSaveBaseline} onEditingChange={setAssessing}/>}
    {!assessing&&<>
    {!archive&&!creating&&<div className="marathon-preview-entry"><div><span className="eyebrow">LOOK AHEAD</span><p>Explore the weeks to race day.</p></div><button type="button" ref={exploreButton} disabled={locked} className="secondary" onClick={()=>setExploring(true)}>Marathon preview ↗</button></div>}
    {!creating&&history.length>0&&<label className="plan-history-select">Training block<select aria-label="Training block" disabled={locked} value={archiveId} onChange={e=>{setArchiveId(e.target.value);resetSelection();}}><option value="">Current block</option>{history.map((entry,index)=><option key={entry.plan.id} value={entry.plan.id}>Past block {history.length-index} · started {entry.plan.start}</option>)}</select></label>}
    {creating&&<div className="plan-replacement-note"><strong>Your current block stays active until you save.</strong><p>Starting the new block archives every session and its status from the current block. Unfinished sessions won’t carry into your new schedule.</p><button type="button" className="quiet-button" disabled={locked} onClick={cancelNew}>Cancel new block</button></div>}
    {archive&&<p className="plan-hint">Archived {archive.archivedAt}. This is a read-only record. Unfinished sessions are no longer on your active calendar.</p>}
    {!archive&&active?.mode!=="marathon"&&raceDate&&<div className="marathon-countdown"><strong>{raceCountdown(raceDate,today)}</strong><p>Your race date is saved. This four-week block does not yet adapt to it or include a race taper.</p></div>}
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
      <span className="eyebrow">{archive?"PAST TRAINING BLOCK":isPreview?"PREVIEW · NOT SAVED YET":"YOUR TRAINING BLOCK"}</span><h3 ref={heading} tabIndex={-1}>{active.mode==="marathon"?active.marathon!.inputs.raceName:"Four weeks of showing up."}</h3><p>{active.days.length} runs per week{active.strength?" + one familiar strength session":""}. {active.mode==="marathon"?"Distance-based marathon plan. Automatic weekly adjustments are not enabled.":"Recovery days between runs. No automatic increases."}</p>
      {!isPreview&&<div className="plan-progress"><progress aria-label="Training block completion" max={active.sessions.length} value={active.sessions.filter(s=>s.status==="completed").length}/><span>{active.sessions.filter(s=>s.status==="completed").length} of {active.sessions.length} sessions completed · {active.sessions.filter(s=>s.status==="skipped").length} skipped</span></div>}
      {isCurrent&&<div className="plan-actions"><button disabled={locked} className="secondary" onClick={startNew}>Start a new block</button></div>}
      {isPreview&&<div className="plan-actions"><button disabled={locked} className="secondary" onClick={()=>setPreview(null)}>Edit choices</button><button disabled={locked} className="primary" onClick={()=>void persist(active)}>{locked?"Saving…":plan?"Archive current & start this plan":"Start this plan"}</button></div>}
      {active.mode==="marathon"&&<label className="plan-history-select">Plan week<select aria-label="Plan week" value={visibleWeek} onChange={e=>{setVisibleWeek(Number(e.target.value));setSelected(null);}}>{active.marathon!.weeks.map((w,i)=><option key={w.number} value={i}>Week {w.number} · {w.phase} · {w.start}</option>)}</select></label>}
      {isCurrent&&!active.pausedOn&&active.mode==="marathon"&&<WeekAdjustment key={`${active.id}-${visibleWeek}`} plan={active} weekIndex={visibleWeek} today={today} busy={locked} onSave={persist}/>}
      {Array.from({length:active.mode==="marathon"?active.marathon!.weeks.length:5},(_,i)=>i).filter(week=>active.mode!=="marathon"||week===visibleWeek).map(week=>{const list=active.sessions.filter(s=>s.date>=addDays(active.start,week*7)&&s.date<=addDays(active.start,week*7+6));if(!list.length)return null;return <section className="plan-block" key={week}><h4>{week===4&&active.mode!=="marathon"?"Rescheduled sessions":`Week ${week+1}`} <span>{addDays(active.start,week*7)}</span></h4>{list.map(s=><article key={s.id} className={`plan-session plan-${s.status}`}><button ref={selected===s.id?summary:undefined} className="plan-session-summary" onClick={()=>{setSelected(s.id);setFocused(true);setMoveDate(s.date);setError("");}}><span className="plan-session-date">{new Date(s.date+"T12:00:00").toLocaleDateString(undefined,{weekday:"short",month:"short",day:"numeric"})}</span><strong>{sessionTitle(s,active)}</strong><span>{sessionTarget(s,active)} · {archive&&s.status==="planned"?"Unfinished when archived":s.status==="planned"&&active.pausedOn&&s.date>=active.pausedOn?"Paused":s.status==="planned"&&s.date<today?"Not completed":s.status} <b aria-hidden="true">↗</b></span></button></article>)}</section>;})}
    </>}
    </>}
  </div>;
}
