import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const js=ts.transpileModule(fs.readFileSync('src/lib/health/calendar.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const compiled={exports:{}};
new Function('module','exports',js)(compiled,compiled.exports);
const {calendarMonth,calendarDay}=compiled.exports;
test('calendar aligns Monday first and includes leap day',()=>{
 const days=calendarMonth(2024,1);
 assert.deepEqual(days.slice(0,4),[null,null,null,'2024-02-01']);
 assert.equal(days.filter(Boolean).length,29);
 assert.ok(days.includes('2024-02-29'));
 assert.equal(days.length%7,0);
});
test('month navigation normalizes year boundaries without losing days',()=>{
 assert.equal(calendarMonth(2026,12).find(Boolean),'2027-01-01');
 assert.equal(calendarMonth(2026,-1).find(Boolean),'2025-12-01');
 assert.equal(calendarMonth(2026,1).filter(Boolean).length,28);
});
test('day agenda includes only matching records and preserves zero values',()=>{
 const state={checkIns:[{date:'2026-09-25',energy:1}],metrics:[{date:'2026-09-25',steps:0}],activities:[{id:'a',date:'2026-09-24'},{id:'b',date:'2026-09-25'}],completed:['2026-09-25:rest','2026-09-24:move']};
 const day=calendarDay(state,'2026-09-25');
 assert.equal(day.hasRecord,true);assert.equal(day.metric.steps,0);
 assert.deepEqual(day.activities.map(a=>a.id),['b']);assert.equal(day.completed.length,1);
 assert.equal(calendarDay(state,'2026-09-26').hasRecord,false);
});
