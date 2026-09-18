// Calls the real local HTTP route with fictional records only. No browser state.
import assert from "node:assert/strict";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
const base = process.env.TEST_ORIGIN || "http://127.0.0.1:3018";
const cases = JSON.parse(
  readFileSync(new URL("./health-agent.cases.json", import.meta.url)),
);
function grade(scenario, data, status = 200) {
  const failures = [];
  if (status !== 200) failures.push(`HTTP ${status}: ${data.error}`);
  else {
    for (const expression of scenario.must || [])
      if (!new RegExp(expression, "i").test(data.message))
        failures.push(`Missing expected pattern: ${expression}`);
    for (const expression of scenario.mustNot || [])
      if (new RegExp(expression, "i").test(data.message))
        failures.push(`Prohibited pattern: ${expression}`);
    if (
      scenario.maxSuggestions !== undefined &&
      data.suggestions.length > scenario.maxSuggestions
    )
      failures.push("Too many memory suggestions");
    if (
      scenario.minSuggestions !== undefined &&
      data.suggestions.length < scenario.minSuggestions
    )
      failures.push("Missing grounded memory candidate");
    if (!data.suggestions.every((s) => scenario.message.includes(s.evidence)))
      failures.push("Ungrounded memory evidence");
  }
  return failures;
}
// Recheck unchanged captured outputs when correcting a lexical grader; no model call.
if (process.argv.includes("--regrade")) {
  const path = "evals/results/health-agent-latest.json";
  const report = JSON.parse(readFileSync(path));
  assert.equal(report.results.length, cases.length);
  for (const result of report.results) {
    const scenario = cases.find((c) => c.id === result.id);
    assert.ok(
      scenario &&
        scenario.message === result.question &&
        typeof result.reply === "string",
    );
    result.failures = grade(scenario, {
      message: result.reply,
      suggestions: result.suggestions,
    });
  }
  report.regradedAt = new Date().toISOString();
  report.passed = report.results.filter((r) => !r.failures.length).length;
  writeFileSync(path, JSON.stringify(report, null, 2) + "\n");
  console.log(
    `${report.passed}/${report.total} captured outputs pass current checks. No new model calls.`,
  );
  process.exit(report.passed === report.total ? 0 : 1);
}
if (!process.argv.includes("--live")) {
  console.log(
    `Loaded ${cases.length} scenarios. Pass --live to call the running local agent with synthetic data.`,
  );
  process.exit(0);
}
const session = await fetch(base + "/api/health/session", {
  headers: { "sec-fetch-site": "same-origin" },
});
const cookie = session.headers.get("set-cookie")?.split(";")[0];
assert.ok(cookie, "Start local-health-preview first.");
const results = [];
for (const scenario of cases) {
  const now = new Date().toISOString();
  const memory = {
    enabled: scenario.memoryEnabled !== false,
    entries: scenario.memoryText
      ? [
          {
            id: "synthetic-preference",
            category: "preference",
            text: scenario.memoryText,
            evidence: null,
            source: "manual",
            createdAt: now,
            updatedAt: now,
            expiresOn: null,
          },
        ]
      : [],
    conversations: [],
    activeConversationId: null,
  };
  const response = await fetch(base + "/api/health/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json", cookie, origin: base },
    body: JSON.stringify({
      messages: [{ role: "user", content: scenario.message }],
      state: {
        profile: {
          name: "Synthetic evaluation",
          goal: scenario.profileGoal || "Build a sustainable routine",
          minutes: 30,
        },
        checkIns: [],
        activities: [],
        metrics: scenario.metric ? [scenario.metric] : [],
        completed: [],
      },
      memory,
      useMemory: memory.enabled,
      sample: !!scenario.sample,
      consent: true,
    }),
    signal: AbortSignal.timeout(60000),
  });
  const data = await response.json();
  const failures = grade(scenario, data, response.status);
  results.push({
    id: scenario.id,
    question: scenario.message,
    reviewCriteria: scenario.review,
    reply: data.message,
    suggestions: data.suggestions,
    promptVersion: data.promptVersion,
    model: data.model,
    failures,
  });
  console.log(
    `${failures.length ? "FAIL" : "PASS"}: ${scenario.id}${failures.length ? ": " + failures.join("; ") : ""}`,
  );
}
mkdirSync("evals/results", { recursive: true });
const report = {
  runAt: new Date().toISOString(),
  type: "Live HTTP smoke evaluation; lexical checks plus manual review required, not clinical validation",
  passed: results.filter((r) => !r.failures.length).length,
  total: results.length,
  results,
};
writeFileSync(
  "evals/results/health-agent-latest.json",
  JSON.stringify(report, null, 2) + "\n",
);
console.log(
  `${report.passed}/${report.total} smoke checks passed. Review synthetic outputs in evals/results/health-agent-latest.json.`,
);
process.exitCode = report.passed === report.total ? 0 : 1;
