import { CreateWorkoutRequest } from '@/types/workout';

/** The shape the legacy /api/workouts endpoints actually store. */
export type StoredWorkout = CreateWorkoutRequest & { id: string };

/**
 * In-memory storage (replace with database later).
 *
 * Shared by /api/workouts and /api/workouts/[id] so both routes read and write
 * the same records - each route owning a private array meant every lookup by
 * id missed. Contents are still lost on restart and shared across all users.
 */
export const workouts: StoredWorkout[] = [];
