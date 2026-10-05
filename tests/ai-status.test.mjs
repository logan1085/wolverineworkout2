import fs from 'node:fs';
import ts from 'typescript';
import assert from 'node:assert/strict';
import {test} from 'node:test';
const m={exports:{}};
new Function('module','exports',ts.transpileModule(fs.readFileSync('src/lib/health/ai-status.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(m,m.exports);
const {checkAIStatus}=m.exports;
test('missing key never makes a provider request',async()=>{assert.equal(await checkAIStatus(undefined,undefined,()=>{throw Error('must not call');}),'not_configured');});
test('only a provider 401 is authentication failure; no provider error text escapes',async()=>{
 assert.equal(await checkAIStatus('synthetic',undefined,async()=>new Response('secret-sensitive error',{status:401})),'authentication_failed');
 for(const status of [403,404,429,500])assert.equal(await checkAIStatus('synthetic',undefined,async()=>new Response('{}',{status})),'unverified');
});
test('reachable means matching metadata only; request sends no user context or generation',async()=>{
 let captured;const result=await checkAIStatus('synthetic','example/model',async(url,options)=>{captured={url,options};return Response.json({object:'model',id:'example/model'});});
 assert.equal(result,'reachable');assert.equal(captured.url,'https://api.openai.com/v1/models/example%2Fmodel');assert.equal(captured.options.body,undefined);assert.equal(captured.options.method,undefined);assert.equal(captured.options.redirect,'error');assert.equal(captured.options.cache,'no-store');assert.ok(captured.options.signal instanceof AbortSignal);
});
test('bad JSON, wrong model, invalid body and transport failures are unverified',async()=>{
 for(const fetcher of [async()=>new Response('bad'),async()=>Response.json({id:'another',object:'model'}),async()=>Response.json(null),async()=>{throw Error('DNS');}])assert.equal(await checkAIStatus('synthetic','test-model',fetcher),'unverified');
});
