// Reuse a key in another ignored env file without copying it into this project.
// Development only: binds to loopback and protects health API calls with an
// HttpOnly cookie minted only for same-origin requests to this exact host.
import { readFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { spawn } from "node:child_process";
const source = process.argv[2];
if (!source) {
  console.error(
    "Provide the path to an existing env file. Secret values are never printed.",
  );
  process.exit(1);
}
const contents = readFileSync(source, "utf8");
const line = contents
  .split(/\r?\n/)
  .find((s) => /^\s*(?:export\s+)?OPENAI_API_KEY\s*=/.test(s));
const key = line
  ?.slice(line.indexOf("=") + 1)
  .trim()
  .replace(/^(['"])(.*)\1$/, "$2");
if (!key) {
  console.error("No API key found in the selected file.");
  process.exit(1);
}
const child = spawn(
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    "dev",
    "--hostname",
    "127.0.0.1",
    "--port",
    "3018",
  ],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      OPENAI_API_KEY: key,
      HEALTH_LOCAL_PREVIEW: "1",
      HEALTH_LOCAL_HOST: "127.0.0.1:3018",
      HEALTH_LOCAL_TOKEN: randomBytes(32).toString("hex"),
    },
  },
);
for (const signal of ["SIGTERM", "SIGINT"])
  process.on(signal, () => child.kill(signal));
child.on("exit", (code) => process.exit(code ?? 0));
