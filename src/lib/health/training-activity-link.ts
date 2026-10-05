import type { Activity } from './model';
import { updateTraining, type TrainingPlan, type TrainingArchive } from './training';
import { assertUniqueActivityRefs } from './training-activity-ref';
export function linkTrainingActivity(plan: TrainingPlan, history: TrainingArchive[], activities: Activity[], sessionId: string, activity: Pick<Activity,'id'|'source'>, today: string): TrainingPlan {
  const session=plan.sessions.find(s=>s.id===sessionId);
  if (!session || session.kind!=='run' || session.status==='skipped' || session.activityRef) throw new Error('Choose an unfinished or completed run without an existing activity link.');
  const matches=activities.filter(a=>a.id===activity.id&&a.source===activity.source);
  if (matches.length!==1) throw new Error('That activity is missing or ambiguous. Reload your history and try again.');
  if (matches[0].date!==session.date || matches[0].date>today) throw new Error('Choose an activity recorded on the scheduled day, on or before today.');
  const next=updateTraining(plan,sessionId,{status:'completed',activityRef:{id:activity.id,source:activity.source,linkedOn:today}},today);
  assertUniqueActivityRefs([next,...history.map(entry=>entry.plan)]);
  return next;
}
export function unlinkTrainingActivity(plan:TrainingPlan,sessionId:string,today:string) {
  return updateTraining(plan,sessionId,{activityRef:undefined},today);
}
