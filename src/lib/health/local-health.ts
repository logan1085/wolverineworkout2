import { emptyHealth, validateHealth, type HealthState } from "./model";
export const HEALTH_STORAGE_KEY = "wolverine.health.v1";
export const HEALTH_WRITE_LOCK = "wolverine.health.write";
type Storage = Pick<globalThis.Storage,"getItem"|"setItem"|"removeItem">;
export function readLocalHealth(storage: Storage) {
  const raw = storage.getItem(HEALTH_STORAGE_KEY);
  return {raw, state:raw === null ? emptyHealth : validateHealth(JSON.parse(raw))};
}
/** Call inside the shared browser write lock when Web Locks are available. */
export function commitLocalHealth(storage: Storage, next:HealthState|null, expected:string|null) {
  if(storage.getItem(HEALTH_STORAGE_KEY)!==expected)
    throw new Error("Your history changed in another tab. Close this form to refresh, then try again. Your changes have not been saved.");
  const state=next===null ? emptyHealth : validateHealth(next);
  const raw=next===null ? null : JSON.stringify(state);
  // Do not report success or change the caller's snapshot until storage succeeds.
  if(raw===null)storage.removeItem(HEALTH_STORAGE_KEY);else storage.setItem(HEALTH_STORAGE_KEY,raw);
  return {raw,state};
}
