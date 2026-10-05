"use client";
import { useRef, useState } from 'react';
import { proposeLighterWeek, restoreWeekTargets } from '@/lib/health/marathon-training';
import { addDays, sessionTarget, sessionTitle, type TrainingPlan } from '@/lib/health/training';
export default function WeekAdjustment({plan,weekIndex,today,busy,onSave}:{plan:TrainingPlan;weekIndex:number;today:string;busy:boolean;onSave:(plan:TrainingPlan)=>Promise<boolean>}){
 const [proposal,setProposal]=useState<{next:TrainingPlan;base:string;date:string;restore:boolean}|null>(null),[error,setError]=useState(''),[saving,setSaving]=useState(false);
 const heading=useRef<HTMLHeadingElement>(null),pending=useRef(false);
 const week=plan.marathon!.weeks[weekIndex],adjustment=plan.adjustments?.find(a=>a.week===weekIndex);
 const locked=busy||saving;
 const current=JSON.stringify(plan),stale=!!proposal&&(proposal.base!==current||proposal.date!==today);
 const eligible=plan.sessions.some(s=>week.sessions.some(o=>o.id===s.id)&&s.date>=today&&s.status==='planned'&&s.kind==='run'&&s.runType!=='race');
 const hard=plan.sessions.filter(s=>s.date>=addDays(week.start,-7)&&s.date<=week.end&&s.date<=today&&s.feedback?.effort==='hard').length;
 function preview(restore:boolean){setError('');try{setProposal({next:restore?restoreWeekTargets(plan,weekIndex,today):proposeLighterWeek(plan,weekIndex,today),base:current,date:today,restore});requestAnimationFrame(()=>heading.current?.focus());}catch(e){setError((e as Error).message);}}
 async function apply(){if(!proposal||stale||locked||pending.current)return;pending.current=true;setSaving(true);try{const next=proposal.restore?restoreWeekTargets(plan,weekIndex,today):proposeLighterWeek(plan,weekIndex,today);if(await onSave(next)){setProposal(null);requestAnimationFrame(()=>heading.current?.focus());}}catch(e){setError((e as Error).message);}finally{pending.current=false;setSaving(false);}}
 if(!eligible&&!adjustment)return null;
 const changed=proposal?.next.sessions.filter(s=>s.distanceKm!==plan.sessions.find(p=>p.id===s.id)?.distanceKm)??[];
 return <section className="week-adjustment" aria-label="Review weekly targets"><span className="eyebrow">WEEK {weekIndex+1} · YOUR TARGETS</span><h4 ref={heading} tabIndex={-1}>{proposal?'Review the changes':adjustment?'Lighter targets saved':'Need a lighter week?'}</h4>
 {hard>0&&<p>{hard} session{hard===1?'':'s'} marked hard in this week or the preceding seven days. That is your reported effort, not a readiness assessment.</p>}
 {proposal?<><p>{proposal.restore?'Restore the original distances below.':'Reduce these unfinished runs by 20%, rounded down to 0.1 km.'}</p><ul className="week-change-list">{changed.map(s=>{const before=plan.sessions.find(p=>p.id===s.id)!;return <li key={s.id}><div><strong>{sessionTitle(s,plan)}</strong><time dateTime={s.date}>{new Date(s.date+'T12:00:00').toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric'})}</time></div><span>{sessionTarget(before,plan)} → <b>{sessionTarget(s,proposal.next)}</b></span></li>;})}</ul><p className="plan-hint">Only the listed targets change. Later weeks retain their existing distances; no automatic catch-up or follow-on adjustment is applied.</p><div className="plan-actions"><button className="primary" disabled={locked||stale} onClick={()=>void apply()}>{saving?'Saving…':proposal.restore?'Restore these targets':'Apply lighter targets'}</button><button className="quiet-button" disabled={locked} onClick={()=>{setProposal(null);setError('');requestAnimationFrame(()=>heading.current?.focus());}}>Cancel changes</button></div>{stale&&<p role="alert">Your plan or date changed. Cancel and review again before applying.</p>}</>:<>{adjustment?<p>{adjustment.sessionIds.length} run targets adjusted on {adjustment.appliedOn}. Your original schedule is retained for comparison.</p>:<p>Preview shorter distances for the remaining runs in this week. Completed runs, recovery days and race day stay as they are.</p>}<button className="secondary" disabled={locked} onClick={()=>preview(!!adjustment)}>{adjustment?'Review original targets':'Preview a lighter week'}</button></>}
 <p className="plan-hint">This is a distance-editing option, not an injury assessment. If running hurts, stop rather than use a shorter target to push through. <a href="https://www.nhs.uk/live-well/exercise/knee-pain-and-other-running-injuries/" target="_blank" rel="noreferrer">Running injury guidance ↗</a></p>
 {error&&<p role="alert" className="form-error">{error}</p>}
 </section>;
}
