import { readFile } from "node:fs/promises";

const [lock, npmrc] = await Promise.all([
  readFile(new URL("../package-lock.json", import.meta.url), "utf8"),
  readFile(new URL("../.npmrc", import.meta.url), "utf8"),
]);

const forbidden = ["applied-caas", "internal.api.openai.org", "artifactory/api/npm"];
const hit = forbidden.find((value) => lock.includes(value) || npmrc.includes(value));
if (hit) {
  console.error(`Registry configuration contains a private registry reference: ${hit}`);
  process.exit(1);
}

const registryLines = npmrc
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter((line) => line.startsWith("registry=") || line.includes(":registry="));
if (registryLines.length !== 1 || registryLines[0] !== "registry=https://registry.npmjs.org/") {
  console.error(".npmrc must contain exactly one registry and it must be https://registry.npmjs.org/");
  process.exit(1);
}

const parsed = JSON.parse(lock);
const invalid = Object.entries(parsed.packages ?? {})
  .filter(([, value]) => value && typeof value === "object" && "resolved" in value)
  .map(([name, value]) => ({ name, resolved: value.resolved }))
  .filter(({ resolved }) => typeof resolved === "string" && !resolved.startsWith("https://registry.npmjs.org/"));

if (invalid.length) {
  console.error("package-lock.json contains non-public package URLs:");
  for (const item of invalid.slice(0, 20)) console.error(`- ${item.name}: ${item.resolved}`);
  process.exit(1);
}

console.log("Registry check passed: .npmrc and all locked package sources use registry.npmjs.org.");
