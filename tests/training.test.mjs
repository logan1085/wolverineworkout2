import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import path from 'node:path';
function load(file){const out=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;const m={exports:{}};new Function('require','module','exports',out)(id=>load(path.resolve(path.dirname(file),id+'.ts')),m,m.exports);return m.exports;}
const {createTraining,validateTraining,updateTraining,addDays,sessionSteps}=load('src/lib/health/training.ts');
const {validateHealth,emptyHealth}=load('src/lib/health/model.ts');
const input=()=>({id:'plan-test',start:'2026-09-28',experience:'regular',minutes:30,days:[1,3,5],strength:true});
test('four-week block respects days, stable workload and recovery across weeks',()=>{const p=createTraining(input());assert.equal(p.sessions.length,16);const runs=p.sessions.filter(s=>s.kind==='run');assert.equal(runs.length,12);assert.ok(runs.every(s=>s.minutes===30&&[1,3,5].includes(new Date(s.date+'T12:00:00Z').getUTCDay())));assert.ok(runs.every((s,i)=>!i||s.date>addDays(runs[i-1].date,1)));assert.equal(new Set(p.sessions.map(s=>s.date)).size,16);});
test('beginner block caps duration, counts walking and includes warmup/cooldown',()=>{const p=createTraining({...input(),experience:'starting',minutes:60});const run=p.sessions.find(s=>s.kind==='run');assert.equal(run.minutes,20);assert.match(sessionSteps(run,p).join(' '),/Walking the whole session counts/);assert.equal(sessionSteps(run,p).filter(s=>s.startsWith('5 min')).length,2);});
test('bad preferences, consecutive days and invalid calendar dates are rejected',()=>{for(const patch of [{days:[1,2]},{days:[0,6]},{days:[1,1]},{days:[1]},{minutes:NaN},{minutes:14},{start:'2026-02-30'}])assert.throws(()=>createTraining({...input(),...patch}));});
test('rescheduling rejects collisions, past dates and adjacent runs',()=>{const p=createTraining(input());const run=p.sessions[0];for(const date of ['2026-09-27','2026-09-29','2026-10-01','2026-11-03',''])assert.throws(()=>updateTraining(p,run.id,{date},'2026-09-28'));const moved=updateTraining(p,run.id,{date:'2026-10-26'},'2026-09-28');assert.equal(moved.sessions.find(s=>s.id===run.id).date,'2026-10-26');assert.equal(p.sessions[0].date,'2026-09-28');});
test('completion, undo and skip are explicit and future completion is rejected',()=>{const p=createTraining(input());assert.throws(()=>updateTraining(p,p.sessions[1].id,{status:'completed'},'2026-09-28'));const done=updateTraining(p,p.sessions[0].id,{status:'completed'},'2026-09-28');assert.equal(done.sessions[0].status,'completed');assert.throws(()=>updateTraining(done,done.sessions[0].id,{date:'2026-10-26'},'2026-09-28'));assert.equal(updateTraining(done,done.sessions[0].id,{status:'planned'},'2026-09-28').sessions[0].status,'planned');assert.equal(updateTraining(p,p.sessions[0].id,{status:'skipped'},'2026-09-28').sessions[0].status,'skipped');});
test('recovery replaces workload without marking a session completed',()=>{const p=createTraining(input());const next=updateTraining(p,p.sessions[0].id,{kind:'recovery'},'2026-09-28');assert.equal(next.sessions[0].minutes,10);assert.equal(next.sessions[0].kind,'recovery');assert.equal(next.sessions[0].status,'planned');});
test('old health data survives and training round trips through health validation',()=>{assert.deepEqual(validateHealth(emptyHealth),emptyHealth);const p=createTraining(input());const state={...structuredClone(emptyHealth),profile:{...emptyHealth.profile,training:p}};assert.deepEqual(validateHealth(JSON.parse(JSON.stringify(state))).profile.training,p);assert.deepEqual(validateHealth(state).activities,[]);});
test('validation strips extra fields, rejects duplicate IDs and excessive sessions',()=>{const p=createTraining(input());assert.equal(validateTraining({...p,secret:'discard'}).secret,undefined);assert.throws(()=>validateTraining({...p,sessions:[...p.sessions,p.sessions[0]]}));assert.throws(()=>validateTraining({...p,sessions:p.sessions.map((s,i)=>({...s,id:i===1?p.sessions[0].id:s.id}))}));});
test('calendar arithmetic crosses DST, leap day and year boundaries consistently',()=>{assert.equal(addDays('2026-10-31',2),'2026-11-02');assert.equal(addDays('2028-02-28',1),'2028-02-29');assert.equal(addDays('2026-12-31',1),'2027-01-01');});
test('optional race date survives persisted health validation and rejects impossible dates',()=>{
 const state=structuredClone(emptyHealth);
 state.profile.raceDate='2026-11-01';
 assert.equal(validateHealth(JSON.parse(JSON.stringify(state))).profile.raceDate,'2026-11-01');
 for(const raceDate of ['2026-02-30','',null,20261101])assert.throws(()=>validateHealth({...state,profile:{...state.profile,raceDate}}));
 delete state.profile.raceDate;
 assert.equal(validateHealth(state).profile.raceDate,undefined);
});
const {saveTrainingBlock,validateTrainingHistory,MAX_TRAINING_ARCHIVES}=load('src/lib/health/training.ts');
test('replacement archives exact completed, skipped and unfinished work without mutating either block',()=>{
 const original=createTraining(input());
 const old=updateTraining(updateTraining(original,original.sessions[0].id,{status:'completed'},'2026-09-28'),original.sessions[1].id,{status:'skipped'},'2026-09-28');
 const next=createTraining({...input(),id:'plan-next',start:'2026-10-05'});
 const before=JSON.stringify({old,next});
 const result=saveTrainingBlock(old,[],next,'2026-10-05');
 assert.deepEqual(result.training,next);
 assert.deepEqual(result.trainingHistory,[{plan:old,archivedAt:'2026-10-05'}]);
 assert.equal(JSON.stringify({old,next}),before);
 const persisted=validateHealth({...structuredClone(emptyHealth),profile:{...emptyHealth.profile,...result}});
 assert.deepEqual(persisted.profile.trainingHistory,result.trainingHistory);
 assert.equal(persisted.activities.length,0);
});
test('updating the active block does not archive it or overwrite existing history',()=>{
 const old=createTraining(input());
 const next=createTraining({...input(),id:'plan-next',start:'2026-10-05'});
 const first=saveTrainingBlock(old,[],next,'2026-10-05');
 const update=updateTraining(next,next.sessions[0].id,{status:'completed'},'2026-10-05');
 const result=saveTrainingBlock(first.training,first.trainingHistory,update,'2026-10-05');
 assert.equal(result.trainingHistory.length,1);
 assert.deepEqual(result.trainingHistory,first.trainingHistory);
 assert.equal(result.training.sessions[0].status,'completed');
});
test('archive validation rejects duplicate active IDs, invalid metadata and archive reactivation',()=>{
 const plan=createTraining(input());
 const entry={plan,archivedAt:'2026-10-05'};
 assert.throws(()=>validateTrainingHistory([entry],plan.id));
 assert.throws(()=>validateTrainingHistory([entry,entry]));
 assert.throws(()=>validateTrainingHistory([{...entry,archivedAt:'2026-02-30'}]));
 assert.throws(()=>validateTrainingHistory('invalid'));
 assert.throws(()=>saveTrainingBlock(undefined,[entry],plan,'2026-10-05'));
 assert.equal(validateTrainingHistory([{...entry,private:'ignored'}])[0].private,undefined);
});
test('full history never silently drops old work and rejects replacement without changing input',()=>{
 const current=createTraining(input());
 const history=Array.from({length:MAX_TRAINING_ARCHIVES},(_,i)=>({plan:createTraining({...input(),id:`plan-history-${i}`}),archivedAt:'2026-10-05'}));
 const snapshot=JSON.stringify(history);
 assert.throws(()=>saveTrainingBlock(current,history,createTraining({...input(),id:'plan-next'}),'2026-10-05'),/full/);
 assert.equal(JSON.stringify(history),snapshot);
 assert.equal(saveTrainingBlock(current,history,current,'2026-10-05').trainingHistory.length,MAX_TRAINING_ARCHIVES);
});
