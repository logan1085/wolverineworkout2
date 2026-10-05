'use client';
import { useEffect, useRef, useState } from 'react';
import { displayDistance } from '@/lib/health/running-baseline';
import type { Activity } from '@/lib/health/model';
import { linkTrainingActivity, unlinkTrainingActivity } from '@/lib/health/training-activity-link';
import type { TrainingArchive, TrainingPlan, TrainingSession } from '@/lib/health/training';

export default function TrainingActivityLink({plan,history,session,activities,today,busy,readOnly,onSave}:{plan:TrainingPlan;history:TrainingArchive[];session:TrainingSession;activities:Activity[];today:string;busy:boolean;readOnly:boolean;onSave:(plan:TrainingPlan)=>Promise<boolean>}) {
  const [choosing,setChoosing]=useState(false),[selection,setSelection]=useState(''),[error,setError]=useState('');
  const alert=useRef<HTMLParagraphElement>(null),button=useRef<HTMLButtonElement>(null),picker=useRef<HTMLSelectElement>(null),choiceHeading=useRef<HTMLHeadingElement>(null);
  const previousChoice=useRef(false);
  useEffect(()=>{if(choosing)(picker.current??choiceHeading.current)?.focus();else if(previousChoice.current)button.current?.focus();previousChoice.current=choosing;},[choosing]);
  const ref=session.activityRef;
  const matches=ref?activities.filter(a=>a.id===ref.id&&a.source===ref.source):[];
  const linked=matches.length===1&&matches[0].date===session.date?matches[0]:undefined;
  const used=[plan,...history.map(entry=>entry.plan)].flatMap(p=>p.sessions.flatMap(s=>s.activityRef?[JSON.stringify([s.activityRef.source,s.activityRef.id])]:[]));
  const candidates=activities.filter(a=>a.date===session.date&&a.date<=today&&!used.includes(JSON.stringify([a.source,a.id])));
  const chosen=candidates.find(a=>JSON.stringify([a.source,a.id])===selection);
  useEffect(()=>{if(error)alert.current?.focus();},[error]);
  const unit=plan.marathon?.inputs.baseline.unit??"km";
  const details=(a:Activity)=>`${a.type} · ${a.minutes} min${a.distanceKm===undefined?'':` · ${displayDistance(a.distanceKm,unit)} ${unit}`} · ${a.source==='manual'?'Manually logged':'Garmin'}`;
  async function apply(unlink=false){setError('');try{const next=unlink?unlinkTrainingActivity(plan,session.id,today):linkTrainingActivity(plan,history,activities,session.id,chosen!,today);if(await onSave(next)){setChoosing(false);setSelection('');button.current?.focus();}}catch(e){setError(e instanceof Error?e.message:'Could not update this link.');}}
  if(session.kind!=='run'||session.date>today||session.status==='skipped'||(readOnly&&!ref)||(!ref&&plan.pausedOn&&session.date>=plan.pausedOn))return null;
  return <section className="training-activity-link" aria-label="Recorded activity for this session"><span className="eyebrow">ACTUAL ACTIVITY</span>
    {ref?<><h4>{linked?linked.name:'Linked activity unavailable'}</h4><p>{linked?details(linked):'The original activity is no longer available on this date. Your completed status and reflection are preserved.'}</p>{!readOnly&&<button ref={button} className="quiet-button" disabled={busy} onClick={()=>void apply(true)}>Remove link</button>}<p className="plan-hint">Removing the link keeps the activity and completed session.</p></>:choosing?<><h4 ref={choiceHeading} tabIndex={-1}>Choose the activity you completed</h4><p className="plan-hint">Only activities from {session.date} appear. Review the actual activity; its distance can differ from your target.</p>{candidates.length?<><label>Recorded activity<select ref={picker} aria-label="Recorded activity to link" disabled={busy} value={selection} onChange={e=>{setSelection(e.target.value);setError('');}}><option value="">Choose an activity</option>{candidates.map(a=><option key={JSON.stringify([a.source,a.id])} value={JSON.stringify([a.source,a.id])}>{a.name} · {details(a)}</option>)}</select></label>{chosen&&<p>{chosen.name}<br/>{details(chosen)}</p>}<p className="plan-hint">Confirming links this record and marks the session completed. It does not change your target, copy activity data, or verify that you met the prescription.</p><div className="plan-actions"><button className="primary" disabled={busy||!chosen} onClick={()=>void apply()}>Link & mark completed</button><button className="quiet-button" disabled={busy} onClick={()=>{setChoosing(false);setSelection('');button.current?.focus();}}>Cancel</button></div></>:<><p>No unlinked activities are available for this date. Log your activity in Activity first, then return here. You can also mark the session completed without an activity.</p><button className="quiet-button" disabled={busy} onClick={()=>setChoosing(false)}>Back</button></>}</>:<button ref={button} className="secondary" disabled={busy} onClick={()=>setChoosing(true)}>Link a logged activity</button>}
    {error&&<p ref={alert} tabIndex={-1} role="alert" className="form-error">{error}</p>}
  </section>;
}
