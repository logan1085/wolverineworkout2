import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
function load(file,dependencies={}){const m={exports:{}};new Function('require','module','exports',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(id=>{if(!(id in dependencies))throw new Error('Unexpected dependency '+id);return dependencies[id];},m,m.exports);return m.exports;}
const voice=load('src/lib/health/voice.ts');
const {releaseVoice}=load('src/lib/health/voice-client.ts');
test('voice config has fixed server-owned instructions and bounded output; no stored context or tools',()=>{const c=voice.runVoiceConfig();assert.equal(c.type,'realtime');assert.equal(c.max_output_tokens,220);assert.equal(c.audio.output.voice,'marin');assert.equal(c.tools,undefined);assert.match(c.instructions,/Did you run today/);assert.match(c.instructions,/No tools or persistence/);assert.match(c.instructions,/one short question/);assert.match(c.instructions,/Never guilt/);});
test('audio sharing requires affirmative consent',()=>{for(const v of [null,{},false,{consent:'true'},{consent:false}])assert.equal(voice.validVoiceConsent(v),false);assert.equal(voice.validVoiceConsent({consent:true}),true);});
test('cleanup stops tracks, connection, audio, pending network and timers',async()=>{let stops=0,closed=0,paused=0,fired=false;const abort=new AbortController();const pc={onconnectionstatechange:()=>{},ontrack:()=>{},close(){closed++;}};const audio={srcObject:{},pause(){paused++;}};releaseVoice({abort,pc,audio,mic:{getTracks:()=>[{stop(){stops++;}},{stop(){stops++;}}]},timer:setTimeout(()=>{fired=true},10),connectTimer:setTimeout(()=>{fired=true},10)});await new Promise(r=>setTimeout(r,20));assert.equal(stops,2);assert.equal(closed,1);assert.equal(paused,1);assert.equal(audio.srcObject,null);assert.equal(pc.ontrack,null);assert.equal(pc.onconnectionstatechange,null);assert.equal(abort.signal.aborted,true);assert.equal(fired,false);releaseVoice({});});
test('voice endpoint enforces origin, identity and consent before minting; returns only the ephemeral secret',async()=>{
 const {createHash}=await import('node:crypto');let origin=true,identity=null,called=0,sent=null;const savedFetch=globalThis.fetch,oldKey=process.env.OPENAI_API_KEY;
 const json=(data,init={})=>new Response(JSON.stringify(data),{...init,headers:{'Content-Type':'application/json',...init.headers}});
 const route=load('src/app/api/health/voice/route.ts',{'node:crypto':{createHash},'next/server':{NextResponse:{json}},'@/lib/health/voice':voice,'@/lib/health/server':{sameOrigin:()=>origin,healthIdentity:async()=>identity,noStore:{'Cache-Control':'no-store, private'},apiError:(error,status=400)=>json({error},{status}),boundedJson:async(req,limit)=>{assert.equal(limit,2048);return req.json();}}});
 const request=body=>new Request('https://example.com/api/health/voice',{method:'POST',body:JSON.stringify(body)});
 try{process.env.OPENAI_API_KEY='test-only';globalThis.fetch=async(url,options)=>{called++;assert.equal(url,'https://api.openai.com/v1/realtime/client_secrets');sent=JSON.parse(options.body);return json({value:'ephemeral-test',session:{private:'not-returned'}});};
 origin=false;assert.equal((await route.POST(request({consent:true}))).status,403);origin=true;
 assert.equal((await route.POST(request({consent:true}))).status,401);identity={id:'unit-user',local:false};
 assert.equal((await route.POST(request({consent:false}))).status,400);assert.equal(called,0);
 const ok=await route.POST(request({consent:true,model:'untrusted-model',state:{private:'not-forwarded'}}));assert.equal(ok.status,200);assert.equal(ok.headers.get('cache-control'),'no-store, private');assert.deepEqual(await ok.json(),{value:'ephemeral-test'});assert.deepEqual(sent,{session:voice.runVoiceConfig()});
 assert.equal((await route.POST(request({consent:true}))).status,429);assert.equal(called,1);
 identity={id:'second-user',local:false};globalThis.fetch=async()=>json({error:{message:'secret upstream detail'}},{status:500});const bad=await route.POST(request({consent:true}));assert.equal(bad.status,502);assert.ok(!(await bad.text()).includes('secret upstream'));
 }finally{globalThis.fetch=savedFetch;if(oldKey===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=oldKey;}
});
