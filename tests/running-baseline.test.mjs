import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
function load(file){const out=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;const m={exports:{}};new Function('require','module','exports',out)(id=>load(path.resolve(path.dirname(file),id+'.ts')),m,m.exports);return m.exports;}
const {validateRunningBaseline,toKilometres,displayDistance,baselineIsStale}=load('src/lib/health/running-baseline.ts');
const {validateHealth,emptyHealth}=load('src/lib/health/model.ts');
const base=()=>({weeklyKm:32,longestRunKm:12,daysPerWeek:4,unit:'km',recordedAt:'2026-10-05'});
test('miles and kilometres retain meaning through conversion',()=>{
 assert.equal(toKilometres(10,'mi'),16.093);
 assert.equal(displayDistance(16.093,'mi'),10);
 assert.equal(toKilometres(10,'km'),10);
 for(const miles of [0,0.1,3.1,6.2,13.1,26.2,100])assert.equal(displayDistance(toKilometres(miles,'mi'),'mi'),miles);
});
test('zero running is valid; missing or contradictory running is not',()=>{
 assert.deepEqual(validateRunningBaseline({...base(),weeklyKm:0,longestRunKm:0,daysPerWeek:0}),{...base(),weeklyKm:0,longestRunKm:0,daysPerWeek:0});
 for(const patch of [{weeklyKm:0},{daysPerWeek:0},{longestRunKm:0},{longestRunKm:129},{weeklyKm:NaN},{weeklyKm:Infinity},{weeklyKm:-1},{weeklyKm:'32'},{daysPerWeek:2.5},{daysPerWeek:8},{unit:'miles'},{recordedAt:'2026-02-30'}])assert.throws(()=>validateRunningBaseline({...base(),...patch}));
 // The longest run can exceed the weekly average after a quieter week.
 assert.equal(validateRunningBaseline({...base(),weeklyKm:8,longestRunKm:20}).longestRunKm,20);
});
test('assessment round trips and old profiles remain compatible; unsupported fields are stripped',()=>{
 assert.deepEqual(validateHealth(emptyHealth),emptyHealth);
 const state={...structuredClone(emptyHealth),profile:{...emptyHealth.profile,runningBaseline:{...base(),score:99}}};
 assert.deepEqual(validateHealth(JSON.parse(JSON.stringify(state))).profile.runningBaseline,base());
 assert.throws(()=>validateHealth({...state,profile:{...state.profile,runningBaseline:null}}));
});
test('staleness is calendar based and starts after four weeks',()=>{
 assert.equal(baselineIsStale(base(),'2026-11-02'),false);
 assert.equal(baselineIsStale(base(),'2026-11-03'),true);
 assert.equal(baselineIsStale({...base(),recordedAt:'2026-12-20'},'2027-01-18'),true);
});
