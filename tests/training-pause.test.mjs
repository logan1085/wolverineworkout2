import fs from 'node:fs';import path from 'node:path';import ts from 'typescript';import assert from 'node:assert/strict';import {test} from 'node:test';
function load(file){const m={exports:{}};new Function('require','module','exports',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(id=>load(path.resolve(path.dirname(file),id+'.ts')),m,m.exports);return m.exports;}
const {pauseTraining,resumeTraining}=load('src/lib/health/training-pause.ts');
const {createTraining,updateTraining,validateTraining,saveTrainingBlock,sessionSteps}=load('src/lib/health/training.ts');
const {validateHealth,emptyHealth}=load('src/lib/health/model.ts');
const {createMarathonDraft}=load('src/lib/health/marathon-progression.ts');
const {activateMarathonDraft,proposeLighterWeek,restoreWeekTargets}=load('src/lib/health/marathon-training.ts');
const {trainingDayMarker}=load('src/lib/health/training-week-summary.ts');
const today='2026-10-05';
const make=()=>createTraining({id:'plan-pause',start:today,experience:'regular',minutes:30,days:[1,3,5],strength:false});
test('pause preserves dates, status, reflection and actual activity reference through export validation',()=>{
 let p=updateTraining(make(),'session-0',{status:'completed',feedback:{effort:'easy',note:'Fictional',updatedOn:today},activityRef:{id:'a',source:'manual',linkedOn:today}},today);
 const paused=pauseTraining(p,today);assert.deepEqual(paused.sessions,p.sessions);assert.equal(p.pausedOn,undefined);
 const state=validateHealth(JSON.parse(JSON.stringify({...emptyHealth,profile:{...emptyHealth.profile,training:paused}})));assert.equal(state.profile.training.pausedOn,today);assert.deepEqual(state.profile.training.sessions,p.sessions);
});
test('pause is explicit; missing records never automatically create one',()=>{assert.equal(validateTraining(make()).pausedOn,undefined);assert.throws(()=>pauseTraining(make(),'invalid'));assert.throws(()=>pauseTraining(pauseTraining(make(),today),today));assert.throws(()=>validateTraining({...make(),pausedOn:'2026-02-31'}));});
test('continuing requires explicit review and never moves or stacks the saved schedule',()=>{
 const p=pauseTraining(make(),today);assert.throws(()=>resumeTraining(p,'2026-10-12',false));assert.throws(()=>resumeTraining(p,'2026-10-04',true));
 const next=resumeTraining(p,'2026-10-12',true);assert.equal(next.pausedOn,undefined);assert.deepEqual(next.sessions,p.sessions);assert.equal(next.sessions[0].status,'planned');
});
test('paused sessions cannot change status, kind or date; prior work and reflections remain editable',()=>{
 const p=pauseTraining(make(),'2026-10-07');
 for(const patch of [{status:'completed'},{kind:'recovery'},{date:'2026-10-09'}])assert.throws(()=>updateTraining(p,'session-1',patch,'2026-10-09'),/paused/);
 assert.throws(()=>updateTraining(p,'session-0',{date:'2026-10-13'},'2026-10-09'),/paused/);
 const before=updateTraining(p,'session-0',{status:'completed'},'2026-10-09');assert.equal(before.sessions[0].status,'completed');
 assert.equal(updateTraining(before,'session-0',{feedback:{effort:'easy',note:'Recorded later',updatedOn:'2026-10-09'}},'2026-10-09').sessions[0].feedback.note,'Recorded later');
});
test('marathon pause survives archiving and prevents target edits',()=>{
 const p=activateMarathonDraft(createMarathonDraft({id:'plan-marathon',raceName:'Test',raceDate:'2027-02-21',asOf:today,weeks:20,runDays:[0,2,3,5],longRunDay:0,baseline:{weeklyKm:40,longestRunKm:16,daysPerWeek:4,unit:'km',recordedAt:today}}),today);
 const adjusted=proposeLighterWeek(p,0,today),paused=pauseTraining(adjusted,today);
 assert.equal(validateTraining(paused).pausedOn,today);assert.throws(()=>proposeLighterWeek(paused,1,today),/paused/);assert.throws(()=>restoreWeekTargets(paused,0,today),/paused/);
 assert.equal(saveTrainingBlock(paused,[],make(),today).trainingHistory[0].plan.pausedOn,today);
});
test('calendar and instructions describe saved paused work without offering a workout',()=>{
 const p=pauseTraining(make(),today),s=p.sessions[0];assert.match(sessionSteps(s,p)[0],/paused/);
 assert.equal(trainingDayMarker([s],0,s.date,today,p.pausedOn).label,'paused scheduled session');
 assert.equal(trainingDayMarker([{...s,status:'completed'}],1,s.date,today,p.pausedOn).symbol,'✓');
});
