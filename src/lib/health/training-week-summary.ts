import type { TrainingSession } from './training';

export function scheduledWeekSummary(sessions: TrainingSession[], start: string, end: string, today: string) {
  const week = sessions.filter(session => session.date >= start && session.date <= end && session.kind !== 'recovery');
  return {
    total: week.length,
    completed: week.filter(session => session.status === 'completed' && session.date <= today).length,
    skipped: week.filter(session => session.status === 'skipped').length,
  };
}

/** Plan completion and logged activity are independent; neither implies the other. */
export function trainingDayMarker(sessions: TrainingSession[], recorded: number, date: string, today: string) {
  const completed = sessions.some(session => session.status === 'completed' && session.date <= today);
  if (completed) return { symbol: '✓', label: 'completed planned session' };
  if (sessions.some(session => session.status === 'planned' && session.kind !== 'recovery')) return { symbol: '○', label: 'scheduled session' };
  if (recorded > 0 && date <= today) return { symbol: '●', label: 'recorded activity' };
  if (sessions.some(session => session.status === 'skipped')) return { symbol: '–', label: 'skipped session' };
  return { symbol: '·', label: sessions.some(session => session.kind === 'recovery') ? 'recovery day' : 'no scheduled session' };
}
