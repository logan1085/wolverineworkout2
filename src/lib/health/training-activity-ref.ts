import { calendarDate } from './calendar-date';
export type TrainingActivityRef = { id: string; source: 'manual' | 'garmin'; linkedOn: string };
export function validateActivityRef(value: unknown, status: string, kind: string, date: string): TrainingActivityRef {
  const ref = value as TrainingActivityRef;
  if (!ref || typeof ref !== 'object' || typeof ref.id !== 'string' || !ref.id.trim() || ref.id.length > 100 || !['manual','garmin'].includes(ref.source) || !calendarDate(ref.linkedOn) || ref.linkedOn < date || status !== 'completed' || kind !== 'run') throw new Error('Only a completed run can link a recorded activity.');
  return { id: ref.id, source: ref.source, linkedOn: ref.linkedOn };
}
export function assertUniqueActivityRefs(plans: {sessions:{activityRef?:TrainingActivityRef}[]}[]) {
  const used=new Set<string>();
  for (const plan of plans) for (const session of plan.sessions) if (session.activityRef) {
    const key=JSON.stringify([session.activityRef.source,session.activityRef.id]);
    if (used.has(key)) throw new Error('A recorded activity can only link to one planned session.');
    used.add(key);
  }
}
