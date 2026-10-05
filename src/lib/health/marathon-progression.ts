import { addDays, calendarDate } from './calendar-date';
import { baselineIsStale, validateRunningBaseline, type RunningBaseline } from './running-baseline';

export type MarathonInputs = {
  id: string;
  raceName: string;
  raceDate: string;
  asOf: string;
  weeks: number;
  runDays: number[];
  longRunDay: number;
  baseline: RunningBaseline;
};
export type MarathonPhase = 'foundation' | 'build' | 'recovery' | 'taper' | 'race';
export type MarathonSession = { id:string; date:string; kind:'easy'|'long'|'race'; distanceKm:number };
export type MarathonWeek = {
  number:number; start:string; end:string; phase:MarathonPhase;
  trainingKm:number; raceKm:number; longestTrainingKm:number;
  sessions:MarathonSession[];
};
export type MarathonDraft = {
  version:'marathon-draft-v1';
  inputs:MarathonInputs;
  start:string;
  weeks:MarathonWeek[];
  notices:string[];
};
const floorHalf=(km:number)=>Math.floor((km+1e-9)*2)/2;
const sum=(sessions:MarathonSession[])=>Math.round(sessions.reduce((n,s)=>n+s.distanceKm,0)*1000)/1000;
const weekday=(date:string)=>new Date(date+'T12:00:00Z').getUTCDay();

export function marathonWeeksForDate(raceDate:string,asOf:string):number {
  if(!calendarDate(raceDate)||!calendarDate(asOf))return 0;
  return Math.floor(((Date.parse(raceDate)-Date.parse(asOf))/86400000+1)/7);
}

/** Product support boundaries, not a readiness score or medical clearance. */
export function validateMarathonInputs(value:MarathonInputs):MarathonInputs {
  if(!value||typeof value!=='object')throw new Error('Enter your marathon details.');
  if(typeof value.id!=='string'||!/^plan-[a-zA-Z0-9-]{1,60}$/.test(value.id))throw new Error('Invalid plan identifier.');
  if(typeof value.raceName!=='string'||!value.raceName.trim()||value.raceName.trim().length>100||/[\r\n]/.test(value.raceName))throw new Error('Enter your race name.');
  if(!calendarDate(value.raceDate)||!calendarDate(value.asOf))throw new Error('Choose valid calendar dates.');
  if(!Number.isInteger(value.weeks)||value.weeks<16||value.weeks>24)throw new Error('This marathon draft supports 16–24 weeks; it cannot compress preparation into a shorter plan.');
  const start=addDays(value.raceDate,1-value.weeks*7);
  if(start<value.asOf||start>addDays(value.asOf,6))throw new Error('Choose a 16–24 week length that starts within the next seven days and ends on race day.');
  const baseline=validateRunningBaseline(value.baseline);
  if(baseline.recordedAt>value.asOf||baselineIsStale(baseline,value.asOf))throw new Error('Update your recent-running assessment before creating a marathon draft.');
  if(baseline.weeklyKm<40||baseline.weeklyKm>60||baseline.daysPerWeek<4||baseline.daysPerWeek>5||baseline.longestRunKm<16||baseline.longestRunKm>30||baseline.longestRunKm<baseline.weeklyKm/4)throw new Error('This draft currently supports runners averaging 40–60 km over four or five days a week, with a recent longest run of 16–30 km. This is a product limit, not a judgment of your ability.');
  const days=value.runDays;
  if(!Array.isArray(days)||days.length!==4||new Set(days).size!==4||!days.every(d=>Number.isInteger(d)&&d>=0&&d<=6)||!Number.isInteger(value.longRunDay)||!days.includes(value.longRunDay))throw new Error('Choose four running days and one of them for your long run.');
  if(days.includes((value.longRunDay+1)%7)||days.includes((value.longRunDay+6)%7))throw new Error('Leave the day before and after your long run free of running.');
  if(days.some(d=>days.includes((d+1)%7)&&days.includes((d+2)%7)))throw new Error('Avoid three consecutive running days.');
  return {id:value.id,raceName:value.raceName.trim(),raceDate:value.raceDate,asOf:value.asOf,weeks:value.weeks,runDays:[...days].sort(),longRunDay:value.longRunDay,baseline};
}

