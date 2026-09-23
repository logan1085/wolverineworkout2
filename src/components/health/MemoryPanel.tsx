"use client";
import { FormEvent, useRef, useState } from "react";
import {
  emptyMemory,
  forgetMemory,
  memoryCategories,
  memoryExpired,
  MemoryCategory,
  MemoryEntry,
  MemoryState,
  validateMemory,
} from "@/lib/health/memory-model";
import ContextBrief from "./ContextBrief";
import type { HealthState } from "@/lib/health/model";
type Props = {
  health: HealthState;
  state: MemoryState;
  ready: boolean;
  error: string;
  busy: boolean;
  cloud: boolean;
  update: (fn: (state: MemoryState) => MemoryState) => Promise<MemoryState>;
  reload: () => Promise<void>;
  onResume: (id: string) => void;
  onForget: () => void;
};
export default function MemoryPanel({
  state,
  health,
  ready,
  error,
  busy,
  cloud,
  update,
  reload,
  onResume,
  onForget,
}: Props) {
  const [editing, setEditing] = useState<MemoryEntry | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [notice, setNotice] = useState("");
  const [working, setWorking] = useState(false);
  const restore = useRef<HTMLInputElement>(null);
  const disabled = busy || working || !ready;
  async function run(fn: () => Promise<void>) {
    if (working) return;
    setWorking(true);
    setNotice("");
    try {
      await fn();
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Memory could not be saved.");
    } finally {
      setWorking(false);
    }
  }
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const now = new Date().toISOString();
    const entry: MemoryEntry = {
      id: editing?.id || crypto.randomUUID(),
      category: String(form.get("category")) as MemoryCategory,
      text: String(form.get("text")).trim(),
      source: "manual",
      evidence: null,
      createdAt: editing?.createdAt || now,
      updatedAt: now,
      expiresOn: String(form.get("expiresOn")) || null,
    };
    await run(async () => {
      await update((s) => ({
        ...s,
        entries: editing
          ? s.entries.map((x) => (x.id === editing.id ? entry : x))
          : [entry, ...s.entries],
        ...(editing ? { conversations: [], activeConversationId: null } : {}),
      }));
      if (editing) onForget();
      setEditing(null);
      setShowForm(false);
      setNotice("Memory saved.");
    });
  }
  function download() {
    const blob = new Blob([JSON.stringify(state, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "wolverine-memory.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const shown = state.entries.filter(
    (m) =>
      (filter === "all" || filter === "review"
        ? filter !== "review" || memoryExpired(m)
        : m.category === filter) &&
      m.text.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <>
      <div className="greeting">
        <div>
          <p className="eyebrow">A LITTLE LESS STARTING OVER</p>
          <h1>
            Memory
          </h1>
          <p>
            Review what your agent remembers.
          </p>
        </div>
        <button
          className="primary"
          disabled={disabled}
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
        >
          ＋ Add a memory
        </button>
      </div>
      {(error || notice) && (
        <div className="notice" role="status">
          <span>{notice || error}</span>
          {error && (
            <button className="quiet-button" onClick={() => void reload()}>
              Reload memory
            </button>
          )}
        </div>
      )}
      <section className="panel memory-setting">
        <div>
          <h2>Memory is {state.enabled ? "on" : "off"}</h2>
          <p>
            {state.enabled
              ? "Use saved facts in replies and save new chats."
              : "Saved facts are paused. New chats aren’t saved."}
          </p>
          <small>
            {cloud
              ? "Saved privately to your account"
              : "Saved in this browser on this device"}{" "}
            · Sample chats are never saved.
          </small>
        </div>
        <label className="memory-switch">
          <input
            type="checkbox"
            role="switch"
            aria-label="Enable memory and conversation history"
            checked={state.enabled}
            disabled={disabled}
            onChange={(e) => {
              const enabled = e.target.checked;
              void run(async () => {
                await update((s) => ({ ...s, enabled }));
                onForget();
                setNotice(
                  enabled
                    ? "Memory is on. You approve each suggested fact before it is saved."
                    : "Memory is off. Your current chat was cleared; saved history remains available.",
                );
              });
            }}
          />
          <span>{state.enabled ? "On" : "Off"}</span>
        </label>
      </section>
      {showForm && (
        <section className="panel memory-editor">
          <div className="section-heading">
            <h2>
              {editing ? "Update a memory" : "Something worth remembering"}
            </h2>
            <button className="quiet-button" onClick={() => setShowForm(false)}>
              Cancel
            </button>
          </div>
          <form key={editing?.id || "new"} onSubmit={submit}>
            <label>
              What should Wolverine remember?
              <textarea
                name="text"
                required
                maxLength={400}
                defaultValue={editing?.text || ""}
                placeholder="I prefer morning workouts and have about 30 minutes."
              />
            </label>
            <div className="form-grid">
              <label>
                Category
                <select
                  name="category"
                  defaultValue={editing?.category || "preference"}
                >
                  {memoryCategories.map((c) => (
                    <option value={c} key={c}>
                      {c.charAt(0).toUpperCase() + c.slice(1)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Use until <span>optional</span>
                <input
                  name="expiresOn"
                  type="date"
                  defaultValue={editing?.expiresOn || ""}
                />
              </label>
            </div>
            <p className="subtle">
              {editing
                ? "Updating a fact also clears saved conversations, so the old version cannot be recalled from a transcript."
                : "After the use-until date, this memory stays visible for review but is left out of saved-memory recall. A resumed chat may still mention it."}
            </p>
            <button className="primary" disabled={disabled}>
              Save memory
            </button>
          </form>
        </section>
      )}
      <div className="memory-layout">
        <section className="panel">
          <div className="section-heading">
            <h2>
              Your saved facts{" "}
              <span className="count-badge">{state.entries.length}</span>
            </h2>
            <span className="subtle">Only what you choose to keep</span>
          </div>
          {state.entries.length > 0 && <div className="memory-filters">
            <input
              aria-label="Search memories"
              placeholder="Find a memory…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              aria-label="Filter memories"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All memories</option>
              {memoryCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
              <option value="review">Needs review</option>
            </select>
          </div>}
          {shown.length ? (
            shown.map((entry) => (
              <article className="memory-card" key={entry.id}>
                <div className="section-heading">
                  <span className="memory-category">{entry.category}</span>
                  <small>
                    {memoryExpired(entry)
                      ? "Needs review · not used"
                      : entry.expiresOn
                        ? `Use until ${entry.expiresOn}`
                        : "Available for recall"}
                  </small>
                </div>
                <p>{entry.text}</p>
                {entry.evidence && <blockquote>“{entry.evidence}”</blockquote>}
                <div className="section-heading">
                  <small>
                    {entry.source === "conversation"
                      ? "Confirmed from conversation"
                      : "Added or edited by you"}{" "}
                    · {new Date(entry.updatedAt).toLocaleDateString()}
                  </small>
                  <div className="button-row">
                    <button
                      className="quiet-button"
                      disabled={disabled}
                      onClick={() => {
                        setEditing(entry);
                        setShowForm(true);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="quiet-button forget-button"
                      disabled={disabled}
                      onClick={() => {
                        if (
                          window.confirm(
                            "Forget this fact and clear all saved conversations? This prevents the old fact from returning through a transcript. Other saved facts are kept.",
                          )
                        )
                          void run(async () => {
                            await update((s) => forgetMemory(s, entry.id));
                            onForget();
                            setNotice(
                              "Memory forgotten and conversation history cleared.",
                            );
                          });
                      }}
                    >
                      Forget
                    </button>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <div className="empty-state">
              <span className="agent-mark">✳</span>
              <h3>
                {state.entries.length
                  ? "No matching memories."
                  : "Start with one thing about you."}
              </h3>
              <p>
                A goal you’re working toward, a routine that fits, or a
                preference you don’t want to repeat.
              </p>
            </div>
          )}
        </section>
        <details className="view-disclosure memory-history"><summary>Conversations & backups ({state.conversations.length})</summary>
          <span className="eyebrow">PICK UP WHERE YOU LEFT OFF</span>
          <h2>Conversations</h2>
          <p className="subtle">
            The 10 most recent chats, saved while memory is on. Older chats are
            removed as storage fills.
          </p>
          {state.conversations.length ? (
            state.conversations.map((c) => (
              <article className="conversation-row" key={c.id}>
                <button
                  disabled={disabled || !state.enabled}
                  onClick={() => onResume(c.id)}
                >
                  <strong>{c.title}</strong>
                  <small>
                    {new Date(c.updatedAt).toLocaleDateString()} ·{" "}
                    {c.messages.length} messages
                  </small>
                </button>
                <button
                  className="icon-button"
                  aria-label={`Delete conversation ${c.title}`}
                  disabled={disabled}
                  onClick={() => {
                    if (
                      window.confirm(
                        "Delete this conversation? Confirmed memories are kept and can be forgotten separately.",
                      )
                    )
                      void run(async () => {
                        await update((s) => ({
                          ...s,
                          conversations: s.conversations.filter(
                            (x) => x.id !== c.id,
                          ),
                          activeConversationId:
                            s.activeConversationId === c.id
                              ? null
                              : s.activeConversationId,
                        }));
                        onForget();
                        setNotice("Conversation deleted.");
                      });
                  }}
                >
                  ×
                </button>
              </article>
            ))
          ) : (
            <p className="subtle">
              Turn memory on, then start a personal conversation. It’ll appear
              here.
            </p>
          )}
          <div className="journal-rule" />
          <div className="button-row">
            <button className="secondary" disabled={!ready} onClick={download}>
              Export memory ↓
            </button>
            <button
              className="quiet-button"
              disabled={disabled}
              onClick={() => restore.current?.click()}
            >
              Restore backup ↑
            </button>
            <input
              ref={restore}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (
                  !window.confirm(
                    "Replace your saved memories and conversations with this backup? Restored memory will be off until you enable it.",
                  )
                ) {
                  e.target.value = "";
                  return;
                }
                void run(async () => {
                  if (file.size > 650000)
                    throw new Error(
                      "Choose a memory backup smaller than 650 KB.",
                    );
                  const restored = validateMemory(
                    JSON.parse(await file.text()),
                  );
                  await update(() => ({
                    ...restored,
                    enabled: false,
                    activeConversationId: null,
                  }));
                  onForget();
                  setNotice(
                    "Memory restored and paused. Review it before enabling recall.",
                  );
                  if (restore.current) restore.current.value = "";
                });
              }}
            />
          </div>
          <button
            className="danger-button"
            disabled={disabled}
            onClick={() => {
              if (
                window.confirm(
                  "Delete every saved memory and conversation, and turn memory off? Export first if you want a backup.",
                )
              )
                void run(async () => {
                  await update(() => emptyMemory());
                  onForget();
                  setNotice(
                    "All memories and conversations have been cleared.",
                  );
                });
            }}
          >
            Forget everything
          </button>
          <p className="connection-note">
            Deleting here prevents future app recall. It cannot retract
            information already sent to the AI service.
          </p>
        </details>
      </div>
      {ready && <details className="view-disclosure"><summary>What your agent knows</summary><ContextBrief health={health} memory={state} onEdit={id => { const entry = state.entries.find(e => e.id === id); if (entry) { setEditing(entry); setShowForm(true); } }} /></details>}
    </>
  );
}
