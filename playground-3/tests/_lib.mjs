import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export const ROOT = new URL("../client/", import.meta.url).pathname.replace(/\/$/, "");
export const NEXT_URL = "http://localhost:3000";
export const GQL_URL = "http://localhost:1337/graphql";

export function assert(cond, msg) {
  if (!cond) {
    console.error("  FAIL:", msg);
    process.exitCode = 1;
    throw new Error(msg);
  }
  console.log("  ok:", msg);
}

export function fileContains(rel, needle) {
  const t = readFileSync(join(ROOT, rel), "utf8");
  return t.includes(needle);
}

export function fileExists(rel) {
  return existsSync(join(ROOT, rel));
}

export function readFile(rel) {
  return readFileSync(join(ROOT, rel), "utf8");
}

export async function fetchPage(path) {
  const r = await fetch(NEXT_URL + path);
  const text = await r.text();
  return { status: r.status, text };
}

export async function gql(query, variables = {}) {
  const r = await fetch(GQL_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  return { status: r.status, json: await r.json() };
}

export function header(label) {
  console.log(`\n=== ${label} ===`);
}
