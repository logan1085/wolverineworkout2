// Shared, provider-independent memory model. No browser or server side effects.
export const memoryCategories = [
  "goal",
  "preference",
  "routine",
  "constraint",
] as const;
export type MemoryCategory = (typeof memoryCategories)[number];
export type MemoryEntry = {
  id: string;
  category: MemoryCategory;
  text: string;
  evidence: string | null;
  source: "manual" | "conversation";
  createdAt: string;
  updatedAt: string;
  expiresOn: string | null;
};
export type MemorySuggestion = {
  category: MemoryCategory;
  text: string;
  evidence: string;
};
export type SavedMessage = { role: "user" | "assistant"; content: string };
export type SavedConversation = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: SavedMessage[];
};
export type MemoryState = {
  enabled: boolean;
  entries: MemoryEntry[];
  conversations: SavedConversation[];
  activeConversationId: string | null;
};
export type MemorySnapshot = { state: MemoryState; revision: number };
export const MEMORY_STORAGE_KEY = "wolverine.memory.v1";
export const emptyMemory = (): MemoryState => ({
  enabled: false,
  entries: [],
  conversations: [],
  activeConversationId: null,
});
export const normalizeMemoryText = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
const timestamp = (v: unknown): v is string =>
  typeof v === "string" && v.length <= 40 && Number.isFinite(Date.parse(v));
const string = (v: unknown, max: number): v is string =>
  typeof v === "string" && v.trim().length > 0 && v.length <= max;
