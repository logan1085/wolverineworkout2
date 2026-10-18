"use client";
import {useState} from 'react';
import type {Activity} from '@/lib/health/model';
import {demoRunningHistory,runningHistory} from '@/lib/health/running-history';
const pace=(n:number|null)=>{if(n===null)return '—';const s=Math.round(n*60);return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;};
export default function RunningHistory({activities,today,sample,loading,onLog,onConnections}:{activities:Activity[];today:string;sample:boolean;loading:boolean;onLog:()=>void;onConnections:()=>void}){
 const [demo,setDemo]=useState(false),[connect,setConnect]=useState(false);
 const history=runningHistory(demo?demoRunningHistory(today):activities,today);
 return <section className="panel running-history" aria-labelledby="running-history-title">
 <div className="section-heading"><div><span className="eyebrow">{demo||sample?'SYNTHETIC EXAMPLE · NOT YOUR RESULTS':'YOUR RUNNING HISTORY · LAST 28 DAYS'}</span><h2 id="running-history-title">See how your running adds up.</h2></div><button className="primary" onClick={()=>setConnect(!connect)} aria-expanded={connect}>Connect Strava</button></div>
 <p>Distance, consistency, long runs and pace — from recorded runs, separate from your training plan.</p>
 {connect&&<div className="running-sync" role="status"><strong>Strava activity sync is not available yet.</strong><p>No account has been connected and no Strava activities have been imported. The current connector supports questions, not history sync. Activity sync needs an approved API app and working account storage before authorization can begin.</p><p>The proposed import is read-only: run date, type, distance and moving time. No routes, heart rate, edits, or AI sharing. Private “Only You” activities would be excluded.</p><button className="secondary" onClick={onConnections}>View connection status</button></div>}
 {loading?<p role="status">Loading saved running history…</p>:<>
 {!history.count&&<p className="running-empty">No runs recorded in this period. Log a run to start your history, or explore a synthetic example. Nothing is presented as synced.</p>}
 <div className="running-metrics"><div><strong>{history.km.toFixed(1)} km</strong><span>recorded distance</span></div><div><strong>{history.days} / 28</strong><span>days with a run · {history.count} runs</span></div><div><strong>{history.longest?`${history.longest.toFixed(1)} km`:'—'}</strong><span>longest recorded run</span></div><div><strong>{pace(history.weeks[3].pace)}</strong><span>min/km · latest 7 days</span></div></div>
 <div className="running-table"><table><caption>Four consecutive seven-day periods ending {today}</caption><thead><tr><th scope="col">Period</th><th scope="col">Runs</th><th scope="col">Distance</th><th scope="col">Longest</th><th scope="col">Pace / km</th></tr></thead><tbody>{history.weeks.map(w=><tr key={w.from}><th scope="row">{w.from.slice(5)} – {w.to.slice(5)}</th><td>{w.count}</td><td>{w.km.toFixed(1)} km</td><td>{w.longest===null?'—':`${w.longest.toFixed(1)} km`}</td><td>{pace(w.pace)}</td></tr>)}</tbody></table></div>
 <p className="running-provenance">{demo||sample?'Synthetic example only; these numbers are not saved or merged with your records.':`Source: ${history.manual} manually logged runs and ${history.garmin} Garmin records in the period. No Strava sync.`} {history.missing>0?`${history.missing} runs lack positive distance and are excluded from distance and pace calculations.`:''} Pace is total recorded minutes divided by distance for runs with both values; manually logged duration may include stops. Terrain and effort differ, so a faster average is not proof of improved fitness. Empty periods mean no recorded runs, not necessarily no running.</p>
 <div className="button-row"><button className="secondary" disabled={sample||demo} onClick={onLog}>Log a run</button><button className="quiet-button" aria-pressed={demo} onClick={()=>setDemo(!demo)}>{demo?'Return to my records':'Explore synthetic example'}</button></div></>}
 </section>;
}
