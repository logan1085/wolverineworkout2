import fs from 'node:fs';
import ts from 'typescript';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import {test} from 'node:test';
const require=createRequire(import.meta.url);
// No real provider traffic or credentials. Exercise the installed SDK's serialization.
test('legacy Mem0 v3 retains user-scoped add/search and normalizes results',async()=>{
 const oldFetch=globalThis.fetch,oldKey=process.env.MEM0_API_KEY,oldTelemetry=process.env.MEM0_TELEMETRY,oldEnable=process.env.ENABLE_MEMORY;
 const calls=[],pending=[];
 process.env.MEM0_API_KEY='synthetic-contract-only';process.env.MEM0_TELEMETRY='false';process.env.ENABLE_MEMORY='true';
 globalThis.fetch=async(url,options={})=>{
  const parsed=new URL(url);assert.equal(parsed.origin,'https://api.mem0.ai');
  const body=options.body?JSON.parse(options.body):undefined;calls.push({path:parsed.pathname,body});
  if(parsed.pathname==='/v1/ping/')return Response.json({status:'ok'});
  if(parsed.pathname==='/v3/memories/search/')return Response.json({results:[{memory:'Synthetic preference'}]});
  if(parsed.pathname==='/v3/memories/add/')return Response.json({results:[]});
  throw new Error('Unexpected request in isolated contract test');
 };
 try{
  const loadedModule={exports:{}};
  new Function('require','module','exports','setTimeout',ts.transpileModule(fs.readFileSync('src/lib/memory.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(id=>id==='@/lib/logger'?{log:{debug(){},warn(){},error(){}},redact:()=>'(redacted)'}:require(id),loadedModule,loadedModule.exports,fn=>pending.push(fn));
  const service=loadedModule.exports.memoryService;
  assert.deepEqual(await service.getUserMemories('runner-A','synthetic query'),[{memory:'Synthetic preference'}]);
  await service.getUserMemories('runner-B','another query');
  const searches=calls.filter(c=>c.path==='/v3/memories/search/');
  assert.deepEqual(searches.map(c=>c.body.filters),[{user_id:'runner-A'},{user_id:'runner-B'}]);
  assert.ok(searches.every(c=>!('user_id' in c.body)));
  await service.storeUserPreferences('runner-A',{goals:'Fictional marathon'},'Fictional preference');
  for(const fn of pending)await fn();
  const adds=calls.filter(c=>c.path==='/v3/memories/add/');assert.equal(adds.length,2);
  assert.ok(adds.every(c=>c.body.user_id==='runner-A'&&!('userId' in c.body)));
  const before=calls.length;service.setEnabled(false);assert.deepEqual(await service.getUserMemories('runner-A'),[]);assert.equal(calls.length,before);
 }finally{
  globalThis.fetch=oldFetch;
  for(const [key,value] of [['MEM0_API_KEY',oldKey],['MEM0_TELEMETRY',oldTelemetry],['ENABLE_MEMORY',oldEnable]]){if(value===undefined)delete process.env[key];else process.env[key]=value;}
 }
});
