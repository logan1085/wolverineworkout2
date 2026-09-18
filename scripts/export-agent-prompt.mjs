// Generate a readable copy from the actual runtime source; never maintain two prompts.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import ts from "typescript";
const compiled = { exports: {} };
new Function(
  "module",
  "exports",
  ts.transpileModule(readFileSync("src/lib/health/agent-prompt.ts", "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText,
)(compiled, compiled.exports);
const { buildHealthPrompt, buildStravaPrompt, HEALTH_PROMPT_VERSION } =
  compiled.exports;
mkdirSync("docs/agent", { recursive: true });
writeFileSync(
  "docs/agent/SYSTEM_PROMPT.md",
  `# Wolverine system prompt\n\nVersion: ${HEALTH_PROMPT_VERSION}\n\nGenerated with \`node scripts/export-agent-prompt.mjs\` from \`src/lib/health/agent-prompt.ts\`. Edit the source, then regenerate this document. The example below has personal mode and memory enabled; the runtime selects separate instructions when memory is off or fictional sample data is active. The date is illustrative, replaced each request. User data is sent separately as untrusted reference JSON.\n\n## Personal health agent\n\n${buildHealthPrompt({ sample: false, memoryEnabled: true, now: new Date("2026-09-18T12:00:00Z") })}\n\n## Separate live Strava view\n\n${buildStravaPrompt()}\n`,
);
console.log("Exported docs/agent/SYSTEM_PROMPT.md from runtime source.");
