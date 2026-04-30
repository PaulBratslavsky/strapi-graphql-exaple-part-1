import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export const ROOT = new URL("../server/", import.meta.url).pathname.replace(/\/$/, "");
export const GQL_URL = "http://localhost:1338/graphql";
export const REST_URL = "http://localhost:1338/api";

export function assert(cond, msg) {
  if (!cond) {
    console.error("  FAIL:", msg);
    process.exitCode = 1;
    throw new Error(msg);
  }
  console.log("  ok:", msg);
}

export function readJSON(rel) {
  return JSON.parse(readFileSync(join(ROOT, rel), "utf8"));
}

export function fileExists(rel) {
  return existsSync(join(ROOT, rel));
}

export async function gql(query, variables = {}, headers = {}) {
  const r = await fetch(GQL_URL, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify({ query, variables }),
  });
  const json = await r.json();
  return { status: r.status, json };
}

export async function rest(path, init = {}) {
  const r = await fetch(REST_URL + path, init);
  return { status: r.status, json: await r.json().catch(() => null) };
}

export function header(label) {
  console.log(`\n=== ${label} ===`);
}
