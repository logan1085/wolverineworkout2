import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import {test} from 'node:test';
import assert from 'node:assert/strict';
const cache=new Map();
function load(file){file=path.resolve(file);if(cache.has(file))return cache.get(file).exports;const m={exports:{}};cache.set(file,m);new Function('module','exports','require',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(m,m.exports,name=>load(path.resolve(path.dirname(file),name+'.ts')));return m.exports;}
const {runningHistory,demoRunningHistory}=load('src/lib/health/running-history.ts');
const run=(date,distanceKm,minutes=30,type='Running')=>({id:date,name:'Test',date,distanceKm,minutes,type,source:'manual'});
test('rolling window excludes future, old and non-running records; counts unique running days',()=>{
 const h=runningHistory([run('2026-10-18',5),run('2026-10-18',2),run('2026-09-21',3),run('2026-09-20',9),run('2026-10-19',9),run('2026-10-17',9,30,'Cycling')],'2026-10-18');assert.equal(h.count,3);assert.equal(h.days,2);assert.equal(h.km,10);assert.equal(h.weeks[0].count,1);assert.equal(h.weeks[3].count,2);
});
test('pace is distance weighted, unknown distances excluded, empty weeks have no pace',()=>{
 const h=runningHistory([run('2026-10-17',5,30),run('2026-10-18',10,50),run('2026-10-16',undefined,90),run('2026-10-15',0,30)],'2026-10-18');assert.equal(h.weeks[3].pace,80/15);assert.equal(h.longest,10);assert.equal(h.missing,2);assert.equal(h.weeks[0].pace,null);
});
test('synthetic example is independent and deterministic without changing supplied records',()=>{
 const original=[run('2026-10-18',3)];const copy=JSON.stringify(original);assert.equal(runningHistory(demoRunningHistory('2026-10-18'),'2026-10-18').count,12);runningHistory(original,'2026-10-18');assert.equal(JSON.stringify(original),copy);
});
