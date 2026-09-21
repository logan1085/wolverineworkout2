import type { HealthState } from "./model";
import { memoryExpired, type MemoryState } from "./memory-model";

// Derived for each read, never cached or persisted. Dates use UTC consistently
// on the server and client. Observations are records, not clinical inferences.
export function buildContextBrief(health: HealthState, memory: MemoryState, now = Date.now()) {
  const asOf = new Date(now).toISOString().slice(0, 10);
  const since = new Date(Date.parse(asOf) - 6 * 86400000).toISOString().slice(0, 10);
  const recent = (date: string) => date >= since && date <= asOf;
  const active = memory.enabled ? memory.entries.filter(e => !memoryExpired(e, now)).sort((a,b) => b.updatedAt.localeCompare(a.updatedAt) || a.id.localeCompare(b.id)) : [];
  const confirmed = active.slice(0, 12).map(({id, category, text, source, updatedAt, expiresOn}) => ({id, category, text, source, updatedAt, expiresOn}));
  const checkIns = health.checkIns.filter(c => recent(c.date)).sort((a,b) => b.date.localeCompare(a.date)).slice(0,7);
  const metrics = health.metrics.filter(m => recent(m.date)).sort((a,b) => b.date.localeCompare(a.date)).slice(0,7);
  const activities = health.activities.filter(a => recent(a.date)).sort((a,b) => b.date.localeCompare(a.date)).slice(0,20);
  const discrepancies = checkIns.flatMap(c => {
    const device = metrics.find(m => m.date === c.date);
    return device?.sleepHours !== undefined && Math.abs(c.sleepHours-device.sleepHours) >= 1 ? [{ date:c.date, field:"sleepHours", selfReported:c.sleepHours, garmin:device.sleepHours, note:"Sources differ by at least one hour. Ask which record applies; do not choose a winner or infer a medical cause." }] : [];
  });
  return {
    asOf, since, memoryEnabled: memory.enabled,
    profile: health.profile,
    confirmed, additionalActiveFacts: Math.max(0,active.length-confirmed.length),
    recent: {checkIns, metrics, activities}, discrepancies,
    limitations: "Only the last seven UTC calendar dates are summarized. Missing records do not mean no activity. Profile settings are user-editable settings, not independently verified facts. Conflict checks only compare same-date sleep sources; they do not detect semantic contradictions in saved text.",
  };
}
