// Live integration checks use fictional facts only; they don't touch browser data.
import assert from "node:assert/strict";
const base = "http://127.0.0.1:3018";
const session = await fetch(base + "/api/health/session", {
  headers: { "sec-fetch-site": "same-origin" },
});
const cookie = session.headers.get("set-cookie")?.split(";")[0];
assert.ok(cookie, "Start local-health-preview first.");
const state = {
  profile: {
    name: "Synthetic test persona",
    goal: "Build a sustainable routine",
    minutes: 30,
  },
  checkIns: [],
  metrics: [],
  activities: [],
  completed: [],
};
const empty = {
  enabled: true,
  entries: [],
  conversations: [],
  activeConversationId: null,
};
async function chat(message, memory, sample = false, useMemory = true) {
  const r = await fetch(base + "/api/health/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json", cookie, origin: base },
    body: JSON.stringify({
      messages: [{ role: "user", content: message }],
      state,
      memory,
      sample,
      useMemory,
      consent: true,
    }),
  });
  const data = await r.json();
  assert.equal(r.status, 200, data.error);
  return data;
}
for (const method of ["GET", "PUT"]) {
  const r = await fetch(base + "/api/health/memory", {
    method,
    headers: {
      cookie,
      origin: base,
      ...(method === "PUT" ? { "Content-Type": "application/json" } : {}),
    },
    ...(method === "PUT"
      ? { body: JSON.stringify({ state: empty, revision: 0 }) }
      : {}),
  });
  assert.equal(r.status, 401);
  console.log("PASS: local session cannot " + method + " cloud memory");
}
if (process.argv.includes("--live")) {
  const utterance =
    "I prefer morning swims, and I only have 20 minutes before work.";
  const proposal = await chat(utterance, empty);
  assert.ok(
    proposal.suggestions.length > 0,
    "Expected a grounded suggestion for an explicit preference.",
  );
  assert.ok(proposal.suggestions.every((s) => utterance.includes(s.evidence)));
  assert.deepEqual(proposal.memoryUsed, []);
  console.log(
    "PASS: live extraction proposes grounded facts without claiming persistence",
  );
  const now = new Date().toISOString();
  const remembered = {
    ...empty,
    entries: [
      {
        id: "synthetic-memory",
        category: "preference",
        text: "I prefer morning swims before work.",
        source: "manual",
        evidence: null,
        createdAt: now,
        updatedAt: now,
        expiresOn: null,
      },
    ],
  };
  // Fresh messages array emulates a new conversation with no original transcript.
  const recalled = await chat(
    "What type of movement do I prefer, and when?",
    remembered,
  );
  assert.equal(recalled.memoryUsed[0]?.id, "synthetic-memory");
  assert.match(recalled.message, /swim/i);
  assert.match(recalled.message, /morning|before work/i);
  console.log("PASS: a new conversation recalls a confirmed preference");
  const paused = await chat("What preferences do you have saved for me?", {
    ...remembered,
    enabled: false,
  });
  assert.deepEqual(paused.memoryUsed, []);
  assert.deepEqual(paused.suggestions, []);
  console.log("PASS: paused memory is excluded");
  const sample = await chat("Give me one simple next step.", remembered, true);
  assert.deepEqual(sample.memoryUsed, []);
  assert.deepEqual(sample.suggestions, []);
  console.log("PASS: sample chats cannot recall or propose personal memories");
}
