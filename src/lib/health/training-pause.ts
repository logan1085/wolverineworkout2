import { calendarDate } from './calendar-date';
import type { TrainingPlan } from './training';
export function validatePauseDate(value: unknown): string | undefined {
  if(value===undefined)return undefined;
  if(!calendarDate(value))throw new Error('Invalid training pause date.');
  return value as string;
}
export function pauseTraining(plan:TrainingPlan,today:string):TrainingPlan {
  if(!calendarDate(today))throw new Error('Invalid pause date.');
  if(plan.pausedOn)throw new Error('This schedule is already paused.');
  return {...plan,pausedOn:today};
}
export function resumeTraining(plan:TrainingPlan,today:string,reviewed:boolean):TrainingPlan {
  if(!calendarDate(today)||!plan.pausedOn||today<plan.pausedOn)throw new Error('Review the current pause before continuing.');
  if(!reviewed)throw new Error('Review the unchanged dates and targets before continuing.');
  const next={...plan};delete next.pausedOn;return next;
}
