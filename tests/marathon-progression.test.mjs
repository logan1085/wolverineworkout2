import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
function load(file){const out=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;const m={exports:{}};new Function('require','module','exports',out)(id=>load(path.resolve(path.dirname(file),id+'.ts')),m,m.exports);return m.exports;}
const {createMarathonDraft}=load('src/lib/health/marathon-progression.ts');
const {addDays}=load('src/lib/health/training.ts');
const input=()=>({id:'plan-progression',raceName:'Test marathon',raceDate:'2027-03-21',asOf:'2026-11-02',weeks:20,runDays:[0,2,3,5],longRunDay:0,baseline:{weeklyKm:40,longestRunKm:16,daysPerWeek:4,unit:'km',recordedAt:'2026-11-02'}});
test('proposal preserves input, starts from actual workload and ends on race day',()=>{
 const source=input(),before=JSON.stringify(source),plan=createMarathonDraft(source);
 assert.equal(JSON.stringify(source),before);
 assert.equal(plan.weeks.length,20);
 assert.equal(plan.start,'2026-11-02');
 assert.equal(plan.weeks[0].trainingKm,40);
 assert.equal(plan.weeks[1].trainingKm,40);
 assert.ok(plan.weeks[0].longestTrainingKm<=source.baseline.longestRunKm);
 assert.deepEqual(plan.weeks.at(-1).sessions.at(-1),{id:'marathon-race',date:source.raceDate,kind:'race',distanceKm:42.195});
 source.baseline.weeklyKm=99;source.runDays.push(6);
 assert.equal(plan.inputs.baseline.weeklyKm,40);assert.equal(plan.inputs.runDays.length,4);
});
test('recovery, taper and race mileage are distinct and workload is bounded',()=>{
 const plan=createMarathonDraft(input()),weeks=plan.weeks;
 let peak=0,peakLong=0;
 for(const week of weeks){
   const training=week.sessions.filter(s=>s.kind!=='race');
   assert.equal(training.reduce((n,s)=>n+s.distanceKm,0),week.trainingKm);
   assert.ok(training.every(s=>Number.isFinite(s.distanceKm)&&s.distanceKm>0&&s.distanceKm<=30));
   assert.ok(week.trainingKm<=60);
   if(week.phase==='build'){assert.ok(week.trainingKm<=peak*1.05+1e-9);assert.ok(week.longestTrainingKm<=peakLong*1.1+1e-9);}
   if(week.phase==='recovery')assert.ok(week.trainingKm<peak&&week.longestTrainingKm<peakLong);
   peak=Math.max(peak,week.trainingKm);peakLong=Math.max(peakLong,week.longestTrainingKm);
 }
 assert.ok(weeks.some(w=>w.phase==='recovery'));
 assert.equal(weeks.at(-3).phase,'taper');assert.equal(weeks.at(-2).phase,'taper');
 assert.ok(weeks.at(-2).trainingKm<weeks.at(-3).trainingKm);
 assert.ok(weeks.at(-1).trainingKm<weeks.at(-2).trainingKm);
 assert.equal(weeks.at(-1).raceKm,42.195);
 assert.ok(weeks.at(-1).sessions.every(s=>s.kind==='race'||s.date<addDays(input().raceDate,-1)));
});
test('date and workload matrix covers race weekdays, DST, year boundaries and supported lengths',()=>{
 for(const n of [16,20,24])for(const volume of [40,50,60])for(let day=0;day<7;day++){
   const raceDate=addDays('2027-03-21',day),asOf=addDays(raceDate,1-n*7);
   const plan=createMarathonDraft({...input(),weeks:n,raceDate,asOf,baseline:{...input().baseline,weeklyKm:volume,longestRunKm:volume*.4,recordedAt:asOf}});
   const all=plan.weeks.flatMap(w=>w.sessions),dates=new Set(all.map(s=>s.date));
   assert.equal(dates.size,all.length);
   assert.equal(all.filter(s=>s.kind==='race').length,1);
   assert.ok(all.every(s=>s.date>=asOf&&s.date<=raceDate&&s.distanceKm>0));
   for(const s of all.filter(s=>s.kind==='long')){
     assert.ok(!dates.has(addDays(s.date,-1))&&!dates.has(addDays(s.date,1)));
   }
   for(const week of plan.weeks.slice(0,-1))assert.equal(week.sessions.length,4);
   assert.equal(plan.weeks.at(-1).end,raceDate);
 }
});
test('unsupported, missing, stale and contradictory inputs fail instead of inventing a plan',()=>{
 const b=input().baseline;
 for(const patch of [{weeks:8},{weeks:25},{raceDate:'2027-02-30'},{asOf:'2026-12-01'},{asOf:'2026-09-01'},{runDays:[0,2,3]},{runDays:[0,2,3,6]},{runDays:[0,2,3,4]},{longRunDay:6},{baseline:{...b,weeklyKm:0,longestRunKm:0,daysPerWeek:0}},{baseline:{...b,weeklyKm:61}},{baseline:{...b,longestRunKm:5}},{baseline:{...b,daysPerWeek:2}},{baseline:{...b,recordedAt:'2026-09-01'}},{baseline:{...b,recordedAt:'2026-11-03'}}])assert.throws(()=>createMarathonDraft({...input(),...patch}));
});
test('longer preparation spreads progression rather than plateauing at peak months early',()=>{
 for(const weeklyKm of [40,50,60]){
   const raceDate='2027-03-21',asOf=addDays(raceDate,1-24*7);
   const plan=createMarathonDraft({...input(),weeks:24,raceDate,asOf,baseline:{...input().baseline,weeklyKm,longestRunKm:weeklyKm*.4,recordedAt:asOf}});
   const work=plan.weeks.slice(0,-3),peak=work.at(-1).trainingKm;
   assert.ok(work.slice(0,-1).every(w=>w.trainingKm<peak));
 }
});
