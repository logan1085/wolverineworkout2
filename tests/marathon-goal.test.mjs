import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const module={exports:{}};
new Function('exports',ts.transpileModule(fs.readFileSync('src/lib/health/marathon-goal.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(module.exports);
const {parseMarathonGoal,formatMarathonGoal,RACE_AIMS}=module.exports;
test('legacy NYC goal is recognized without rewriting the saved profile',()=>{
 assert.deepEqual(parseMarathonGoal('Training for the NYC Marathon'),{race:'the NYC Marathon',aim:'Finish feeling strong'});
 assert.equal(parseMarathonGoal('Build a sustainable routine'),null);
});
test('every intention survives save and edit, including punctuation in race names',()=>{
 for(const aim of RACE_AIMS){const race='St. George Marathon';assert.deepEqual(parseMarathonGoal(formatMarathonGoal(race,aim)),{race,aim});}
 assert.equal(formatMarathonGoal('  NYC Marathon  ',RACE_AIMS[0]),'Preparing for NYC Marathon. My aim: finish feeling strong.');
});
test('invalid or unrecognized values do not silently replace a goal',()=>{
 for(const race of ['', ' '.repeat(4),'x'.repeat(101),'NYC\nMarathon'])assert.throws(()=>formatMarathonGoal(race,RACE_AIMS[0]));
 assert.throws(()=>formatMarathonGoal('NYC Marathon','unsupported'));
 assert.equal(parseMarathonGoal('Preparing for NYC. My aim: unrecognized.'),null);
});
