import assert from 'node:assert/strict';
const origin='http://127.0.0.1:3018';
const endpoint=origin+'/api/health/scene';
assert.equal((await fetch(endpoint,{method:'POST',headers:{Origin:'https://example.com'}})).status,403);
assert.equal((await fetch(endpoint,{method:'POST',headers:{Origin:origin}})).status,401);
const session=await fetch(origin+'/api/health/session',{headers:{Origin:origin,'sec-fetch-site':'same-origin'}});
const Cookie=session.headers.get('set-cookie')?.split(';')[0];assert.ok(Cookie);
const post=body=>fetch(endpoint,{method:'POST',headers:{Origin:origin,Cookie,'Content-Type':'application/json'},body:JSON.stringify(body)});
assert.equal((await post({prompt:'tree',consent:false})).status,400);
assert.equal((await post({prompt:'tree',consent:true,scene:{script:'bad'}})).status,400);
if(process.argv.includes('--live')) {const r=await post({prompt:'A tiny alpine campsite with a coral tent and three pine trees. Use at most 12 shapes.',consent:true});const data=await r.json();assert.equal(r.status,200,JSON.stringify(data));assert.ok(data.scene.objects.length>0 && data.scene.objects.length<=24);console.log('Live generated sketch:',data.scene.title,'—',data.scene.objects.length,'primitives');}
console.log('Scene API guards passed.');
