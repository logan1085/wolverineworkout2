import fs from 'node:fs';
import ts from 'typescript';
import assert from 'node:assert/strict';
import {test} from 'node:test';
const m={exports:{}};
new Function('module','exports',ts.transpileModule(fs.readFileSync('src/components/health/training-world-asset.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(m,m.exports);
const {fetchTrainingWorldAsset}=m.exports;
const stalled=signal=>new Promise((resolve,reject)=>{if(signal.aborted)reject(signal.reason);else signal.addEventListener('abort',()=>reject(signal.reason),{once:true});});
test('stalled response times out instead of keeping stadium loading forever',async()=>{
 await assert.rejects(fetchTrainingWorldAsset(new AbortController().signal,10,async(_,o)=>stalled(o.signal)),{name:'TimeoutError'});
});
test('deadline includes a stalled response body',async()=>{
 await assert.rejects(fetchTrainingWorldAsset(new AbortController().signal,10,async(_,o)=>({ok:true,arrayBuffer:()=>stalled(o.signal)})),{name:'TimeoutError'});
});
test('leaving the scene cancels immediately and retry can succeed',async()=>{
 const c=new AbortController();const pending=fetchTrainingWorldAsset(c.signal,10000,async(_,o)=>stalled(o.signal));c.abort();await assert.rejects(pending,{name:'AbortError'});
 let signal;const bytes=await fetchTrainingWorldAsset(new AbortController().signal,10,async(_,o)=>{signal=o.signal;return new Response(new Uint8Array([1,2,3]));});assert.deepEqual([...new Uint8Array(bytes)],[1,2,3]);await new Promise(r=>setTimeout(r,20));assert.equal(signal.aborted,false,'successful download clears deadline');
});
test('HTTP error rejects and does not pass an error page to the GLB parser',async()=>{
 await assert.rejects(fetchTrainingWorldAsset(new AbortController().signal,100,async()=>new Response('unavailable',{status:503})),/Stadium asset unavailable/);
});