export function validateMemory(value: unknown): MemoryState {
  if (!value || typeof value !== "object")
    throw new Error("Memory must be an object.");
  const state = value as MemoryState;
  if (
    typeof state.enabled !== "boolean" ||
    !Array.isArray(state.entries) ||
    state.entries.length > 100 ||
    !Array.isArray(state.conversations) ||
    state.conversations.length > 10
  )
    throw new Error("Memory supports 100 facts and 10 conversations.");
  const ids = new Set<string>();
  const facts = new Set<string>();
  const entries = state.entries.map((m) => {
    if (
      !m ||
      !string(m.id, 80) ||
      ids.has(m.id) ||
      !memoryCategories.includes(m.category) ||
      !string(m.text, 400) ||
      !["manual", "conversation"].includes(m.source) ||
      !timestamp(m.createdAt) ||
      !timestamp(m.updatedAt) ||
      (m.evidence !== null && !string(m.evidence, 600)) ||
      (m.source === "conversation" && m.evidence === null)
    )
      throw new Error("Invalid memory entry.");
    if (
      m.expiresOn !== null &&
      (typeof m.expiresOn !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(m.expiresOn) ||
        !Number.isFinite(Date.parse(m.expiresOn)) ||
        new Date(m.expiresOn).toISOString().slice(0, 10) !== m.expiresOn)
    )
      throw new Error("Invalid memory review date.");
    const normalized = normalizeMemoryText(m.text);
    if (!normalized || facts.has(normalized))
      throw new Error("That memory is already saved.");
    ids.add(m.id);
    facts.add(normalized);
    return {
      id: m.id,
      category: m.category,
      text: m.text.trim(),
      evidence: m.evidence,
      source: m.source,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
      expiresOn: m.expiresOn,
    };
  });
  const conversationIds = new Set<string>();
  const conversations = state.conversations.map((c) => {
    if (
      !c ||
      !string(c.id, 80) ||
      conversationIds.has(c.id) ||
      !string(c.title, 100) ||
      !timestamp(c.createdAt) ||
      !timestamp(c.updatedAt) ||
      !Array.isArray(c.messages) ||
      c.messages.length > 40 ||
      c.messages.some(
        (m) =>
          !m ||
          !["user", "assistant"].includes(m.role) ||
          !string(m.content, 4000),
      )
    )
      throw new Error("Invalid saved conversation.");
    conversationIds.add(c.id);
    return {
      id: c.id,
      title: c.title,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      messages: c.messages.map((m) => ({ role: m.role, content: m.content })),
    };
  });
  if (
    state.activeConversationId !== null &&
    !conversationIds.has(state.activeConversationId)
  )
    throw new Error("The selected conversation no longer exists.");
  const clean = {
    enabled: state.enabled,
    entries,
    conversations,
    activeConversationId: state.activeConversationId,
  };
  if (JSON.stringify(clean).length > 150000)
    throw new Error(
      "Memory is full. Export or delete older conversations first.",
    );
  return clean;
}
export function validateSnapshot(value: unknown): MemorySnapshot {
  if (!value || typeof value !== "object")
    throw new Error("Invalid memory snapshot.");
  const snapshot = value as MemorySnapshot;
  if (!Number.isSafeInteger(snapshot.revision) || snapshot.revision < 0)
    throw new Error("Invalid memory revision.");
  return { revision: snapshot.revision, state: validateMemory(snapshot.state) };
}
export function memoryExpired(entry: MemoryEntry, now = Date.now()) {
  return (
    entry.expiresOn !== null &&
    Date.parse(entry.expiresOn + "T23:59:59.999Z") < now
  );
}
export function retrieveMemories(
  state: MemoryState,
  query: string,
  now = Date.now(),
): MemoryEntry[] {
  if (!state.enabled) return [];
  const words = new Set(
    normalizeMemoryText(query)
      .split(" ")
      .filter((w) => w.length > 2),
  );
  return state.entries
    .filter((e) => !memoryExpired(e, now))
    .map((entry) => {
      const terms = normalizeMemoryText(entry.text).split(" ");
      const overlaps = terms.reduce((s, t) => s + (words.has(t) ? 3 : 0), 0);
      return {
        entry,
        score:
          overlaps +
          (entry.category === "constraint"
            ? 5
            : entry.category === "goal"
              ? 3
              : 1),
      };
    })
    .sort(
      (a, b) =>
        b.score - a.score || b.entry.updatedAt.localeCompare(a.entry.updatedAt),
    )
    .slice(0, 8)
    .map((x) => x.entry);
}
// Suggestions must cite an exact substring of the latest user message, not an
// assistant answer, a wearable measurement, or an older unsupported inference.
export function groundedSuggestions(
  value: unknown,
  latestUserText: string,
  existing: MemoryEntry[],
): MemorySuggestion[] {
  if (!Array.isArray(value)) return [];
  const known = new Set(existing.map((m) => normalizeMemoryText(m.text)));
  const result: MemorySuggestion[] = [];
  for (const m of value) {
    if (
      !m ||
      typeof m !== "object" ||
      !memoryCategories.includes(m.category) ||
      !string(m.text, 400) ||
      !string(m.evidence, 600) ||
      m.evidence.trim().length < 4 ||
      !latestUserText.includes(m.evidence)
    )
      continue;
    const key = normalizeMemoryText(m.text);
    if (!key || known.has(key)) continue;
    known.add(key);
    result.push({
      category: m.category,
      text: m.text.trim(),
      evidence: m.evidence,
    });
    if (result.length === 3) break;
  }
  return result;
}
export function recordConversation(
  state: MemoryState,
  id: string,
  messages: SavedMessage[],
  now = new Date().toISOString(),
): MemoryState {
  if (!state.enabled) return state;
  const old = state.conversations.find((c) => c.id === id);
  const first =
    messages.find((m) => m.role === "user")?.content || "Conversation";
  const conversation = {
    id,
    title: old?.title || first.slice(0, 80),
    createdAt: old?.createdAt || now,
    updatedAt: now,
    messages: messages.slice(-40),
  };
  const conversations = [
    conversation,
    ...state.conversations.filter((c) => c.id !== id),
  ].slice(0, 10);
  const next = { ...state, conversations, activeConversationId: id };
  // Drop oldest conversations first; never truncate confirmed facts.
  while (JSON.stringify(next).length > 145000 && next.conversations.length > 1)
    next.conversations.pop();
  while (
    JSON.stringify(next).length > 145000 &&
    conversation.messages.length > 2
  )
    conversation.messages.splice(0, 2);
  return validateMemory(next);
}
export function forgetMemory(state: MemoryState, id: string): MemoryState {
  // Old transcripts may contain the fact. Clear them as disclosed by the UI,
  // otherwise a "forgotten" fact could re-enter context by resuming a chat.
  return {
    ...state,
    entries: state.entries.filter((m) => m.id !== id),
    conversations: [],
    activeConversationId: null,
  };
}
export function readLocalMemory(
  storage: Pick<Storage, "getItem">,
): MemorySnapshot {
  const raw = storage.getItem(MEMORY_STORAGE_KEY);
  return raw
    ? validateSnapshot(JSON.parse(raw))
    : { state: emptyMemory(), revision: 0 };
}
export function saveLocalMemory(
  storage: Pick<Storage, "getItem" | "setItem">,
  state: MemoryState,
  expectedRevision: number,
): MemorySnapshot {
  const current = readLocalMemory(storage);
  if (current.revision !== expectedRevision)
    throw new Error("Memory changed in another tab. Reload it before saving.");
  const next = { state: validateMemory(state), revision: current.revision + 1 };
  storage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(next));
  return next;
}
export const agentMemorySchema = {
  type: "object",
  additionalProperties: false,
  required: ["reply", "suggestions"],
  properties: {
    reply: { type: "string" },
    suggestions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["category", "text", "evidence"],
        properties: {
          category: { type: "string", enum: [...memoryCategories] },
          text: { type: "string" },
          evidence: { type: "string" },
        },
      },
    },
  },
};
