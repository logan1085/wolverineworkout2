import assert from 'node:assert/strict';
import {test} from 'node:test';
import {spawnSync} from 'node:child_process';
import {marathonAgentCases} from '../evals/marathon-agent-cases.mjs';
test('fictional marathon cases validate on every weekday and over date boundaries',()=>{
 for(const today of ['2026-10-05','2026-10-06','2026-10-07','2026-10-08','2026-10-09','2026-10-10','2026-10-11','2028-02-29','2026-12-31']){
  const cases=marathonAgentCases(today);assert.equal(cases.length,7);assert.equal(new Set(cases.map(c=>c.id)).size,7);
  const linked=cases.find(c=>c.id==='marathon-linked-actuals');assert.equal(linked.state.profile.training.sessions[0].date,today);assert.equal(linked.state.activities[0].distanceKm,2);assert.equal(linked.state.activities.length,1);assert.equal(linked.state.profile.training.sessions[0].status,'completed');
  for(const c of cases){assert.ok(c.review);for(const expression of [...c.must??[],...c.mustNot??[]])new RegExp(expression);}
  assert.ok(new RegExp(linked.must[0],'i').test('You logged 2 km.'));assert.ok(new RegExp(linked.must[0],'i').test('You logged 1.2 miles.'));
 }
});
test('return and multi-turn fixtures preserve the relevant prior state',()=>{
 const cases=marathonAgentCases('2026-10-05');assert.equal(cases.find(c=>c.id==='marathon-paused-return').state.profile.training.pausedOn,'2026-10-05');
 const correction=cases.find(c=>c.id==='marathon-goal-correction');assert.match(correction.state.profile.goal,/NYC/);assert.match(correction.message,/Chicago/);assert.equal(correction.history.at(-1).role,'assistant');
 const checkin=cases.find(c=>c.id==='marathon-short-checkin');assert.equal(checkin.history.at(-1).content,'Did you run today?');assert.equal(checkin.maxSuggestions,0);
});
test('live evaluation refuses a production destination before using an account',()=>{
 const result=spawnSync(process.execPath,['evals/run-health-agent.mjs','--live'],{env:{...process.env,TEST_ORIGIN:'https://wolverineworkout2.vercel.app'},encoding:'utf8'});
 assert.notEqual(result.status,0);assert.match(result.stderr,/Live synthetic evals require a local preview origin/);
});
