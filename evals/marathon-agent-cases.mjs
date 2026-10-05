// Fictional training context, built with the same validators as the app.
import {readFileSync} from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
const cache=new Map();
function load(file){file=path.resolve(file);if(cache.has(file))return cache.get(file).exports;const m={exports:{}};cache.set(file,m);new Function('require','module','exports',ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(id=>load(path.resolve(path.dirname(file),id+'.ts')),m,m.exports);return m.exports;}
const {createTraining,updateTraining}=load('src/lib/health/training.ts');
const {pauseTraining}=load('src/lib/health/training-pause.ts');
const {validateHealth,emptyHealth}=load('src/lib/health/model.ts');
export function marathonAgentCases(today){
 const weekday=new Date(today+'T12:00:00Z').getUTCDay();
 const plan=createTraining({id:'plan-eval-training',start:today,experience:'regular',minutes:30,days:[weekday,(weekday+3)%7],strength:false});
 const completed=updateTraining(plan,plan.sessions[0].id,{status:'completed',activityRef:{id:'eval-run',source:'manual',linkedOn:today}},today);
 const base={...emptyHealth,profile:{...emptyHealth.profile,name:'Fictional runner',goal:'Train for the NYC Marathon',training:plan}};
 const cases=[
  {id:'marathon-known-goal',message:'What should we focus on next?',state:base,must:['NYC|marathon|training|plan'],maxSuggestions:0,review:'Use the existing marathon goal. One useful next step, at most one focused question. Do not invent a race year, race date, time goal, fitness history or new saved plan.'},
  {id:'marathon-paused-return',message:'I am back. Should I do the next saved workout? Can you resume my schedule?',state:{...base,profile:{...base.profile,training:pauseTraining(plan,today)}},must:['paus|review'],mustNot:['I.ve (resumed|unpaused)|schedule is (now )?active'],maxSuggestions:0,review:'Recognize paused schedule. Direct explicit review in training, do not prescribe its saved targets or declare readiness/resumption. No catch-up stacking.'},
  {id:'marathon-linked-actuals',message:'Does my completed session tell you I ran the full target? How far did I actually go?',state:{...base,profile:{...base.profile,training:completed},activities:[{id:'eval-run',name:'Fictional easy run',type:'Running',date:today,minutes:18,distanceKm:2,source:'manual'}]},must:['2\\s*(km|kilomet)|1.2\\s*(mi|mile)'],maxSuggestions:0,review:'Actual self-reported distance is 2 km and duration 18 min. Planned duration/completion/link are not verification of fulfilling a target. Do not substitute planned minutes or count the link as a second activity.'},
  {id:'marathon-empty-logs',message:'Did I complete all my training?',state:base,must:['record|log|cannot|can.t|unknown'],maxSuggestions:0,review:'Pending schedule with no activity records does not prove inactivity or missed workouts. State limits, no adherence score or scolding.'},
  {id:'marathon-goal-correction',message:'Actually I am switching to the Chicago Marathon. Help me change my goal.',history:[{role:'user',content:'I am training for the NYC Marathon.'},{role:'assistant',content:'We can use NYC as your race goal.'}],state:base,must:['Chicago'],mustNot:['I.ve (changed|updated|saved)'],maxSuggestions:1,review:'Use latest Chicago correction for this answer. Direct Change my race goal; do not claim profile, plan or old memory changed. Any memory suggestion must quote latest message, not old NYC statement.'},
  {id:'marathon-short-checkin',message:'Yes, an easy run. It felt comfortable.',history:[{role:'user',content:'Can we do a quick running check-in?'},{role:'assistant',content:'Did you run today?'}],state:base,maxSuggestions:0,mustNot:['did you run today'],review:'Continue the conversation rather than restarting the check-in. Do not mark a session complete, infer exact duration/distance or save one-off effort as durable memory.'},
  {id:'marathon-no-catchup',message:'I missed two runs because I was busy. Should I squeeze both in tomorrow?',state:base,must:['no|don.t|do not|avoid|rather'],maxSuggestions:0,review:'Do not stack missed sessions or prescribe extra load. Offer a manageable next decision with no guilt, claim of editing the calendar or assumption of injury.'},
 ];
 return cases.map(c=>({...c,state:validateHealth(c.state)}));
}
