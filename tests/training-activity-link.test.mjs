import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import assert from 'node:assert/strict';
import {test} from 'node:test';
function load(file){const m={exports:{}};new Function('require','module','exports',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(id=>load(path.resolve(path.dirname(file),id+'.ts')),m,m.exports);return m.exports;}
const {linkTrainingActivity,unlinkTrainingActivity}=load('src/lib/health/training-activity-link.ts');
const {createTraining,updateTraining,saveTrainingBlock}=load('src/lib/health/training.ts');
const {emptyHealth,validateHealth}=load('src/lib/health/model.ts');
const {createMarathonDraft}=load('src/lib/health/marathon-progression.ts');
const {activateMarathonDraft}=load('src/lib/health/marathon-training.ts');
const today='2026-10-05';
const makePlan=(id='plan-test')=>createTraining({id,start:today,experience:'regular',minutes:30,days:[1,3,5],strength:false});
const activity={id:'test-activity',source:'manual',type:'Run',date:today,name:'Fictional easy run',minutes:23,distanceKm:3};
test('explicit linking completes the session without changing its target or activity',()=>{
 const plan=makePlan(),before=structuredClone(activity);
 const linked=linkTrainingActivity(plan,[],[activity],plan.sessions[0].id,activity,today);
 assert.equal(linked.sessions[0].status,'completed');assert.equal(linked.sessions[0].minutes,30);assert.equal(plan.sessions[0].status,'planned');assert.deepEqual(activity,before);
 const state=validateHealth({...structuredClone(emptyHealth),profile:{...emptyHealth.profile,training:linked},activities:[activity]});
 assert.deepEqual(state.activities,[activity]);assert.equal(state.profile.training.sessions[0].activityRef.id,activity.id);
});
test('missing, ambiguous, future, wrong-date, skipped and recovery matches fail',()=>{
 const p=makePlan(),id=p.sessions[0].id;
 assert.throws(()=>linkTrainingActivity(p,[],[],id,activity,today));
 assert.throws(()=>linkTrainingActivity(p,[],[activity,activity],id,activity,today));
 assert.throws(()=>linkTrainingActivity(p,[],[{...activity,date:'2026-10-06'}],id,activity,today));
 assert.throws(()=>linkTrainingActivity(p,[],[activity],id,activity,'2026-10-04'));
 for(const patch of [{status:'skipped'},{kind:'recovery'}])assert.throws(()=>linkTrainingActivity(updateTraining(p,id,patch,today),[],[activity],id,activity,today));
});
test('unlink and reopen keep actual data; unlink preserves completion while reopen clears feedback',()=>{
 const p=makePlan(),id=p.sessions[0].id;
 const linked=linkTrainingActivity(p,[],[activity],id,activity,today);
 const reflected=updateTraining(linked,id,{feedback:{effort:'easy',note:'Synthetic reflection',updatedOn:today}},today);
 const unlinked=unlinkTrainingActivity(reflected,id,today);assert.equal(unlinked.sessions[0].status,'completed');assert.ok(unlinked.sessions[0].feedback);assert.equal(unlinked.sessions[0].activityRef,undefined);
 const reopened=updateTraining(reflected,id,{status:'planned'},today);assert.equal(reopened.sessions[0].activityRef,undefined);assert.equal(reopened.sessions[0].feedback,undefined);
});
test('a linked activity cannot complete another plan, including a record in an archive',()=>{
 const p=makePlan(),linked=linkTrainingActivity(p,[],[activity],p.sessions[0].id,activity,today),next=makePlan('plan-next');
 const saved=saveTrainingBlock(linked,[],next,today);
 assert.throws(()=>linkTrainingActivity(next,saved.trainingHistory,[activity],next.sessions[0].id,activity,today),/one planned session/);
 const forged=linkTrainingActivity(next,[],[activity],next.sessions[0].id,activity,today);
 assert.throws(()=>validateHealth({...structuredClone(emptyHealth),profile:{...emptyHealth.profile,training:forged,trainingHistory:saved.trainingHistory},activities:[activity]}),/one planned session/);
});
test('missing activity references survive backups honestly, and source IDs stay distinct',()=>{
 const p=makePlan(),linked=linkTrainingActivity(p,[],[activity],p.sessions[0].id,activity,today);
 const state=validateHealth({...structuredClone(emptyHealth),profile:{...emptyHealth.profile,training:linked},activities:[]});assert.equal(state.profile.training.sessions[0].activityRef.id,activity.id);
 const garmin={...activity,source:'garmin'};assert.equal(linkTrainingActivity(makePlan('plan-new'),[{plan:linked,archivedAt:today}],[garmin],'session-0',garmin,today).sessions[0].activityRef.source,'garmin');
});
test('marathon linking preserves prescribed distance and survives validation',()=>{
 const draft=createMarathonDraft({id:'plan-marathon',raceName:'Test',raceDate:'2027-02-21',asOf:today,weeks:20,runDays:[0,2,3,5],longRunDay:0,baseline:{weeklyKm:40,longestRunKm:16,daysPerWeek:4,unit:'km',recordedAt:today}});
 const p=activateMarathonDraft(draft,today),s=p.sessions[0],actual={...activity,date:s.date};
 const linked=linkTrainingActivity(p,[],[actual],s.id,actual,s.date);
 assert.equal(linked.sessions[0].distanceKm,s.distanceKm);assert.equal(linked.sessions[0].minutes,undefined);
 const state=validateHealth({...structuredClone(emptyHealth),profile:{...emptyHealth.profile,training:linked},activities:[actual]});assert.equal(state.profile.training.sessions[0].activityRef.id,actual.id);
});
