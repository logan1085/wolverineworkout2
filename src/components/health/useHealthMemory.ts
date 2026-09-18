"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  emptyMemory,
  MemoryState,
  MemorySnapshot,
  MEMORY_STORAGE_KEY,
  readLocalMemory,
  saveLocalMemory,
  validateSnapshot,
  validateMemory,
} from "@/lib/health/memory-model";
export function useHealthMemory(userId: string | undefined) {
  const [snapshot, setSnapshot] = useState<MemorySnapshot>({
    state: emptyMemory(),
    revision: 0,
  });
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const ref = useRef(snapshot);
  const owner = useRef(userId);
  const generation = useRef(0);
  const lock = useRef(false);
  // Reject a result from an earlier identity even before its effect cleanup.
  owner.current = userId;
  const reload = useCallback(async () => {
    const epoch = ++generation.current;
    setReady(false);
    setError("");
    try {
      let next: MemorySnapshot;
      if (userId) {
        const r = await fetch("/api/health/memory");
        const body = await r.json();
        if (!r.ok) throw new Error(body.error);
        next = validateSnapshot(body);
      } else next = readLocalMemory(localStorage);
      if (epoch !== generation.current || owner.current !== userId) return;
      ref.current = next;
      setSnapshot(next);
      setReady(true);
    } catch (e) {
      if (epoch === generation.current && owner.current === userId)
        setError(e instanceof Error ? e.message : "Could not load memory.");
    }
  }, [userId]);
  const invalidate = useCallback(() => {
    generation.current++;
  }, []);
  useEffect(() => {
    ref.current = { state: emptyMemory(), revision: 0 };
    setSnapshot(ref.current);
    void reload();
    return invalidate;
  }, [reload, invalidate]);
  useEffect(() => {
    const listener = (e: StorageEvent) => {
      if (!userId && e.key === MEMORY_STORAGE_KEY) void reload();
    };
    window.addEventListener("storage", listener);
    return () => window.removeEventListener("storage", listener);
  }, [userId, reload]);
  const update = useCallback(
    async (transform: (state: MemoryState) => MemoryState) => {
      if (!ready || owner.current !== userId)
        throw new Error(
          "Memory is still loading. Reload memory and try again.",
        );
      if (lock.current)
        throw new Error(
          "A memory change is still saving. Please try again in a moment.",
        );
      lock.current = true;
      setSaving(true);
      const epoch = generation.current;
      const current = ref.current;
      try {
        const state = validateMemory(transform(current.state));
        let next: MemorySnapshot;
        if (userId) {
          const r = await fetch("/api/health/memory", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ state, revision: current.revision }),
          });
          const body = await r.json();
          if (!r.ok) throw new Error(body.error);
          next = validateSnapshot(body);
        } else next = saveLocalMemory(localStorage, state, current.revision);
        if (epoch !== generation.current || owner.current !== userId)
          throw new Error("The active account changed. Reload its memory.");
        ref.current = next;
        setSnapshot(next);
        setError("");
        return next.state;
      } catch (e) {
        if (owner.current === userId) setReady(false);
        if (owner.current === userId)
          setError(e instanceof Error ? e.message : "Could not save memory.");
        throw e;
      } finally {
        lock.current = false;
        setSaving(false);
      }
    },
    [ready, userId],
  );
  return {
    state: snapshot.state,
    revision: snapshot.revision,
    ready,
    error,
    saving,
    reload,
    update,
  };
}
