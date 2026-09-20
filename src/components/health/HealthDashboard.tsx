"use client";
import { FormEvent, useEffect, useRef, useState, useId } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
const SketchStudio = dynamic(() => import("./SketchStudio"), { ssr: false });
import { useAuth } from "@/contexts/AuthContext";
import {
  Activity,
  CheckIn,
  HealthState,
  dailyBriefing,
  dayKey,
  emptyHealth,
  sampleHealth,
  validateHealth,
} from "@/lib/health/model";
import "./health.css";
import MemoryPanel from "./MemoryPanel";
import StravaConnection from "./StravaConnection";
import { useMobileViewport } from "./useMobileViewport";
import { useHealthMemory } from "./useHealthMemory";
import {
  emptyMemory,
  MemoryEntry,
  MemorySuggestion,
  normalizeMemoryText,
  recordConversation,
  readLocalMemory,
  SavedMessage,
} from "@/lib/health/memory-model";
type Tab =
  | "Today"
  | "Your agent"
  | "Activity"
  | "Journal"
  | "Memory"
  | "Connections";
type ChatMessage = { role: "user" | "assistant"; content: string };
type Connection = {
  configured: boolean;
  connected: boolean;
  lastSync: string | null;
};
const tabs: Tab[] = [
  "Today",
  "Your agent",
  "Activity",
  "Journal",
  "Memory",
  "Connections",
];
const icons = ["◉", "✳", "↗", "▤", "◇", "⌘"];
const dateLabel = (date: string) =>
  new Date(date + "T12:00:00").toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
