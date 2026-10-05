import { calendarDate } from './calendar-date';
import type { MarathonDraft } from './marathon-progression';
export type TrainingAdjustment = { week: number; appliedOn: string; scale: 0.8; sessionIds: string[] };
export function lighterDistance(km:number){return Math.floor(km*8+1e-7)/10;}
/** Records explicit target edits; 20% is a product option, not a readiness or safety rule. */
export function validateTrainingAdjustments(value:unknown,draft:MarathonDraft):TrainingAdjustment[]{
 if(value===undefined)return [];
 if(!Array.isArray(value)||value.length>draft.weeks.length)throw new Error('Invalid training adjustments.');
 const weeks=new Set<number>();
 return value.map(item=>{
  const a=item as TrainingAdjustment,week=draft.weeks[a?.week];
  if(!a||!Number.isInteger(a.week)||!week||weeks.has(a.week)||a.scale!==0.8||!calendarDate(a.appliedOn)||a.appliedOn<draft.inputs.asOf||a.appliedOn>week.end||!Array.isArray(a.sessionIds)||!a.sessionIds.length||a.sessionIds.length>week.sessions.length||new Set(a.sessionIds).size!==a.sessionIds.length||a.sessionIds.some(id=>!week.sessions.some(s=>s.id===id&&s.kind!=='race')))throw new Error('Invalid lighter-week record.');
  weeks.add(a.week);
  return {week:a.week,appliedOn:a.appliedOn,scale:0.8,sessionIds:[...a.sessionIds]};
 });
}
