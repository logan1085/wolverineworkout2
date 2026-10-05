import fs from 'node:fs';import path from 'node:path';import ts from 'typescript';import assert from 'node:assert/strict';import {test} from 'node:test';
function load(file){const m={exports:{}};new Function('require','module','exports',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(id=>load(path.resolve(path.dirname(file),id+'.ts')),m,m.exports);return m.exports;}
const {activityDistanceUnit,parseActivityDistance,correctedActivityDistance}=load('src/lib/health/activity-distance.ts');
const {displayDistance}=load('src/lib/health/running-baseline.ts');
const {emptyHealth,validateHealth}=load('src/lib/health/model.ts');
test('active plan units lead, baseline provides fallback, new runners default to km',()=>{
 assert.equal(activityDistanceUnit({}),'km');assert.equal(activityDistanceUnit({runningBaseline:{unit:'mi'}}),'mi');assert.equal(activityDistanceUnit({training:{marathon:{inputs:{baseline:{unit:'km'}}}},runningBaseline:{unit:'mi'}}),'km');
});
test('mile entry survives canonical health validation and displays back in miles',()=>{
 const km=parseActivityDistance('3.1','mi');assert.equal(km,4.989);
 const state=validateHealth({...emptyHealth,activities:[{id:'test-mile',date:'2026-10-05',type:'Running',name:'Fictional run',minutes:30,source:'manual',distanceKm:km}]});
 assert.equal(displayDistance(state.activities[0].distanceKm,'mi'),3.1);assert.equal(displayDistance(state.activities[0].distanceKm,'km'),5);
});
test('blank differs from zero; existing km values do not receive mile conversion',()=>{
 assert.equal(parseActivityDistance('','mi'),undefined);assert.equal(parseActivityDistance('  ','km'),undefined);assert.equal(parseActivityDistance('0','mi'),0);assert.equal(parseActivityDistance('5.123','km'),5.123);
});
test('invalid or excessive distances fail before storage regardless of entered unit',()=>{
 for(const [value,unit] of [['-1','mi'],['NaN','km'],['Infinity','mi'],['1001','km'],['622','mi'],['5','miles']])assert.throws(()=>parseActivityDistance(value,unit));assert.equal(parseActivityDistance('1000','km'),1000);
});

test('editing other fields preserves precise distance despite rounded display; explicit changes are converted',()=>{
 assert.equal(correctedActivityDistance('1.9','mi',3,'mi'),3);assert.equal(correctedActivityDistance('5.1','km',5.123,'km'),5.123);assert.equal(correctedActivityDistance('2','mi',3,'mi'),3.219);assert.equal(correctedActivityDistance('1.9','km',3,'mi'),1.9);assert.equal(correctedActivityDistance('','mi',3,'mi'),undefined);
});
