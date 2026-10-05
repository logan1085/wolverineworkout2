import { calendarDate } from './calendar-date';
import { validateHealth, type Activity, type HealthState } from './model';
export type ActivityCorrection=Pick<Activity,'name'|'type'|'date'|'minutes'|'distanceKm'>;
export function editManualActivity(state:HealthState,original:Activity,correction:ActivityCorrection,today:string):HealthState {
  if(original.source!=='manual')throw new Error('Edit imported activities in their source app.');
  const matches=state.activities.filter(a=>a.id===original.id&&a.source==='manual');
  if(matches.length!==1||JSON.stringify(matches[0])!==JSON.stringify(original))throw new Error('This activity changed. Close and reopen it before saving.');
  if(!calendarDate(today)||!calendarDate(correction.date)||correction.date>today)throw new Error('Choose today or an earlier activity date.');
  if(!correction.name.trim()||!correction.type.trim())throw new Error('Enter an activity name and type.');
  const next:Activity={id:original.id,source:'manual',name:correction.name.trim(),type:correction.type,date:correction.date,minutes:correction.minutes,...(correction.distanceKm!==undefined?{distanceKm:correction.distanceKm}:{})};
  return validateHealth({...state,activities:state.activities.map(a=>a===matches[0]?next:a).sort((a,b)=>b.date.localeCompare(a.date))});
}
