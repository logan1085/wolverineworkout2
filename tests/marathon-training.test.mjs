import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
function load(file){const out=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;const m={exports:{}};new Function('require','module','exports',out)(id=>load(path.resolve(path.dirname(file),id+'.ts')),m,m.exports);return m.exports;}
const {createMarathonDraft}=load('src/lib/health/marathon-progression.ts');
const {activateMarathonDraft}=load('src/lib/health/marathon-training.ts');
const {createTraining,updateTraining,validateTraining,saveTrainingBlock,sessionTarget,trainingEnd}=load('src/lib/health/training.ts');
const {validateHealth,emptyHealth}=load('src/lib/health/model.ts');
const input=()=>({id:'plan-marathon',raceName:'Test race',raceDate:'2027-03-21',asOf:'2026-11-02',weeks:20,runDays:[0,2,3,5],longRunDay:0,baseline:{weeklyKm:40,longestRunKm:16,daysPerWeek:4,unit:'km',recordedAt:'2026-11-02'}});
const plan=()=>activateMarathonDraft(createMarathonDraft(input()),input().asOf);
test('activation round trips as distances without inventing minutes; old block remains archived',()=>{
 const next=plan();assert.equal(next.sessions.length,80);assert.ok(next.sessions.every(s=>s.minutes===undefined));assert.match(sessionTarget(next.sessions[0],next),/km$/);assert.equal(trainingEnd(next),'2027-03-21');
 const old=createTraining({id:'plan-old',start:'2026-10-05',experience:'starting',minutes:20,days:[1,3,5],strength:false});
 const result=saveTrainingBlock(old,[],next,'2026-11-02');
 const state=validateHealth({...structuredClone(emptyHealth),profile:{...emptyHealth.profile,...result}});
 assert.deepEqual(state.profile.training,next);assert.deepEqual(state.profile.trainingHistory[0].plan,old);assert.equal(state.activities.length,0);
 assert.throws(()=>activateMarathonDraft(createMarathonDraft(input()),'2026-11-03'),/Refresh/);
});
test('completion, skip and recovery preserve original planned distances and prohibit future completion',()=>{
 const p=plan(),first=p.sessions[0];assert.throws(()=>updateTraining(p,first.id,{status:'completed'},p.start));
 const done=updateTraining(p,first.id,{status:'completed'},first.date);assert.equal(done.sessions[0].status,'completed');
 const recovery=updateTraining(p,first.id,{kind:'recovery'},p.start);assert.equal(recovery.sessions[0].minutes,10);assert.equal(recovery.sessions[0].distanceKm,undefined);
 assert.equal(recovery.marathon.weeks[0].sessions[0].distanceKm,first.distanceKm);
 const skipped=updateTraining(p,first.id,{status:'skipped'},p.start);assert.equal(skipped.sessions[0].status,'skipped');
});
test('distance tampering, duplicate sessions and race alterations fail validation',()=>{
 const p=plan(),race=p.sessions.at(-1);
 assert.throws(()=>validateTraining({...p,sessions:p.sessions.map((s,i)=>i? s:{...s,distanceKm:100})}));
 assert.throws(()=>validateTraining({...p,sessions:[...p.sessions.slice(1),p.sessions[1]]}));
 assert.throws(()=>updateTraining(p,race.id,{kind:'recovery'},p.start));assert.throws(()=>updateTraining(p,race.id,{date:'2027-03-20'},p.start));
 assert.throws(()=>validateTraining({...p,id:'plan-other'}));
});
test('moves stay inside original week and preserve long-run recovery spacing',()=>{
 const p=plan(),first=p.sessions[0];
 assert.throws(()=>updateTraining(p,first.id,{date:'2026-11-09'},p.start),/original week/);
 assert.throws(()=>updateTraining(p,first.id,{date:'2026-11-07'},p.start),/long run|consecutive/);
 const moved=updateTraining(p,first.id,{date:'2026-11-02'},p.start);assert.equal(moved.sessions.find(s=>s.id===first.id).date,'2026-11-02');
});
