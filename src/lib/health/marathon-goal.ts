/** Preserve the existing profile schema while making race-goal edits reversible. */
export const RACE_AIMS = ['Finish feeling strong','Build consistency','Work toward a time goal'] as const;
export type RaceAim = typeof RACE_AIMS[number];
export function parseMarathonGoal(goal:string):{race:string;aim:RaceAim}|null {
 const match=goal.match(/^(?:Preparing for|Training for) (.+)$/i);
 if(!match)return null;
 const marker='. My aim: ';
 const index=match[1].lastIndexOf(marker);
 if(index<0)return {race:match[1].replace(/\.$/,''),aim:RACE_AIMS[0]};
 const intention=match[1].slice(index+marker.length).replace(/\.$/,'');
 const aim=RACE_AIMS.find(a=>a.toLowerCase()===intention.toLowerCase());
 if(!aim)return null;
 return {race:match[1].slice(0,index),aim};
}
export function formatMarathonGoal(race:string,aim:RaceAim){
 const clean=race.trim();
 if(!clean||clean.length>100||/[\r\n]/.test(clean))throw new Error('Enter a race name between 1 and 100 characters.');
 if(!RACE_AIMS.includes(aim))throw new Error('Choose a race intention.');
 return `Preparing for ${clean}. My aim: ${aim.toLowerCase()}.`;
}