/** Original, deterministic proposal. Not yet an activated/adaptive training plan. */
export function createMarathonDraft(value:MarathonInputs):MarathonDraft {
  const inputs=validateMarathonInputs(value);
  const start=addDays(inputs.raceDate,1-inputs.weeks*7);
  let peakWeekly=floorHalf(inputs.baseline.weeklyKm);
  let peakLong=floorHalf(Math.min(inputs.baseline.longestRunKm,peakWeekly*.4));
  const weeklyCeiling=Math.min(75,floorHalf(inputs.baseline.weeklyKm*1.5));
  const initialWeekly=peakWeekly,initialLong=peakLong;
  const longCeiling=Math.min(30,weeklyCeiling*.45);
  const buildCount=Array.from({length:inputs.weeks-3},(_,i)=>i).filter(i=>i>=2&&i%4!==3).length;
  let buildStep=0;
  const weeks:MarathonWeek[]=[];
  for(let i=0;i<inputs.weeks;i++) {
    const weekStart=addDays(start,i*7),weekEnd=addDays(weekStart,6);
    let phase:MarathonPhase,trainingKm:number,longKm:number;
    const weeksToRace=inputs.weeks-1-i;
    if(weeksToRace===0){phase='race';trainingKm=floorHalf(peakWeekly*.2);longKm=0;}
    else if(weeksToRace<=2){phase='taper';trainingKm=floorHalf(peakWeekly*(weeksToRace===2?.7:.5));longKm=floorHalf(Math.min(weeksToRace===2?16:10,peakLong*(weeksToRace===2?.6:.4)));}
    else if(i%4===3){phase='recovery';trainingKm=floorHalf(peakWeekly*.8);longKm=floorHalf(peakLong*.75);}
    else {
      phase=i<2?'foundation':'build';
      if(i>=2){
        buildStep++;
        // Spread growth across the available build weeks, rather than reaching peak early.
        const fraction=buildStep/buildCount;
        const targetWeekly=floorHalf(initialWeekly*Math.pow(weeklyCeiling/initialWeekly,fraction));
        const targetLong=floorHalf(initialLong*Math.pow(longCeiling/initialLong,fraction));
        peakWeekly=Math.min(targetWeekly,floorHalf(peakWeekly*1.05));
        peakLong=floorHalf(Math.min(targetLong,peakWeekly*.45,peakLong*1.1));
      }
      trainingKm=peakWeekly;longKm=peakLong;
    }
    const dates=Array.from({length:7},(_,n)=>addDays(weekStart,n));
    const longDate=dates.find(date=>weekday(date)===inputs.longRunDay)!;
    const easyDates=dates.filter(date=>inputs.runDays.includes(weekday(date))&&(phase==='race'?date<addDays(inputs.raceDate,-1):date!==longDate));
    // Distribute half-kilometre targets; retain the exact weekly total in the last easy run.
    const easyBudget=trainingKm-longKm;
    const equalEasy=floorHalf(easyBudget/easyDates.length);
    const sessions:MarathonSession[]=easyDates.map((date,n)=>({id:`marathon-${i+1}-easy-${n+1}`,date,kind:'easy',distanceKm:n===easyDates.length-1?easyBudget-equalEasy*(easyDates.length-1):equalEasy}));
    if(phase==='race')sessions.push({id:'marathon-race',date:inputs.raceDate,kind:'race',distanceKm:42.195});
    else sessions.push({id:`marathon-${i+1}-long`,date:longDate,kind:'long',distanceKm:longKm});
    sessions.sort((a,b)=>a.date.localeCompare(b.date));
    const training=sessions.filter(s=>s.kind!=='race');
    weeks.push({number:i+1,start:weekStart,end:weekEnd,phase,trainingKm:sum(training),raceKm:phase==='race'?42.195:0,longestTrainingKm:Math.max(...training.map(s=>s.distanceKm)),sessions});
  }
  return {
    version:'marathon-draft-v1',inputs,start,weeks,
    notices:[
      'An original planning proposal, not a prediction of readiness or finish time. It becomes a saved schedule only after explicit activation.',
      'All training runs are at a comfortable conversational effort. No race pace is inferred from your goal.',
      'Recovery weeks reduce planned distance; the following build resumes progression from the previous high week. This is not catch-up work.',
      'Race week uses short runs on your available days, leaves the day before the race free, and places the marathon on its actual date even if it is not a usual running day.',
      'Training totals exclude the marathon itself. Distances do not imply durations, and missed sessions must not be stacked into later days.',
      'If running causes pain, stop and seek appropriate professional advice. This proposal is not rehabilitation guidance.',
    ],
  };
}