function Spark({ values }: { values: (number | undefined)[] }) {
  const max = Math.max(...values.map((v) => v ?? 0), 1);
  return (
    <div className="spark" aria-hidden="true">
      {values.map((v, i) => (
        <i
          key={i}
          style={{
            height: v === undefined ? "3%" : `${Math.max((v / max) * 100, 8)}%`,
          }}
        />
      ))}
    </div>
  );
}
function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const headingId = useId();
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.showModal();
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="health-dialog"
      aria-labelledby={headingId}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="dialog-heading">
        <h2 id={headingId}>{title}</h2>
        <button
          className="icon-button"
          aria-label="Close dialog"
          onClick={onClose}
        >
          ×
        </button>
      </div>
      {children}
    </dialog>
  );
}
export default function HealthDashboard() {
  const { user, signIn, signUp, signOut } = useAuth();
  const [tab, setTab] = useState<Tab>("Today");
  const [moreOpen, setMoreOpen] = useState(false);
  const { root, keyboardOpen } = useMobileViewport();
  const chatLog = useRef<HTMLDivElement>(null);
  const composerInput = useRef<HTMLTextAreaElement>(null);
  const followChat = useRef(true);
  function navigate(next: Tab) {
    setMoreOpen(false);
    setTab(next);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", next);
    window.history.replaceState({}, "", url);
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  const [data, setData] = useState<HealthState>(emptyHealth);
  const [sample, setSample] = useState(true);
  const [samples, setSamples] = useState<HealthState>(emptyHealth);
  const [loaded, setLoaded] = useState(false);
  const [session, setSession] = useState({
    local: false,
    ai: false,
    auth: false,
  });
  const [connection, setConnection] = useState<Connection>({
    configured: false,
    connected: false,
    lastSync: null,
  });
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [modal, setModal] = useState<
    "checkin" | "activity" | "profile" | "delete" | "context" | "studio" | null
  >(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [thinking, setThinking] = useState(false);
  const [consent, setConsent] = useState(false);
  const memory = useHealthMemory(user?.id);
  const [suggestions, setSuggestions] = useState<MemorySuggestion[]>([]);
  const [memoryUsed, setMemoryUsed] = useState<
    Pick<MemoryEntry, "id" | "text" | "category" | "updatedAt">[]
  >([]);
  const conversationId = useRef<string | null>(null);
  const restoredScope = useRef("");
  const chatEpoch = useRef(0);
  const activeRequest = useRef<AbortController | null>(null);
  const [range, setRange] = useState(7);

  const upload = useRef<HTMLInputElement>(null);
  const current = sample ? samples : data;
  const briefing = dailyBriefing(current);
  const today = dayKey();
  const latest = current.metrics.find((x) => x.date === today);
  const check = current.checkIns.find((x) => x.date === today);
  const name = current.profile.name || "there";
  useEffect(() => {
    setSamples(sampleHealth());
    const params = new URLSearchParams(location.search);
    const selected = params.get("tab");
    if (tabs.includes(selected as Tab)) setTab(selected as Tab);
    if (params.get("garmin")) {
      setSample(false);
      setNotice(
        params.get("garmin") === "connected"
          ? "Garmin connected. Sync to bring in your latest data."
          : "Garmin could not connect. Please try again.",
      );
      history.replaceState(null, "", location.pathname);
    }
    fetch("/api/health/session")
      .then((r) => r.json())
      .then(setSession)
      .catch(() =>
        setNotice(
          "Connection status is unavailable. Local check-ins still work.",
        ),
      );
  }, []);
  useEffect(() => {
    let active = true;
    setLoaded(false);
    setData(emptyHealth);
    resetConversationView();
    restoredScope.current = "";
    setConsent(false);
    setConnection({ configured: false, connected: false, lastSync: null });
    async function load() {
      try {
        if (user) {
          const response = await fetch("/api/health/data");
          const result = await response.json();
          if (!response.ok) throw new Error(result.error);
          if (active) {
            setData(validateHealth(result.state));
            setSample(false);
          }
        } else {
          const saved = localStorage.getItem("wolverine.health.v1");
          if (active) {
            setData(saved ? validateHealth(JSON.parse(saved)) : emptyHealth);
            const view = localStorage.getItem("wolverine.view.v1");
            setSample(view === "sample" || (view !== "personal" && !saved));
          }
        }
      } catch (error) {
        if (active)
          setNotice(
            error instanceof Error
              ? error.message
              : "Could not load health history.",
          );
      } finally {
        if (active) setLoaded(true);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [user]);
  useEffect(() => {
    let active = true;
    fetch("/api/garmin/status")
      .then(async (r) => {
        const result = await r.json();
        if (!r.ok) throw new Error(result.error);
        if (active) setConnection(result);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [user, tab]);
  useEffect(() => {
    const log = chatLog.current;
    if (log && !messages.length) log.scrollTop = 0;
    else if (log && followChat.current) log.scrollTop = log.scrollHeight;
  }, [messages, thinking, tab, keyboardOpen]);
  useEffect(() => {
    const input = composerInput.current;
    if (!input) return;
    input.style.height = "auto";
    input.style.height = `${Math.min(input.scrollHeight, 144)}px`;
  }, [draft, tab]);
  useEffect(() => {
    resetConversationView();
    setConsent(false);
    restoredScope.current = "";
  }, [sample, user?.id]);
  useEffect(() => {
    if (!memory.ready) {
      chatEpoch.current++;
      activeRequest.current?.abort();
      setMessages([]);
      setThinking(false);
      setSuggestions([]);
      setMemoryUsed([]);
      restoredScope.current = "";
      return;
    }
    if (sample) {
      restoredScope.current = "";
      return;
    }
    const scope = user?.id || "local";
    if (restoredScope.current === scope) return;
    restoredScope.current = scope;
    if (memory.state.enabled) {
      const saved = memory.state.conversations.find(
        (c) => c.id === memory.state.activeConversationId,
      );
      if (saved) {
        conversationId.current = saved.id;
        setMessages(saved.messages);
      }
    }
  }, [
    memory.ready,
    sample,
    user?.id,
    memory.state.enabled,
    memory.state.conversations,
    memory.state.activeConversationId,
  ]);
  function resetConversationView() {
    chatEpoch.current++;
    activeRequest.current?.abort();
    setThinking(false);
    conversationId.current = null;
    setMessages([]);
    setSuggestions([]);
    setMemoryUsed([]);
    setDraft("");
  }
  async function startConversation() {
    if (!sample && memory.state.enabled) {
      await memory.update((s) => ({ ...s, activeConversationId: null }));
    }
    resetConversationView();
  }
  async function resumeConversation(id: string) {
    if (thinking) return;
    const saved = memory.state.conversations.find((c) => c.id === id);
    if (!saved) return;
    await memory.update((s) => ({ ...s, activeConversationId: id }));
    resetConversationView();
    setSample(false);
    setMessages(saved.messages);
    conversationId.current = id;
    setConsent(false);
    setTab("Your agent");
  }
  async function acceptSuggestion(
    suggestion: MemorySuggestion,
    replaceId?: string,
  ) {
    if (thinking || sample) return;
    await act(async () => {
      const now = new Date().toISOString();
      await memory.update((s) => {
        const already = s.entries.some(
          (m) =>
            normalizeMemoryText(m.text) ===
            normalizeMemoryText(suggestion.text),
        );
        if (already) return s;
        const entry: MemoryEntry = {
          id: replaceId || crypto.randomUUID(),
          category: suggestion.category,
          text: suggestion.text,
          evidence: suggestion.evidence,
          source: "conversation",
          createdAt: replaceId
            ? s.entries.find((m) => m.id === replaceId)?.createdAt || now
            : now,
          updatedAt: now,
          expiresOn: null,
        };
        return {
          ...s,
          entries: replaceId
            ? s.entries.map((m) => (m.id === replaceId ? entry : m))
            : [entry, ...s.entries],
          ...(replaceId
            ? { conversations: [], activeConversationId: null }
            : {}),
        };
      });
      if (replaceId) resetConversationView();
      else setSuggestions((items) => items.filter((x) => x !== suggestion));
      setNotice("Memory saved. You can review or change it in Memory.");
    });
  }
  async function save(next: HealthState) {
    if (!loaded)
      throw new Error(
        "Your history is still loading. Please try again in a moment.",
      );
    const valid = validateHealth(next);
    if (user) {
      const response = await fetch("/api/health/data", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(valid),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setData(validateHealth(result.state));
    } else {
      localStorage.setItem("wolverine.health.v1", JSON.stringify(valid));
      setData(valid);
    }
    setSample(false);
  }
  function changeSample(value: boolean) {
    try {
      localStorage.setItem("wolverine.view.v1", value ? "sample" : "personal");
    } catch {
      /* View preferences are optional. */
    }
    setSample(value);
    resetConversationView();
    setConsent(false);
  }
  async function act(fn: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    try {
      await fn();
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please retry.",
      );
    } finally {
      setBusy(false);
    }
  }
  function startCheckin() {
    setModal("checkin");
  }
  async function submitCheckin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const item: CheckIn = {
      id: crypto.randomUUID(),
      date: today,
      energy: Number(f.get("energy")),
      stress: Number(f.get("stress")),
      sleepHours: Number(f.get("sleepHours")),
      soreness: Number(f.get("soreness")),
      note: String(f.get("note") || ""),
    };
    await act(async () => {
      await save({
        ...data,
        checkIns: [
          item,
          ...data.checkIns.filter((c) => c.date !== today),
        ].slice(0, 366),
      });
      setModal(null);
      setNotice(
        user
          ? "Check-in saved to your account."
          : "Check-in saved on this device.",
      );
    });
  }
  async function submitActivity(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const distance = String(f.get("distance") || "");
    const item: Activity = {
      id: crypto.randomUUID(),
      date: String(f.get("date")),
      name: String(f.get("name")),
      type: String(f.get("type")),
      minutes: Number(f.get("minutes")),
      ...(distance ? { distanceKm: Number(distance) } : {}),
      source: "manual",
    };
    await act(async () => {
      await save({
        ...data,
        activities: [item, ...data.activities]
          .sort((a, b) => b.date.localeCompare(a.date))
          .slice(0, 1000),
      });
      setModal(null);
      setNotice("Activity added.");
    });
  }
  async function submitProfile(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    await act(async () => {
      await save({
        ...data,
        profile: {
          name: String(f.get("name")),
          goal: String(f.get("goal")),
          minutes: Number(f.get("minutes")),
        },
      });
      setModal(null);
      setNotice("Your preferences are saved.");
    });
  }
  async function send(text = draft) {
    if (thinking || !text.trim() || memory.saving) return;
    if (!consent) {
      setNotice("Please allow sharing your health context before sending.");
      return;
    }
    if (!session.ai || (!user && !session.local)) {
      setNotice("Sign in and connect the AI service to talk with your agent.");
      return;
    }
    const useMemory = !sample && memory.ready && memory.state.enabled;
    if (useMemory && !user) {
      try {
        if (readLocalMemory(localStorage).revision !== memory.revision) {
          await memory.reload();
          setNotice(
            "Memory changed in another tab. Please send your message again.",
          );
          return;
        }
      } catch {
        setNotice(
          "Memory could not be read. Open Memory to reload before sharing saved facts.",
        );
        return;
      }
    }
    const next: ChatMessage[] = [
      ...messages,
      { role: "user", content: text.trim() },
    ];
    const epoch = chatEpoch.current;
    const id = conversationId.current || crypto.randomUUID();
    const controller = new AbortController();
    activeRequest.current = controller;
    setMessages(next);
    setDraft("");
    setThinking(true);
    setSuggestions([]);
    setMemoryUsed([]);
    try {
      const response = await fetch("/api/health/chat", {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next.slice(-19),
          state: {
            ...current,
            checkIns: current.checkIns.slice(0, 14),
            metrics: current.metrics.slice(-14),
            activities: current.activities.slice(0, 20),
            completed: [],
          },
          sample,
          consent: true,
          useMemory,
          memoryRevision: memory.revision,
          memory: useMemory
            ? { ...memory.state, conversations: [], activeConversationId: null }
            : undefined,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        if (response.status === 409) {
          await memory.reload();
          setNotice(result.error);
          return;
        }
        throw new Error(result.error);
      }
      if (epoch !== chatEpoch.current) return;
      const complete: SavedMessage[] = [
        ...next,
        { role: "assistant", content: result.message },
      ];
      setMessages(complete);
      setMemoryUsed(result.memoryUsed || []);
      setSuggestions(useMemory ? result.suggestions || [] : []);
      if (useMemory) {
        try {
          await memory.update((s) => recordConversation(s, id, complete));
          if (epoch === chatEpoch.current) conversationId.current = id;
        } catch {
          setNotice(
            "This conversation could not be saved. Open Memory to reload and resolve the save error.",
          );
        }
      }
    } catch (error) {
      if (epoch !== chatEpoch.current || controller.signal.aborted) return;
      setNotice(
        error instanceof Error ? error.message : "The agent could not respond.",
      );
      setMessages(next.slice(0, -1));
      setDraft(text);
    } finally {
      if (epoch === chatEpoch.current) {
        setThinking(false);
        activeRequest.current = null;
      }
    }
  }
  function ask(text: string) {
    setDraft(text);
    setTab("Your agent");
  }
  async function garminAction(action: "connect" | "sync" | "disconnect") {
    await act(async () => {
      const response = await fetch("/api/garmin/" + action, { method: "POST" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      if (action === "connect") {
        const url = new URL(result.url);
        if (url.origin !== "https://connect.garmin.com")
          throw new Error("Invalid authorization link.");
        location.assign(url.href);
        return;
      }
      const status = await fetch("/api/garmin/status").then((r) => r.json());
      setConnection(status);
      if (action === "sync") {
        const r = await fetch("/api/health/data");
        const saved = await r.json();
        if (!r.ok) throw new Error(saved.error);
        setData(validateHealth(saved.state));
        setSample(false);
        setNotice(
          `Sync complete: ${result.metrics} daily records and ${result.activities} activities received.`,
        );
      } else
        setNotice(
          "Garmin disconnected. Your imported history is retained until you clear it.",
        );
    });
  }
  function exportData() {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `wolverine-health-${today}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice("Your health history was exported.");
  }
  async function importData(file?: File) {
    if (!file) return;
    await act(async () => {
      if (file.size > 180000)
        throw new Error("Choose a Wolverine backup smaller than 180 KB.");
      const restored = validateHealth(JSON.parse(await file.text()));
      await save(restored);
      setNotice(
        "Backup restored. Connected Garmin records are managed by sync.",
      );
    });
    if (upload.current) upload.current.value = "";
  }
  const sleep = check?.sleepHours ?? latest?.sleepHours;
  const visibleActivities = current.activities.filter(
    (a) => (Date.now() - Date.parse(a.date + "T00:00:00")) / 86400000 < range,
  );
  const weekMinutes = visibleActivities.reduce((sum, a) => sum + a.minutes, 0);
  return (
    <div
      ref={root}
      className={`health-app ${tab === "Your agent" ? "mobile-chat" : ""} ${keyboardOpen ? "keyboard-open" : ""}`}
    >
      <aside className="rail">
        <Link className="wordmark" href="/" aria-label="Wolverine home">
          w<span aria-hidden="true">{"///"}</span>
          <b>wolverine</b>
        </Link>
        <button
          className="mobile-profile"
          onClick={() => setModal("profile")}
          aria-label="Edit your profile and goal"
        >
          {data.profile.name?.slice(0, 1).toUpperCase() || "W"}
        </button>
        <div className="rail-label">YOUR HEALTH, CONNECTED</div>
        <nav aria-label="Main navigation">
          {tabs.map((x, i) => (
            <button
              key={x}
              onClick={() => navigate(x)}
              className={tab === x ? "selected" : ""}
              aria-current={tab === x ? "page" : undefined}
            >
              <span aria-hidden="true">{icons[i]}</span>
              {x}
            </button>
          ))}
        </nav>
        <div className="rail-bottom">
          <button className="studio-launch" onClick={() => setModal("studio")}>◇ 3D studio</button>
          <div className="mini-orb" />
          <p>
            A little more in tune.
            <br />
            <small>Every single day.</small>
          </p>
          <Link href="/transparency">Our soul & memory ↗</Link>
          <Link href="/workout">Open workout coach ↗</Link>
          <button
            className="profile-button"
            onClick={() => setModal("profile")}
          >
            <span>{data.profile.name?.slice(0, 1).toUpperCase() || "W"}</span>
            <div>
              {data.profile.name || "Your profile"}
              <small>{user ? "Cloud account" : "On this device"}</small>
            </div>
            <span>⚙</span>
          </button>
        </div>
      </aside>
      <main className="health-main">
        <header className="topbar">
          <span>
            {tab === "Today" ? "YOUR DAILY PICTURE" : tab.toUpperCase()}
          </span>
          <div className="top-actions">
            <button
              className="sample-pill"
              onClick={() => changeSample(!sample)}
              disabled={thinking || tab === "Memory"}
            >
              {tab === "Memory"
                ? "Personal memory"
                : sample
                  ? "Sample data · View my health"
                  : "My health · Explore sample"}
            </button>
            <button
              className="quiet-button"
              onClick={() => setTab("Connections")}
            >
              {connection.connected ? "Garmin connected" : "Connect your apps"}{" "}
              ↗
            </button>
          </div>
        </header>
        {notice && (
          <div className="notice" role="status">
            <span>{notice}</span>
            <button
              className="icon-button"
              onClick={() => setNotice("")}
              aria-label="Dismiss message"
            >
              ×
            </button>
          </div>
        )}
        {tab === "Today" && (
          <>
            <div className="greeting">
              <div>
                <p className="eyebrow">
                  {loaded
                    ? new Date()
                        .toLocaleDateString(undefined, {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                        })
                        .toUpperCase()
                    : "YOUR DAILY BRIEFING"}
                </p>
                <h1>
                  {data.profile.name && !sample ? (
                    <>
                      Hey {name}. <em>How are you, really?</em>
                    </>
                  ) : (
                    <>
                      Make room for <em>feeling good.</em>
                    </>
                  )}
                </h1>
                <p>Your health is more than your last workout.</p>
              </div>
              <button
                className="primary"
                onClick={startCheckin}
                disabled={!loaded}
              >
                ＋{" "}
                {data.checkIns.some((c) => c.date === today)
                  ? "Update check-in"
                  : "Daily check-in"}
              </button>
            </div>
            <section className="briefing">
              <div>
                <span className="eyebrow">
                  WOLVERINE BRIEFING{sample ? " · SAMPLE PROFILE" : ""}
                </span>
                <h2>{briefing.title}</h2>
                <p>{briefing.description}</p>
                <button
                  className="light-btn"
                  onClick={() =>
                    ask(
                      "Help me understand my latest check-in and choose one useful next step.",
                    )
                  }
                >
                  Talk through my day ↗
                </button>
                <small className="briefing-source">
                  Based on{" "}
                  {briefing.reasons.length
                    ? briefing.reasons.join(" · ")
                    : "your next check-in"}{" "}
                  · Rules-based daily guide
                </small>
              </div>
              <div className="orbit" aria-hidden="true">
                <div className="orbit-core">
                  <span>YOUR NEXT STEP</span>
                  <strong>{briefing.label}</strong>
                  <small>Movement · Sleep · Recovery</small>
                </div>
              </div>
            </section>
            <div className="metrics">
              {[
                {
                  name: "Sleep",
                  value:
                    sleep === undefined
                      ? "—"
                      : `${Math.floor(sleep)}h ${Math.round((sleep % 1) * 60)}m`,
                  detail: check
                    ? "Self-reported today"
                    : latest
                      ? "Garmin · today"
                      : "No sleep recorded",
                  icon: "☾",
                  values: current.metrics.slice(-7).map((m) => m.sleepHours),
                },
                {
                  name: "Resting heart rate",
                  value: latest?.restingHeartRate?.toString() ?? "—",
                  detail: latest?.restingHeartRate
                    ? "bpm · Garmin today"
                    : "Connect Garmin for trends",
                  icon: "♡",
                  values: current.metrics
                    .slice(-7)
                    .map((m) => m.restingHeartRate),
                },
                {
                  name: "Daily movement",
                  value: latest?.steps?.toLocaleString() ?? "—",
                  detail:
                    latest?.steps !== undefined
                      ? "steps · Garmin today"
                      : "No steps received today",
                  icon: "↗",
                  values: current.metrics.slice(-7).map((m) => m.steps),
                },
                {
                  name: "Energy",
                  value: check ? `${check.energy} / 5` : "—",
                  detail: check
                    ? "Self-reported today"
                    : "How are you feeling?",
                  icon: "☀",
                  values: current.checkIns
                    .slice(0, 7)
                    .reverse()
                    .map((c) => c.energy),
                },
              ].map((m) => (
                <article className="metric" key={m.name}>
                  <div>
                    {m.name}
                    <span aria-hidden="true">{m.icon}</span>
                  </div>
                  <strong>{m.value}</strong>
                  <small>
                    {sample ? "Sample · " : ""}
                    {m.detail}
                  </small>
                  <Spark values={m.values} />
                </article>
              ))}
            </div>
            <div className="bottom-grid">
              <section className="panel">
                <div className="section-heading">
                  <div>
                    <span className="eyebrow">A PLAN THAT FITS YOUR DAY</span>
                    <h2>Small things. Real progress.</h2>
                  </div>
                  <button
                    className="quiet-button"
                    onClick={() => setModal("profile")}
                  >
                    Adjust
                  </button>
                </div>
                {briefing.plan.map((p, i) => {
                  const done = current.completed.includes(`${today}:${p.id}`);
                  return (
                    <div className="plan-row" key={p.id}>
                      <button
                        className={`step ${done ? "done" : ""}`}
                        disabled={busy}
                        aria-label={`${done ? "Undo" : "Complete"} ${p.title}`}
                        aria-pressed={done}
                        onClick={() => {
                          if (sample) {
                            setSamples({
                              ...samples,
                              completed: done
                                ? samples.completed.filter(
                                    (x) => x !== `${today}:${p.id}`,
                                  )
                                : [...samples.completed, `${today}:${p.id}`],
                            });
                            return;
                          }
                          void act(async () => {
                            await save({
                              ...data,
                              completed: done
                                ? data.completed.filter(
                                    (x) => x !== `${today}:${p.id}`,
                                  )
                                : [...data.completed, `${today}:${p.id}`].slice(
                                    -1500,
                                  ),
                            });
                          });
                        }}
                      >
                        {done ? "✓" : `0${i + 1}`}
                      </button>
                      <div>
                        <h3>{p.title}</h3>
                        <p>{p.detail}</p>
                      </div>
                      <span>{p.kind}</span>
                    </div>
                  );
                })}
              </section>
              <section className="panel agent-teaser">
                <span className="eyebrow">YOUR PERSONAL HEALTH AGENT</span>
                <span className="agent-mark" aria-hidden="true">
                  ✳
                </span>
                <h2>
                  The whole picture.
                  <br />A clearer next step.
                </h2>
                <p>
                  Bring your questions, goals, and real life. We’ll put them in
                  context.
                </p>
                <button
                  className="secondary"
                  onClick={() => setTab("Your agent")}
                >
                  Talk to Wolverine ↗
                </button>
              </section>
            </div>
            <section className="panel recent-panel">
              <div className="section-heading">
                <h2>Recently, in your world</h2>
                <button
                  className="quiet-button"
                  onClick={() => setTab("Activity")}
                >
                  All activity ↗
                </button>
              </div>
              {current.activities.length ? (
                current.activities
                  .slice(0, 3)
                  .map((a) => (
                    <ActivityRow key={a.id} item={a} sample={sample} />
                  ))
              ) : (
                <div className="empty-inline">
                  <p>Your first activity starts the story.</p>
                  <button
                    className="secondary"
                    onClick={() => setModal("activity")}
                  >
                    Log an activity
                  </button>
                </div>
              )}
            </section>
          </>
        )}
        {tab === "Your agent" && (
          <>
            <div className="greeting">
              <div>
                <p className="eyebrow">LESS GUESSWORK. MORE CONTEXT.</p>
                <h1>
                  A conversation <em>about you.</em>
                </h1>
                <p>
                  {sample
                    ? "Explore with a clearly labeled sample profile."
                    : "Sleep, movement, recovery, and the life in between."}
                </p>
              </div>
              <button
                className="quiet-button"
                disabled={thinking || !messages.length}
                onClick={() => void act(startConversation)}
              >
                New conversation
              </button>
            </div>
            <div className="memory-chat-bar">
              <span>
                {sample
                  ? "Sample chat · personal memory is excluded"
                  : memory.ready && memory.state.enabled
                    ? "Memory on · conversation history is saved"
                    : memory.error
                      ? "Memory unavailable · this chat is not saved"
                      : "Memory off · this chat is not saved"}
              </span>
              <button className="quiet-button" onClick={() => setTab("Memory")}>
                Manage memory ↗
              </button>
            </div>
            <div className="chat-layout">
              <section className="panel chat-panel">
                <div className="chat-title">
                  <span className="small-agent">✳</span>
                  <div>
                    <h2>Wolverine</h2>
                    <p>
                      {session.ai && (session.local || user)
                        ? "Your health agent"
                        : "Ready when your AI connection is set up"}
                    </p>
                  </div>
                  <button
                    className="mobile-chat-context quiet-button"
                    onClick={() => setModal("context")}
                  >
                    Context
                  </button>
                  <button
                    className="mobile-new-chat quiet-button"
                    disabled={thinking || !messages.length}
                    onClick={() => void act(startConversation)}
                  >
                    New chat
                  </button>
                </div>
                <div
                  ref={chatLog}
                  onScroll={(event) => {
                    const log = event.currentTarget;
                    followChat.current =
                      log.scrollHeight - log.scrollTop - log.clientHeight < 80;
                  }}
                  className="chat-log"
                  role="log"
                  aria-label="Conversation"
                  aria-live="polite"
                >
                  {!messages.length && (
                    <div className="chat-welcome">
                      <span className="agent-mark">✳</span>
                      <h2>Let’s connect the dots.</h2>
                      <p>What would make today feel a little better?</p>
                      <div className="prompt-chips">
                        {[
                          "What does my recent sleep tell me?",
                          "Help me fit movement into my day.",
                          "I’m feeling tired. How should I adjust?",
                        ].map((q) => (
                          <button key={q} onClick={() => setDraft(q)}>
                            {q} ↗
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {messages.map((m, i) => (
                    <div className={`message ${m.role}`} key={i}>
                      <span>
                        {m.role === "assistant" ? "WOLVERINE" : "YOU"}
                      </span>
                      <p>{m.content}</p>
                    </div>
                  ))}
                  {thinking && (
                    <div className="thinking" role="status">
                      Putting your day in context<span>…</span>
                    </div>
                  )}
                  {!sample && memoryUsed.length > 0 && (
                    <details className="memory-included">
                      <summary>
                        {memoryUsed.length} saved{" "}
                        {memoryUsed.length === 1 ? "memory" : "memories"}{" "}
                        included in this reply’s context
                      </summary>
                      <ul>
                        {memoryUsed.map((m) => (
                          <li key={m.id}>{m.text}</li>
                        ))}
                      </ul>
                    </details>
                  )}
                  {!sample && suggestions.length > 0 && (
                    <div className="memory-suggestions">
                      <h3>Worth remembering?</h3>
                      <p>
                        Review these before they become part of your saved
                        memory.
                      </p>
                      {suggestions.map((suggestion, i) => (
                        <div className="memory-suggestion" key={i}>
                          <span className="memory-category">
                            {suggestion.category}
                          </span>
                          <p>{suggestion.text}</p>
                          <blockquote>“{suggestion.evidence}”</blockquote>
                          <div className="button-row">
                            <button
                              className="secondary"
                              disabled={memory.saving || busy || thinking}
                              onClick={() => void acceptSuggestion(suggestion)}
                            >
                              Remember this
                            </button>
                            <button
                              className="quiet-button"
                              onClick={() =>
                                setSuggestions((items) =>
                                  items.filter((x) => x !== suggestion),
                                )
                              }
                            >
                              Not now
                            </button>
                          </div>
                          {memory.state.entries.some(
                            (m) => m.category === suggestion.category,
                          ) && (
                            <label>
                              Updating something you told me before?
                              <select
                                aria-label="Replace an existing memory"
                                defaultValue=""
                                disabled={memory.saving || busy || thinking}
                                onChange={(e) => {
                                  const id = e.target.value;
                                  if (!id) return;
                                  if (
                                    window.confirm(
                                      "Replace this saved fact and clear old conversations so the previous version cannot return?",
                                    )
                                  )
                                    void acceptSuggestion(suggestion, id);
                                  e.target.value = "";
                                }}
                              >
                                <option value="">
                                  Choose a memory to replace…
                                </option>
                                {memory.state.entries
                                  .filter(
                                    (m) => m.category === suggestion.category,
                                  )
                                  .map((m) => (
                                    <option key={m.id} value={m.id}>
                                      {m.text}
                                    </option>
                                  ))}
                              </select>
                            </label>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div
                  className={`chat-compose-area ${consent ? "has-consent" : ""}`}
                >
                  <button className="studio-launch" onClick={() => setModal("studio")}>◇ Create a 3D sketch</button>
                  <label className="consent">
                    <input
                      type="checkbox"
                      checked={consent}
                      onChange={(e) => setConsent(e.target.checked)}
                    />
                    Allow this conversation and{" "}
                    {sample
                      ? "sample data"
                      : "my health context and any enabled memories"}{" "}
                    to be sent to OpenAI for a response.
                  </label>
                  <form
                    className="composer"
                    onSubmit={(e) => {
                      e.preventDefault();
                      followChat.current = true;
                      void send();
                    }}
                  >
                    <textarea
                      ref={composerInput}
                      aria-label="Message your health agent"
                      enterKeyHint="enter"
                      placeholder="What’s on your mind?"
                      maxLength={4000}
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (
                          e.key === "Enter" &&
                          !e.shiftKey &&
                          !e.nativeEvent.isComposing &&
                          window.matchMedia(
                            "(hover: hover) and (pointer: fine)",
                          ).matches
                        ) {
                          e.preventDefault();
                          followChat.current = true;
                          void send();
                        }
                      }}
                    />
                    <button
                      className="primary"
                      aria-label="Send message"
                      disabled={
                        thinking || memory.saving || !draft.trim() || !consent
                      }
                    >
                      ↑
                    </button>
                  </form>
                  <small className="chat-footnote">
                    AI can make mistakes. For symptoms or medical decisions,
                    talk with a qualified clinician.
                  </small>
                </div>
              </section>
              <aside className="context-panel panel">
                <span className="eyebrow">WHAT YOUR AGENT SEES</span>
                <h2>{sample ? "Sample context" : "Your context"}</h2>
                <div className="context-item">
                  <small>YOUR FOCUS</small>
                  <p>{current.profile.goal}</p>
                </div>
                <div className="context-item">
                  <small>TIME FOR MOVEMENT</small>
                  <p>{current.profile.minutes} minutes</p>
                </div>
                <div className="context-item">
                  <small>LATEST CHECK-IN</small>
                  <p>
                    {current.checkIns[0]
                      ? `${dateLabel(current.checkIns[0].date)} · Energy ${current.checkIns[0].energy}/5`
                      : "No check-ins yet"}
                  </p>
                </div>
                <div className="context-item">
                  <small>ACTIVITY HISTORY</small>
                  <p>{current.activities.length} activities</p>
                </div>
                <p className="context-note">
                  Recent check-ins, notes, wearable summaries, and activities
                  provide context. The agent cannot change your accounts or
                  plan.
                </p>
                <button
                  className="secondary"
                  onClick={() => setModal("profile")}
                >
                  Edit my preferences
                </button>
              </aside>
            </div>
          </>
        )}
        {tab === "Activity" && (
          <>
            <div className="greeting">
              <div>
                <p className="eyebrow">YOUR MOVEMENT, OVER TIME</p>
                <h1>
                  Every bit <em>counts.</em>
                </h1>
                <p>A record of showing up, in whatever way works for you.</p>
              </div>
              <button className="primary" onClick={() => setModal("activity")}>
                ＋ Log activity
              </button>
            </div>
            <div className="activity-summary">
              <div>
                <span className="eyebrow">
                  LAST {range} DAYS{sample ? " · SAMPLE" : ""}
                </span>
                <strong>
                  {weekMinutes}
                  <small> active minutes</small>
                </strong>
                <p>{visibleActivities.length} activities recorded</p>
              </div>
              <div className="range-toggle" aria-label="Activity date range">
                {[7, 30].map((x) => (
                  <button
                    key={x}
                    className={range === x ? "active" : ""}
                    aria-pressed={range === x}
                    onClick={() => setRange(x)}
                  >
                    {x} days
                  </button>
                ))}
              </div>
            </div>
            <section className="panel trend-panel">
              <div className="section-heading">
                <h2>Movement adds up</h2>
                <span className="subtle">Minutes per day</span>
              </div>
              <div
                className="bar-chart"
                role="img"
                aria-label={`${weekMinutes} minutes across ${visibleActivities.length} activities in the last ${range} days`}
              >
                {Array.from({ length: range }, (_, i) => {
                  const d = new Date();
                  d.setDate(d.getDate() - range + 1 + i);
                  const date = dayKey(d);
                  const minutes = current.activities
                    .filter((a) => a.date === date)
                    .reduce((s, a) => s + a.minutes, 0);
                  const max = Math.max(
                    ...visibleActivities.map((a) => a.minutes),
                    60,
                  );
                  return (
                    <div className="chart-column" key={date}>
                      <div className="bar-track">
                        <div
                          className="chart-bar"
                          style={{
                            height: minutes
                              ? `${Math.min(100, (minutes / max) * 100)}%`
                              : "2px",
                          }}
                          title={`${dateLabel(date)}: ${minutes} minutes`}
                        />
                      </div>
                      {range === 7 ? (
                        <span>
                          {d.toLocaleDateString(undefined, {
                            weekday: "short",
                          })}
                        </span>
                      ) : (
                        <span>{i % 5 === 0 ? d.getDate() : ""}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
            <section className="panel">
              <div className="section-heading">
                <h2>Your activity log</h2>
                <span className="subtle">
                  {sample
                    ? "Sample history"
                    : connection.connected
                      ? "Garmin + manual entries"
                      : "Manual entries"}
                </span>
              </div>
              {visibleActivities.length ? (
                visibleActivities.map((a) => (
                  <ActivityRow key={a.id} item={a} sample={sample} />
                ))
              ) : (
                <Empty
                  title="Start with your last walk."
                  text="Log a workout, run, or walk. Connect Garmin to bring in recent activities."
                  action="Log an activity"
                  onClick={() => setModal("activity")}
                />
              )}
            </section>
            <div className="workout-link">
              <div>
                <h2>Want a workout built around you?</h2>
                <p>
                  Your original workout coach is right here, with exercise
                  logging and optional voice guidance.
                </p>
              </div>
              <Link className="secondary" href="/workout">
                Open workout coach ↗
              </Link>
            </div>
          </>
        )}
        {tab === "Journal" && (
          <>
            <div className="greeting">
              <div>
                <p className="eyebrow">THE PART YOUR WATCH CAN’T TELL YOU</p>
                <h1>
                  How you feel <em>matters.</em>
                </h1>
                <p>A minute of reflection. A little more understanding.</p>
              </div>
              <button className="primary" onClick={startCheckin}>
                ＋ Daily check-in
              </button>
            </div>
            <div className="journal-grid">
              <section className="panel">
                <div className="section-heading">
                  <h2>Your check-ins</h2>
                  <span className="subtle">
                    {sample
                      ? "Sample history"
                      : user
                        ? "Saved to your account"
                        : "Saved on this device"}
                  </span>
                </div>
                {current.checkIns.length ? (
                  current.checkIns.map((c) => (
                    <article className="journal-entry" key={c.id}>
                      <div className="section-heading">
                        <h3>
                          {c.date === today ? "Today" : dateLabel(c.date)}
                        </h3>
                        {c.date === today && !sample && (
                          <button
                            className="quiet-button"
                            onClick={startCheckin}
                          >
                            Edit
                          </button>
                        )}
                      </div>
                      <div className="journal-tags">
                        <span>☾ {c.sleepHours}h sleep</span>
                        <span>☀ Energy {c.energy}/5</span>
                        <span>Stress {c.stress}/5</span>
                        <span>Soreness {c.soreness}/5</span>
                      </div>
                      <p>
                        {c.note ||
                          "No note added. Sometimes the numbers are enough."}
                      </p>
                    </article>
                  ))
                ) : (
                  <Empty
                    title="Start where you are."
                    text="Record your sleep, energy, stress, and soreness. There’s no perfect score."
                    action="Make my first check-in"
                    onClick={startCheckin}
                  />
                )}
              </section>
              <aside className="panel journal-aside">
                <span className="eyebrow">YOUR OWN WORDS</span>
                <h2>
                  No streak to protect.
                  <br />
                  Just you, checking in.
                </h2>
                <p>
                  Some days you’re full of energy. Some days getting outside is
                  enough. Both belong here.
                </p>
                <div className="journal-rule" />
                <small>Try asking yourself</small>
                <p>“What gave me energy today? What took it away?”</p>
                <button
                  className="secondary"
                  onClick={() => ask("Help me reflect on my latest check-in.")}
                >
                  Reflect with my agent ↗
                </button>
              </aside>
            </div>
          </>
        )}
        {tab === "Memory" && (
          <MemoryPanel
            state={memory.state}
            ready={memory.ready}
            error={memory.error}
            busy={thinking || memory.saving || busy}
            cloud={!!user}
            update={memory.update}
            reload={memory.reload}
            onResume={(id) => void act(() => resumeConversation(id))}
            onForget={() => {
              resetConversationView();
              try {
                localStorage.setItem("wolverine.view.v1", "personal");
              } catch {
                /* Optional view preference. */
              }
              setSample(false);
            }}
          />
        )}
        {tab === "Connections" && (
          <>
            <div className="greeting">
              <div>
                <p className="eyebrow">ONE PICTURE. YOUR PERMISSION.</p>
                <h1>
                  Your health, <em>connected.</em>
                </h1>
                <p>You choose what to connect and when to share.</p>
              </div>
            </div>
            <div className="connections-grid">
              <section className="panel garmin-card">
                <div className="section-heading">
                  <span className="garmin-logo">
                    GARMIN<span>▲</span>
                  </span>
                  <span
                    className={`connection-badge ${connection.connected ? "connected" : ""}`}
                  >
                    {connection.connected
                      ? "Connected"
                      : connection.configured
                        ? "Ready to connect"
                        : "Setup required"}
                  </span>
                </div>
                <h2>Bring your everyday health into focus.</h2>
                <p>
                  Import sleep duration, resting heart rate, steps, and
                  activities from Garmin Connect. You sign in with Garmin and
                  choose your permissions.
                </p>
                <div className="data-scopes">
                  <span>☾ Sleep</span>
                  <span>♡ Heart rate</span>
                  <span>↗ Activity</span>
                  <span>◉ Steps</span>
                </div>
                {connection.connected ? (
                  <>
                    <p className="subtle">
                      {connection.lastSync
                        ? `Last synced ${new Date(connection.lastSync).toLocaleString()}`
                        : "Connected. Your first sync is ready."}
                    </p>
                    <div className="button-row">
                      <button
                        className="primary"
                        disabled={busy}
                        onClick={() => void garminAction("sync")}
                      >
                        {busy ? "Working…" : "Sync recent data"}
                      </button>
                      <button
                        className="quiet-button"
                        disabled={busy}
                        onClick={() => {
                          if (
                            window.confirm(
                              "Disconnect Garmin? This revokes future access. Your existing imported history will remain until you clear it.",
                            )
                          )
                            void garminAction("disconnect");
                        }}
                      >
                        Disconnect
                      </button>
                    </div>
                    <small className="connection-note">
                      Sync imports data uploaded to Garmin in the last 24 hours.
                      Sync your watch to Garmin Connect first. Older history
                      requires Garmin backfill access.
                    </small>
                  </>
                ) : (
                  <>
                    <button
                      className="primary"
                      disabled={busy || !connection.configured || !user}
                      onClick={() => void garminAction("connect")}
                    >
                      {connection.configured
                        ? "Connect Garmin ↗"
                        : "Garmin setup pending"}
                    </button>
                    <p className="connection-note">
                      {!connection.configured
                        ? "An approved Garmin developer app must be configured before live accounts can connect. Your check-ins and activity log work now."
                        : !user
                          ? "Sign in below to securely link your Garmin account."
                          : "Wolverine never asks for or stores your Garmin password."}
                    </p>
                  </>
                )}
              </section>
              <StravaConnection
                key={user?.id || "signed-out"}
                signedIn={!!user}
              />
              <section className="panel privacy-card">
                <span className="eyebrow">BUILT AROUND YOUR CONSENT</span>
                <h2>
                  Your data.
                  <br />
                  Your call.
                </h2>
                <ul>
                  <li>Garmin access can be revoked at any time.</li>
                  <li>
                    AI context is shared only when you allow it and send a
                    message.
                  </li>
                  <li>Export your history or clear it whenever you want.</li>
                </ul>
                <p>
                  Without sign-in, your check-ins stay in this browser. On a
                  shared device, clear your history when you’re done.
                </p>
              </section>
              <section className="panel">
                <div className="section-heading">
                  <h2>Your account</h2>
                  <span className="subtle">
                    {user
                      ? "Signed in"
                      : session.local
                        ? "Local workspace"
                        : "Not signed in"}
                  </span>
                </div>
                {user ? (
                  <>
                    <p className="account-email">{user.email}</p>
                    <button
                      className="secondary"
                      onClick={() =>
                        void act(async () => {
                          await signOut();
                          setNotice("Signed out.");
                        })
                      }
                    >
                      Sign out
                    </button>
                  </>
                ) : session.auth ? (
                  <AuthFields
                    onSubmit={async (email, password, create) => {
                      await act(async () => {
                        if (create) {
                          await signUp(email, password);
                          setNotice(
                            "Account requested. Check your email if confirmation is required.",
                          );
                        } else await signIn(email, password);
                      });
                    }}
                    busy={busy}
                  />
                ) : (
                  <>
                    <p className="subtle">
                      Account sync is awaiting the app’s Supabase configuration.
                      You can use check-ins and the activity log on this device.
                    </p>
                    <p className="connection-note">
                      {session.local && session.ai
                        ? "Your existing OpenAI key is connected to this local preview."
                        : "The AI service will be available once configured."}
                    </p>
                  </>
                )}
              </section>
              <section className="panel">
                <h2>Keep control of your history</h2>
                <p className="subtle">
                  Export your personal data as a Wolverine backup. Importing
                  replaces your current manual history.
                </p>
                <div className="button-row">
                  <button className="secondary" onClick={exportData}>
                    Export my data ↓
                  </button>
                  <button
                    className="secondary"
                    onClick={() => upload.current?.click()}
                    disabled={busy}
                  >
                    Restore backup ↑
                  </button>
                  <input
                    ref={upload}
                    type="file"
                    accept="application/json,.json"
                    hidden
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (
                        file &&
                        window.confirm(
                          "Replace your current manual history with this Wolverine backup?",
                        )
                      )
                        void importData(file);
                      else if (upload.current) upload.current.value = "";
                    }}
                  />
                </div>
                <button
                  className="danger-button"
                  onClick={() => setModal("delete")}
                >
                  Clear my health history
                </button>
              </section>
            </div>
          </>
        )}
        <footer>
          {tab !== "Memory" && sample
            ? "Preview uses fictional sample data. "
            : user
              ? "Your history is saved to your account. "
              : "Your personal check-ins are stored on this device. "}
          Wolverine is a wellness companion, not medical care.{" "}
          <Link href="/transparency">Read our soul & memory ↗</Link>
        </footer>
      </main>
      <nav className="mobile-dock" aria-label="Mobile navigation">
        {(["Today", "Your agent", "Activity", "Journal"] as Tab[]).map(
          (item, index) => (
            <button
              key={item}
              className={tab === item ? "selected" : ""}
              aria-current={tab === item ? "page" : undefined}
              onClick={() => navigate(item)}
            >
              <span aria-hidden="true">{icons[index]}</span>
              <span>{item === "Your agent" ? "Agent" : item}</span>
            </button>
          ),
        )}
        <button
          className={
            tab === "Memory" || tab === "Connections" || moreOpen
              ? "selected"
              : ""
          }
          aria-haspopup="dialog"
          aria-expanded={moreOpen}
          onClick={() => setMoreOpen(true)}
        >
          <span aria-hidden="true">•••</span>
          <span>More</span>
        </button>
      </nav>
      {moreOpen && (
        <Modal title="Your space" onClose={() => setMoreOpen(false)}>
          <button className="studio-launch" onClick={() => { setMoreOpen(false); setModal("studio"); }}>◇ Create a 3D sketch</button>
          <div className="mobile-menu">
            <button onClick={() => navigate("Memory")}>
              <span>◇</span>
              <div>
                Memory<small>Review what your agent remembers</small>
              </div>
              <span>↗</span>
            </button>
            <button onClick={() => navigate("Connections")}>
              <span>⌘</span>
              <div>
                Connections<small>Garmin, Strava and your account</small>
              </div>
              <span>↗</span>
            </button>
            <button
              onClick={() => {
                setMoreOpen(false);
                setModal("profile");
              }}
            >
              <span>◉</span>
              <div>
                Your profile<small>Goals and time for movement</small>
              </div>
              <span>↗</span>
            </button>
            <Link href="/transparency">
              <span>◇</span>
              <div>
                Our soul & memory<small>Read how the agent works</small>
              </div>
              <span>↗</span>
            </Link>
            <Link href="/workout">
              <span>↗</span>
              <div>
                Workout coach<small>Open the original workout experience</small>
              </div>
              <span>↗</span>
            </Link>
          </div>
        </Modal>
      )}
      {modal === "studio" && (<Modal title="Make something yours." onClose={() => setModal(null)}><SketchStudio key={user?.id || "local"} /></Modal>)}
      {modal === "context" && (
        <Modal title="What your agent sees" onClose={() => setModal(null)}>
          <p>
            {sample
              ? "You’re exploring fictional sample records. Your personal memory is excluded."
              : "Your current health profile, recent records, and relevant confirmed memories when memory is on."}
          </p>
          <div className="context-item">
            <small>YOUR FOCUS</small>
            <p>{current.profile.goal}</p>
          </div>
          <div className="context-item">
            <small>TIME FOR MOVEMENT</small>
            <p>{current.profile.minutes} minutes</p>
          </div>
          <div className="context-item">
            <small>RECENT CONTEXT</small>
            <p>
              Up to 14 check-ins, 14 daily wearable records, and 20 activities.
              Missing data stays unknown.
            </p>
          </div>
          <p>
            Data is sent to OpenAI only when you allow sharing and send a
            message. Strava is queried separately in Connections.
          </p>
          <button
            className="secondary"
            onClick={() => {
              setModal(null);
              navigate("Memory");
            }}
          >
            Review your memory
          </button>
        </Modal>
      )}
      {modal === "checkin" && (
        <Modal title="A moment for you." onClose={() => setModal(null)}>
          <p className="subtle">
            How are you arriving today? This saves to your personal history.
          </p>
          <form onSubmit={submitCheckin}>
            <div className="form-grid">
              <label>
                Sleep last night <span>hours</span>
                <input
                  name="sleepHours"
                  type="number"
                  step="0.1"
                  min="0"
                  max="24"
                  defaultValue={
                    data.checkIns.find((c) => c.date === today)?.sleepHours ?? 7
                  }
                  required
                />
              </label>
              <label>
                Energy
                <select
                  name="energy"
                  defaultValue={
                    data.checkIns.find((c) => c.date === today)?.energy ?? 3
                  }
                >
                  {["Very low", "Low", "Okay", "Good", "Great"].map((s, i) => (
                    <option key={s} value={i + 1}>
                      {i + 1} · {s}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Stress
                <select
                  name="stress"
                  defaultValue={
                    data.checkIns.find((c) => c.date === today)?.stress ?? 2
                  }
                >
                  {["Very calm", "Low", "Moderate", "High", "Very high"].map(
                    (s, i) => (
                      <option key={s} value={i + 1}>
                        {i + 1} · {s}
                      </option>
                    ),
                  )}
                </select>
              </label>
              <label>
                Soreness
                <select
                  name="soreness"
                  defaultValue={
                    data.checkIns.find((c) => c.date === today)?.soreness ?? 1
                  }
                >
                  {["None", "Mild", "Noticeable", "High", "Very high"].map(
                    (s, i) => (
                      <option key={s} value={i + 1}>
                        {i + 1} · {s}
                      </option>
                    ),
                  )}
                </select>
              </label>
            </div>
            <label>
              Anything on your mind?
              <textarea
                name="note"
                maxLength={2000}
                placeholder="How you’re feeling, what’s coming up…"
                defaultValue={
                  data.checkIns.find((c) => c.date === today)?.note ?? ""
                }
              />
            </label>
            <button className="primary" disabled={busy}>
              {busy ? "Saving…" : "Save my check-in"}
            </button>
          </form>
        </Modal>
      )}
      {modal === "activity" && (
        <Modal title="Every bit counts." onClose={() => setModal(null)}>
          <form onSubmit={submitActivity}>
            <label>
              Activity name
              <input
                name="name"
                maxLength={120}
                placeholder="A walk around the neighborhood"
                required
              />
            </label>
            <div className="form-grid">
              <label>
                Type
                <select name="type">
                  {[
                    "Walking",
                    "Running",
                    "Strength",
                    "Cycling",
                    "Swimming",
                    "Mobility",
                    "Other",
                  ].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
              <label>
                Date
                <input
                  name="date"
                  type="date"
                  defaultValue={today}
                  max={today}
                  required
                />
              </label>
              <label>
                Duration <span>minutes</span>
                <input
                  name="minutes"
                  type="number"
                  min="1"
                  max="1440"
                  required
                  defaultValue="30"
                />
              </label>
              <label>
                Distance <span>km · optional</span>
                <input
                  name="distance"
                  type="number"
                  min="0"
                  max="1000"
                  step="0.1"
                />
              </label>
            </div>
            <button className="primary" disabled={busy}>
              {busy ? "Saving…" : "Save activity"}
            </button>
          </form>
        </Modal>
      )}
      {modal === "profile" && (
        <Modal title="Make this yours." onClose={() => setModal(null)}>
          <form onSubmit={submitProfile}>
            <label>
              What should we call you?
              <input
                name="name"
                maxLength={60}
                defaultValue={data.profile.name}
                placeholder="Your first name"
              />
            </label>
            <label>
              What are you working toward?
              <textarea
                name="goal"
                maxLength={240}
                defaultValue={data.profile.goal}
                required
              />
            </label>
            <label>
              Time for movement <span>minutes a day</span>
              <input
                name="minutes"
                type="number"
                min="5"
                max="180"
                defaultValue={data.profile.minutes}
                required
              />
            </label>
            <button className="primary" disabled={busy}>
              {busy ? "Saving…" : "Save preferences"}
            </button>
          </form>
        </Modal>
      )}
      {modal === "delete" && (
        <Modal
          title="Clear your health history?"
          onClose={() => setModal(null)}
        >
          <p>
            This removes your saved profile, check-ins, activities, and plan
            history, saved memories, and conversations{" "}
            {user ? "from your account" : "from this browser"}. Export a backup
            first if you want to keep a copy.
          </p>
          <p className="subtle">
            Your Garmin connection is separate. Disconnect it first if you want
            to stop future imports.
          </p>
          <div className="button-row">
            <button className="secondary" onClick={() => setModal(null)}>
              Keep my history
            </button>
            <button
              className="danger-button"
              disabled={busy}
              onClick={() =>
                void act(async () => {
                  await memory.update(() => emptyMemory());
                  resetConversationView();
                  if (user) {
                    const r = await fetch("/api/health/data", {
                      method: "DELETE",
                    });
                    if (!r.ok) throw new Error("Could not clear your history.");
                  } else localStorage.removeItem("wolverine.health.v1");
                  setData(emptyHealth);
                  setSample(false);
                  setMessages([]);
                  setConsent(false);
                  setModal(null);
                  setNotice("Your health history has been cleared.");
                })
              }
            >
              Clear history
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
function ActivityRow({ item: a, sample }: { item: Activity; sample: boolean }) {
  return (
    <article className="activity-row">
      <div className="activity-icon" aria-hidden="true">
        {a.type.toLowerCase().includes("run")
          ? "↗"
          : a.type.toLowerCase().includes("strength")
            ? "⌁"
            : "◉"}
      </div>
      <div>
        <h3>{a.name}</h3>
        <p>
          {dateLabel(a.date)} ·{" "}
          {sample
            ? "Sample"
            : a.source === "garmin"
              ? "Garmin"
              : "Manual entry"}
        </p>
      </div>
      <strong>
        {a.minutes}
        <small> min</small>
      </strong>
      {a.distanceKm !== undefined && (
        <span className="distance">{a.distanceKm} km</span>
      )}
    </article>
  );
}
function Empty({
  title,
  text,
  action,
  onClick,
}: {
  title: string;
  text: string;
  action: string;
  onClick: () => void;
}) {
  return (
    <div className="empty-state">
      <span className="agent-mark">◌</span>
      <h3>{title}</h3>
      <p>{text}</p>
      <button className="secondary" onClick={onClick}>
        {action}
      </button>
    </div>
  );
}
function AuthFields({
  onSubmit,
  busy,
}: {
  onSubmit: (email: string, password: string, create: boolean) => Promise<void>;
  busy: boolean;
}) {
  const [create, setCreate] = useState(false);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        void onSubmit(
          String(f.get("email")),
          String(f.get("password")),
          create,
        );
      }}
    >
      <label>
        Email
        <input name="email" type="email" autoComplete="email" required />
      </label>
      <label>
        Password
        <input
          name="password"
          type="password"
          minLength={8}
          autoComplete={create ? "new-password" : "current-password"}
          required
        />
      </label>
      <div className="button-row">
        <button className="primary" disabled={busy}>
          {create ? "Create account" : "Sign in"}
        </button>
        <button
          type="button"
          className="quiet-button"
          onClick={() => setCreate(!create)}
        >
          {create ? "Already have an account?" : "Create an account"}
        </button>
      </div>
    </form>
  );
}
