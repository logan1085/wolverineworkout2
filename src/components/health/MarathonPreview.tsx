"use client";
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { activateMarathonDraft } from '@/lib/health/marathon-training';
import type { TrainingPlan } from '@/lib/health/training';
import { addDays } from '@/lib/health/calendar-date';
import { parseMarathonGoal } from '@/lib/health/marathon-goal';
import { createMarathonDraft, marathonWeeksForDate, type MarathonDraft, type MarathonPhase } from '@/lib/health/marathon-progression';
import { displayDistance, type RunningBaseline } from '@/lib/health/running-baseline';

const dayNames=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const phaseNames:Record<MarathonPhase,string>={foundation:'Find your rhythm',build:'Build endurance',recovery:'A lighter week',taper:'Ease toward race day',race:'Race week'};
const phaseNotes:Record<MarathonPhase,string>={foundation:'Begin from the running volume you reported. Keep the effort comfortable.',build:'A gradual distance build. The following weeks remain a proposal, not a commitment to push through fatigue.',recovery:'Less planned distance, with room to recover. Missed sessions do not need to be made up.',taper:'Planned training distance comes down as race day approaches.',race:'Short training runs, a clear day before the race, and your event on its actual date.'};
const dateLabel=(date:string)=>new Date(date+'T12:00:00').toLocaleDateString(undefined,{month:'short',day:'numeric'});
type Props={goal:string;raceDate?:string;baseline?:RunningBaseline;today:string;busy:boolean;replacing:boolean;onActivate:(plan:TrainingPlan)=>Promise<void>;onBack:()=>void};
export default function MarathonPreview({goal,raceDate,baseline,today,busy,replacing,onActivate,onBack}:Props){
 const [name,setName]=useState(parseMarathonGoal(goal)?.race??''),[date,setDate]=useState(raceDate??'');
 const [days,setDays]=useState([0,2,3,5]),[longDay,setLongDay]=useState(0),[unit,setUnit]=useState<RunningBaseline['unit']>(baseline?.unit??'mi');
 const [draft,setDraft]=useState<MarathonDraft|null>(null),[weekIndex,setWeekIndex]=useState(0),[error,setError]=useState('');
 const [saving,setSaving]=useState(false);
 const saveLock=useRef(false),locked=busy||saving;
 async function activate(){if(!draft||locked||saveLock.current)return;saveLock.current=true;setSaving(true);setError('');try{await onActivate(activateMarathonDraft(draft,today));}catch(e){setError(e instanceof Error?e.message:'Could not confirm activation. Your preview is still here.');}finally{saveLock.current=false;setSaving(false);}}
 const heading=useRef<HTMLHeadingElement>(null),errorRef=useRef<HTMLParagraphElement>(null);
 useEffect(()=>{heading.current?.focus();},[draft]);
 useEffect(()=>{if(error)errorRef.current?.focus();},[error]);
 const weeks=marathonWeeksForDate(date,today);
 const distance=(km:number)=>`${displayDistance(km,unit)} ${unit}`;
 function generate(e:FormEvent){
  e.preventDefault();setError('');
  if(!baseline){setError('Add your recent running in Training before making a marathon preview.');return;}
  try{setDraft(createMarathonDraft({id:`plan-${crypto.randomUUID()}`,raceName:name,raceDate:date,asOf:today,weeks,runDays:days,longRunDay:longDay,baseline}));setWeekIndex(0);}
  catch(e){setError(e instanceof Error?e.message:'Check your marathon details.');}
 }
 const week=draft?.weeks[weekIndex];
 return <section className="marathon-preview" aria-label="Marathon plan preview">
  <button disabled={locked} type="button" className="quiet-button marathon-preview-back" onClick={onBack}>← Back to current training</button>
  <span className="eyebrow">MARATHON · REVIEW YOUR PLAN</span>
  <h3 ref={heading} tabIndex={-1}>{draft?draft.inputs.raceName:'See the road to race day.'}</h3>
  <p className="marathon-preview-note">{draft?'This draft is not saved or active. Your current training is unchanged.':'Explore a distance-based draft with build, recovery and taper weeks. Your saved race and active plan change only when you activate.'}</p>
  {!draft?<form onSubmit={generate} className="plan-fields">
   {!baseline&&<p className="form-error">Add your recent running first, using “Add your running” in Training.</p>}
   <label>Race name<input required maxLength={100} value={name} onChange={e=>setName(e.target.value)} placeholder="Your marathon"/></label>
   <label>Race date<input type="date" required value={date} onInput={e=>setDate(e.currentTarget.value)} onChange={e=>setDate(e.target.value)}/></label>
   <p className="plan-hint">{weeks>=16&&weeks<=24?`${weeks} weeks, beginning ${dateLabel(addDays(date,1-weeks*7))}.`:'This draft supports race dates 16–24 weeks away.'} Dates here are for the preview only.</p>
   <span>Choose four running days</span><div className="plan-day-choices">{[1,2,3,4,5,6,0].map(d=><button type="button" key={d} aria-pressed={days.includes(d)} onClick={()=>setDays(days.includes(d)?days.filter(x=>x!==d):[...days,d])}>{dayNames[d]}</button>)}</div>
   <label>Long-run day<select aria-label="Long-run day" value={longDay} onChange={e=>setLongDay(Number(e.target.value))}>{[1,2,3,4,5,6,0].map(d=><option key={d} value={d}>{dayNames[d]}</option>)}</select></label>
   <p className="plan-hint">Include your long-run day above. Leave the day before and after it free of running, and avoid three runs on consecutive days.</p>
   <details className="marathon-preview-disclosure"><summary>Who this preview currently supports</summary><p>Recent running of 40–60 km a week (about 25–37 miles), over four or five days, with a longest recent run of 16–30 km. Your assessment must be no more than four weeks old.</p><p>These are product limits, not a judgment of your ability or a readiness assessment. This draft does not yet support time-goal workouts, injury rehabilitation or weekly adaptation.</p></details>
   {error&&<p className="form-error" role="alert" tabIndex={-1} ref={errorRef}>{error}</p>}
   <button className="primary" disabled={!baseline} type="submit">Preview my marathon →</button>
  </form>:<>
   <div className="marathon-preview-controls"><span>{dateLabel(draft.start)}, {draft.start.slice(0,4)} — {dateLabel(draft.inputs.raceDate)}, {draft.inputs.raceDate.slice(0,4)}</span><label>Display distances<select disabled={locked} aria-label="Display distances" value={unit} onChange={e=>setUnit(e.target.value as RunningBaseline['unit'])}><option value="mi">Miles</option><option value="km">Kilometres</option></select></label></div>
   <dl className="marathon-preview-stats"><div><dt>Weeks</dt><dd>{draft.weeks.length}</dd></div><div><dt>Peak training week</dt><dd>{distance(Math.max(...draft.weeks.map(w=>w.trainingKm)))}</dd></div><div><dt>Longest training run</dt><dd>{distance(Math.max(...draft.weeks.map(w=>w.longestTrainingKm)))}</dd></div></dl>
   <div className="marathon-volume" aria-hidden="true">{draft.weeks.map(w=><i key={w.number} className={`phase-${w.phase}${w.number===weekIndex+1?' selected':''}`} style={{height:`${Math.max(5,100*w.trainingKm/Math.max(...draft.weeks.map(v=>v.trainingKm)))}%`}}/>)}</div><p className="plan-hint">Weekly training distance · race distance excluded · displayed distances rounded</p>
   <label className="plan-history-select">Explore a week<select disabled={locked} aria-label="Explore a week" value={weekIndex} onChange={e=>setWeekIndex(Number(e.target.value))}>{draft.weeks.map((w,i)=><option key={w.number} value={i}>Week {w.number} · {phaseNames[w.phase]} · {distance(w.trainingKm)} training</option>)}</select></label>
   {week&&<div className="marathon-preview-week" aria-live="polite"><div className="marathon-week-title"><span className="eyebrow">WEEK {week.number} · {dateLabel(week.start)}–{dateLabel(week.end)}</span><h4>{phaseNames[week.phase]}</h4><p>{phaseNotes[week.phase]}</p></div><p className="marathon-week-distance">{distance(week.trainingKm)} training{week.raceKm>0&&<> + {distance(week.raceKm)} race</>}</p><ul>{Array.from({length:7},(_,i)=>{const day=addDays(week.start,i),session=week.sessions.find(s=>s.date===day);return <li key={day} className={session?'has-session':'is-rest'}><time dateTime={day}>{new Date(day+'T12:00:00').toLocaleDateString(undefined,{weekday:'short'})}<span>{dateLabel(day)}</span></time><div><strong>{session?session.kind==='race'?'Marathon':session.kind==='long'?'Long easy run':'Easy run':'Rest from running'}</strong>{session&&<span>{session.kind==='race'?'Event distance, not a readiness prediction':'Comfortable, conversational effort'}</span>}</div>{session&&<b>{distance(session.distanceKm)}</b>}</li>;})}</ul></div>}
   <div className="plan-actions"><button type="button" className="secondary" disabled={locked||weekIndex===0} onClick={()=>setWeekIndex(weekIndex-1)}>← Previous week</button><button type="button" className="secondary" disabled={locked||weekIndex===draft.weeks.length-1} onClick={()=>setWeekIndex(weekIndex+1)}>Next week →</button></div>
   <details className="marathon-preview-disclosure"><summary>How to read this draft</summary>{draft.notices.map(note=><p key={note}>{note}</p>)}</details>
   <p className="marathon-preview-note">Activation saves this race and its schedule. {replacing?"Your current block and its session statuses will move to history.":"Your weekly calendar will show these sessions."} Automatic weekly adjustments are not enabled.</p>
   {error&&<p className="form-error" role="alert" tabIndex={-1} ref={errorRef}>{error}</p>}<div className="plan-actions"><button disabled={locked} className="primary" type="button" onClick={()=>void activate()}>{locked?"Activating…":replacing?"Archive current & activate marathon":"Activate marathon plan"}</button><button disabled={locked} className="secondary" type="button" onClick={()=>{setDraft(null);setError('');}}>Edit preview choices</button></div>
  </>}
 </section>;
}
