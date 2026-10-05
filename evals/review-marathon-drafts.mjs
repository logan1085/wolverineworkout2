// Synthetic, offline review. No model/API calls or user records.
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
function load(file){const compiled={exports:{}};const out=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;new Function('require','module','exports',out)(id=>load(path.resolve(path.dirname(file),id+'.ts')),compiled,compiled.exports);return compiled.exports;}
const {createMarathonDraft}=load('src/lib/health/marathon-progression.ts');
const {addDays}=load('src/lib/health/training.ts');
const summaries=[];
for(const weeks of [16,20,24])for(const weeklyKm of [40,50,60]){
 const raceDate='2027-03-21',asOf=addDays(raceDate,1-weeks*7);
 const draft=createMarathonDraft({id:`plan-review-${weeks}-${weeklyKm}`,raceName:'Synthetic review race',raceDate,asOf,weeks,runDays:[0,2,3,5],longRunDay:0,baseline:{weeklyKm,longestRunKm:weeklyKm*.4,daysPerWeek:4,unit:'km',recordedAt:asOf}});
 summaries.push({weeks,baselineWeeklyKm:weeklyKm,start:draft.start,weeklyTrainingKm:draft.weeks.map(w=>w.trainingKm),weeklyLongestKm:draft.weeks.map(w=>w.longestTrainingKm),phases:draft.weeks.map(w=>w.phase),peakTrainingKm:Math.max(...draft.weeks.map(w=>w.trainingKm)),peakLongKm:Math.max(...draft.weeks.map(w=>w.longestTrainingKm)),raceKm:draft.weeks.at(-1).raceKm});
}
fs.mkdirSync('evals/results',{recursive:true});
fs.writeFileSync('evals/results/marathon-draft-review.json',JSON.stringify({engine:'marathon-draft-v1',status:'offline engineering review; not activated in the app',summaries},null,2)+'\n');
for(const s of summaries)console.log(`${s.weeks} weeks / ${s.baselineWeeklyKm} km base: ${s.weeklyTrainingKm.join(', ')} | longest peak ${s.peakLongKm} km`);
