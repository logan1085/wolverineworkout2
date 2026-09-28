import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import path from 'node:path';
function load(file){const source=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;const compiled={exports:{}};new Function('require','module','exports',source)(id=>load(path.resolve(path.dirname(file),id+'.ts')),compiled,compiled.exports);return compiled.exports;}
const {dailyTasks,routineStreak}=load('src/lib/health/routine.ts');
const {validateHealth,emptyHealth}=load('src/lib/health/model.ts');
const state=()=>({...structuredClone(emptyHealth),profile:{name:'',goal:'Routine',minutes:20,routine:{goals:['movement','reflection','rest'],pace:'gentle',startedAt:'2026-09-01'}}});
test('old profiles remain valid; routine validation rejects unsupported and duplicate goals',()=>{assert.deepEqual(validateHealth(emptyHealth),emptyHealth);assert.deepEqual(validateHealth(state()).profile.routine,state().profile.routine);for(const goals of [[],['bogus'],['rest','rest']]){const s=state();s.profile.routine.goals=goals;assert.throws(()=>validateHealth(s));}});
test('tasks follow chosen goals, adapt to energy, and recognize saved actions',()=>{const s=state();s.profile.routine.goals=['movement'];assert.equal(dailyTasks(s,'2026-09-28').length,1);assert.match(dailyTasks(s,'2026-09-28')[0].title,/rest/);s.activities=[{date:'2026-09-28'}];assert.equal(dailyTasks(s,'2026-09-28')[0].automatic,true);s.profile.routine.pace='steady';s.checkIns=[{date:'2026-09-28',energy:1}];assert.match(dailyTasks(s,'2026-09-28')[0].title,/rest/);});
test('streak deduplicates sources, ignores future and pre-onboarding dates, and preserves yesterday',()=>{const s=state();s.completed=['2026-09-26:routine-rest','2026-09-27:routine-rest','2026-09-29:routine-rest','2026-08-31:routine-rest'];s.checkIns=[{date:'2026-09-27'}];assert.deepEqual(routineStreak(s,'2026-09-28'),{current:2,best:2,days:['2026-09-26','2026-09-27']});s.completed.push('2026-09-28:routine-rest');assert.equal(routineStreak(s,'2026-09-28').current,3);});
test('missed day resets current but retains best; rest completion is undoable',()=>{const s=state();s.completed=['2026-09-23:routine-rest','2026-09-24:routine-rest','2026-09-28:routine-rest'];assert.equal(routineStreak(s,'2026-09-28').current,1);assert.equal(routineStreak(s,'2026-09-28').best,2);assert.equal(dailyTasks(s,'2026-09-28').find(t=>t.id==='rest').done,true);s.completed.pop();assert.equal(routineStreak(s,'2026-09-28').current,0);assert.equal(dailyTasks(s,'2026-09-28').find(t=>t.id==='rest').done,false);});
test('streak crosses month boundaries in local calendar dates',()=>{const s=state();s.completed=['2026-09-30:routine-rest','2026-10-01:routine-rest'];assert.equal(routineStreak(s,'2026-10-02').current,2);});

test('routine and briefing share stress, sleep, and stale-record pacing rules',()=>{
 const s=state();s.profile.routine.pace='steady';
 s.checkIns=[{date:'2026-09-28',energy:4,soreness:1,stress:5,sleepHours:8}];
 assert.match(dailyTasks(s,'2026-09-28')[0].title,/rest/);
 s.checkIns=[];s.metrics=[{date:'2026-09-28',sleepHours:4}];
 assert.match(dailyTasks(s,'2026-09-28')[0].title,/rest/);
 assert.equal(dailyTasks(s,'2026-09-29')[0].title,'20 minutes of movement');
 s.checkIns=[{date:'2026-09-28',energy:4,soreness:1,stress:1,sleepHours:8}];
 assert.equal(dailyTasks(s,'2026-09-28')[0].title,'20 minutes of movement');
});
test('wind-down suggestion respects a five-minute preference',()=>{
 const s=state();s.profile.minutes=5;s.profile.routine.pace='steady';
 assert.match(dailyTasks(s,'2026-09-28').find(t=>t.id==='rest').detail,/5 quiet minutes/);
});
