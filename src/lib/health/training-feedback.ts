import { calendarDate } from './calendar-date';
export const SESSION_EFFORTS = ['easy', 'steady', 'hard'] as const;
export type SessionFeedback = { effort: typeof SESSION_EFFORTS[number]; note: string; updatedOn: string };
/** A subjective account of a completed session, never a wearable measurement. */
export function validateSessionFeedback(value: unknown, status: string, sessionDate: string): SessionFeedback | undefined {
  if (value === undefined) return undefined;
  const feedback = value as SessionFeedback;
  if (!feedback || status !== 'completed' || !SESSION_EFFORTS.includes(feedback.effort) || typeof feedback.note !== 'string' || feedback.note.length > 280 || !calendarDate(feedback.updatedOn) || feedback.updatedOn < sessionDate) throw new Error('Feedback needs a completed session, an effort, and a note of at most 280 characters.');
  return { effort: feedback.effort, note: feedback.note.trim(), updatedOn: feedback.updatedOn };
}
