import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import {test} from 'node:test';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
function load(file) { const compiled={exports:{}}; new Function('require','module','exports',ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(name=>name.startsWith('.')?load(path.resolve(path.dirname(file),name+'.ts')):require(name),compiled,compiled.exports); return compiled.exports; }
const {buildContextBrief}=load('src/lib/health/context-brief.ts');
const now=Date.parse('2026-09-21T12:00:00Z');
const health={profile:{name:'',goal:'Walk',minutes:20},checkIns:[],metrics:[],activities:[],completed:[]};
const entry=(id,expiresOn=null)=>({id,text:'Confirmed '+id,category:'goal',source:'manual',createdAt:'2026-09-20T00:00:00Z',updatedAt:'2026-09-20T00:00:00Z',expiresOn});
test('paused and expired facts cannot enter brief',()=>{const state={enabled:true,entries:[entry('active'),entry('old','2026-09-19')],conversations:[]};assert.deepEqual(buildContextBrief(health,state,now).confirmed.map(x=>x.id),['active']);assert.equal(buildContextBrief(health,{...state,enabled:false},now).confirmed.length,0);});
test('calendar window excludes old and future records and identifies source differences',()=>{const state={enabled:false,entries:[]};const data={...health,checkIns:[{id:'a',date:'2026-09-21',sleepHours:8},{id:'old',date:'2026-09-14',sleepHours:4},{id:'future',date:'2026-09-22',sleepHours:4}],metrics:[{date:'2026-09-21',sleepHours:6}]};const brief=buildContextBrief(data,state,now);assert.equal(brief.recent.checkIns.length,1);assert.equal(brief.discrepancies.length,1);assert.equal(brief.discrepancies[0].selfReported,8);assert.equal(brief.discrepancies[0].garmin,6);});
test('deleting a fact immediately removes it; brief is bounded and never mutates memory',()=>{const state={enabled:true,entries:Array.from({length:15},(_,i)=>entry(String(i)))};const before=JSON.stringify(state);const brief=buildContextBrief(health,state,now);assert.equal(brief.confirmed.length,12);assert.equal(brief.additionalActiveFacts,3);assert.equal(JSON.stringify(state),before);assert.equal(buildContextBrief(health,{...state,entries:[]},now).confirmed.length,0);});
