"use client";
import { useEffect, useRef, useState } from 'react';
import { baselineIsStale, displayDistance, toKilometres, validateRunningBaseline, type RunningBaseline } from '@/lib/health/running-baseline';

type Props={baseline?:RunningBaseline;today:string;busy:boolean;onEditingChange:(editing:boolean)=>void;onSave:(baseline:RunningBaseline)=>Promise<void>};
export default function RunningAssessment({baseline,today,busy,onSave,onEditingChange}:Props) {
 const [editing,setEditing]=useState(false),[step,setStep]=useState(1),[unit,setUnit]=useState<RunningBaseline['unit']>(baseline?.unit??'mi');
 const [weekly,setWeekly]=useState(''),[longest,setLongest]=useState(''),[days,setDays]=useState(''),[error,setError]=useState(''),[pending,setPending]=useState(false);
 const lock=useRef(false),heading=useRef<HTMLHeadingElement>(null),errorRef=useRef<HTMLParagraphElement>(null),editButton=useRef<HTMLButtonElement>(null);
 useEffect(()=>{if(editing)heading.current?.focus();},[editing,step]);
 useEffect(()=>{if(error)errorRef.current?.focus();},[error]);
 function edit(){setUnit(baseline?.unit??'mi');setWeekly(baseline?String(displayDistance(baseline.weeklyKm,baseline.unit)):'');setLongest(baseline?String(displayDistance(baseline.longestRunKm,baseline.unit)):'');setDays(baseline?String(baseline.daysPerWeek):'');setStep(1);setError('');setEditing(true);onEditingChange(true);}
 function cancel(){setEditing(false);onEditingChange(false);setError('');requestAnimationFrame(()=>editButton.current?.focus());}
 function changeUnit(next:RunningBaseline['unit']) {
  if(next===unit)return;
  if(weekly!==''&&Number.isFinite(Number(weekly)))setWeekly(String(displayDistance(toKilometres(Number(weekly),unit),next)));
  if(longest!==''&&Number.isFinite(Number(longest)))setLongest(String(displayDistance(toKilometres(Number(longest),unit),next)));
  setUnit(next);
 }
 async function submit(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();if(busy||lock.current)return;setError('');
  if(step===1){setStep(2);return;}
  let next:RunningBaseline;
  try{next=validateRunningBaseline({weeklyKm:toKilometres(Number(weekly),unit),longestRunKm:toKilometres(Number(longest),unit),daysPerWeek:Number(days),unit,recordedAt:today});}
  catch(e){setError(e instanceof Error?e.message:'Check your answers.');return;}
  lock.current=true;setPending(true);
  try{await onSave(next);setEditing(false);onEditingChange(false);requestAnimationFrame(()=>editButton.current?.focus());}
  catch(e){setError(e instanceof Error?e.message:'We couldn’t confirm this was saved. Your answers are still here. Retry or reload to check.');}
  finally{lock.current=false;setPending(false);}
 }
 return <section className="running-assessment" aria-label="Your running starting point">
  {!editing?<><div className="running-assessment-heading"><div><span className="eyebrow">YOUR STARTING POINT</span><h3>{baseline?'Your recent running':'Let’s get to know your running.'}</h3></div><button ref={editButton} type="button" className="quiet-button" disabled={busy} onClick={edit}>{baseline?'Update':'Add your running'} ↗</button></div>{baseline?<><dl className="running-baseline-stats"><div><dt>Weekly average</dt><dd>{displayDistance(baseline.weeklyKm,baseline.unit)} <small>{baseline.unit}</small></dd></div><div><dt>Running days / week</dt><dd>{baseline.daysPerWeek}</dd></div><div><dt>Longest recent run</dt><dd>{displayDistance(baseline.longestRunKm,baseline.unit)} <small>{baseline.unit}</small></dd></div></dl><p className="plan-hint">Your estimate · updated {new Date(baseline.recordedAt+'T12:00:00').toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'})}. {baselineIsStale(baseline,today)?'More than four weeks old—update this to reflect your current running.':'Based on the four weeks before this update.'}</p></>:<p className="plan-hint">Save a quick picture of your last four weeks. Starting from zero counts, too.</p>}</>:<form onSubmit={submit} aria-busy={pending}><fieldset disabled={busy||pending} className="plan-fields"><span className="eyebrow">YOUR STARTING POINT · {step} / 2</span><h3 tabIndex={-1} ref={heading}>{step===1?'What does a recent week look like?':'What was your longest recent run?'}</h3>{step===1?<><p className="plan-hint">Think about the last four completed weeks, including quieter weeks. Estimates are fine; use zero if you haven’t been running.</p><label>Distance unit<select value={unit} onChange={e=>changeUnit(e.target.value as RunningBaseline['unit'])}><option value="mi">Miles</option><option value="km">Kilometres</option></select></label><label>Average weekly distance ({unit})<input type="number" inputMode="decimal" min="0" max={unit==='mi'?186:300} step="0.1" required value={weekly} onChange={e=>setWeekly(e.target.value)} /></label><label>Typical running days per week<select required value={days} onChange={e=>setDays(e.target.value)}><option value="" disabled>Choose your days</option>{[0,1,2,3,4,5,6,7].map(n=><option key={n} value={n}>{n===0?'0 · Not currently running':`${n} ${n===1?'day':'days'}`}</option>)}</select></label></>:<><p className="plan-hint">Your longest single run in those same four weeks, not an all-time best.</p><p className="running-assessment-answer">{weekly} {unit} per week · {days} running {days==='1'?'day':'days'} per week</p><label>Longest run ({unit})<input type="number" inputMode="decimal" min="0" max={unit==='mi'?93:150} step="0.1" required value={longest} onChange={e=>setLongest(e.target.value)}/></label><p className="plan-hint">Saved with your profile and included when you choose to share context with your agent. Updating this won’t change scheduled workouts.</p></>}{error&&<p className="form-error" role="alert" tabIndex={-1} ref={errorRef}>{error}</p>}<div className="plan-actions">{step===2&&<button type="button" className="secondary" onClick={()=>{setStep(1);setError('');}}>Back</button>}<button type="submit" className="primary">{pending?'Saving…':step===1?'Continue →':'Save my starting point'}</button><button type="button" className="quiet-button" onClick={cancel}>Cancel</button></div></fieldset></form>}
 </section>;
}
