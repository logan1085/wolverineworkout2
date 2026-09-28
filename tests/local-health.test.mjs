import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
function load(file){const source=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;const compiled={exports:{}};new Function('require','module','exports',source)(id=>load(path.resolve(path.dirname(file),id+'.ts')),compiled,compiled.exports);return compiled.exports;}
const {readLocalHealth,commitLocalHealth,HEALTH_STORAGE_KEY}=load('src/lib/health/local-health.ts');
function storage(){const map=new Map();return {getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)};}
test('stale second tab cannot overwrite a first tab completion',()=>{
 const store=storage();const a=readLocalHealth(store),b=readLocalHealth(store);
 commitLocalHealth(store,{...a.state,completed:['2026-09-28:routine-rest']},a.raw);
 assert.throws(()=>commitLocalHealth(store,{...b.state,completed:['2026-09-28:routine-movement']},b.raw),/another tab/);
 assert.deepEqual(readLocalHealth(store).state.completed,['2026-09-28:routine-rest']);
 const refreshed=readLocalHealth(store);
 commitLocalHealth(store,{...refreshed.state,completed:[...refreshed.state.completed,'2026-09-28:routine-movement']},refreshed.raw);
 assert.equal(readLocalHealth(store).state.completed.length,2);
});
test('stale deletion is rejected and refreshed deletion returns an empty snapshot',()=>{
 const store=storage();const old=readLocalHealth(store);const current=commitLocalHealth(store,{...old.state,completed:['2026-09-28:routine-rest']},old.raw);
 assert.throws(()=>commitLocalHealth(store,null,old.raw),/another tab/);
 assert.equal(commitLocalHealth(store,null,current.raw).raw,null);
 assert.equal(store.getItem(HEALTH_STORAGE_KEY),null);
});
test('invalid data and storage failure do not change persisted state',()=>{
 const store=storage();const before=readLocalHealth(store);
 assert.throws(()=>commitLocalHealth(store,{...before.state,profile:{...before.state.profile,minutes:-1}},before.raw));
 assert.equal(store.getItem(HEALTH_STORAGE_KEY),null);
 const unavailable={...store,setItem:()=>{throw new Error('quota');}};
 assert.throws(()=>commitLocalHealth(unavailable,before.state,before.raw),/quota/);
 assert.equal(store.getItem(HEALTH_STORAGE_KEY),null);
 store.setItem(HEALTH_STORAGE_KEY,'broken');assert.throws(()=>readLocalHealth(store));
});
