import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
function load(file){const out=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;const m={exports:{}};new Function('require','module','exports',out)(id=>load(path.resolve(path.dirname(file),id+'.ts')),m,m.exports);return m.exports;}
const {createMarathonDraft}=load('src/lib/health/marathon-progression.ts');
const {activateMarathonDraft,proposeLighterWeek,restoreWeekTargets}=load('src/lib/health/marathon-training.ts');
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

test('session feedback survives health storage and archiving in both plan formats',()=>{
 const legacy=createTraining({id:'plan-legacy',start:'2026-11-02',experience:'starting',minutes:20,days:[1,3,5],strength:false});
 for(const original of [legacy,plan()]){
  const first=original.sessions[0];const completed=updateTraining(original,first.id,{status:'completed'},first.date);
  const feedback={effort:'hard',note:'  Windy; slowed down on the way back.  ',updatedOn:first.date};
  const reflected=updateTraining(completed,first.id,{feedback},first.date);
  const expected={...feedback,note:feedback.note.trim()};
  assert.deepEqual(reflected.sessions[0].feedback,expected);
  const state=validateHealth({...structuredClone(emptyHealth),profile:{...emptyHealth.profile,training:reflected}});
  assert.deepEqual(state.profile.training.sessions[0].feedback,expected);assert.equal(state.activities.length,0);
  const replacement=createTraining({...legacy,id:'plan-replacement'});
  assert.deepEqual(saveTrainingBlock(reflected,[],replacement,first.date).trainingHistory[0].plan.sessions[0].feedback,expected);
  const reopened=updateTraining(reflected,first.id,{status:'planned'},first.date);
  assert.equal(reopened.sessions[0].feedback,undefined);assert.deepEqual(reflected.sessions[0].feedback,expected);
  const cleared=updateTraining(reflected,first.id,{feedback:undefined},first.date);assert.equal(cleared.sessions[0].status,'completed');assert.equal(cleared.sessions[0].feedback,undefined);
 }
});
test('feedback rejects unfinished sessions, unsupported efforts, oversized notes and inconsistent dates',()=>{
 const p=plan(),first=p.sessions[0],feedback={effort:'easy',note:'',updatedOn:first.date};
 assert.throws(()=>updateTraining(p,first.id,{feedback},first.date),/completed/);
 const completed=updateTraining(p,first.id,{status:'completed'},first.date);
 for(const bad of [{...feedback,effort:'excellent'},{...feedback,note:'x'.repeat(281)},{...feedback,note:null},{...feedback,updatedOn:'invalid'},{...feedback,updatedOn:p.start}])assert.throws(()=>updateTraining(completed,first.id,{feedback:bad},first.date));
 assert.throws(()=>validateTraining({...completed,sessions:completed.sessions.map((s,i)=>i?s:{...s,feedback:{...feedback,updatedOn:p.start}})}));
 const reflected=updateTraining(completed,first.id,{feedback},first.date);assert.equal(reflected.sessions[0].feedback.note,'');
});

test('lighter week preserves completed feedback, skips, race and all other weeks',()=>{
 let p=plan();const first=p.sessions[0],second=p.sessions[1];
 p=updateTraining(p,first.id,{status:'completed'},first.date);
 p=updateTraining(p,first.id,{feedback:{effort:'hard',note:'A tiring run',updatedOn:first.date}},first.date);
 p=updateTraining(p,second.id,{status:'skipped'},first.date);
 const before=structuredClone(p),lighter=proposeLighterWeek(p,0,first.date);
 assert.deepEqual(p,before);assert.equal(lighter.adjustments.length,1);assert.equal(lighter.adjustments[0].sessionIds.length,2);
 for(const s of p.sessions){const next=lighter.sessions.find(n=>n.id===s.id);if(lighter.adjustments[0].sessionIds.includes(s.id))assert.ok(next.distanceKm<s.distanceKm);else assert.deepEqual(next,s);}
 assert.deepEqual(validateHealth({...structuredClone(emptyHealth),profile:{...emptyHealth.profile,training:lighter}}).profile.training,lighter);
 assert.throws(()=>proposeLighterWeek(lighter,0,first.date),/already/);
 assert.deepEqual(restoreWeekTargets(lighter,0,first.date),p);
 const raceWeek=proposeLighterWeek(plan(),19,plan().start);assert.deepEqual(raceWeek.sessions.at(-1),plan().sessions.at(-1));
});
test('adjustments cannot forge distances, target race day, repeat a week or move before application',()=>{
 const p=plan(),lighter=proposeLighterWeek(p,0,p.start),record=lighter.adjustments[0];
 assert.throws(()=>validateTraining({...lighter,adjustments:[record,record]}));
 assert.throws(()=>validateTraining({...lighter,adjustments:[{...record,scale:0.5}]}));
 assert.throws(()=>validateTraining({...lighter,adjustments:[{...record,sessionIds:[p.sessions.at(-1).id]}]}));
 assert.throws(()=>validateTraining({...lighter,sessions:lighter.sessions.map((s,i)=>i?s:{...s,distanceKm:s.distanceKm+1})}));
 const applied=proposeLighterWeek(p,0,p.sessions[1].date);
 assert.throws(()=>updateTraining(applied,p.sessions[1].id,{date:p.start},p.start),/adjustment date/);
 assert.throws(()=>proposeLighterWeek(p,0,'2026-11-09'),/current or upcoming/);
});
test('restore cannot rewrite completed or past adjusted runs; archives retain target changes',()=>{
 const p=plan(),lighter=proposeLighterWeek(p,0,p.start),first=lighter.sessions[0];
 const completed=updateTraining(lighter,first.id,{status:'completed'},first.date);
 assert.throws(()=>restoreWeekTargets(completed,0,first.date),/before any affected/);
 assert.throws(()=>restoreWeekTargets(lighter,0,'2026-11-04'),/before any affected/);
 const replacement=createTraining({id:'plan-next',start:p.start,experience:'starting',minutes:20,days:[1,3,5],strength:false});
 assert.deepEqual(saveTrainingBlock(completed,[],replacement,first.date).trainingHistory[0].plan,completed);
 assert.deepEqual(lighter.marathon,p.marathon);
});
test('lighter targets remain valid through recovery and later completion without changing their blueprint',()=>{
 const p=plan(),lighter=proposeLighterWeek(p,1,p.start),id=lighter.adjustments[0].sessionIds[0];
 const recovery=updateTraining(lighter,id,{kind:'recovery'},p.start);assert.equal(recovery.sessions.find(s=>s.id===id).distanceKm,undefined);
 const restored=restoreWeekTargets(recovery,1,p.start);assert.equal(restored.sessions.find(s=>s.id===id).kind,'recovery');assert.equal(restored.adjustments,undefined);
 for(let week=0;week<p.marathon.weeks.length;week++){
  const reduced=proposeLighterWeek(p,week,p.start);for(const id of reduced.adjustments[0].sessionIds){const s=reduced.sessions.find(s=>s.id===id);assert.ok(s.distanceKm>0);assert.ok(s.distanceKm<=p.sessions.find(s=>s.id===id).distanceKm*.8+1e-6);}
 }
});
