import fs from 'node:fs';
import ts from 'typescript';
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {NextRequest}=require('next/server');
const source=ts.transpileModule(fs.readFileSync('src/app/auth/callback/route.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
function load(exchange){const loadedModule={exports:{}};new Function('require','module','exports',source)(name=>name==='@/lib/supabase-server'?{createClient:async()=>({auth:{exchangeCodeForSession:exchange}})}:require(name),loadedModule,loadedModule.exports);return loadedModule.exports.GET;}
async function run(query,exchange){const response=await load(exchange)(new NextRequest('https://wolverine.test/auth/callback'+query));assert.equal(response.status,303);assert.equal(response.headers.get('cache-control'),'private, no-store');assert.equal(response.headers.get('referrer-policy'),'no-referrer');return response.headers.get('location');}
test('missing, duplicate, oversized and rejected-provider callbacks do not exchange or leak input',async()=>{
 for(const query of ['', '?code=', '?code=a&code=b','?error=access_denied&error_description=secret&code=a','?code='+ 'x'.repeat(4097)]){
 assert.equal(await run(query,()=>{throw Error('must not exchange');}),'https://wolverine.test/auth/confirmed?result=invalid');
 }
});
test('successful exchange stays on the fixed app destination regardless of redirect inputs',async()=>{
 let received;const target=await run('?code=one-time-code&next=https://evil.test&redirectTo=//evil.test',async code=>{received=code;return {data:{session:{},user:{id:'synthetic-user'}},error:null};});
 assert.equal(received,'one-time-code');assert.equal(target,'https://wolverine.test/auth/confirmed?result=confirmed');
});
test('expired or used codes and incomplete exchange results never claim success',async()=>{
 for(const result of [{data:{session:null,user:null},error:{status:400,message:'private-provider-detail'}},{data:{session:{},user:null},error:null}])assert.equal(await run('?code=used',async()=>result),'https://wolverine.test/auth/confirmed?result=invalid');
});
test('network, configuration and provider outages produce a recoverable result without error details',async()=>{
 for(const exchange of [async()=>{throw Error('private endpoint');},async()=>({data:{},error:{status:503,message:'private'}}),async()=>({data:{},error:{status:0}})])assert.equal(await run('?code=synthetic',exchange),'https://wolverine.test/auth/confirmed?result=unavailable');
});
const React=require('react');
const {renderToStaticMarkup}=require('react-dom/server');
const pageSource=ts.transpileModule(fs.readFileSync('src/app/auth/confirmed/page.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
async function page(result,getUser){const loadedModule={exports:{}};new Function('require','module','exports',pageSource)(name=>name==='@/lib/supabase-server'?{getAuthenticatedUser:getUser}:name==='./confirmation.css'?{}:name==='next/link'?{__esModule:true,default:({prefetch,...props})=>{void prefetch;return React.createElement('a',props);}}:require(name),loadedModule,loadedModule.exports);return renderToStaticMarkup(await loadedModule.exports.default({searchParams:Promise.resolve({result})}));}
test('forged success query cannot show success without a verified user',async()=>{const html=await page('confirmed',async()=>null);assert.match(html,/Let’s get you signed in/);assert.doesNotMatch(html,/You’re ready/);assert.match(html,/tab=Connections/);});
test('verified signed-in user can return to training without exposing account details',async()=>{const html=await page('confirmed',async()=>({id:'synthetic',email:'private@example.test'}));assert.match(html,/You’re ready/);assert.match(html,/tab=Today/);assert.doesNotMatch(html,/private@example/);});
test('failure pages remain usable when the backend cannot be reached',async()=>{const html=await page('confirmed',async()=>{throw Error('private-config');});assert.match(html,/Let’s try again shortly/);assert.doesNotMatch(html,/private-config/);});
test('recovery destination requires successful code exchange; flags alone never authenticate',async()=>{
 assert.equal(await run('?flow=recovery',()=>{throw Error('not called');}),'https://wolverine.test/auth/confirmed?result=invalid');
 assert.equal(await run('?flow=recovery&code=synthetic',async()=>({data:{session:{},user:{id:'u'}},error:null})),'https://wolverine.test/auth/reset-password');
});
