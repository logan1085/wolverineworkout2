/** Bound response and body download; leaving the scene still cancels immediately. */
export async function fetchTrainingWorldAsset(signal: AbortSignal, timeoutMs = 15000, fetcher: typeof fetch = fetch): Promise<ArrayBuffer> {
  const request = new AbortController();
  const abort = () => request.abort(signal.reason);
  if (signal.aborted) abort();
  else signal.addEventListener("abort", abort, { once: true });
  const deadline = setTimeout(() => request.abort(new DOMException("Stadium download timed out", "TimeoutError")), timeoutMs);
  try {
    const response = await fetcher("/models/training/training-ground-v1.glb", { signal: request.signal });
    if (!response.ok) throw new Error("Stadium asset unavailable");
    return await response.arrayBuffer();
  } finally {
    clearTimeout(deadline);
    signal.removeEventListener("abort", abort);
  }
}
