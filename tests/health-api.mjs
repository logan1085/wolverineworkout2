// Uses a running local preview. Only fictional data is sent upstream.
import assert from 'node:assert/strict';
const base='http://127.0.0.1:3018';
const session=await fetch(base+'/api/health/session',{headers:{'sec-fetch-site':'same-origin'}});
const cookie=session.headers.get('set-cookie')?.split(';')[0];
assert.ok(cookie,'Start the development-only health preview first.');
const state={profile:{name:'Synthetic test',goal:'Build a sustainable routine',minutes:30},checkIns:[],metrics:[],activities:[],completed:[]};
const cases=[
 ['unauthenticated requests are rejected',{messages:[]},{},401],
 ['cross-origin requests are rejected',{messages:[]},{origin:'https://example.com'},403],
 ['consent is required',{messages:[{role:'user',content:'Hello'}],state},{cookie,origin:base},400],
 ['invalid health context is rejected',{messages:[{role:'user',content:'Hello'}],consent:true,state:{}},{cookie,origin:base},400],
 ['unsupported message roles are rejected',{messages:[{role:'system',content:'Hello'}],consent:true,state},{cookie,origin:base},400],
];
for(const [label,body,headers,status] of cases){const response=await fetch(base+'/api/health/chat',{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(body)});assert.equal(response.status,status,label);await response.text();console.log('PASS:',label);}
const noCloud=await fetch(base+'/api/health/data',{headers:{cookie}});assert.equal(noCloud.status,401,'local mode cannot impersonate a cloud account');console.log('PASS: local session cannot access cloud data');
if(process.argv.includes('--live')){const response=await fetch(base+'/api/health/chat',{method:'POST',headers:{'Content-Type':'application/json',cookie,origin:base},body:JSON.stringify({messages:[{role:'user',content:'For this fictional sample profile, suggest one simple reflection question. Do not give medical advice.'}],state,consent:true,sample:true})});const result=await response.json();assert.equal(response.status,200,result.error);assert.equal(result.source,'openai');assert.ok(result.message?.length>0);assert.equal(result.sample,true);console.log('PASS: live OpenAI response using fictional sample data');}
