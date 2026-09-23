"use client";
import { FormEvent, useEffect, useRef, useState } from "react";
type Status = {
  configured: boolean;
  eligible: boolean;
  connected: boolean;
  lastQuery: string | null;
};
export default function StravaConnection({ signedIn }: { signedIn: boolean }) {
  const [status, setStatus] = useState<Status | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [question, setQuestion] = useState("");
  const [consent, setConsent] = useState(false);
  const [answer, setAnswer] = useState("");
  const controller = useRef<AbortController | null>(null);
  useEffect(() => {
    const abort = new AbortController();
    fetch("/api/strava/status", { signal: abort.signal, cache: "no-store" })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok)
          throw new Error(data.error || "Connection status unavailable.");
        setStatus(data);
      })
      .catch((e) => {
        if (!abort.signal.aborted) setNotice(e.message);
      });
    const params = new URLSearchParams(window.location.search);
    if (params.get("strava")) {
      setNotice(
        params.get("strava") === "connected"
          ? "Strava linked. Ask a question to check live access."
          : "Strava could not connect. Check MCP access and try again. Disconnect an existing connection before reconnecting.",
      );
      params.delete("strava");
      window.history.replaceState(
        {},
        "",
        `${window.location.pathname}?${params}`,
      );
    }
    return () => {
      abort.abort();
      controller.current?.abort();
    };
  }, []);
  async function action(kind: "connect" | "disconnect" | "ask") {
    const abort = new AbortController();
    controller.current = abort;
    setBusy(true);
    setNotice("");
    if (kind === "ask") setAnswer("");
    try {
      const response = await fetch(`/api/strava/${kind}`, {
        method: "POST",
        signal: abort.signal,
        headers: { "Content-Type": "application/json" },
        ...(kind === "ask"
          ? { body: JSON.stringify({ question, consent }) }
          : {}),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Strava request failed.");
      if (kind === "connect") {
        const url = new URL(data.url);
        if (
          url.origin !== "https://www.strava.com" ||
          url.pathname !== "/oauth/mcp/authorize"
        )
          throw new Error("Invalid connection link.");
        window.location.assign(url.href);
        return;
      }
      if (kind === "ask") {
        setAnswer(data.message);
        setConsent(false);
        setStatus((s) => (s ? { ...s, lastQuery: data.queriedAt } : s));
        if (data.warning) setNotice(data.warning);
      } else {
        setAnswer("");
        setQuestion("");
        setConsent(false);
        setStatus((s) => (s ? { ...s, connected: false, lastQuery: null } : s));
        setNotice(data.message);
      }
    } catch (e) {
      if (!abort.signal.aborted)
        setNotice(e instanceof Error ? e.message : "Could not reach Strava.");
    } finally {
      if (!abort.signal.aborted) setBusy(false);
    }
  }
  function ask(e: FormEvent) {
    e.preventDefault();
    void action("ask");
  }
  return (
    <section className="panel strava-card">
      <div className="section-heading">
        <span className="eyebrow strava-wordmark">STRAVA</span>
        <span
          className={`connection-badge ${status?.connected ? "connected" : ""}`}
        >
          {!status
            ? "Checking…"
            : status.connected
              ? "Account linked"
              : status.configured
                ? "Personal connection"
                : "Setup required"}
        </span>
      </div>
      <h2>Ask about your training</h2>
      <p>Read-only answers from your personal Strava account. You approve sharing for each question.</p>
      {status?.connected ? (
        <>
          <form onSubmit={ask} className="strava-question">
            <label htmlFor="strava-question">Ask about my Strava</label>
            <textarea
              id="strava-question"
              rows={3}
              maxLength={2000}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="What did my training look like this week?"
              disabled={busy}
            />
            <label className="strava-consent">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                disabled={busy}
              />
              Share this question and the live Strava data needed to answer it
              with OpenAI.
            </label>
            <div className="button-row">
              <button
                className="primary"
                disabled={busy || !consent || !question.trim()}
              >
                {busy ? "Working…" : "Ask with live data ↗"}
              </button>
              <button
                type="button"
                className="quiet-button"
                disabled={busy}
                onClick={() => void action("disconnect")}
              >
                Disconnect & delete connection
              </button>
            </div>
          </form>
          {answer && (
            <div
              className="strava-answer"
              role="region"
              aria-label="Strava answer"
            >
              <p className="eyebrow">LIVE STRAVA ANSWER</p>
              <p>{answer}</p>
              <button
                className="quiet-button"
                onClick={() => {
                  setAnswer("");
                  setQuestion("");
                  setConsent(false);
                }}
              >
                Clear answer
              </button>
            </div>
          )}
          <p className="connection-note">
            {status.lastQuery
              ? `Last answered ${new Date(status.lastQuery).toLocaleString()}. `
              : ""}
            Answers disappear when you leave this view. They are not added to
            your dashboard, exports, or agent memory.
          </p>
        </>
      ) : (
        <>
          <button
            className="secondary"
            disabled={
              busy || !signedIn || !status?.configured || !status.eligible
            }
            onClick={() => void action("connect")}
          >
            {busy ? "Working…" : "Link personal Strava ↗"}
          </button>
          <p className="connection-note">
            {!status?.configured
              ? "Requires a registered Strava MCP client and an eligible subscription. The connector is not activated in this workspace yet."
              : !signedIn
                ? "Sign in below to link your account."
                : !status.eligible
                  ? "This connection is limited to the configured owner’s personal account."
                  : "You’ll authorize directly with Strava. Wolverine never asks for your Strava password."}
          </p>
        </>
      )}
      {notice && (
        <p className="connection-note" role="status">
          {notice}
        </p>
      )}
      <div className="strava-links">
        <a
          href="https://support.strava.com/en-us/articles/15401531-what-is-the-strava-mcp-connector"
          target="_blank"
          rel="noreferrer"
        >
          Check eligibility ↗
        </a>
        <a
          href="https://www.strava.com/settings/apps"
          target="_blank"
          rel="noreferrer"
        >
          Manage Strava access ↗
        </a>
      </div>
      <p className="connection-note">
        Garmin imports appear in your health timeline. Strava is queried live
        here, so the same workout is never counted twice.
      </p>
    </section>
  );
}
