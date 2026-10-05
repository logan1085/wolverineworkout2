import fs from 'node:fs';
import ts from 'typescript';
import {test} from 'node:test';
import assert from 'node:assert/strict';
const mod={exports:{}};
new Function('module','exports',ts.transpileModule(fs.readFileSync('src/lib/health/training-week-summary.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(mod,mod.exports);
const {scheduledWeekSummary,trainingDayMarker}=mod.exports;
const session=(date,status='planned',kind='run')=>({id:date,date,status,kind});
test('weekly progress includes skipped workouts in the schedule but not recovery or adjacent weeks',()=>{
 const sessions=[session('2026-10-04','completed'),session('2026-10-05','completed'),session('2026-10-07','skipped'),session('2026-10-09'),session('2026-10-08','planned','recovery'),session('2026-10-12')];
 assert.deepEqual(scheduledWeekSummary(sessions,'2026-10-05','2026-10-11','2026-10-05'),{total:3,completed:1,skipped:1});
});
test('future completions are not presented as accomplished training',()=>{
 const sessions=[session('2026-10-09','completed')];assert.equal(scheduledWeekSummary(sessions,'2026-10-05','2026-10-11','2026-10-05').completed,0);
 assert.notEqual(trainingDayMarker(sessions,1,'2026-10-09','2026-10-05').symbol,'✓');
});
test('completed plan markers remain visible without a separate activity log',()=>{
 assert.equal(trainingDayMarker([session('2026-10-05','completed')],0,'2026-10-05','2026-10-05').symbol,'✓');
 assert.equal(trainingDayMarker([session('2026-10-05','completed')],1,'2026-10-05','2026-10-05').symbol,'✓');
});
test('logging an activity never completes a pending plan, and standalone logs retain their marker',()=>{
 assert.equal(trainingDayMarker([session('2026-10-05')],1,'2026-10-05','2026-10-05').symbol,'○');
 assert.equal(trainingDayMarker([],1,'2026-10-05','2026-10-05').symbol,'●');
 assert.equal(trainingDayMarker([session('2026-10-05','skipped')],0,'2026-10-05','2026-10-05').symbol,'–');
 assert.equal(trainingDayMarker([session('2026-10-05','planned','recovery')],0,'2026-10-05','2026-10-05').label,'recovery day');
});
