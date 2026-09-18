import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs";
import ts from "typescript";
const source = ts.transpileModule(
  fs.readFileSync("src/lib/health/memory-model.ts", "utf8"),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  },
).outputText;
const compiled = { exports: {} };
new Function("require", "module", "exports", source)(
  require,
  compiled,
  compiled.exports,
);
const {
  emptyMemory,
  validateMemory,
  readLocalMemory,
  saveLocalMemory,
  retrieveMemories,
  groundedSuggestions,
  recordConversation,
  forgetMemory,
} = compiled.exports;
const now = "2026-09-18T12:00:00.000Z";
function fact(id, text, extra = {}) {
  return {
    id,
    category: "preference",
    text,
    evidence: null,
    source: "manual",
    createdAt: now,
    updatedAt: now,
    expiresOn: null,
    ...extra,
  };
}
function storage() {
  const map = new Map();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => map.set(k, v),
  };
}
function state(entries = []) {
  return { ...emptyMemory(), enabled: true, entries };
}
test("confirmed memories survive a new storage reader / session", () => {
  const disk = storage();
  const saved = saveLocalMemory(
    disk,
    state([fact("one", "I prefer morning workouts.")]),
    0,
  );
  const reloaded = readLocalMemory(disk);
  assert.deepEqual(saved, reloaded);
  assert.equal(
    retrieveMemories(reloaded.state, "When should I train?", Date.parse(now))[0]
      .id,
    "one",
  );
});
test("memory off excludes saved facts without deleting them", () => {
  const s = { ...state([fact("one", "I enjoy cycling.")]), enabled: false };
  assert.deepEqual(retrieveMemories(s, "cycling"), []);
  assert.equal(s.entries.length, 1);
});
test("expired facts stay reviewable but cannot be retrieved", () => {
  const s = state([
    fact("old", "I am traveling this week.", { expiresOn: "2026-09-17" }),
    fact("current", "I prefer morning walks."),
  ]);
  assert.equal(s.entries.length, 2);
  assert.deepEqual(
    retrieveMemories(s, "travel", Date.parse(now)).map((m) => m.id),
    ["current"],
  );
});
test("retrieval prioritizes relevant facts and constraints with bounded context", () => {
  const entries = Array.from({ length: 12 }, (_, i) =>
    fact(String(i), "Preference number " + i),
  );
  entries.push(
    fact("match", "I prefer swimming before work."),
    fact("constraint", "I only have access to bodyweight equipment.", {
      category: "constraint",
    }),
  );
  const result = retrieveMemories(
    state(entries),
    "swimming before work",
    Date.parse(now),
  );
  assert.equal(result.length, 8);
  assert.equal(result[0].id, "match");
  assert.ok(result.some((m) => m.id === "constraint"));
});
test("duplicate facts and malformed backups are rejected", () => {
  assert.throws(() =>
    validateMemory(
      state([fact("a", "Morning walks!"), fact("b", "morning walks")]),
    ),
  );
  assert.throws(() =>
    validateMemory(state([fact("a", "Bad source", { source: "assistant" })])),
  );
  assert.throws(() =>
    validateMemory(state([fact("a", "Bad date", { expiresOn: "2026-02-31" })])),
  );
  assert.throws(() =>
    validateMemory({ ...state(), activeConversationId: "missing" }),
  );
});
test("suggestions need exact user evidence and are not automatically saved", () => {
  const s = state();
  const result = groundedSuggestions(
    [
      {
        category: "routine",
        text: "I run on Tuesdays.",
        evidence: "I run on Tuesdays",
      },
      {
        category: "constraint",
        text: "I have a diagnosed condition.",
        evidence: "The assistant diagnosed me",
      },
      { category: "goal", text: "Complete a marathon.", evidence: "marathon" },
    ],
    "I run on Tuesdays after work.",
    s.entries,
  );
  assert.equal(result.length, 1);
  assert.equal(s.entries.length, 0);
  assert.equal(result[0].category, "routine");
});
test("already remembered facts are not proposed again", () => {
  assert.deepEqual(
    groundedSuggestions(
      [
        {
          category: "preference",
          text: "I like walking!",
          evidence: "I like walking",
        },
      ],
      "I like walking",
      [fact("a", "I like walking.")],
    ),
    [],
  );
});
test("conversation recording is opt-in and bounds retained history", () => {
  const messages = [
    { role: "user", content: "Help me plan my morning." },
    { role: "assistant", content: "Start with a short walk." },
  ];
  const off = emptyMemory();
  assert.equal(recordConversation(off, "a", messages), off);
  let s = state();
  for (let i = 0; i < 15; i++)
    s = recordConversation(s, String(i), messages, now);
  assert.equal(s.conversations.length, 10);
  assert.equal(s.activeConversationId, "14");
  assert.equal(s.conversations[0].title, "Help me plan my morning.");
  assert.equal(s.conversations[9].id, "5");
});
test("long conversations and total serialized size stay bounded", () => {
  let s = state();
  for (let i = 0; i < 12; i++)
    s = recordConversation(
      s,
      String(i),
      Array.from({ length: 80 }, (_, j) => ({
        role: j % 2 ? "assistant" : "user",
        content: "x".repeat(3900),
      })),
      now,
    );
  assert.ok(JSON.stringify(s).length <= 150000);
  assert.ok(s.conversations[0].messages.length <= 40);
  assert.ok(s.conversations[0].messages.length >= 2);
});
test("forget removes the fact and transcripts but preserves unrelated memories", () => {
  const s = recordConversation(
    state([fact("a", "I like running."), fact("b", "I like swimming.")]),
    "chat",
    [{ role: "user", content: "I like running." }],
    now,
  );
  const forgotten = forgetMemory(s, "a");
  assert.equal(forgotten.entries.length, 1);
  assert.equal(forgotten.entries[0].id, "b");
  assert.deepEqual(forgotten.conversations, []);
  assert.equal(forgotten.activeConversationId, null);
});
test("a stale session cannot restore facts after forget-everything", () => {
  const disk = storage();
  const previous = saveLocalMemory(
    disk,
    state([fact("a", "Private preference.")]),
    0,
  );
  const cleared = saveLocalMemory(disk, emptyMemory(), previous.revision);
  assert.throws(
    () => saveLocalMemory(disk, previous.state, previous.revision),
    /another tab/,
  );
  assert.deepEqual(readLocalMemory(disk), cleared);
  assert.equal(cleared.state.entries.length, 0);
});
test("corrupt storage fails closed rather than overwriting personal data", () => {
  const disk = storage();
  disk.setItem("wolverine.memory.v1", "broken");
  assert.throws(() => readLocalMemory(disk));
  assert.throws(() => saveLocalMemory(disk, state(), 0));
  assert.equal(disk.getItem("wolverine.memory.v1"), "broken");
});
