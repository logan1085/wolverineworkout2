"use client";
import { buildContextBrief } from "@/lib/health/context-brief";
import type { HealthState } from "@/lib/health/model";
import type { MemoryState } from "@/lib/health/memory-model";
export default function ContextBrief({health, memory, onEdit}: {health:HealthState; memory:MemoryState; onEdit:(id:string)=>void}) {
  const brief = buildContextBrief(health,memory);
  return <section className="panel knowledge-brief" aria-labelledby="knowledge-title">
    <span className="eyebrow">YOUR CONTEXT, IN PLAIN SIGHT</span>
    <h2 id="knowledge-title">What Wolverine knows about me</h2>
    <p>Rebuilt from your records as of {brief.asOf} (UTC). Personal records only. The agent receives this same brief when you share personal context; relevant saved facts may also be retrieved for your question.</p>
    <h3>Profile settings</h3><p>{brief.profile.goal} · {brief.profile.minutes} minutes for movement</p>
    <h3>Confirmed facts</h3>
    {!brief.memoryEnabled ? <p>Memory is paused. Saved facts are excluded from the agent’s brief.</p> : !brief.confirmed.length ? <p>No active confirmed facts yet. Add a memory below or confirm a suggestion in chat.</p> : <ul>{brief.confirmed.map(f => <li key={f.id}><strong>{f.category}</strong><p>{f.text}</p><small>{f.source === "manual" ? "Entered by you" : "Confirmed from chat"} · Updated {f.updatedAt.slice(0,10)}{f.expiresOn ? ` · Expires ${f.expiresOn}` : ""}</small><button className="quiet-button" onClick={() => onEdit(f.id)}>Review / edit</button></li>)}</ul>}
    {brief.additionalActiveFacts > 0 && <p>{brief.additionalActiveFacts} more active facts remain available for question-specific recall. This brief includes the 12 most recently updated.</p>}
    <h3>Recent observations</h3><p>{brief.since}–{brief.asOf} · Records, not conclusions</p>
    {!brief.recent.checkIns.length && !brief.recent.metrics.length && !brief.recent.activities.length && <p>No records in this window. Wolverine won’t infer how you felt or whether you exercised.</p>}
    <ul>{brief.recent.checkIns.map(c => <li key={c.id}>{c.date} · Your check-in: {c.sleepHours}h sleep, energy {c.energy}/5, stress {c.stress}/5, soreness {c.soreness}/5.{c.note && <p>{c.note}</p>}</li>)}{brief.recent.metrics.map(m => <li key={m.date}>{m.date} · Garmin: {m.sleepHours !== undefined ? `${m.sleepHours}h sleep` : "sleep unavailable"}{m.steps !== undefined ? ` · ${m.steps.toLocaleString()} steps` : ""}{m.restingHeartRate !== undefined ? ` · resting heart rate ${m.restingHeartRate} bpm` : ""}{m.bodyBattery !== undefined ? ` · Body Battery ${m.bodyBattery}` : ""}</li>)}{brief.recent.activities.map(a => <li key={a.id}>{a.date} · {a.name} · {a.minutes} min · {a.source === "manual" ? "Logged by you" : "Garmin"}</li>)}</ul>
    <h3>Needs clarification</h3>{brief.discrepancies.length ? <ul>{brief.discrepancies.map(d => <li key={d.date}>{d.date}: you logged {d.selfReported}h sleep; Garmin recorded {d.garmin}h. These may describe different windows. Review the check-in in Journal; Wolverine will ask rather than pick a value.</li>)}</ul> : <p>No same-date sleep differences of one hour or more were found.</p>}
    <small>This check does not detect contradictions in free-text memories. Review, edit or forget those below. This brief is rebuilt, never saved as another copy of your health history.</small>
  </section>;
}
